from datetime import date, time, datetime

from pydantic import BaseModel, model_validator


# =========================================================
# Create Session
# =========================================================

class SessionCreate(BaseModel):
    course_id: int

    title: str

    session_date: date

    start_time: time
    end_time: time

    meeting_url: str | None = None

    attendance_open_at: datetime
    attendance_close_at: datetime

    @model_validator(mode="after")
    def validate_times(self):
        if self.end_time <= self.start_time:
            raise ValueError(
                "end_time must be greater than start_time"
            )

        if self.attendance_close_at <= self.attendance_open_at:
            raise ValueError(
                "attendance_close_at must be greater than attendance_open_at"
            )

        return self


# =========================================================
# Update Session
# =========================================================

class SessionUpdate(BaseModel):
    title: str | None = None

    session_date: date | None = None

    start_time: time | None = None
    end_time: time | None = None

    meeting_url: str | None = None

    attendance_open_at: datetime | None = None
    attendance_close_at: datetime | None = None

    @model_validator(mode="after")
    def validate_times(self):
        if (
            self.start_time is not None
            and self.end_time is not None
            and self.end_time <= self.start_time
        ):
            raise ValueError(
                "end_time must be greater than start_time"
            )

        if (
            self.attendance_open_at is not None
            and self.attendance_close_at is not None
            and self.attendance_close_at <= self.attendance_open_at
        ):
            raise ValueError(
                "attendance_close_at must be greater than attendance_open_at"
            )

        return self


# =========================================================
# Session Response
# =========================================================

class SessionResponse(BaseModel):
    id: int
    course_id: int

    title: str

    session_date: date

    start_time: time
    end_time: time

    meeting_url: str | None

    attendance_open_at: datetime
    attendance_close_at: datetime

    model_config = {  
        "from_attributes": True
    }