from datetime import date
from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, Field, model_validator


class CourseStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class CourseCreate(BaseModel):
    name: str
    description: str
    objectives: str
    trainer_id: int | None = None

    start_date: date
    end_date: date

    duration: Decimal = Field(gt=0)
    seats: int = Field(gt=0)

    target_audience: str
    prerequisites: str | None = None
    registration_conditions: str | None = None

    impact_wait_days: int = Field(
        default=0,
        ge=0,
    )

    status: CourseStatus = CourseStatus.DRAFT

    @model_validator(mode="after")
    def validate_dates(self):
        today = date.today()

        if self.start_date < today:
            raise ValueError(
                "تاريخ بداية الدورة لا يمكن أن يكون قبل تاريخ اليوم."
            )

        if self.end_date < self.start_date:
            raise ValueError(
                "تاريخ نهاية الدورة لا يمكن أن يكون قبل تاريخ البداية."
            )

        return self


class CourseUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    objectives: str | None = None
    trainer_id: int | None = None

    start_date: date | None = None
    end_date: date | None = None

    duration: Decimal | None = Field(
        default=None,
        gt=0,
    )

    seats: int | None = Field(
        default=None,
        gt=0,
    )

    target_audience: str | None = None
    prerequisites: str | None = None
    registration_conditions: str | None = None

    impact_wait_days: int | None = Field(
        default=None,
        ge=0,
    )

    status: CourseStatus | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if (
            self.start_date is not None
            and self.end_date is not None
            and self.end_date < self.start_date
        ):
            raise ValueError(
                "تاريخ نهاية الدورة لا يمكن أن يكون قبل تاريخ البداية."
            )

        return self


class CourseResponse(BaseModel):
    id: int

    name: str
    description: str
    objectives: str

    trainer_id: int | None

    start_date: date
    end_date: date

    duration: Decimal
    seats: int

    target_audience: str
    prerequisites: str | None
    registration_conditions: str | None

    impact_wait_days: int

    status: CourseStatus

    model_config = {
        "from_attributes": True
    }