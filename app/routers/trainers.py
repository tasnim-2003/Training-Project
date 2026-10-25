
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database import get_db
from app.models import User
from app.dependencies import get_current_admin

router = APIRouter(
    prefix="/trainers",
    tags=["Trainers"],
)

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


class TrainerCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8)


class TrainerResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str
    status: str

    class Config:
        from_attributes = True


@router.get("/active", response_model=list[TrainerResponse])
def get_active_trainers(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return (
        db.query(User)
        .filter(
            User.role == "trainer",
            User.status == "active",
        )
        .order_by(User.name.asc())
        .all()
    )


@router.get("/", response_model=list[TrainerResponse])
def get_all_trainers(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return (
        db.query(User)
        .filter(User.role == "trainer")
        .order_by(User.name.asc())
        .all()
    )


@router.post(
    "/",
    response_model=TrainerResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_trainer(
    trainer_data: TrainerCreate,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    email = trainer_data.email.lower()

    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This email is already registered.",
        )

    trainer = User(
        name=trainer_data.name.strip(),
        email=email,
        password=pwd_context.hash(trainer_data.password),
        role="trainer",
        status="active",
    )

    try:
        db.add(trainer)
        db.commit()
        db.refresh(trainer)
        return trainer
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not create the trainer account.",
        )
