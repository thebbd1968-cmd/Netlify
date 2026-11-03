"""Tests for the Gumroad webhook: authentication must fail closed and only the
three Douglas RE products may ever provision a subscription.

These cover the regressions that mattered:
  * an unknown permalink (the unrelated playbooks on the same Gumroad account)
    must be acknowledged and ignored — never defaulted to a tier
  * a missing / wrong / unconfigured shared secret must be rejected with 4xx
  * a valid sale for a Douglas RE product provisions the right tier
"""
import os

TEST_SECRET = os.environ.get("GUMROAD_WEBHOOK_SECRET", "test-secret-do-not-use-in-prod")

WEBHOOK = "/webhooks/gumroad"

SALE_PRO = {
    "event": "sale",
    "product_permalink": "douglas-re-pro",
    "product_id": "prod_pro_123",
    "email": "buyer@example.com",
    "license_key": "LICENSE-PRO-001",
    "sale_id": "sale_pro_001",
    "subscription_id": "sub_pro_001",
    "price": "7900",  # Gumroad sends cents
}

PLAYBOOK_SALE = {
    "event": "sale",
    "product_permalink": "va-real-estate-playbook",
    "product_id": "prod_playbook_va",
    "email": "playbook-buyer@example.com",
    "license_key": "LICENSE-PLAYBOOK-001",
    "sale_id": "sale_playbook_001",
    "price": "4900",
}


def _counts(db):
    from app.models.subscription import Subscription
    from app.models.user import User

    return db.query(User).count(), db.query(Subscription).count()


# ─── Authentication ──────────────────────────────────────────────────────────
def test_missing_secret_is_rejected_and_mutates_nothing(client, db_session):
    resp = client.post(WEBHOOK, data=SALE_PRO)
    assert resp.status_code in (401, 403), resp.text
    assert _counts(db_session) == (0, 0)


def test_wrong_secret_is_rejected_and_mutates_nothing(client, db_session):
    resp = client.post(f"{WEBHOOK}?secret=definitely-wrong", data=SALE_PRO)
    assert resp.status_code in (401, 403), resp.text
    assert _counts(db_session) == (0, 0)


def test_unconfigured_secret_fails_closed(client, db_session, monkeypatch):
    """An unset GUMROAD_WEBHOOK_SECRET must reject, never skip verification."""
    monkeypatch.delenv("GUMROAD_WEBHOOK_SECRET", raising=False)
    resp = client.post(f"{WEBHOOK}?secret={TEST_SECRET}", data=SALE_PRO)
    assert resp.status_code in (401, 403), resp.text
    assert _counts(db_session) == (0, 0)


def test_ping_with_correct_secret_returns_200(client, db_session):
    resp = client.post(f"{WEBHOOK}?secret={TEST_SECRET}", data={"event": "ping"})
    assert resp.status_code == 200, resp.text
    assert _counts(db_session) == (0, 0)


def test_secret_header_is_accepted(client, db_session):
    resp = client.post(
        WEBHOOK, data={"event": "ping"}, headers={"X-Gumroad-Webhook-Secret": TEST_SECRET}
    )
    assert resp.status_code == 200, resp.text


# ─── Product allow-listing ───────────────────────────────────────────────────
def test_unknown_permalink_is_ignored_without_mutation(client, db_session):
    resp = client.post(f"{WEBHOOK}?secret={TEST_SECRET}", data=PLAYBOOK_SALE)
    assert resp.status_code == 200, resp.text
    assert "ignored" in resp.json()["message"].lower()
    assert _counts(db_session) == (0, 0)


def test_unknown_permalink_never_defaults_to_starter(client, db_session):
    from app.models.subscription import Subscription

    client.post(f"{WEBHOOK}?secret={TEST_SECRET}", data=PLAYBOOK_SALE)
    assert db_session.query(Subscription).filter_by(plan_tier="starter").count() == 0


# ─── Happy path ──────────────────────────────────────────────────────────────
def test_valid_pro_sale_provisions_professional(client, db_session):
    from app.models.subscription import Subscription

    resp = client.post(f"{WEBHOOK}?secret={TEST_SECRET}", data=SALE_PRO)
    assert resp.status_code == 200, resp.text

    sub = db_session.query(Subscription).one()
    assert sub.plan_tier == "professional"
    assert sub.gumroad_product_permalink == "douglas-re-pro"
    assert sub.gumroad_sale_id == "sale_pro_001"
    assert sub.recurring_amount == 79.0
    assert sub.amount_paid == 79.0
    assert sub.is_active is True
    assert sub.status == "active"


def test_duplicate_sale_is_idempotent(client, db_session):
    from app.models.subscription import Subscription

    assert client.post(f"{WEBHOOK}?secret={TEST_SECRET}", data=SALE_PRO).status_code == 200
    assert client.post(f"{WEBHOOK}?secret={TEST_SECRET}", data=SALE_PRO).status_code == 200
    assert db_session.query(Subscription).count() == 1


def test_cancellation_deactivates_subscription(client, db_session):
    from app.models.subscription import Subscription

    client.post(f"{WEBHOOK}?secret={TEST_SECRET}", data=SALE_PRO)
    resp = client.post(
        f"{WEBHOOK}?secret={TEST_SECRET}",
        data={
            "event": "subscription.cancelled",
            "product_permalink": "douglas-re-pro",
            "email": SALE_PRO["email"],
            "license_key": SALE_PRO["license_key"],
            "subscription_id": SALE_PRO["subscription_id"],
        },
    )
    assert resp.status_code == 200, resp.text
    sub = db_session.query(Subscription).one()
    assert sub.is_active is False
    assert sub.status == "cancelled"


def test_unknown_resource_name_is_acknowledged(client, db_session):
    """Real resource subscriptions send `resource_name`, not `event`."""
    resp = client.post(
        f"{WEBHOOK}?secret={TEST_SECRET}",
        data={**PLAYBOOK_SALE, "resource_name": "sale"},
    )
    assert resp.status_code == 200
    assert _counts(db_session) == (0, 0)
