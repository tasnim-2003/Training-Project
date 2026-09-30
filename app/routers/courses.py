from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_admin
from app.models import Course
from app.schemas.course import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
)


router = APIRouter(
    prefix="/courses",
    tags=["Courses"],
)


@router.get(
    "/",
    response_model=list[CourseResponse],
)
def get_courses(
    db: Session = Depends(get_db),
):
    courses = (
        db.query(Course)
        .filter(Course.status == "published")
        .order_by(Course.start_date.asc())
        .all()
    )

    return courses


@router.get(
    "/admin",
    response_model=list[CourseResponse],
)
def get_courses_for_admin(
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    courses = (
        db.query(Course)
        .order_by(Course.start_date.asc())
        .all()
    )

    return courses


@router.get(
    "/{course_id}",
    response_model=CourseResponse,
)
def get_course(
    course_id: int,
    db: Session = Depends(get_db),
):
    course = (
        db.query(Course)
        .filter(
            Course.id == course_id,
            Course.status == "published",
        )
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    return course


@router.post(
    "/",
    response_model=CourseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_course(
    course_data: CourseCreate,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    new_course = Course(
        name=course_data.name,
        description=course_data.description,
        objectives=course_data.objectives,
        trainer_id=course_data.trainer_id,
        start_date=course_data.start_date,
        end_date=course_data.end_date,
        duration=course_data.duration,
        seats=course_data.seats,
        target_audience=course_data.target_audience,
        prerequisites=course_data.prerequisites,
        registration_conditions=course_data.registration_conditions,
        impact_wait_days=course_data.impact_wait_days,
        status=course_data.status.value,
    )

    db.add(new_course)
    db.commit()
    db.refresh(new_course)

    return new_course


@router.get(
    "/admin/{course_id}",
    response_model=CourseResponse,
)
def get_course_for_admin(
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

    return course


@router.put(
    "/{course_id}",
    response_model=CourseResponse,
)
def update_course(
    course_id: int,
    course_data: CourseUpdate,
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

    update_data = course_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        if field == "status" and value is not None:
            setattr(course, field, value.value)
        else:
            setattr(course, field, value)

    db.commit()
    db.refresh(course)

    return course