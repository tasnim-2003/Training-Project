from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_admin, get_current_user
from app.models import Course, Enrollment
from app.schemas.enrollment import (
    EnrollmentCreate,
    EnrollmentUpdate,
    EnrollmentResponse,
)

router = APIRouter(
    prefix="/enrollments",
    tags=["Enrollments"],
)


@router.post(
    "/",
    response_model=EnrollmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_enrollment(
    enrollment_data: EnrollmentCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user["role"] != "trainee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only trainees can register for courses",
        )

    course = (
        db.query(Course)
        .filter(
            Course.id == enrollment_data.course_id,
            Course.status == "published",
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    existing_enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.trainee_id == current_user["user_id"],
            Enrollment.course_id == course.id,
        )
        .first()
    )

    if existing_enrollment:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already registered for this course",
        )

    approved_count = (
        db.query(Enrollment)
        .filter(
            Enrollment.course_id == course.id,
            Enrollment.status == "approved",
        )
        .count()
    )

    if approved_count >= course.seats:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Course seats are full",
        )

    enrollment = Enrollment(
        trainee_id=current_user["user_id"],
        course_id=course.id,
        registered_at=datetime.now(timezone.utc),
        status="pending",
    )

    db.add(enrollment)
    db.commit()
    db.refresh(enrollment)

    return {
        "id": enrollment.id,
        "trainee_id": enrollment.trainee_id,
        "course_id": enrollment.course_id,
        "course_title": course.name,
        "registered_at": enrollment.registered_at,
        "status": enrollment.status,
        "rejection_reason": enrollment.rejection_reason,
    }


@router.get(
    "/my",
    response_model=list[EnrollmentResponse],
)
def get_my_enrollments(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enrollments = (
        db.query(
            Enrollment,
            Course.name.label("course_title"),
        )
        .join(
            Course,
            Course.id == Enrollment.course_id,
        )
        .filter(
            Enrollment.trainee_id == current_user["user_id"]
        )
        .order_by(Enrollment.registered_at.desc())
        .all()
    )

    return [
        {
            "id": enrollment.id,
            "trainee_id": enrollment.trainee_id,
            "course_id": enrollment.course_id,
            "course_title": course_title,
            "registered_at": enrollment.registered_at,
            "status": enrollment.status,
            "rejection_reason": enrollment.rejection_reason,
        }
        for enrollment, course_title in enrollments
    ]


@router.get(
    "/admin",
    response_model=list[EnrollmentResponse],
)
def get_all_enrollments(
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    enrollments = (
        db.query(
            Enrollment,
            Course.name.label("course_title"),
        )
        .join(
            Course,
            Course.id == Enrollment.course_id,
        )
        .order_by(Enrollment.registered_at.desc())
        .all()
    )

    return [
        {
            "id": enrollment.id,
            "trainee_id": enrollment.trainee_id,
            "course_id": enrollment.course_id,
            "course_title": course_title,
            "registered_at": enrollment.registered_at,
            "status": enrollment.status,
            "rejection_reason": enrollment.rejection_reason,
        }
        for enrollment, course_title in enrollments
    ]


@router.put(
    "/admin/{enrollment_id}",
    response_model=EnrollmentResponse,
)
def update_enrollment(
    enrollment_id: int,
    enrollment_data: EnrollmentUpdate,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    enrollment = (
        db.query(Enrollment)
        .filter(Enrollment.id == enrollment_id)
        .first()
    )

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment request not found",
        )

    if enrollment.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Enrollment request has already been processed",
        )

    course = (
        db.query(Course)
        .filter(Course.id == enrollment.course_id)
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    if enrollment_data.status == "approved":
        approved_count = (
            db.query(Enrollment)
            .filter(
                Enrollment.course_id == course.id,
                Enrollment.status == "approved",
                Enrollment.id != enrollment.id,
            )
            .count()
        )

        if approved_count >= course.seats:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Course seats are full",
            )

    if enrollment_data.status == "rejected":
        if not enrollment_data.rejection_reason:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rejection reason is required",
            )

    enrollment.status = enrollment_data.status
    enrollment.rejection_reason = (
        enrollment_data.rejection_reason
        if enrollment_data.status == "rejected"
        else None
    )

    db.commit()
    db.refresh(enrollment)

    return {
        "id": enrollment.id,
        "trainee_id": enrollment.trainee_id,
        "course_id": enrollment.course_id,
        "course_title": course.name,
        "registered_at": enrollment.registered_at,
        "status": enrollment.status,
        "rejection_reason": enrollment.rejection_reason,
    }