
from pathlib import Path
from uuid import uuid4
from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from pydantic import BaseModel, HttpUrl
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_trainer, get_current_user
from app.models import (
    Course,
    CourseSection,
    CourseLecture,
    LectureAttachment,
    Enrollment,
    User,
    LectureCompletion,
)

router = APIRouter(prefix="/courses", tags=["Course Learning Content"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
LEARNING_UPLOAD_DIR = UPLOAD_DIR / "learning"
LEARNING_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024
MAX_VIDEO_SIZE = 500 * 1024 * 1024

VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov"}
ATTACHMENT_EXTENSIONS = {
    ".pdf", ".doc", ".docx", ".ppt", ".pptx",
    ".xls", ".xlsx", ".txt", ".zip",
    ".png", ".jpg", ".jpeg",
}


# =========================
# Request models
# =========================

class SectionCreate(BaseModel):
    title: str
    description: str | None = None


class SectionUpdate(BaseModel):
    title: str | None = None
    description: str | None = None


class LectureCreate(BaseModel):
    title: str
    description: str | None = None


class LectureUpdate(BaseModel):
    title: str | None = None
    description: str | None = None


class VideoLinkCreate(BaseModel):
    video_url: HttpUrl


class LectureCompletionUpdate(BaseModel):
    completed: bool


# =========================
# Access helpers
# =========================

def ensure_assigned_course(course_id: int, trainer_id: int, db: Session):
    course = (
        db.query(Course)
        .filter(
            Course.id == course_id,
            Course.trainer_id == trainer_id,
        )
        .first()
    )

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="الدورة غير موجودة أو غير مسندة إليك",
        )

    return course


def ensure_learning_access(course_id: int, current_user: dict, db: Session):
    role = current_user.get("role")

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
            detail="User account not found",
        )

    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    if role == "trainer" and user.role == "trainer":
        ensure_assigned_course(course_id, user.id, db)
        return

    if role == "trainee" and user.role == "trainee":
        course = (
            db.query(Course)
            .filter(Course.id == course_id)
            .first()
        )

        if course is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Course not found",
            )

        enrollment = (
            db.query(Enrollment)
            .filter(
                Enrollment.course_id == course_id,
                Enrollment.trainee_id == user.id,
                Enrollment.status == "approved",
            )
            .first()
        )

        if enrollment is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Approved enrollment is required to access course content",
            )

        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to access this course content",
    )


def get_section(course_id: int, section_id: int, db: Session):
    section = (
        db.query(CourseSection)
        .filter(
            CourseSection.id == section_id,
            CourseSection.course_id == course_id,
        )
        .first()
    )

    if section is None:
        raise HTTPException(status_code=404, detail="القسم غير موجود")

    return section


def get_lecture(course_id: int, lecture_id: int, db: Session):
    lecture = (
        db.query(CourseLecture)
        .join(
            CourseSection,
            CourseLecture.section_id == CourseSection.id,
        )
        .filter(
            CourseLecture.id == lecture_id,
            CourseSection.course_id == course_id,
        )
        .first()
    )

    if lecture is None:
        raise HTTPException(
            status_code=404,
            detail="المحاضرة غير موجودة ضمن هذه الدورة",
        )

    return lecture


def get_trainee(current_user: dict, db: Session):
    identity = (
        current_user.get("user_id")
        or current_user.get("id")
        or current_user.get("sub")
    )

    try:
        user = db.query(User).filter(User.id == int(identity)).first()
    except (TypeError, ValueError):
        user = db.query(User).filter(User.email == str(identity)).first()

    if user is None or user.role != "trainee":
        raise HTTPException(status_code=403, detail="المتدرب فقط")

    return user


# =========================
# Ordering helpers
# =========================

def next_section_order(course_id: int, db: Session) -> int:
    last = (
        db.query(CourseSection)
        .filter(CourseSection.course_id == course_id)
        .order_by(CourseSection.order.desc())
        .first()
    )
    return 1 if last is None else last.order + 1


def next_lecture_order(section_id: int, db: Session) -> int:
    last = (
        db.query(CourseLecture)
        .filter(CourseLecture.section_id == section_id)
        .order_by(CourseLecture.order.desc())
        .first()
    )
    return 1 if last is None else last.order + 1


# =========================
# Response helpers
# =========================

def section_data(section):
    return {
        "id": section.id,
        "course_id": section.course_id,
        "title": section.title,
        "description": section.description,
        "order": section.order,
        "created_at": section.created_at,
    }


