
from datetime import datetime

from sqlalchemy import (
    Column,
    BigInteger,
    String,
    Enum,
    ForeignKey,
    Text,
    Date,
    Numeric,
    Integer,
    Boolean,
    Time,
    DateTime,
    UniqueConstraint,
    CheckConstraint,
)

from app.database import Base


# =========================================================
# 1. Users
# =========================================================

class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)

    role = Column(
        Enum("admin", "trainer", "trainee", name="user_role_enum"),
        nullable=False,
    )

    status = Column(
        Enum("active", "inactive", name="user_status_enum"),
        nullable=False,
        default="active",
    )


# =========================================================
# 2. Courses
# =========================================================

class Course(Base):
    __tablename__ = "courses"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    objectives = Column(Text, nullable=False)
    cover_image = Column(Text, nullable=True)
    trainer_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=True,
    )

    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    duration = Column(Numeric(5, 2), nullable=False)
    seats = Column(Integer, nullable=False)
    minimum_participants = Column(Integer, nullable=True)
    maximum_participants = Column(Integer, nullable=True)
    target_audience = Column(Text, nullable=False)
    prerequisites = Column(Text, nullable=True)
    registration_conditions = Column(Text, nullable=True)

    impact_wait_days = Column(Integer, nullable=False, default=0)

    status = Column(
        Enum("draft", "published", "archived", name="course_status_enum"),
        nullable=False,
        default="draft",
    )

    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="check_course_dates"),
        CheckConstraint("seats > 0", name="check_course_seats_positive"),
        CheckConstraint("duration > 0", name="check_course_duration_positive"),
        CheckConstraint(
            "impact_wait_days >= 0",
            name="check_impact_wait_days_non_negative",
        ),
        CheckConstraint(
            "minimum_participants IS NULL OR minimum_participants > 0",
            name="check_minimum_participants_positive",
        ),
        CheckConstraint(
            "maximum_participants IS NULL OR maximum_participants > 0",
            name="check_maximum_participants_positive",
        ),
        CheckConstraint(
            """
            minimum_participants IS NULL
            OR maximum_participants IS NULL
            OR minimum_participants <= maximum_participants
            """,
            name="check_participant_limits",
        ),
    )


# =========================================================
# 3. Course Contents
# =========================================================

class CourseContent(Base):
    __tablename__ = "course_contents"

    id = Column(BigInteger, primary_key=True, index=True)

    course_id = Column(
        BigInteger,
        ForeignKey("courses.id"),
        nullable=False,
    )

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    type = Column(
        Enum("video", "material", "file", "link", name="content_type_enum"),
        nullable=False,
    )

    content_url = Column(Text, nullable=True)
    order = Column(Integer, nullable=False)
    is_required = Column(Boolean, nullable=False, default=True)

    __table_args__ = (
        CheckConstraint('"order" > 0', name="check_content_order_positive"),
        UniqueConstraint(
            "course_id",
            "order",
            name="uq_course_content_order",
        ),
    )


# =========================================================
# 4. Sessions
# =========================================================

class Session(Base):
    __tablename__ = "sessions"

    id = Column(BigInteger, primary_key=True, index=True)

    course_id = Column(
        BigInteger,
        ForeignKey("courses.id"),
        nullable=False,
    )

    title = Column(String(255), nullable=False)
    session_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    meeting_url = Column(Text, nullable=True)
    attendance_open_at = Column(DateTime, nullable=False)
    attendance_close_at = Column(DateTime, nullable=False)

    __table_args__ = (
        CheckConstraint("end_time > start_time", name="check_session_time"),
        CheckConstraint(
            "attendance_close_at > attendance_open_at",
            name="check_attendance_window",
        ),
    )


# =========================================================
# 5. Enrollments
# =========================================================

class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(BigInteger, primary_key=True, index=True)

    trainee_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False,
    )

    course_id = Column(
        BigInteger,
        ForeignKey("courses.id"),
        nullable=False,
    )

    registered_at = Column(DateTime, nullable=False)

    status = Column(
        Enum("pending", "approved", "rejected", name="enrollment_status_enum"),
        nullable=False,
        default="pending",
    )

    rejection_reason = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint(
            "trainee_id",
            "course_id",
            name="uq_enrollment_trainee_course",
        ),
    )


# =========================================================
# 6. Attendance
# =========================================================

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(BigInteger, primary_key=True, index=True)

    trainee_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False,
    )

    course_id = Column(
        BigInteger,
        ForeignKey("courses.id"),
        nullable=False,
    )

    session_id = Column(
        BigInteger,
        ForeignKey("sessions.id"),
        nullable=False,
    )

    attendance_status = Column(
        Enum("present", "absent", name="attendance_status_enum"),
        nullable=False,
    )

    recorded_at = Column(DateTime, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "trainee_id",
            "session_id",
            name="uq_attendance_trainee_session",
        ),
    )


