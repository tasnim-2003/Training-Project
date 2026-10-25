
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app import models
from app.database import Base, engine, get_db
from app.dependencies import get_current_user
from app.models import (
    CourseLecture,
    CourseSection,
    LectureAttachment,
)
from app.routers import (
    analytics,
    attendance,
    auth,
    courses,
    course_contents,
    course_learning_content,
    enrollments,
    evaluations,
    notifications,
    sessions,
    trainer_applications,
    trainers,
    password_reset,
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Athar Training Management System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analytics.router)
app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(course_contents.router)
app.include_router(enrollments.router)
app.include_router(sessions.router)
app.include_router(attendance.router)
app.include_router(evaluations.router)
app.include_router(notifications.router)
app.include_router(trainers.router)
app.include_router(course_learning_content.router)
app.include_router(password_reset.router)
app.include_router(trainer_applications.router)


UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
LEARNING_UPLOAD_DIR = UPLOAD_DIR / "learning"

UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
LEARNING_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@app.get("/uploads/learning/{file_path:path}")
def serve_protected_learning_file(
    file_path: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from app.routers.course_learning_content import ensure_learning_access

    # Only allow a single filename, not directory traversal.
    filename = Path(file_path).name

    if (
        not filename
        or filename != file_path
        or filename in {".", ".."}
    ):
        raise HTTPException(status_code=404, detail="File not found")

    requested_url = f"/uploads/learning/{filename}"
    physical_path = (LEARNING_UPLOAD_DIR / filename).resolve()

    if physical_path.parent != LEARNING_UPLOAD_DIR.resolve():
        raise HTTPException(status_code=404, detail="File not found")

    # Find the file in the database before serving it.
    lecture = (
        db.query(CourseLecture)
        .join(
            CourseSection,
            CourseLecture.section_id == CourseSection.id,
        )
        .filter(
            (CourseLecture.video_url == requested_url)
            | (CourseLecture.video_file_path == requested_url)
        )
        .first()
    )

    attachment = (
        db.query(LectureAttachment)
        .filter(LectureAttachment.file_path == requested_url)
        .first()
    )

    if lecture is None and attachment is None:
        raise HTTPException(status_code=404, detail="File not found")

    if lecture is not None:
        section = (
            db.query(CourseSection)
            .filter(CourseSection.id == lecture.section_id)
            .first()
        )

        if section is None:
            raise HTTPException(status_code=404, detail="File not found")

        course_id = section.course_id
    else:
        attachment_lecture = (
            db.query(CourseLecture)
            .filter(CourseLecture.id == attachment.lecture_id)
            .first()
        )

        if attachment_lecture is None:
            raise HTTPException(status_code=404, detail="File not found")

        section = (
            db.query(CourseSection)
            .filter(CourseSection.id == attachment_lecture.section_id)
            .first()
        )

        if section is None:
            raise HTTPException(status_code=404, detail="File not found")

        course_id = section.course_id

    # Requires an active account and valid course access.
    # Trainees must have an approved enrollment.
    ensure_learning_access(course_id, current_user, db)

    if not physical_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    if lecture is not None:
        return FileResponse(
            path=physical_path,
            content_disposition_type="inline",
        )

    return FileResponse(
        path=physical_path,
        filename=attachment.original_filename,
        content_disposition_type="attachment",
    )


# Keep the existing uploads mount for other uploaded resources.
# The protected learning-file route above must remain before this mount.
app.mount(
    "/uploads",
    StaticFiles(directory=str(UPLOAD_DIR)),
    name="uploads",
)


@app.get("/")
def home():
    return {"message": "Training Management System"}
