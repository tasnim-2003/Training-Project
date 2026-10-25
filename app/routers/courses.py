
from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_admin, get_current_trainer
from app.models import Course, User
from app.schemas.course import CourseCreate, CourseUpdate, CourseResponse


router = APIRouter(prefix="/courses", tags=["Courses"])

APP_DIR = Path(__file__).resolve().parent.parent
COVER_DIR = APP_DIR / "uploads" / "course_covers"
COVER_DIR.mkdir(parents=True, exist_ok=True)

MAX_COVER_SIZE = 5 * 1024 * 1024

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def validate_trainer_assignment(
    trainer_id: int | None,
    db: Session,
) -> None:
    if trainer_id is None:
        return

    trainer = (
        db.query(User)
        .filter(
            User.id == trainer_id,
            User.role == "trainer",
            User.status == "active",
        )
        .first()
    )

    if trainer is None:
        raise HTTPException(
            status_code=422,
            detail="The selected trainer does not exist or is not active.",
        )


def serialize_course(course: Course, db: Session) -> dict:
    result = CourseResponse.model_validate(course).model_dump()

    trainer = None
    if course.trainer_id is not None:
        trainer = (
            db.query(User)
            .filter(User.id == course.trainer_id)
            .first()
        )

    result["trainer_name"] = trainer.name if trainer else None
    return result


def remove_managed_cover(cover_path: str | None) -> None:
    if not cover_path:
        return

    filename = Path(cover_path).name
    if not filename:
        return

    target = (COVER_DIR / filename).resolve()

    if target.parent == COVER_DIR.resolve() and target.is_file():
        target.unlink(missing_ok=True)


@router.get("/trainers")
def get_active_trainers_for_assignment(
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    trainers = (
        db.query(User)
        .filter(User.role == "trainer", User.status == "active")
        .order_by(User.name.asc())
        .all()
    )

    return [
        {
            "id": trainer.id,
            "name": trainer.name,
            "email": trainer.email,
        }
        for trainer in trainers
    ]


@router.get("/", response_model=list[CourseResponse])
def get_courses(db: Session = Depends(get_db)):
    courses = (
        db.query(Course)
        .filter(Course.status == "published")
        .order_by(Course.start_date.asc())
        .all()
    )
    return [serialize_course(course, db) for course in courses]


@router.get("/trainer", response_model=list[CourseResponse])
def get_courses_for_trainer(
    current_trainer: User = Depends(get_current_trainer),
    db: Session = Depends(get_db),
):
    courses = (
        db.query(Course)
        .filter(Course.trainer_id == current_trainer.id)
        .order_by(Course.start_date.asc())
        .all()
    )
    return [serialize_course(course, db) for course in courses]


@router.get("/admin", response_model=list[CourseResponse])
def get_courses_for_admin(
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    courses = db.query(Course).order_by(Course.start_date.asc()).all()
    return [serialize_course(course, db) for course in courses]


@router.get("/admin/{course_id}", response_model=CourseResponse)
def get_course_for_admin(
    course_id: int,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    return serialize_course(course, db)


@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db)):
    course = (
        db.query(Course)
        .filter(Course.id == course_id, Course.status == "published")
        .first()
    )

    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    return serialize_course(course, db)


@router.post("/", response_model=CourseResponse, status_code=201)
def create_course(
    course_data: CourseCreate,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    validate_trainer_assignment(course_data.trainer_id, db)

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

    return serialize_course(new_course, db)


@router.put("/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    course_data: CourseUpdate,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    update_data = course_data.model_dump(exclude_unset=True)

    if "trainer_id" in update_data:
        validate_trainer_assignment(update_data["trainer_id"], db)

    for field, value in update_data.items():
        if field == "status" and value is not None:
            setattr(course, field, value.value)
        else:
            setattr(course, field, value)

    db.commit()
    db.refresh(course)

    return serialize_course(course, db)


@router.post("/{course_id}/cover")
async def upload_course_cover(
    course_id: int,
    file: UploadFile = File(...),
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    extension = ALLOWED_IMAGE_TYPES.get(file.content_type or "")
    if extension is None:
        raise HTTPException(
            status_code=415,
            detail="الصيغ المدعومة هي JPG وPNG وWebP فقط.",
        )

    content = await file.read(MAX_COVER_SIZE + 1)
    if not content:
        raise HTTPException(status_code=400, detail="ملف الصورة فارغ.")

    if len(content) > MAX_COVER_SIZE:
        raise HTTPException(
            status_code=413,
            detail="حجم صورة الغلاف يجب ألا يتجاوز 5 ميجابايت.",
        )

    filename = f"{uuid4().hex}{extension}"
    destination = COVER_DIR / filename
    relative_url = f"/uploads/course_covers/{filename}"

    try:
        destination.write_bytes(content)
        old_cover = course.cover_image
        course.cover_image = relative_url
        db.commit()
        db.refresh(course)
    except Exception:
        db.rollback()
        destination.unlink(missing_ok=True)
        raise HTTPException(
            status_code=500,
            detail="تعذر حفظ صورة الغلاف.",
        )
    finally:
        await file.close()

    if old_cover and old_cover != relative_url:
        remove_managed_cover(old_cover)

    return {"cover_image": course.cover_image}


@router.delete("/{course_id}/cover", status_code=status.HTTP_204_NO_CONTENT)
def delete_course_cover(
    course_id: int,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    old_cover = course.cover_image
    course.cover_image = None
    db.commit()

    remove_managed_cover(old_cover)
    return None


@router.delete("/{course_id}", status_code=204)
def delete_course(
    course_id: int,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    db.delete(course)
    db.commit()
    return None