def lecture_data(lecture):
    return {
        "id": lecture.id,
        "section_id": lecture.section_id,
        "title": lecture.title,
        "description": lecture.description,
        "order": lecture.order,
        "video_source_type": lecture.video_source_type,
        "video_url": lecture.video_url,
        "created_at": lecture.created_at,
    }


def attachment_data(attachment):
    return {
        "id": attachment.id,
        "lecture_id": attachment.lecture_id,
        "title": attachment.title,
        "original_filename": attachment.original_filename,
        "file_path": attachment.file_path,
        "mime_type": attachment.mime_type,
        "file_size": attachment.file_size,
        "created_at": attachment.created_at,
    }


# =========================
# File helpers
# =========================

def remove_uploaded_file(url: str | None):
    if not url or not url.startswith("/uploads/learning/"):
        return

    filename = Path(url).name
    if not filename:
        return

    path = LEARNING_UPLOAD_DIR / filename
    if path.is_file():
        path.unlink()


async def save_upload(
    file: UploadFile,
    allowed_extensions: set[str],
    max_size: int,
) -> tuple[str, int]:
    original_name = Path(file.filename or "").name
    extension = Path(original_name).suffix.lower()

    if not original_name or extension not in allowed_extensions:
        raise HTTPException(status_code=415, detail="نوع الملف غير مدعوم")

    saved_name = f"{uuid4().hex}{extension}"
    destination = LEARNING_UPLOAD_DIR / saved_name
    size = 0

    try:
        with destination.open("wb") as output:
            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                size += len(chunk)

                if size > max_size:
                    raise HTTPException(
                        status_code=413,
                        detail="حجم الملف يتجاوز الحد المسموح",
                    )

                output.write(chunk)

        return f"/uploads/learning/{saved_name}", size

    except Exception:
        if destination.exists():
            destination.unlink()
        raise

    finally:
        await file.close()


# =========================
# Public curriculum preview
# =========================

@router.get("/{course_id}/learning/preview")
def list_learning_preview(
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

    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Published course not found",
        )

    sections = (
        db.query(CourseSection)
        .filter(CourseSection.course_id == course_id)
        .order_by(CourseSection.order.asc())
        .all()
    )

    result = []

    for section in sections:
        lectures = (
            db.query(CourseLecture)
            .filter(CourseLecture.section_id == section.id)
            .order_by(CourseLecture.order.asc())
            .all()
        )

        result.append({
            "id": section.id,
            "title": section.title,
            "description": section.description,
            "order": section.order,
            "lectures": [
                {
                    "id": lecture.id,
                    "title": lecture.title,
                    "description": lecture.description,
                    "order": lecture.order,
                }
                for lecture in lectures
            ],
        })

    return result


# =========================
# Learning sections
# =========================

@router.get("/{course_id}/learning/sections")
def list_sections(
    course_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_learning_access(course_id, current_user, db)

    sections = (
        db.query(CourseSection)
        .filter(CourseSection.course_id == course_id)
        .order_by(CourseSection.order.asc())
        .all()
    )

    result = []

    for section in sections:
        item = section_data(section)

        lectures = (
            db.query(CourseLecture)
            .filter(CourseLecture.section_id == section.id)
            .order_by(CourseLecture.order.asc())
            .all()
        )

        item["lectures"] = []

        for lecture in lectures:
            lecture_item = lecture_data(lecture)

            attachments = (
                db.query(LectureAttachment)
                .filter(LectureAttachment.lecture_id == lecture.id)
                .order_by(LectureAttachment.id.asc())
                .all()
            )

            lecture_item["attachments"] = [
                attachment_data(a) for a in attachments
            ]
            item["lectures"].append(lecture_item)

        result.append(item)

    return result


@router.post(
    "/{course_id}/learning/sections",
    status_code=status.HTTP_201_CREATED,
)
def create_section(
    course_id: int,
    data: SectionCreate,
    current_trainer=Depends(get_current_trainer),
    db: Session = Depends(get_db),
):
    ensure_assigned_course(course_id, current_trainer.id, db)

    title = data.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="اسم القسم مطلوب")

    section = CourseSection(
        course_id=course_id,
        title=title,
        description=data.description.strip() if data.description else None,
        order=next_section_order(course_id, db),
    )

    db.add(section)
    db.commit()
    db.refresh(section)

    return section_data(section)


