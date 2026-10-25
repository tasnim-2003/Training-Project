
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCourseById, getStoredUser } from '../services/api'
import {
  getAvailableEvaluation,
  getAvailableEvaluationQuestions,
  getEvaluationStatus,
  submitEvaluation,
} from '../services/evaluationApi'
import './EvaluationPage.css'

function getCourseName(course) {
  return (
    course?.title ||
    course?.name ||
    course?.course_name ||
    'البرنامج التدريبي'
  )
}

function EvaluationPage() {
  const { courseId } = useParams()
  const user = getStoredUser()

  const [course, setCourse] = useState(null)
  const [evaluation, setEvaluation] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadEvaluation() {
      try {
        setLoading(true)
        setError('')

        const status = await getEvaluationStatus(courseId)

        if (!active) return

        if (status?.completed) {
          setCompleted(true)
          return
        }

        if (!status?.evaluation_available) {
          setError('لا يوجد تقييم متاح لهذا البرنامج حاليًا.')
          return
        }

        const [courseResult, evaluationResult, questionsResult] =
          await Promise.all([
            getCourseById(courseId),
            getAvailableEvaluation(courseId),
            getAvailableEvaluationQuestions(courseId),
          ])

        if (!active) return

        setCourse(courseResult)
        setEvaluation(evaluationResult)
        setQuestions(
          Array.isArray(questionsResult) ? questionsResult : [],
        )
      } catch (err) {
        if (active) {
          setError(err.message || 'تعذر تحميل التقييم.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadEvaluation()

    return () => {
      active = false
    }
  }, [courseId])

  function updateAnswer(questionId, value) {
    setAnswers((current) => ({
      ...current,
      [questionId]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!evaluation?.id) {
      setError('تعذر تحديد التقييم المطلوب.')
      return
    }

    if (!user?.id) {
      setError('تعذر تحديد حساب المتدرب. سجّل الدخول ثم حاول مجددًا.')
      return
    }

    const missingAnswer = questions.find((question) => {
      const answer = answers[question.id]

      return answer === undefined || String(answer).trim() === ''
    })

    if (missingAnswer) {
      setError('يرجى الإجابة عن جميع الأسئلة قبل إرسال التقييم.')
      return
    }

    const submission = {
      evaluation_id: evaluation.id,
      trainee_id: user.id,
      answers: questions.map((question) => ({
        question_id: question.id,
        answer_text: String(answers[question.id]).trim(),
      })),
    }

    try {
      setSubmitting(true)

      await submitEvaluation(submission)

      setCompleted(true)
    } catch (err) {
      setError(err.message || 'تعذر إرسال التقييم. حاول مرة أخرى.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="evaluation-page" dir="rtl">
      <header className="evaluation-header">
        <Link to="/trainee" className="evaluation-brand">
          <strong>أثر</strong>
          <span>من التعلم إلى التغيير.</span>
        </Link>

        <Link
          to="/trainee/evaluations"
          className="evaluation-back-link"
        >
          العودة إلى التقييمات
        </Link>
      </header>

      <section className="evaluation-container evaluation-form-container">
        {loading ? (
          <div className="evaluation-state">
            <span className="evaluation-state-icon">…</span>
            <strong>جارٍ تحميل التقييم</strong>
            <p>يتم تجهيز أسئلة البرنامج التدريبي.</p>
          </div>
        ) : completed ? (
          <div className="evaluation-state success">
            <span className="evaluation-state-icon">✓</span>
            <strong>تم إكمال التقييم بنجاح</strong>
            <p>
              شكرًا لمشاركة الرأي. تسهم الإجابات في تحسين البرامج
              التدريبية وتطوير أثرها.
            </p>

            <Link
              to="/trainee/evaluations"
              className="evaluation-primary-button"
            >
              العودة إلى التقييمات
            </Link>
          </div>
        ) : error && !evaluation ? (
          <div className="evaluation-state">
            <span className="evaluation-state-icon">!</span>
            <strong>تعذر فتح التقييم</strong>
            <p>{error}</p>

            <Link
              to="/trainee/evaluations"
              className="evaluation-primary-button"
            >
              العودة إلى التقييمات
            </Link>
          </div>
        ) : (
          <>
            <div className="evaluation-intro">
              <span className="evaluation-eyebrow">
                تقييم البرنامج
              </span>

              <h1>
                {evaluation?.title || 'تقييم البرنامج التدريبي'}
              </h1>

              <p>{getCourseName(course)}</p>

              <div className="evaluation-progress-note">
                يرجى الإجابة عن جميع الأسئلة قبل إرسال التقييم.
              </div>
            </div>

            {error && (
              <div className="evaluation-alert error" role="alert">
                {error}
              </div>
            )}

            {questions.length === 0 ? (
              <div className="evaluation-state">
                <strong>لا توجد أسئلة في هذا التقييم</strong>
                <p>
                  يرجى الرجوع إلى قائمة التقييمات أو التواصل مع المسؤول.
                </p>

                <Link
                  to="/trainee/evaluations"
                  className="evaluation-primary-button"
                >
                  العودة إلى التقييمات
                </Link>
              </div>
            ) : (
              <form
                className="evaluation-form"
                onSubmit={handleSubmit}
              >
                {questions.map((question, index) => (
                  <fieldset
                    className="evaluation-question"
                    key={question.id}
                  >
                    <legend>
                      <span className="evaluation-question-number">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      {question.question_text ||
                        question.text ||
                        `السؤال ${index + 1}`}
                    </legend>

                    {question.question_type === 'rating' ? (
                      <div className="evaluation-rating-options">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <label
                            key={rating}
                            className={`evaluation-rating-option ${
                              String(answers[question.id] ?? '') ===
                              String(rating)
                                ? 'selected'
                                : ''
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={rating}
                              checked={
                                String(answers[question.id] ?? '') ===
                                String(rating)
                              }
                              onChange={() =>
                                updateAnswer(question.id, rating)
                              }
                            />

                            <span>{rating}</span>
                          </label>
                        ))}

                        <div className="evaluation-rating-labels">
                          <span>ضعيف جدًا</span>
                          <span>ممتاز</span>
                        </div>
                      </div>
                    ) : (
                      <textarea
                        value={answers[question.id] ?? ''}
                        onChange={(event) =>
                          updateAnswer(
                            question.id,
                            event.target.value,
                          )
                        }
                        rows={4}
                        placeholder="اكتب إجابتك هنا..."
                        required
                      />
                    )}
                  </fieldset>
                ))}

                <div className="evaluation-form-actions">
                  <Link
                    to="/trainee/evaluations"
                    className="evaluation-secondary-button"
                  >
                    إلغاء
                  </Link>

                  <button
                    type="submit"
                    className="evaluation-primary-button"
                    disabled={submitting}
                  >
                    {submitting
                      ? 'جارٍ إرسال التقييم…'
                      : 'إرسال التقييم'}

                    {!submitting && (
                      <span aria-hidden="true">←</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </section>
    </main>
  )
}

export default EvaluationPage

