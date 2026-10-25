
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas.user import UserCreate
from app.security import create_access_token


router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class ProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr


class PasswordUpdate(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)


def resolve_current_user(current_user: dict, db: Session) -> User:
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

    try:
        user = db.query(User).filter(User.id == int(identity)).first()
    except (TypeError, ValueError):
        user = db.query(User).filter(User.email == str(identity)).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found",
        )

    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive",
        )

    return user


def user_response(user: User):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "status": user.status,
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    email = str(user_data.email).strip().lower()
    name = user_data.name.strip()

    if not name:
        raise HTTPException(status_code=422, detail="Name is required")

    if len(user_data.password) < 8:
        raise HTTPException(
            status_code=422,
            detail="Password must be at least 8 characters long",
        )

    if len(user_data.password.encode("utf-8")) > 72:
        raise HTTPException(status_code=422, detail="Password is too long")

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="Email is already registered")

    new_user = User(
        name=name,
        email=email,
        password=pwd_context.hash(user_data.password),
        role="trainee",
        status="active",
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to create account")

    return {
        "message": "Account created successfully",
        "user": user_response(new_user),
    }


@router.post("/login")
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    email = str(login_data.email).strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if not user or not pwd_context.verify(login_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.status != "active":
        raise HTTPException(status_code=403, detail="Account is inactive")

    return {
        "message": "Login successful",
        "access_token": create_access_token(
            user_id=user.id,
            role=user.role,
        ),
        "token_type": "bearer",
        "user": user_response(user),
    }


@router.get("/me")
def get_my_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = resolve_current_user(current_user, db)
    return user_response(user)


@router.patch("/me")
def update_my_profile(
    profile: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = resolve_current_user(current_user, db)
    name = profile.name.strip()
    email = str(profile.email).strip().lower()

    if not name:
        raise HTTPException(status_code=422, detail="Name is required")

    existing = (
        db.query(User)
        .filter(User.email == email, User.id != user.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409,
            detail="Email is already registered",
        )

    user.name = name
    user.email = email

    try:
        db.commit()
        db.refresh(user)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to update profile")

    return {
        "message": "Profile updated successfully",
        "user": user_response(user),
    }


@router.post("/change-password")
def change_my_password(
    data: PasswordUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = resolve_current_user(current_user, db)

    if not pwd_context.verify(data.current_password, user.password):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect",
        )

    if len(data.new_password.encode("utf-8")) > 72:
        raise HTTPException(
            status_code=422,
            detail="New password is too long",
        )

    if pwd_context.verify(data.new_password, user.password):
        raise HTTPException(
            status_code=422,
            detail="New password must be different",
        )

    user.password = pwd_context.hash(data.new_password)

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Unable to change password")

    return {"message": "Password changed successfully"}