@router.patch("/{course_id}/learning/sections/{section_id}")
def update_section(
    course_id: int,
    section_id: int,
    data: SectionUpdate,
    current_trainer=Depends(get_current_trainer),
    db: Session = Depends(get_db),
):
    ensure_assigned_course(course_id, current_trainer.id, db)
    section = get_section(course_id, section_id, db)

    changes = data.model_dump(exclude_unset=True)

    if "title" in changes:
        title = (changes["title"] or "").strip()
        if not title:
            raise HTTPException(status_code=422, detail="اسم القسم مطلوب")
        section.title = title

    if "description" in changes:
        section.description = (
            changes["description"].strip()
            if changes["description"]
            else None
        )

    db.commit()
    db.refresh(section)
    return section_data(section)


@router.delete(
    "/{course_id}/learning/sections/{section_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_section(
    course_id: int,
    section_id: int,
    current_trainer=Depends(get_current_trainer),
    db: Session = Depends(get_db),
):
    ensure_assigned_course(course_id, current_trainer.id, db)
    section = get_section(course_id, section_id, db)

    lectures = (
        db.query(CourseLecture)
        .filter(CourseLecture.section_id == section_id)
        .all()
    )

    for lecture in lectures:
        remove_uploaded_file(lecture.video_url)

        attachments = (
            db.query(LectureAttachment)
            .filter(LectureAttachment.lecture_id == lecture.id)
            .all()
        )

        for attachment in attachments:
            remove_uploaded_file(attachment.file_path)

    db.delete(section)
    db.commit()
    return None


# =========================
# Lectures
# =========================

@router.post(
    "/{course_id}/learning/sections/{section_id}/lectures",
    status_code=status.HTTP_201_CREATED,
)
def create_lecture(
    course_id: int,
    section_id: int,
    data: LectureCreate,
    current_trainer=Depends(get_current_trainer),
    db: Session = Depends(get_db),
):
    ensure_assigned_course(course_id, current_trainer.id, db)
    get_section(course_id, section_id, db)

    title = data.title.strip()
    if not title:
        raise HTTPException(status_code=422, detail="عنوان المحاضرة مطلوب")

    lecture = CourseLecture(
        section_id=section_id,
        title=title,
        description=data.description.strip() if data.description else None,
        order=next_lecture_order(section_id, db),
    )

    db.add(lecture)
    db.commit()
    db.refresh(lecture)

    return lecture_data(lecture)


@router.patch("/{course_id}/learning/lectures/{lecture_id}")
def update_lecture(
    course_id: int,
    lecture_id: int,
    data: LectureUpdate,
    current_trainer=Depends(get_current_trainer),
    db: Session = Depends(get_db),
):
    ensure_assigned_course(course_id, current_trainer.id, db)
    lecture = get_lecture(course_id, lecture_id, db)

    changes = data.model_dump(exclude_unset=True)

    if "title" in changes:
        title = (changes["title"] or "").strip()
        if not title:
            raise HTTPException(status_code=422, detail="عنوان المحاضرة مطلوب")
        lecture.title = title

    if "description" in changes:
        lecture.description = (
            changes["description"].strip()
            if changes["description"]
            else None
        )

    db.commit()
    db.refresh(lecture)
    return lecture_data(lecture)


@router.delete(
    "/{course_id}/learning/lectures/{lecture_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_lecture(
    course_id: int,
    lecture_id: int,
    current_trainer=Depends(get_current_trainer),
    db: Session = Depends(get_db),
):
    ensure_assigned_course(course_id, current_trainer.id, db)
    lecture = get_lecture(course_id, lecture_id, db)

    remove_uploaded_file(lecture.video_url)

    attachments = (
        db.query(LectureAttachment)
        .filter(LectureAttachment.lecture_id == lecture_id)
        .all()
    )

    for attachment in attachments:
        remove_uploaded_file(attachment.file_path)

    db.delete(lecture)
    db.commit()
    return None


# =========================
# External video link
# =========================

@router.put("/{course_id}/learning/lectures/{lecture_id}/video-link")
def set_video_link(
    course_id: int,
    lecture_id: int,
    data: VideoLinkCreate,
    current_trainer=Depends(get_current_trainer),
    db: Session = Depends(get_db),
):
    ensure_assigned_course(course_id, current_trainer.id, db)
    lecture = get_lecture(course_id, lecture_id, db)

    old_url = (
        lecture.video_url
        if lecture.video_source_type == "upload"
        else None
    )

    lecture.video_source_type = "link"
    lecture.video_url = str(data.video_url)
    lecture.video_file_path = None

    db.commit()
    db.refresh(lecture)

    if old_url:
        remove_uploaded_file(old_url)

    return lecture_data(lecture)


# =========================
# Video upload
# =========================

