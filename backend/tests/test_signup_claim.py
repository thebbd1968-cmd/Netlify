"""Tests for self-serve signup and buyer-account claiming.

A buyer who pays on Gumroad before ever visiting the product is provisioned by
the webhook as a User with an empty password hash, with their subscription
attached. The moment they sign up with that same email they must end up owning
that account — same row, same subscription — not a duplicate account beside it.

These cover the three regressions that would break that:
  * a signup for a webhook-created account must claim it (not 4xx, not a dup)
  * a signup for an account that already has a password must be refused with 409
  * claiming must not lose or re-point the subscription
"""
import os

TEST_SECRET = os.environ.get("GUMROAD_WEBHOOK_SECRET", "test-secret-do-not-use-in-prod")

WEBHOOK = "/webhooks/gumroad"
REGISTER = "/auth/register"
LOGIN = "/auth/login"

SALE_PRO = {
    "event": "sale",
    "product_permalink": "douglas-re-pro",
    "product_id": "prod_pro_123",
    "email": "buyer-first@example.com",
    "license_key": "LICENSE-PRO-CLAIM-001",
    "sale_id": "sale_pro_claim_001",
    "subscription_id": "sub_pro_claim_001",
    "price": "7900",  # Gumroad sends cents
}


def _counts(db):
    from app.models.subscription import Subscription
    from app.models.user import User

    return db.query(User).count(), db.query(Subscription).count()


def _buy_first(client, email="buyer-first@example.com"):
    """Deliver a signed Pro sale for a buyer who has not signed up yet."""
    sale = dict(SALE_PRO, email=email)
    resp = client.post(f"{WEBHOOK}?secret={TEST_SECRET}", data=sale)
    assert resp.status_code == 200, resp.text


def _signup(client, email, password="buyerpass123", name="Buyer First"):
    return client.post(REGISTER, json={"email": email, "password": password, "name": name})


# ─── Claiming a webhook-created account ──────────────────────────────────────
def test_signup_claims_webhook_created_account(client, db_session):
    from app.models.user import User

    _buy_first(client)
    assert _counts(db_session) == (1, 1)

    placeholder = db_session.query(User).filter(User.email == "buyer-first@example.com").one()
    assert placeholder.hashed_password == ""
    placeholder_id = placeholder.id

    resp = _signup(client, "buyer-first@example.com")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["access_token"]
    assert body["account_claimed"] is True

    # Same row, now with a real password — no duplicate account.
    db_session.expire_all()
    assert _counts(db_session) == (1, 1)
    claimed = db_session.query(User).filter(User.email == "buyer-first@example.com").one()
    assert claimed.id == placeholder_id
    assert claimed.hashed_password not in ("", None)
    assert claimed.name == "Buyer First"

    # And the new credentials work.
    login = client.post(
        LOGIN, json={"email": "buyer-first@example.com", "password": "buyerpass123"}
    )
    assert login.status_code == 200, login.text


def test_claim_keeps_the_subscription_link(client, db_session):
    from app.models.subscription import Subscription
    from app.models.user import User

    _buy_first(client)

    sub_before = db_session.query(Subscription).one()
    owner_before = sub_before.user_id
    assert db_session.query(User).filter(User.id == owner_before).one().hashed_password == ""

    resp = _signup(client, "buyer-first@example.com")
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]

    db_session.expire_all()
    sub_after = db_session.query(Subscription).one()
    assert sub_after.user_id == owner_before  # still owned by the same account
    assert sub_after.is_active is True
    assert sub_after.plan_tier == "professional"

    # The claimed account reports the subscription as active.
    sub = client.get("/billing/subscription", headers={"token": token})
    assert sub.status_code == 200, sub.text
    assert sub.json()["plan_tier"] == "professional"
    assert sub.json()["status"] == "active"


def test_claim_matches_email_case_insensitively(client, db_session):
    from app.models.user import User

    _buy_first(client, email="Mixed.Case@Example.com")

    resp = _signup(client, "mixed.case@example.com")
    assert resp.status_code == 200, resp.text
    assert resp.json()["account_claimed"] is True
    assert _counts(db_session) == (1, 1)
    assert db_session.query(User).filter(User.hashed_password != "").count() == 1


def test_login_to_unclaimed_account_is_401_not_500(client, db_session):
    """A purchase-first buyer who tries to log in before signing up gets a clean 401."""
    _buy_first(client)

    resp = client.post(LOGIN, json={"email": "buyer-first@example.com", "password": "anything"})
    assert resp.status_code == 401, resp.text


# ─── Duplicate signup ────────────────────────────────────────────────────────
def test_duplicate_signup_is_rejected_with_409(client, db_session):
    first = _signup(client, "new-agent@example.com")
    assert first.status_code == 200, first.text
    assert first.json()["account_claimed"] is False

    second = _signup(client, "new-agent@example.com")
    assert second.status_code == 409, second.text
    detail = second.json()["detail"]
    assert "already exists" in detail.lower()
    # Readable, not a stack trace or an empty body.
    assert detail[0].isupper()

    assert _counts(db_session) == (1, 0)


def test_duplicate_signup_is_case_insensitive(client, db_session):
    assert _signup(client, "new-agent@example.com").status_code == 200

    second = _signup(client, "New-Agent@Example.com")
    assert second.status_code == 409, second.text
    assert _counts(db_session) == (1, 0)


def test_claim_does_not_overwrite_an_existing_password(client, db_session):
    """A claimed account is a normal account afterwards: no second takeover."""
    _buy_first(client)
    assert _signup(client, "buyer-first@example.com", password="firstpass123").status_code == 200

    hijack = _signup(client, "buyer-first@example.com", password="secondpass123")
    assert hijack.status_code == 409, hijack.text

    login = client.post(
        LOGIN, json={"email": "buyer-first@example.com", "password": "firstpass123"}
    )
    assert login.status_code == 200, login.text
    old = client.post(
        LOGIN, json={"email": "buyer-first@example.com", "password": "secondpass123"}
    )
    assert old.status_code == 401, old.text


# ─── Plain signup validation ─────────────────────────────────────────────────
def test_short_password_is_rejected(client, db_session):
    resp = client.post(
        REGISTER, json={"email": "short@example.com", "password": "short", "name": "Short"}
    )
    assert resp.status_code == 400, resp.text
    assert _counts(db_session) == (0, 0)


def test_signup_without_a_purchase_has_no_subscription(client, db_session):
    resp = _signup(client, "no-plan@example.com")
    assert resp.status_code == 200, resp.text

    sub = client.get("/billing/subscription", headers={"token": resp.json()["access_token"]})
    assert sub.status_code == 200, sub.text
    assert sub.json() is None
