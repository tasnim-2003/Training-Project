
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_trainer
from app.models import Course, Session as TrainingSession
from app.schemas.session import SessionCreate, SessionUpdate, SessionResponse


router = APIRouter(
    prefix="/sessions",
    tags=["Sessions"],
)


def get_trainer_id(current_trainer):
    """الحصول على معرّف المدرب من بيانات المستخدم الحالي."""
    if isinstance(current_trainer, dict):
        trainer_id = current_trainer.get("id")
    else:
        trainer_id = getattr(current_trainer, "id", None)

    if trainer_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to identify the current trainer",
        )

    return trainer_id


def get_assigned_course(
    course_id: int,
    trainer_id: int,
    db: Session,
):
    """التأكد من أن الدورة موجودة ومسندة للمدرب الحالي."""
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

    if course.trainer_id != trainer_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This course is not assigned to you",
        )

    return course


def validate_session_times(
    start_time,
    end_time,
    attendance_open_at,
    attendance_close_at,
):
    if start_time is not None and end_time is not None:
        if end_time <= start_time:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="End time must be greater than start time",
            )

    if (
        attendance_open_at is not None
        and attendance_close_at is not None
    ):
        if attendance_close_at <= attendance_open_at:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=(
                    "Attendance close time must be greater "
                    "than attendance open time"
                ),
            )


@router.post(
    "/",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_session(
    session_data: SessionCreate,
    current_trainer=Depends(get_current_trainer),
    db: Session = Depends(get_db),
):
    trainer_id = get_trainer_id(current_trainer)

    get_assigned_course(
        course_id=session_data.course_id,
        trainer_id=trainer_id,
        db=db,
    )

    validate_session_times(
        session_data.start_time,
        session_data.end_time,
        session_data.attendance_open_at,
        session_data.attendance_close_at,
    )

    training_session = TrainingSession(
        course_id=session_data.course_id,
        title=session_data.title,
        session_date=session_data.session_date,
        start_time=session_data.start_time,
        end_time=session_data.end_time,
        meeting_url=session_data.meeting_url,
        attendance_open_at=session_data.attendance_open_at,
        attendance_close_at=session_data.attendance_close_at,
    )

    db.add(training_session)
    db.commit()
    db.refresh(training_session)

    return training_session


@router.put(
    "/{session_id}",
    response_model=SessionResponse,
)
def update_session(
    session_id: int,
    session_data: SessionUpdate,
    current_trainer=Depends(get_current_trainer),
    db: Session = Depends(get_db),
):
    trainer_id = get_trainer_id(current_trainer)

    training_session = (
        db.query(TrainingSession)
        .filter(TrainingSession.id == session_id)
        .first()
    )

    if not training_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    get_assigned_course(
        course_id=training_session.course_id,
        trainer_id=trainer_id,
        db=db,
    )

    changes = session_data.model_dump(exclude_unset=True)

    new_start_time = changes.get(
        "start_time",
        training_session.start_time,
    )
    new_end_time = changes.get(
        "end_time",
        training_session.end_time,
    )
    new_attendance_open = changes.get(
        "attendance_open_at",
        training_session.attendance_open_at,
    )
    new_attendance_close = changes.get(
        "attendance_close_at",
        training_session.attendance_close_at,
    )

    validate_session_times(
        new_start_time,
        new_end_time,
        new_attendance_open,
        new_attendance_close,
    )

    for field, value in changes.items():
        setattr(training_session, field, value)

    db.commit()
    db.refresh(training_session)

    return training_session
