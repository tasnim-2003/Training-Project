from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_admin, get_current_user
from app.models import (
    Course,
    Enrollment,
    Evaluation,
    EvaluationResponse,
    Notification,
)
from app.schemas.notification import (
    NotificationCreate,
    NotificationResponse,
    NotificationUpdate,
)


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


@router.post(
    "/",
    response_model=NotificationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_notification(
    notification_data: NotificationCreate,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    notification = Notification(
        user_id=notification_data.user_id,
        title=notification_data.title,
        message=notification_data.message,
        type=notification_data.type.value,
        is_read=False,
        created_at=datetime.now(),
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


@router.get(
    "/my",
    response_model=list[NotificationResponse],
)
def get_my_notifications(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user["id"])
        .order_by(Notification.created_at.desc())
        .all()
    )

    return notifications


@router.put(
    "/{notification_id}",
    response_model=NotificationResponse,
)
def update_notification(
    notification_id: int,
    notification_data: NotificationUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.user_id == current_user["id"],
        )
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    notification.is_read = notification_data.is_read

    db.commit()
    db.refresh(notification)

    return notification


@router.post(
    "/evaluation-reminder/{course_id}",
)
def send_evaluation_reminders(
    course_id: int,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    course = (
        db.query(Course)
        .filter(Course.id == course_id)
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    evaluation = (
        db.query(Evaluation)
        .filter(
            Evaluation.course_id == course_id,
            Evaluation.is_active.is_(True),
        )
        .first()
    )

    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active evaluation is available for this course",
        )

    enrollments = (
        db.query(Enrollment)
        .filter(
            Enrollment.course_id == course_id,
            Enrollment.status == "approved",
        )
        .all()
    )

    sent_count = 0
    skipped_count = 0

    for enrollment in enrollments:
        existing_response = (
            db.query(EvaluationResponse)
            .filter(
                EvaluationResponse.evaluation_id == evaluation.id,
                EvaluationResponse.trainee_id == enrollment.trainee_id,
            )
            .first()
        )

        if existing_response:
            skipped_count += 1
            continue

        notification = Notification(
            user_id=enrollment.trainee_id,
            title="التقييم متاح الآن",
            message=f"نموذج تقييم دورة «{course.name}» متاح الآن. نرجو إكمال التقييم.",
            type="evaluation",
            is_read=False,
            created_at=datetime.now(),
        )

        db.add(notification)
        sent_count += 1

    db.commit()

    return {
        "course_id": course_id,
        "evaluation_id": evaluation.id,
        "sent_count": sent_count,
        "skipped_count": skipped_count,
        "message": "Evaluation reminders sent successfully",
    }