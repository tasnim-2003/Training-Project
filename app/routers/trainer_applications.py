
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from app.database import get_db
from app.dependencies import get_current_admin
from app.models import TrainerApplication, User, Notification


router = APIRouter(
    prefix="/trainer-applications",
    tags=["Trainer Applications"],
)

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


class TrainerApplicationCreate(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    employee_id: str | None = Field(default=None, max_length=100)
    department: str = Field(min_length=2, max_length=255)
    specialization: str = Field(min_length=2, max_length=255)
    qualifications: str = Field(min_length=5)
    experience: str = Field(min_length=5)
    motivation: str = Field(min_length=10)


class TrainerApplicationReview(BaseModel):
    status: str
    rejection_reason: str | None = None


class TrainerApplicationResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    employee_id: str | None
    department: str
    specialization: str
    qualifications: str
    experience: str
    motivation: str
    status: str
    rejection_reason: str | None
    created_at: datetime
    reviewed_at: datetime | None

    class Config:
        from_attributes = True


@router.post(
    "/",
    response_model=TrainerApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_application(
    data: TrainerApplicationCreate,
    db: Session = Depends(get_db),
):
    email = str(data.email).lower().strip()

    existing_user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="هذا البريد مرتبط بحساب موجود بالفعل.",
        )

    existing_pending = (
        db.query(TrainerApplication)
        .filter(
            TrainerApplication.email == email,
            TrainerApplication.status == "pending",
        )
        .first()
    )

    if existing_pending:
        raise HTTPException(
            status_code=409,
            detail="يوجد طلب سابق بهذا البريد وما زال قيد المراجعة.",
        )

    application = TrainerApplication(
        name=data.name.strip(),
        email=email,
        password_hash=pwd_context.hash(data.password),
        employee_id=(data.employee_id or "").strip() or None,
        department=data.department.strip(),
        specialization=data.specialization.strip(),
        qualifications=data.qualifications.strip(),
        experience=data.experience.strip(),
        motivation=data.motivation.strip(),
        status="pending",
    )

    try:
        db.add(application)
        db.flush()

        admins = (
            db.query(User)
            .filter(
                User.role == "admin",
                User.status == "active",
            )
            .all()
        )

        for admin in admins:
            notification = Notification(
                user_id=admin.id,
                title="طلب مدرب جديد",
                message=(
                    f"وصل طلب انضمام جديد من "
                    f"{application.name}، "
                    f"وبانتظار المراجعة."
                ),
                type="trainer_application",
                is_read=False,
                created_at=datetime.utcnow(),
            )
            db.add(notification)

        db.commit()
        db.refresh(application)

    except Exception:
        db.rollback()
        raise

    return application


@router.get(
    "/admin",
    response_model=list[TrainerApplicationResponse],
)
def list_applications(
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    return (
        db.query(TrainerApplication)
        .order_by(TrainerApplication.created_at.desc())
        .all()
    )


@router.put(
    "/admin/{application_id}",
    response_model=TrainerApplicationResponse,
)
def review_application(
    application_id: int,
    data: TrainerApplicationReview,
    db: Session = Depends(get_db),
    current_admin=Depends(get_current_admin),
):
    if data.status not in ("approved", "rejected"):
        raise HTTPException(
            status_code=400,
            detail="الحالة يجب أن تكون approved أو rejected.",
        )

    application = (
        db.query(TrainerApplication)
        .filter(TrainerApplication.id == application_id)
        .with_for_update()
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="الطلب غير موجود.",
        )

    if application.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="سبق اتخاذ إجراء على هذا الطلب.",
        )

    if (
        data.status == "rejected"
        and not (
            data.rejection_reason
            and data.rejection_reason.strip()
        )
    ):
        raise HTTPException(
            status_code=400,
            detail="يرجى كتابة سبب الرفض.",
        )

    if data.status == "approved":
        existing_user = (
            db.query(User)
            .filter(User.email == application.email)
            .first()
        )

        if existing_user:
            raise HTTPException(
                status_code=409,
                detail="يوجد حساب مسجل بهذا البريد بالفعل.",
            )

        trainer = User(
            name=application.name,
            email=application.email,
            password=application.password_hash,
            role="trainer",
            status="active",
        )
        db.add(trainer)

    application.status = data.status

    application.rejection_reason = (
        data.rejection_reason.strip()
        if data.status == "rejected" and data.rejection_reason
        else None
    )

    application.reviewed_at = datetime.utcnow()

    admin_id = (
        current_admin.get("user_id")
        or current_admin.get("id")
        or current_admin.get("sub")
    )

    if admin_id is None:
        raise HTTPException(
            status_code=401,
            detail="تعذر تحديد هوية المسؤول من رمز الدخول.",
        )

    try:
        application.reviewed_by = int(admin_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="معرّف المسؤول في رمز الدخول غير صالح.",
        )

    try:
        db.commit()
        db.refresh(application)
    except Exception:
        db.rollback()
        raise

    return application