@router.post("/{course_id}/learning/lectures/{lecture_id}/video-upload")
async def upload_lecture_video(
    course_id: int,
    lecture_id: int,
    file: UploadFile = File(...),
    current_trainer=Depends(get_current_trainer),
    db: Session = Depends(get_db),
):
    ensure_assigned_course(course_id, current_trainer.id, db)
    lecture = get_lecture(course_id, lecture_id, db)

    old_url = (
        lecture.video_url
        if lecture.video_source_type == "upload"
        else None
    )

    file_url, _ = await save_upload(
        file,
        VIDEO_EXTENSIONS,
        MAX_VIDEO_SIZE,
    )

    lecture.video_source_type = "upload"
    lecture.video_url = file_url
    lecture.video_file_path = file_url

    try:
        db.commit()
        db.refresh(lecture)
    except Exception:
        db.rollback()
        remove_uploaded_file(file_url)
        raise

    if old_url:
        remove_uploaded_file(old_url)

    return lecture_data(lecture)


# =========================
# Lecture attachments
# =========================

@router.post(
    "/{course_id}/learning/lectures/{lecture_id}/attachments",
    status_code=status.HTTP_201_CREATED,
)
async def upload_lecture_attachment(
    course_id: int,
    lecture_id: int,
    file: UploadFile = File(...),
    title: str | None = Form(None),
    current_trainer=Depends(get_current_trainer),
    db: Session = Depends(get_db),
):
    ensure_assigned_course(course_id, current_trainer.id, db)
    lecture = get_lecture(course_id, lecture_id, db)

    file_url, size = await save_upload(
        file,
        ATTACHMENT_EXTENSIONS,
        MAX_ATTACHMENT_SIZE,
    )

    original_name = Path(file.filename or "attachment").name
    attachment_title = (title or "").strip() or original_name

    attachment = LectureAttachment(
        lecture_id=lecture.id,
        title=attachment_title,
        original_filename=original_name,
        file_path=file_url,
        mime_type=file.content_type,
        file_size=size,
    )

    try:
        db.add(attachment)
        db.commit()
        db.refresh(attachment)
    except Exception:
        db.rollback()
        remove_uploaded_file(file_url)
        raise

    return attachment_data(attachment)


@router.delete(
    "/{course_id}/learning/lectures/{lecture_id}/attachments/{attachment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_lecture_attachment(
    course_id: int,
    lecture_id: int,
    attachment_id: int,
    current_trainer=Depends(get_current_trainer),
    db: Session = Depends(get_db),
):
    ensure_assigned_course(course_id, current_trainer.id, db)
    get_lecture(course_id, lecture_id, db)

    attachment = (
        db.query(LectureAttachment)
        .filter(
            LectureAttachment.id == attachment_id,
            LectureAttachment.lecture_id == lecture_id,
        )
        .first()
    )

    if attachment is None:
        raise HTTPException(status_code=404, detail="المرفق غير موجود")

    file_url = attachment.file_path

    db.delete(attachment)
    db.commit()

    remove_uploaded_file(file_url)
    return None


# =========================
# Trainee lecture progress
# =========================

@router.get("/{course_id}/learning/progress")
def get_lecture_progress(
    course_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_learning_access(course_id, current_user, db)
    user = get_trainee(current_user, db)

    completed_ids = [
        row.lecture_id
        for row in db.query(LectureCompletion.lecture_id)
        .filter(
            LectureCompletion.trainee_id == user.id,
            LectureCompletion.course_id == course_id,
        )
        .all()
    ]

    return {"completed_lecture_ids": completed_ids}


@router.put(
    "/{course_id}/learning/lectures/{lecture_id}/completion"
)
def update_lecture_completion(
    course_id: int,
    lecture_id: int,
    data: LectureCompletionUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ensure_learning_access(course_id, current_user, db)
    user = get_trainee(current_user, db)

    lecture = get_lecture(course_id, lecture_id, db)

    if not (lecture.video_url or lecture.video_file_path):
        raise HTTPException(
            status_code=400,
            detail="المحاضرة لا تحتوي على فيديو",
        )

    completion = (
        db.query(LectureCompletion)
        .filter(
            LectureCompletion.trainee_id == user.id,
            LectureCompletion.course_id == course_id,
            LectureCompletion.lecture_id == lecture_id,
        )
        .first()
    )

    if data.completed:
        if completion is None:
            db.add(
                LectureCompletion(
                    trainee_id=user.id,
                    course_id=course_id,
                    lecture_id=lecture_id,
                    completed_at=datetime.utcnow(),
                )
            )
    elif completion is not None:
        db.delete(completion)

    db.commit()

    return {
        "lecture_id": lecture_id,
        "completed": data.completed,
    }
