"""
Authentication router — login, register, token management.
Simple JWT-based auth for MVP.
Uses bcrypt directly (passlib is incompatible with bcrypt >= 5.0).
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, Header, Query
from jose import jwt
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas import LoginRequest, RegisterResponse, TokenResponse, UserCreate, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("JWT_SECRET", "dev-secret-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        # Accounts provisioned by the Gumroad webhook start with an empty hash:
        # nobody can log into them until they are claimed by a signup.
        return False
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        # A stored value that isn't a bcrypt hash must fail closed, not 500.
        return False


def normalize_email(email: Optional[str]) -> str:
    """Emails are matched case-insensitively; store and compare the lowercase form."""
    return (email or "").strip().lower()


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def get_current_user_id(
    token: Optional[str] = Header(None),
    token_q: Optional[str] = Query(None, alias="token"),
) -> str:
    """Decode JWT and return user id. Accepts token from Header or Query param. Raise 401 if invalid."""
    raw = token or token_q
    if not raw:
        raise HTTPException(status_code=401, detail="Missing token — provide via header `token:` or query `?token=`")
    try:
        payload = jwt.decode(raw, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/register", response_model=RegisterResponse)
def register(body: UserCreate, db: Session = Depends(get_db)):
    """
    Create an account, or claim one that the Gumroad webhook already created.

    A buyer can reach the product from either direction:

      * pay first — the webhook provisions a User row with an empty password
        hash and the subscription attached, then they sign up here;
      * sign up first — a plain new account, and they activate a license later.

    When the email matches a webhook-provisioned account (empty password hash) we
    set a real password on that existing row, so the subscription it owns carries
    over instead of a duplicate account being created beside it. If the email
    already belongs to a user who has a password, that is a genuine duplicate and
    we refuse with 409 rather than silently taking the account over.
    """
    email = normalize_email(body.email)
    if not email or "@" not in email or email.startswith("@") or email.endswith("@"):
        raise HTTPException(status_code=400, detail="Enter a valid email address")

    password = body.password or ""
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    name = (body.name or "").strip()

    existing = db.query(User).filter(func.lower(User.email) == email).first()
    if existing:
        if existing.hashed_password:
            raise HTTPException(
                status_code=409,
                detail=(
                    "An account with this email already exists. "
                    "Sign in instead, or use a different email."
                ),
            )

        # Claim the webhook-created account: same row, so the subscription the
        # webhook attached to it stays attached.
        existing.hashed_password = hash_password(password)
        if name:
            existing.name = name
        if body.phone:
            existing.phone = body.phone
        if body.company:
            existing.company = body.company
        existing.email_verified = True
        db.commit()
        db.refresh(existing)

        return RegisterResponse(
            access_token=create_access_token(existing.id),
            account_claimed=True,
        )

    user = User(
        email=email,
        name=name or email.split("@")[0],
        hashed_password=hash_password(password),
        role=body.role,
        phone=body.phone,
        company=body.company,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return RegisterResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    email = normalize_email(body.email)
    user = db.query(User).filter(func.lower(User.email) == email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserOut)
def get_me(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
