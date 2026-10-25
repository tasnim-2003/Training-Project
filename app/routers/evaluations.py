
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_admin, get_current_user
from app.models import (
    Course,
    Enrollment,
    Evaluation,
    EvaluationAnswer,
    EvaluationQuestion,
    EvaluationResponse,
    CourseSection,
    CourseLecture,
    LectureCompletion,
)

from app.schemas.evaluation import (
    EvaluationCreate,
    EvaluationQuestionCreate,
    EvaluationQuestionResponse,
    EvaluationQuestionUpdate,
    EvaluationResponseSchema,
    EvaluationSubmit,
    EvaluationSubmissionResponse,
    EvaluationUpdate,
)

router = APIRouter(
    prefix="/evaluations",
    tags=["Evaluations"],
)


# =========================================================
# Helper - Check Course Lecture Completion
# =========================================================

def get_course_lecture_progress(
    db: Session,
    course_id: int,
    trainee_id: int,
):
    total_lectures = (
        db.query(CourseLecture.id)
        .join(
            CourseSection,
            CourseLecture.section_id == CourseSection.id,
        )
        .filter(CourseSection.course_id == course_id)
        .count()
    )

    completed_lectures = (
        db.query(LectureCompletion.lecture_id)
        .join(
            CourseLecture,
            LectureCompletion.lecture_id == CourseLecture.id,
        )
        .join(
            CourseSection,
            CourseLecture.section_id == CourseSection.id,
        )
        .filter(
            CourseSection.course_id == course_id,
            LectureCompletion.course_id == course_id,
            LectureCompletion.trainee_id == trainee_id,
        )
        .distinct()
        .count()
    )

    return {
        "total_lectures": total_lectures,
        "completed_lectures": completed_lectures,
        "content_completed": (
            total_lectures > 0
            and completed_lectures >= total_lectures
        ),
    }


# =========================================================
# Admin - Create Evaluation
# =========================================================

@router.post(
    "/",
    response_model=EvaluationResponseSchema,
    status_code=status.HTTP_201_CREATED,
)
def create_evaluation(
    evaluation_data: EvaluationCreate,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    course = (
        db.query(Course)
        .filter(Course.id == evaluation_data.course_id)
        .first()
    )

    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found",
        )

    existing_evaluation = (
        db.query(Evaluation)
        .filter(
            Evaluation.course_id == evaluation_data.course_id
        )
        .first()
    )

    if existing_evaluation:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An evaluation already exists for this course",
        )

    evaluation = Evaluation(
        course_id=evaluation_data.course_id,
        title=evaluation_data.title,
        is_active=evaluation_data.is_active,
    )

    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    return {
        "id": evaluation.id,
        "course_id": evaluation.course_id,
        "title": evaluation.title,
        "is_active": evaluation.is_active,
    }


# =========================================================
# Admin - Get Evaluation
# =========================================================

@router.get(
    "/course/{course_id}",
    response_model=EvaluationResponseSchema,
)
def get_course_evaluation(
    course_id: int,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    evaluation = (
        db.query(Evaluation)
        .filter(Evaluation.course_id == course_id)
        .first()
    )

    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation not found",
        )

    return evaluation


# =========================================================
# Admin - Update Evaluation
# =========================================================

@router.put(
    "/{evaluation_id}",
    response_model=EvaluationResponseSchema,
)
def update_evaluation(
    evaluation_id: int,
    evaluation_data: EvaluationUpdate,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    evaluation = (
        db.query(Evaluation)
        .filter(Evaluation.id == evaluation_id)
        .first()
    )

    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation not found",
        )

    update_data = evaluation_data.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(evaluation, field, value)

    db.commit()
    db.refresh(evaluation)

    return evaluation


# =========================================================
# Admin - Add Evaluation Question
# =========================================================

@router.post(
    "/questions",
    response_model=EvaluationQuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_evaluation_question(
    question_data: EvaluationQuestionCreate,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    evaluation = (
        db.query(Evaluation)
        .filter(Evaluation.id == question_data.evaluation_id)
        .first()
    )

    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation not found",
        )

    existing_question = (
        db.query(EvaluationQuestion)
        .filter(
            EvaluationQuestion.evaluation_id
            == question_data.evaluation_id,
            EvaluationQuestion.order == question_data.order,
        )
        .first()
    )

    if existing_question:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A question with this order already exists",
        )

    question = EvaluationQuestion(
        evaluation_id=question_data.evaluation_id,
        question_text=question_data.question_text,
        question_type=question_data.question_type.value,
        order=question_data.order,
    )

    db.add(question)
    db.commit()
    db.refresh(question)

    return question


