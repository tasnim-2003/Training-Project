
from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class NotificationType(str, Enum):
    REGISTRATION = "registration"
    SESSION_REMINDER = "session_reminder"
    EVALUATION = "evaluation"
    IMPACT = "impact"
    CERTIFICATE = "certificate"
    TRAINER_APPLICATION = "trainer_application"


class NotificationCreate(BaseModel):
    user_id: int
    title: str
    message: str
    type: NotificationType


class NotificationUpdate(BaseModel):
    is_read: bool


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: NotificationType
    is_read: bool
    created_at: datetime

    model_config = {"from_attributes": True}
