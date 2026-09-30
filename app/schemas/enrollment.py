from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class EnrollmentStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class EnrollmentCreate(BaseModel):
    course_id: int


class EnrollmentUpdate(BaseModel):
    status: EnrollmentStatus
    rejection_reason: str | None = None


class EnrollmentResponse(BaseModel):
    id: int

    trainee_id: int
    course_id: int

    course_title: str

    registered_at: datetime

    status: EnrollmentStatus

    rejection_reason: str | None

    model_config = {
        "from_attributes": True
    }