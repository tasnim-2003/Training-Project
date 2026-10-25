
from pathlib import Path
from uuid import uuid4

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
from app.dependencies import get_current_trainer
from app.models import Course, CourseContent, Session as TrainingSession
from app.schemas.course_content import (
    CourseContentResponse,
    CourseContentType,
)

router = APIRouter(prefix="/courses", tags=["Course Content"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE = 50 * 1024 * 1024

ALLOWED_EXTENSIONS = {
    ".mp4", ".webm", ".mov",
    ".pdf",
    ".doc", ".docx",
    ".ppt", ".pptx",
    ".xls", ".xlsx",
    ".txt", ".zip",
}


class CourseContentLinkCreate(BaseModel):
    title: str
    description: str | None = None
    type: CourseContentType
    content_url: HttpUrl
    is_required: bool = True


class MeetingLinkUpdate(BaseModel):
    meeting_url: HttpUrl | None = None


def get_assigned_course(
    course_id: int,
    trainer_id: int,
    db: Session,
) -> Course:
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
            detail="Course not found or not assigned to this trainer",
        )

    return course


def next_content_order(course_id: int, db: Session) -> int:
    last_content = (
        db.query(CourseContent)
        .filter(CourseContent.course_id == course_id)
        .order_by(CourseContent.order.desc())
        .first()
    )

    return 1 if last_content is None else last_content.order + 1


@router.get(
    "/{course_id}/contents",
    response_model=list[CourseContentResponse],
)
def get_course_contents(
    course_id: int,
    current_trainer=Depends(get_current_trainer),
    db: Session = Depends(get_db),
):
    get_assigned_course(course_id, current_trainer.id, db)

    return (
        db.query(CourseContent)
        .filter(CourseContent.course_id == course_id)
        .order_by(CourseContent.order.asc())
        .all()
    )


@router.post(
    "/{course_id}/contents",
    response_model=CourseContentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_course_content_link(
    course_id: int,
    content_data: CourseContentLinkCreate,
    current_trainer=Depends(get_current_trainer),
    db: Session = Depends(get_db),
):
    get_assigned_course(course_id, current_trainer.id, db)

    if content_data.type not in {
        CourseContentType.VIDEO,
        CourseContentType.LINK,
    }:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="This content type requires a file upload.",
        )

    content = CourseContent(
        course_id=course_id,
        title=content_data.title.strip(),
        description=content_data.description,
        type=content_data.type.value,
        content_url=str(content_data.content_url),
        order=next_content_order(course_id, db),
        is_required=content_data.is_required,
    )

    db.add(content)
    db.commit()
    db.refresh(content)

    return content


@router.post(
    "/{course_id}/contents/upload",
    response_model=CourseContentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_course_content(
    course_id: int,
    title: str = Form(...),
    description: str = Form(""),
    type: CourseContentType = Form(...),
    is_required: bool = Form(True),
    file: UploadFile = File(...),
    current_trainer=Depends(get_current_trainer),
    db: Session = Depends(get_db),
):
    get_assigned_course(course_id, current_trainer.id, db)

    if type not in {
        CourseContentType.VIDEO,
        CourseContentType.MATERIAL,
        CourseContentType.FILE,
    }:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Choose a file-based content type.",
        )

    original_name = Path(file.filename or "").name
    extension = Path(original_name).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="This file type is not allowed.",
        )

    if type == CourseContentType.VIDEO and extension not in {
        ".mp4", ".webm", ".mov",
    }:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Video content requires a video file.",
        )

    if type == CourseContentType.MATERIAL and extension not in {
        ".pdf", ".doc", ".docx", ".ppt", ".pptx",
    }:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Use a PDF, Word, or PowerPoint file for materials.",
        )

    if type == CourseContentType.FILE and extension not in {
        ".pdf", ".doc", ".docx", ".ppt", ".pptx",
        ".xls", ".xlsx", ".txt", ".zip",
    }:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported document type.",
        )

    saved_name = f"{uuid4().hex}{extension}"
    destination = UPLOAD_DIR / saved_name
    size = 0

    try:
        with destination.open("wb") as output:
            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                size += len(chunk)

                if size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="Maximum file size is 50 MB.",
                    )

                output.write(chunk)

        content = CourseContent(
            course_id=course_id,
            title=title.strip(),
            description=description.strip() or None,
            type=type.value,
            content_url=f"/uploads/{saved_name}",
            order=next_content_order(course_id, db),
            is_required=is_required,
        )

        db.add(content)
        db.commit()
        db.refresh(content)

        return content

    except Exception:
        if destination.exists():
            destination.unlink()

        db.rollback()
        raise

    finally:
        await file.close()


@router.delete(
    "/{course_id}/contents/{content_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_course_content(
    course_id: int,
    content_id: int,
    current_trainer=Depends(get_current_trainer),
    db: Session = Depends(get_db),
):
    get_assigned_course(course_id, current_trainer.id, db)

    content = (
        db.query(CourseContent)
        .filter(
            CourseContent.id == content_id,
            CourseContent.course_id == course_id,
        )
        .first()
    )

    if content is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course content not found",
        )

    if content.content_url and content.content_url.startswith("/uploads/"):
        filename = Path(content.content_url).name
        stored_file = UPLOAD_DIR / filename

        if stored_file.exists():
            stored_file.unlink()

    db.delete(content)
    db.commit()

    return None


@router.get(
    "/{course_id}/sessions",
)
def get_course_sessions(
    course_id: int,
    current_trainer=Depends(get_current_trainer),
    db: Session = Depends(get_db),
):
    get_assigned_course(course_id, current_trainer.id, db)

    return (
        db.query(TrainingSession)
        .filter(TrainingSession.course_id == course_id)
        .order_by(
            TrainingSession.session_date.asc(),
            TrainingSession.start_time.asc(),
        )
        .all()
    )


@router.patch(
    "/{course_id}/sessions/{session_id}/meeting-link",
)
def update_session_meeting_link(
    course_id: int,
    session_id: int,
    meeting_data: MeetingLinkUpdate,
    current_trainer=Depends(get_current_trainer),
    db: Session = Depends(get_db),
):
    get_assigned_course(course_id, current_trainer.id, db)

    session = (
        db.query(TrainingSession)
        .filter(
            TrainingSession.id == session_id,
            TrainingSession.course_id == course_id,
        )
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    session.meeting_url = (
        str(meeting_data.meeting_url)
        if meeting_data.meeting_url
        else None
    )

    db.commit()
    db.refresh(session)

    return session
