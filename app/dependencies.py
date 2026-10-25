
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.security import decode_access_token
from app.database import get_db
from app.models import User


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    token = credentials.credentials
    user = decode_access_token(token)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def get_current_admin(
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return current_user


def get_current_trainer(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.get("role") != "trainer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Trainer access required",
        )

    identity = (
        current_user.get("user_id")
        or current_user.get("id")
        or current_user.get("sub")
    )

    if identity is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User identity missing from token",
        )

    user = None

    try:
        user_id = int(identity)
        user = db.query(User).filter(User.id == user_id).first()
    except (TypeError, ValueError):
        user = db.query(User).filter(User.email == str(identity)).first()

    if user is None or user.role != "trainer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Trainer account not found",
        )

    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Trainer account is inactive",
        )

    return user