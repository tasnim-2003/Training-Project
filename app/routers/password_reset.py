
import hashlib
import os
import secrets
import smtplib

from datetime import datetime, timedelta
from email.message import EmailMessage
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database import get_db
from app.models import User, PasswordResetToken


router = APIRouter(
    prefix="/auth",
    tags=["Password Recovery"],
)

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

RESET_TOKEN_MINUTES = 15

GENERIC_MESSAGE = (
    "إذا كان البريد مسجلًا، فستصلك تعليمات استعادة كلمة المرور."
)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str = Field(min_length=32, max_length=200)
    new_password: str = Field(min_length=8, max_length=128)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def is_local_test_mode() -> bool:
    return (
        os.getenv("APP_ENV", "").lower() == "development"
        and os.getenv("PASSWORD_RESET_TEST_MODE", "").lower() == "true"
    )


def send_reset_email(recipient: str, reset_url: str) -> None:
    host = os.getenv("SMTP_HOST")
    port = os.getenv("SMTP_PORT")
    username = os.getenv("SMTP_USERNAME")
    password = os.getenv("SMTP_PASSWORD")
    sender = os.getenv("MAIL_FROM")
    use_tls = os.getenv("SMTP_USE_TLS", "true").lower() == "true"

    if not all([host, port, username, password, sender]):
        raise RuntimeError("SMTP is not configured")

    message = EmailMessage()
    message["Subject"] = "استعادة كلمة المرور - أثر"
    message["From"] = sender
    message["To"] = recipient

    message.set_content(
        "وصلنا طلب لاستعادة كلمة المرور لحسابك في نظام أثر.\n\n"
        f"افتحي الرابط التالي خلال {RESET_TOKEN_MINUTES} دقيقة:\n"
        f"{reset_url}\n\n"
        "إذا لم تطلبي استعادة كلمة المرور، تجاهلي هذه الرسالة."
    )

    with smtplib.SMTP(host, int(port), timeout=15) as server:
        server.ehlo()

        if use_tls:
            server.starttls()
            server.ehlo()

        server.login(username, password)
        server.send_message(message)


@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    test_mode = is_local_test_mode()

    smtp_values = [
        os.getenv("SMTP_HOST"),
        os.getenv("SMTP_PORT"),
        os.getenv("SMTP_USERNAME"),
        os.getenv("SMTP_PASSWORD"),
        os.getenv("MAIL_FROM"),
    ]

    if not test_mode and not all(smtp_values):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service is not configured yet",
        )

    email = str(request.email).strip().lower()

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user or user.status != "active":
        return {"message": GENERIC_MESSAGE}

    raw_token = secrets.token_urlsafe(32)

    token_record = PasswordResetToken(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=datetime.utcnow()
        + timedelta(minutes=RESET_TOKEN_MINUTES),
    )

    try:
        db.add(token_record)
        db.commit()
        db.refresh(token_record)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to create password reset request",
        )

    frontend_url = os.getenv(
        "FRONTEND_URL",
        "http://localhost:5173",
    ).rstrip("/")

    reset_url = (
        f"{frontend_url}/reset-password?"
        f"{urlencode({'token': raw_token})}"
    )

    if test_mode:
        return {
            "message": GENERIC_MESSAGE,
            "test_reset_token": raw_token,
            "test_reset_url": reset_url,
            "expires_in_minutes": RESET_TOKEN_MINUTES,
        }

    try:
        send_reset_email(user.email, reset_url)
    except Exception:
        try:
            db.delete(token_record)
            db.commit()
        except Exception:
            db.rollback()

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send recovery email",
        )

    return {"message": GENERIC_MESSAGE}


@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    if len(request.new_password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=422,
            detail="Password is too long",
        )

    token_record = (
        db.query(PasswordResetToken)
        .filter(
            PasswordResetToken.token_hash
            == hash_token(request.token)
        )
        .with_for_update()
        .first()
    )

    now = datetime.utcnow()

    if (
        not token_record
        or token_record.used_at is not None
        or token_record.expires_at <= now
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset link",
        )

    user = (
        db.query(User)
        .filter(User.id == token_record.user_id)
        .with_for_update()
        .first()
    )

    if not user or user.status != "active":
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset link",
        )

    try:
        user.password = pwd_context.hash(request.new_password)
        token_record.used_at = now

        (
            db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.user_id == user.id,
                PasswordResetToken.id != token_record.id,
                PasswordResetToken.used_at.is_(None),
            )
            .update(
                {PasswordResetToken.used_at: now},
                synchronize_session=False,
            )
        )

        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to reset password",
        )

    return {
        "message": (
            "Password has been reset successfully. Please log in again."
        )
    }