# =========================================================
# 7. Content Completion
# =========================================================

class ContentCompletion(Base):
    __tablename__ = "content_completions"

    id = Column(BigInteger, primary_key=True, index=True)

    trainee_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False,
    )

    course_id = Column(
        BigInteger,
        ForeignKey("courses.id"),
        nullable=False,
    )

    content_id = Column(
        BigInteger,
        ForeignKey("course_contents.id"),
        nullable=False,
    )

    completed_at = Column(DateTime, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "trainee_id",
            "content_id",
            name="uq_content_completion_trainee_content",
        ),
    )


# =========================================================
# 8. Evaluations
# =========================================================

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(BigInteger, primary_key=True, index=True)

    course_id = Column(
        BigInteger,
        ForeignKey("courses.id"),
        nullable=False,
    )

    title = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    __table_args__ = (
        UniqueConstraint("course_id", name="uq_course_evaluation_form"),
    )


# =========================================================
# 9. Evaluation Questions
# =========================================================

class EvaluationQuestion(Base):
    __tablename__ = "evaluation_questions"

    id = Column(BigInteger, primary_key=True, index=True)

    evaluation_id = Column(
        BigInteger,
        ForeignKey("evaluations.id"),
        nullable=False,
    )

    question_text = Column(Text, nullable=False)

    question_type = Column(
        Enum("rating", "text", name="evaluation_question_type_enum"),
        nullable=False,
    )

    order = Column(Integer, nullable=False)

    __table_args__ = (
        CheckConstraint(
            '"order" > 0',
            name="check_evaluation_question_order_positive",
        ),
        UniqueConstraint(
            "evaluation_id",
            "order",
            name="uq_evaluation_question_order",
        ),
    )


# =========================================================
# 10. Evaluation Responses
# =========================================================

class EvaluationResponse(Base):
    __tablename__ = "evaluation_responses"

    id = Column(BigInteger, primary_key=True, index=True)

    evaluation_id = Column(
        BigInteger,
        ForeignKey("evaluations.id"),
        nullable=False,
    )

    trainee_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False,
    )

    submitted_at = Column(DateTime, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "evaluation_id",
            "trainee_id",
            name="uq_trainee_evaluation_response",
        ),
    )


# =========================================================
# 11. Evaluation Answers
# =========================================================

class EvaluationAnswer(Base):
    __tablename__ = "evaluation_answers"

    id = Column(BigInteger, primary_key=True, index=True)

    response_id = Column(
        BigInteger,
        ForeignKey("evaluation_responses.id"),
        nullable=False,
    )

    question_id = Column(
        BigInteger,
        ForeignKey("evaluation_questions.id"),
        nullable=False,
    )

    answer_text = Column(Text, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "response_id",
            "question_id",
            name="uq_evaluation_response_question_answer",
        ),
    )


# =========================================================
# 12. Impact Forms
# =========================================================

class ImpactForm(Base):
    __tablename__ = "impact_forms"

    id = Column(BigInteger, primary_key=True, index=True)

    course_id = Column(
        BigInteger,
        ForeignKey("courses.id"),
        nullable=False,
    )

    title = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    __table_args__ = (
        UniqueConstraint("course_id", name="uq_course_impact_form"),
    )


# =========================================================
# 13. Impact Questions
# =========================================================

class ImpactQuestion(Base):
    __tablename__ = "impact_questions"

    id = Column(BigInteger, primary_key=True, index=True)

    impact_form_id = Column(
        BigInteger,
        ForeignKey("impact_forms.id"),
        nullable=False,
    )

    question_text = Column(Text, nullable=False)

    question_type = Column(
        Enum("rating", "text", name="impact_question_type_enum"),
        nullable=False,
    )

    order = Column(Integer, nullable=False)

    __table_args__ = (
        CheckConstraint(
            '"order" > 0',
            name="check_impact_question_order_positive",
        ),
        UniqueConstraint(
            "impact_form_id",
            "order",
            name="uq_impact_question_order",
        ),
    )


# =========================================================
# 14. Impact Responses
# =========================================================

class ImpactResponse(Base):
    __tablename__ = "impact_responses"

    id = Column(BigInteger, primary_key=True, index=True)

    impact_form_id = Column(
        BigInteger,
        ForeignKey("impact_forms.id"),
        nullable=False,
    )

    trainee_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False,
    )

    submitted_at = Column(DateTime, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "impact_form_id",
            "trainee_id",
            name="uq_trainee_impact_response",
        ),
    )


# =========================================================
# 15. Impact Answers
# =========================================================