# =========================================================
# Admin - Get Evaluation Questions
# =========================================================

@router.get(
    "/{evaluation_id}/questions",
    response_model=list[EvaluationQuestionResponse],
)
def get_evaluation_questions(
    evaluation_id: int,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    evaluation = (
        db.query(Evaluation)
        .filter(Evaluation.id == evaluation_id)
        .first()
    )

    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation not found",
        )

    questions = (
        db.query(EvaluationQuestion)
        .filter(
            EvaluationQuestion.evaluation_id == evaluation_id
        )
        .order_by(EvaluationQuestion.order.asc())
        .all()
    )

    return questions


# =========================================================
# Admin - Update Evaluation Question
# =========================================================

@router.put(
    "/questions/{question_id}",
    response_model=EvaluationQuestionResponse,
)
def update_evaluation_question(
    question_id: int,
    question_data: EvaluationQuestionUpdate,
    current_admin: dict = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    question = (
        db.query(EvaluationQuestion)
        .filter(EvaluationQuestion.id == question_id)
        .first()
    )

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation question not found",
        )

    update_data = question_data.model_dump(
        exclude_unset=True
    )

    if "order" in update_data:
        existing_order = (
            db.query(EvaluationQuestion)
            .filter(
                EvaluationQuestion.evaluation_id
                == question.evaluation_id,
                EvaluationQuestion.order
                == update_data["order"],
                EvaluationQuestion.id != question.id,
            )
            .first()
        )

        if existing_order:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A question with this order already exists",
            )

    for field, value in update_data.items():
        if field == "question_type" and value is not None:
            setattr(question, field, value.value)
        else:
            setattr(question, field, value)

    db.commit()
    db.refresh(question)

    return question


# =========================================================
# Trainee - Get Available Evaluation
# =========================================================

@router.get(
    "/available/{course_id}",
    response_model=EvaluationResponseSchema,
)
def get_available_evaluation(
    course_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trainee_id = current_user["id"]

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.course_id == course_id,
            Enrollment.trainee_id == trainee_id,
            Enrollment.status == "approved",
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not approved for this course",
        )

    progress = get_course_lecture_progress(
        db,
        course_id,
        trainee_id,
    )

    if not progress["content_completed"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please complete all course lectures before evaluation",
        )

    evaluation = (
        db.query(Evaluation)
        .filter(
            Evaluation.course_id == course_id,
            Evaluation.is_active.is_(True),
        )
        .first()
    )

    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active evaluation is available for this course",
        )

    existing_response = (
        db.query(EvaluationResponse)
        .filter(
            EvaluationResponse.evaluation_id == evaluation.id,
            EvaluationResponse.trainee_id == trainee_id,
        )
        .first()
    )

    if existing_response:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already completed this evaluation",
        )

    return evaluation


# =========================================================
# Trainee - Get Available Evaluation Questions
# =========================================================

@router.get(
    "/available/{course_id}/questions",
    response_model=list[EvaluationQuestionResponse],
)
def get_available_evaluation_questions(
    course_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trainee_id = current_user["id"]

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.course_id == course_id,
            Enrollment.trainee_id == trainee_id,
            Enrollment.status == "approved",
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not approved for this course",
        )

    progress = get_course_lecture_progress(
        db,
        course_id,
        trainee_id,
    )

    if not progress["content_completed"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please complete all course lectures before evaluation",
        )

    evaluation = (
        db.query(Evaluation)
        .filter(
            Evaluation.course_id == course_id,
            Evaluation.is_active.is_(True),
        )
        .first()
    )

    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active evaluation is available for this course",
        )

    existing_response = (
        db.query(EvaluationResponse)
        .filter(
            EvaluationResponse.evaluation_id == evaluation.id,
            EvaluationResponse.trainee_id == trainee_id,
        )
        .first()
    )

    if existing_response:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already completed this evaluation",
        )

    questions = (
        db.query(EvaluationQuestion)
        .filter(
            EvaluationQuestion.evaluation_id == evaluation.id
        )
        .order_by(EvaluationQuestion.order.asc())
        .all()
    )

    return questions


