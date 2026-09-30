from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


# =========================================================
# Evaluation Question Type
# =========================================================

class EvaluationQuestionType(str, Enum):
    RATING = "rating"
    TEXT = "text"


# =========================================================
# Create Evaluation
# =========================================================

class EvaluationCreate(BaseModel):
    course_id: int
    title: str
    is_active: bool = True


# =========================================================
# Update Evaluation
# =========================================================

class EvaluationUpdate(BaseModel):
    title: str | None = None
    is_active: bool | None = None


# =========================================================
# Evaluation Response
# =========================================================

class EvaluationResponseSchema(BaseModel):
    id: int
    course_id: int
    title: str
    is_active: bool

    model_config = {
        "from_attributes": True
    }


# =========================================================
# Create Evaluation Question
# =========================================================

class EvaluationQuestionCreate(BaseModel):
    evaluation_id: int

    question_text: str

    question_type: EvaluationQuestionType

    order: int = Field(gt=0)


# =========================================================
# Update Evaluation Question
# =========================================================

class EvaluationQuestionUpdate(BaseModel):
    question_text: str | None = None

    question_type: EvaluationQuestionType | None = None

    order: int | None = Field(default=None, gt=0)


# =========================================================
# Evaluation Question Response
# =========================================================

class EvaluationQuestionResponse(BaseModel):
    id: int
    evaluation_id: int

    question_text: str

    question_type: EvaluationQuestionType

    order: int

    model_config = {
        "from_attributes": True
    }


# =========================================================
# Create Evaluation Response
# =========================================================

class EvaluationResponseCreate(BaseModel):
    evaluation_id: int
    trainee_id: int


# =========================================================
# Evaluation Answer
# =========================================================

class EvaluationAnswerCreate(BaseModel):
    question_id: int
    answer_text: str


# =========================================================
# Submit Evaluation
# =========================================================

class EvaluationSubmit(BaseModel):
    evaluation_id: int
    trainee_id: int
    answers: list[EvaluationAnswerCreate]


# =========================================================
# Evaluation Response Output
# =========================================================

class EvaluationSubmissionResponse(BaseModel):
    id: int

    evaluation_id: int
    trainee_id: int

    submitted_at: datetime

    model_config = {
        "from_attributes": True
    }
   