class ImpactAnswer(Base):
    __tablename__ = "impact_answers"

    id = Column(BigInteger, primary_key=True, index=True)

    response_id = Column(
        BigInteger,
        ForeignKey("impact_responses.id"),
        nullable=False,
    )

    question_id = Column(
        BigInteger,
        ForeignKey("impact_questions.id"),
        nullable=False,
    )

    answer_text = Column(Text, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "response_id",
            "question_id",
            name="uq_impact_response_question_answer",
        ),
    )


# =========================================================
# 16. Certificates
# =========================================================

class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(BigInteger, primary_key=True, index=True)

    trainee_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False,
    )

    course_id = Column(
        BigInteger,
        ForeignKey("courses.id"),
        nullable=False,
    )

    certificate_number = Column(
        String(255),
        unique=True,
        nullable=False,
    )

    issued_at = Column(DateTime, nullable=False)

    status = Column(
        Enum("issued", "revoked", name="certificate_status_enum"),
        nullable=False,
        default="issued",
    )

    file_path = Column(Text, nullable=True)

    __table_args__ = (
        UniqueConstraint(
            "trainee_id",
            "course_id",
            name="uq_trainee_course_certificate",
        ),
    )


# =========================================================
# 17. Notifications
# =========================================================

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(BigInteger, primary_key=True, index=True)

    user_id = Column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=False,
    )

    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)

    type = Column(
        Enum(
            "registration",
            "session_reminder",
            "evaluation",
            "impact",
            "certificate",
            "trainer_application",
            name="notification_type",
            create_type=False,
        ),
        nullable=False,
    )

    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False)


# =========================================================
# 18. Course Sections
# =========================================================

class CourseSection(Base):
    __tablename__ = "course_sections"

    __table_args__ = (
        UniqueConstraint(
            "course_id",
            "order",
            name="uq_course_sections_course_order",
        ),
        CheckConstraint(
            '"order" > 0',
            name="ck_course_sections_positive_order",
        ),
    )

    id = Column(BigInteger, primary_key=True, index=True)

    course_id = Column(
        BigInteger,
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# =========================================================
# 19. Course Lectures
# =========================================================

class CourseLecture(Base):
    __tablename__ = "course_lectures"

    __table_args__ = (
        UniqueConstraint(
            "section_id",
            "order",
            name="uq_course_lectures_section_order",
        ),
        CheckConstraint(
            '"order" > 0',
            name="ck_course_lectures_positive_order",
        ),
    )

    id = Column(BigInteger, primary_key=True, index=True)

    section_id = Column(
        BigInteger,
        ForeignKey("course_sections.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(String(250), nullable=False)
    description = Column(Text, nullable=True)
    order = Column(Integer, nullable=False, default=1)
    video_source_type = Column(String(20), nullable=True)
    video_url = Column(Text, nullable=True)
    video_file_path = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# =========================================================
# 20. Lecture Attachments
# =========================================================

class LectureAttachment(Base):
    __tablename__ = "lecture_attachments"

    id = Column(BigInteger, primary_key=True, index=True)

    lecture_id = Column(
        BigInteger,
        ForeignKey("course_lectures.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    mime_type = Column(String(150), nullable=True)
    file_size = Column(BigInteger, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)



class LectureCompletion(Base):
    __tablename__ = "lecture_completions"

    id = Column(BigInteger, primary_key=True, index=True)

    trainee_id = Column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    course_id = Column(
        BigInteger,
        ForeignKey("courses.id", ondelete="CASCADE"),
        nullable=False,
    )

    lecture_id = Column(
        BigInteger,
        ForeignKey("course_lectures.id", ondelete="CASCADE"),
        nullable=False,
    )

    completed_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    __table_args__ = (
        UniqueConstraint(
            "trainee_id",
            "lecture_id",
            name="uq_lecture_completion_trainee_lecture",
        ),
    )
# =========================================================
# 21. Password Reset Tokens
# =========================================================

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(BigInteger, primary_key=True, index=True)

    user_id = Column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    token_hash = Column(String(64), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# =========================================================
# 22. Trainer Applications
# =========================================================

class TrainerApplication(Base):
    __tablename__ = "trainer_applications"

    id = Column(BigInteger, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    employee_id = Column(String(100), nullable=True)
    department = Column(String(255), nullable=False)
    specialization = Column(String(255), nullable=False)
    qualifications = Column(Text, nullable=False)
    experience = Column(Text, nullable=False)
    motivation = Column(Text, nullable=False)

    status = Column(
        Enum(
            "pending",
            "approved",
            "rejected",
            name="trainer_application_status_enum",
        ),
        nullable=False,
        default="pending",
    )

    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)

    reviewed_by = Column(
        BigInteger,
        ForeignKey("users.id"),
        nullable=True,
    )