# =========================================================
# Trainee - Submit Evaluation
# =========================================================

@router.post(
    "/submit",
    response_model=EvaluationSubmissionResponse,
    status_code=status.HTTP_201_CREATED,
)
def submit_evaluation(
    submission: EvaluationSubmit,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trainee_id = current_user["id"]

    if submission.trainee_id != trainee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit your own evaluation",
        )

    evaluation = (
        db.query(Evaluation)
        .filter(
            Evaluation.id == submission.evaluation_id,
            Evaluation.is_active.is_(True),
        )
        .first()
    )

    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active evaluation not found",
        )

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.course_id == evaluation.course_id,
            Enrollment.trainee_id == trainee_id,
            Enrollment.status == "approved",
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not approved for this course",
        )

    progress = get_course_lecture_progress(
        db,
        evaluation.course_id,
        trainee_id,
    )

    if not progress["content_completed"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please complete all course lectures before evaluation",
        )

    existing_response = (
        db.query(EvaluationResponse)
        .filter(
            EvaluationResponse.evaluation_id
            == submission.evaluation_id,
            EvaluationResponse.trainee_id == trainee_id,
        )
        .first()
    )

    if existing_response:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already submitted this evaluation",
        )

    questions = (
        db.query(EvaluationQuestion)
        .filter(
            EvaluationQuestion.evaluation_id
            == submission.evaluation_id
        )
        .all()
    )

    question_map = {
        question.id: question
        for question in questions
    }

    submitted_question_ids = {
        answer.question_id
        for answer in submission.answers
    }

    expected_question_ids = set(question_map.keys())

    if submitted_question_ids != expected_question_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="All evaluation questions must be answered",
        )

    for answer in submission.answers:
        question = question_map.get(answer.question_id)

        if not question:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid evaluation question",
            )

        answer_text = answer.answer_text.strip()

        if not answer_text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Answers cannot be empty",
            )

        if question.question_type == "rating":
            try:
                rating = int(answer_text)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Rating answers must be numbers from 1 to 5",
                )

            if rating < 1 or rating > 5:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Rating answers must be between 1 and 5",
                )

    evaluation_response = EvaluationResponse(
        evaluation_id=submission.evaluation_id,
        trainee_id=trainee_id,
        submitted_at=datetime.now(),
    )

    db.add(evaluation_response)
    db.flush()

    for answer in submission.answers:
        evaluation_answer = EvaluationAnswer(
            response_id=evaluation_response.id,
            question_id=answer.question_id,
            answer_text=answer.answer_text.strip(),
        )

        db.add(evaluation_answer)

    db.commit()
    db.refresh(evaluation_response)

    return evaluation_response


# =========================================================
# Trainee - Check Evaluation Completion
# =========================================================

@router.get(
    "/status/{course_id}",
)
def get_evaluation_status(
    course_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    trainee_id = current_user["id"]

    enrollment = (
        db.query(Enrollment)
        .filter(
            Enrollment.course_id == course_id,
            Enrollment.trainee_id == trainee_id,
            Enrollment.status == "approved",
        )
        .first()
    )

    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not approved for this course",
        )

    progress = get_course_lecture_progress(
        db,
        course_id,
        trainee_id,
    )

    evaluation = (
        db.query(Evaluation)
        .filter(
            Evaluation.course_id == course_id
        )
        .first()
    )

    if not evaluation:
        return {
            "course_id": course_id,
            "evaluation_available": False,
            "completed": False,
            **progress,
        }

    response = (
        db.query(EvaluationResponse)
        .filter(
            EvaluationResponse.evaluation_id == evaluation.id,
            EvaluationResponse.trainee_id == trainee_id,
        )
        .first()
    )

    return {
        "course_id": course_id,
        "evaluation_id": evaluation.id,
        "evaluation_available": (
            evaluation.is_active
            and progress["content_completed"]
        ),
        "completed": response is not None,
        "submitted_at": (
            response.submitted_at
            if response
            else None
        ),
        **progress,
    }
