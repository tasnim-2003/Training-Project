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
    Identity,
)

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, Identity(), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role = Column(
        Enum("admin", "trainer", "trainee", name="user_role"),
        nullable=False,
    )
    status = Column(
        Enum("active", "inactive", name="user_status"),
        nullable=False,
        default="active",
    )


class Course(Base):
    __tablename__ = "courses"

    id = Column(BigInteger, Identity(), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    objectives = Column(Text, nullable=False)
    trainer_id = Column(BigInteger, ForeignKey("users.id"), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    duration = Column(Numeric(5, 2), nullable=False)
    seats = Column(Integer, nullable=False)
    target_audience = Column(Text, nullable=False)
    prerequisites = Column(Text, nullable=True)
    registration_conditions = Column(Text, nullable=True)
    impact_wait_days = Column(Integer, nullable=False, default=0)

    status = Column(
        Enum(
            "draft",
            "published",
            "archived",
            name="course_status",
        ),
        nullable=False,
        default="draft",
    )

    __table_args__ = (
        CheckConstraint(
            "end_date >= start_date",
            name="check_course_dates",
        ),
        CheckConstraint(
            "seats > 0",
            name="check_course_seats_positive",
        ),
        CheckConstraint(
            "duration > 0",
            name="check_course_duration_positive",
        ),
        CheckConstraint(
            "impact_wait_days >= 0",
            name="check_impact_wait_days_non_negative",
        ),
    )


class CourseContent(Base):
    __tablename__ = "course_contents"

    id = Column(BigInteger, Identity(), primary_key=True, index=True)
    course_id = Column(
        BigInteger,
        ForeignKey("courses.id"),
        nullable=False,
    )
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(
        Enum(
            "video",
            "material",
            "file",
            "link",
            name="course_content_type",
        ),
        nullable=False,
    )
    content_url = Column(Text, nullable=True)
    order = Column(Integer, nullable=False)
    is_required = Column(Boolean, nullable=False, default=True)

    __table_args__ = (
        CheckConstraint(
            '"order" > 0',
            name="check_content_order_positive",
        ),
        UniqueConstraint(
            "course_id",
            "order",
            name="uq_course_content_order",
        ),
    )


class Session(Base):
    __tablename__ = "sessions"

    id = Column(BigInteger, Identity(), primary_key=True, index=True)
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
        CheckConstraint(
            "end_time > start_time",
            name="check_session_time",
        ),
        CheckConstraint(
            "attendance_close_at > attendance_open_at",
            name="check_attendance_window",
        ),
    )


class Enrollment(Base):
    __tablename__ = "enrollments"

    id = Column(BigInteger, Identity(), primary_key=True, index=True)
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
        Enum(
            "pending",
            "approved",
            "rejected",
            name="enrollment_status",
        ),
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


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(BigInteger, Identity(), primary_key=True, index=True)
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
        Enum(
            "present",
            "absent",
            name="attendance_status",
        ),
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


class ContentCompletion(Base):
    __tablename__ = "content_completions"

    id = Column(BigInteger, Identity(), primary_key=True, index=True)
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


class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(BigInteger, Identity(), primary_key=True, index=True)
    course_id = Column(
        BigInteger,
        ForeignKey("courses.id"),
        nullable=False,
    )
    title = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    __table_args__ = (
        UniqueConstraint(
            "course_id",
            name="uq_course_evaluation_form",
        ),
    )


class EvaluationQuestion(Base):
    __tablename__ = "evaluation_questions"

    id = Column(BigInteger, Identity(), primary_key=True, index=True)
    evaluation_id = Column(
        BigInteger,
        ForeignKey("evaluations.id"),
        nullable=False,
    )
    question_text = Column(Text, nullable=False)

    question_type = Column(
        Enum(
            "rating",
            "text",
            name="evaluation_question_type",
        ),
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


class EvaluationResponse(Base):
    __tablename__ = "evaluation_responses"

    id = Column(BigInteger, Identity(), primary_key=True, index=True)
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


class EvaluationAnswer(Base):
    __tablename__ = "evaluation_answers"

    id = Column(BigInteger, Identity(), primary_key=True, index=True)
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


class ImpactForm(Base):
    __tablename__ = "impact_forms"

    id = Column(BigInteger, Identity(), primary_key=True, index=True)
    course_id = Column(
        BigInteger,
        ForeignKey("courses.id"),
        nullable=False,
    )
    title = Column(String(255), nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    __table_args__ = (
        UniqueConstraint(
            "course_id",
            name="uq_course_impact_form",
        ),
    )


class ImpactQuestion(Base):
    __tablename__ = "impact_questions"

    id = Column(BigInteger, Identity(), primary_key=True, index=True)
    impact_form_id = Column(
        BigInteger,
        ForeignKey("impact_forms.id"),
        nullable=False,
    )
    question_text = Column(Text, nullable=False)

    question_type = Column(
        Enum(
            "rating",
            "text",
            name="impact_question_type",
        ),
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


class ImpactResponse(Base):
    __tablename__ = "impact_responses"

    id = Column(BigInteger, Identity(), primary_key=True, index=True)
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


class ImpactAnswer(Base):
    __tablename__ = "impact_answers"

    id = Column(BigInteger, Identity(), primary_key=True, index=True)
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


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(BigInteger, Identity(), primary_key=True, index=True)
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
        Enum(
            "issued",
            "revoked",
            name="certificate_status",
        ),
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


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(BigInteger, Identity(), primary_key=True, index=True)
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
            name="notification_type",
        ),
        nullable=False,
    )

    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False)