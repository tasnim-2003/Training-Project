import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminCourses } from '../services/api'
import {
  createEvaluation,
  createEvaluationQuestion,
  getEvaluationForCourse,
  getEvaluationQuestions,
  updateEvaluation,
  updateEvaluationQuestion,
} from '../services/evaluationApi'
import './EvaluationManagement.css'

function courseTitle(course) {
  return (
    course?.title ||
    course?.name ||
    course?.course_title ||
    `الدورة رقم ${course?.id}`
  )
}

function errorText(error) {
  if (error?.status === 401 || error?.status === 403) {
    return 'لا توجد صلاحية للوصول. تأكد من تسجيل الدخول بحساب مسؤول التدريب.'
  }

  return error?.message || 'حدث خطأ غير متوقع. حاول مرة أخرى.'
}

export default function EvaluationManagement() {
  const [courses, setCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [questions, setQuestions] = useState([])

  const [evaluationTitle, setEvaluationTitle] = useState(
    'تقييم الدورة التدريبية',
  )
  const [isActive, setIsActive] = useState(true)

  const [questionText, setQuestionText] = useState('')
  const [questionType, setQuestionType] = useState('rating')
  const [questionOrder, setQuestionOrder] = useState('1')

  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [editDraft, setEditDraft] = useState({
    question_text: '',
    question_type: 'rating',
    order: '1',
  })

  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingEvaluation, setLoadingEvaluation] = useState(false)
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const selectedCourse = useMemo(
    () =>
      courses.find(
        (course) => String(course.id) === String(selectedCourseId),
      ),
    [courses, selectedCourseId],
  )

  useEffect(() => {
    let cancelled = false

    async function loadCourses() {
      setLoadingCourses(true)
      setError('')

      try {
        const result = await getAdminCourses()

        if (cancelled) return

        const list = Array.isArray(result)
          ? result
          : result?.items || result?.courses || []

        setCourses(list)
      } catch (err) {
        if (!cancelled) {
          setError(errorText(err))
        }
      } finally {
        if (!cancelled) {
          setLoadingCourses(false)
        }
      }
    }

    loadCourses()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadSelectedEvaluation() {
      if (!selectedCourseId) {
        setEvaluation(null)
        setQuestions([])
        setEvaluationTitle('تقييم الدورة التدريبية')
        setIsActive(true)
        return
      }

      setLoadingEvaluation(true)
      setError('')
      setNotice('')
      setEvaluation(null)
      setQuestions([])

      try {
        const existing = await getEvaluationForCourse(
          selectedCourseId,
        )

        if (cancelled) return

        setEvaluation(existing)
        setEvaluationTitle(existing.title || '')
        setIsActive(Boolean(existing.is_active))

        const questionList = await getEvaluationQuestions(
          existing.id,
        )

        if (!cancelled) {
          setQuestions(
            Array.isArray(questionList) ? questionList : [],
          )
        }
      } catch (err) {
        if (cancelled) return

        if (err.status === 404) {
          setEvaluation(null)
          setQuestions([])
          setEvaluationTitle('تقييم الدورة التدريبية')
          setIsActive(true)
        } else {
          setError(errorText(err))
        }
      } finally {
        if (!cancelled) {
          setLoadingEvaluation(false)
        }
      }
    }

    loadSelectedEvaluation()

    return () => {
      cancelled = true
    }
  }, [selectedCourseId])

  async function handleSaveEvaluation(event) {
    event.preventDefault()

    if (!selectedCourseId) {
      setError('اختر دورة تدريبية أولًا.')
      return
    }

    const title = evaluationTitle.trim()

    if (!title) {
      setError('اكتب عنوانًا للتقييم.')
      return
    }

    setSaving(true)
    setError('')
    setNotice('')

    try {
      if (evaluation) {
        const updated = await updateEvaluation(evaluation.id, {
          title,
          is_active: isActive,
        })

        setEvaluation(updated)
        setNotice('تم حفظ إعدادات التقييم بنجاح.')
      } else {
        const created = await createEvaluation({
          course_id: Number(selectedCourseId),
          title,
          is_active: isActive,
        })

        setEvaluation(created)
        setQuestions([])
        setNotice('تم إنشاء التقييم. يمكنك الآن إضافة أسئلته.')
      }
    } catch (err) {
      setError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleAddQuestion(event) {
    event.preventDefault()

    if (!evaluation) {
      setError('احفظ التقييم أولًا قبل إضافة الأسئلة.')
      return
    }

    const text = questionText.trim()
    const order = Number(questionOrder)

    if (!text) {
      setError('اكتب نص السؤال.')
      return
    }

    if (!Number.isInteger(order) || order < 1) {
      setError('ترتيب السؤال يجب أن يكون رقمًا صحيحًا موجبًا.')
      return
    }

    setSaving(true)
    setError('')
    setNotice('')

    try {
      const created = await createEvaluationQuestion({
        evaluation_id: evaluation.id,
        question_text: text,
        question_type: questionType,
        order,
      })

      setQuestions((current) =>
        [...current, created].sort((a, b) => a.order - b.order),
      )

      setQuestionText('')
      setQuestionType('rating')
      setQuestionOrder(String(order + 1))
      setNotice('تمت إضافة السؤال بنجاح.')
    } catch (err) {
      setError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  function startEditing(question) {
    setEditingQuestionId(question.id)

    setEditDraft({
      question_text: question.question_text || '',
      question_type: question.question_type || 'rating',
      order: String(question.order || 1),
    })

    setError('')
    setNotice('')
  }

  async function handleUpdateQuestion(event) {
    event.preventDefault()

    const order = Number(editDraft.order)

    if (!editDraft.question_text.trim()) {
      setError('نص السؤال مطلوب.')
      return
    }

    if (!Number.isInteger(order) || order < 1) {
      setError('ترتيب السؤال يجب أن يكون رقمًا صحيحًا موجبًا.')
      return
    }

    setSaving(true)
    setError('')
    setNotice('')

    try {
      const updated = await updateEvaluationQuestion(
        editingQuestionId,
        {
          question_text: editDraft.question_text.trim(),
          question_type: editDraft.question_type,
          order,
        },
      )

      setQuestions((current) =>
        current
          .map((question) =>
            question.id === updated.id ? updated : question,
          )
          .sort((a, b) => a.order - b.order),
      )

      setEditingQuestionId(null)
      setNotice('تم تعديل السؤال بنجاح.')
    } catch (err) {
      setError(errorText(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="evaluation-management" dir="rtl">
      <header className="evaluation-management__topbar">
        <div>
          <span className="evaluation-management__eyebrow">
            أثر · مسؤول التدريب
          </span>

          <h1>إدارة التقييمات</h1>

          <p>
            إعداد تقييم الدورة وأسئلته قبل إتاحته للمتدربين.
          </p>
        </div>

        <Link
          className="evaluation-management__back"
          to="/admin"
        >
          العودة إلى لوحة الإدارة
        </Link>
      </header>

      {error && (
        <div
          className="evaluation-management__alert evaluation-management__alert--error"
          role="alert"
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          className="evaluation-management__alert evaluation-management__alert--success"
          role="status"
        >
          {notice}
        </div>
      )}

      <section className="evaluation-management__panel">
        <div className="evaluation-management__section-heading">
          <span className="evaluation-management__step">01</span>

          <div>
            <h2>اختيار الدورة</h2>
            <p>
              لكل دورة تقييم واحد يمكن تعديل عنوانه وحالته.
            </p>
          </div>
        </div>

        <label className="evaluation-management__field">
          <span>الدورة التدريبية</span>

          <select
            value={selectedCourseId}
            onChange={(event) =>
              setSelectedCourseId(event.target.value)
            }
            disabled={loadingCourses || saving}
          >
            <option value="">
              {loadingCourses
                ? 'جارٍ تحميل الدورات...'
                : 'اختر دورة تدريبية'}
            </option>

            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {courseTitle(course)}
              </option>
            ))}
          </select>
        </label>

        {!loadingCourses && courses.length === 0 && !error && (
          <p className="evaluation-management__muted">
            لم يتم العثور على دورات متاحة للإدارة.
          </p>
        )}

        {selectedCourse && (
          <div className="evaluation-management__course-chip">
            الدورة المختارة:{' '}
            <strong>{courseTitle(selectedCourse)}</strong>
          </div>
        )}
      </section>

      {selectedCourseId && (
        <>
          <section className="evaluation-management__panel">
            <div className="evaluation-management__section-heading">
              <span className="evaluation-management__step">02</span>

              <div>
                <h2>إعداد التقييم</h2>

                <p>
                  {evaluation
                    ? `رقم التقييم: ${evaluation.id}`
                    : 'أنشئ تقييمًا جديدًا لهذه الدورة.'}
                </p>
              </div>

              {evaluation && (
                <span
                  className={`evaluation-management__status ${
                    isActive ? 'is-active' : 'is-inactive'
                  }`}
                >
                  {isActive ? 'مفعّل' : 'متوقف'}
                </span>
              )}
            </div>

            {loadingEvaluation ? (
              <p className="evaluation-management__muted">
                جارٍ تحميل بيانات التقييم...
              </p>
            ) : (
              <form
                onSubmit={handleSaveEvaluation}
                className="evaluation-management__form"
              >
                <label className="evaluation-management__field">
                  <span>عنوان التقييم</span>

                  <input
                    value={evaluationTitle}
                    onChange={(event) =>
                      setEvaluationTitle(event.target.value)
                    }
                    maxLength={200}
                    placeholder="مثال: تقييم الدورة التدريبية"
                  />
                </label>

                <label className="evaluation-management__toggle">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) =>
                      setIsActive(event.target.checked)
                    }
                  />

                  <span>
                    <strong>إتاحة التقييم للمتدربين</strong>
                    <small>
                      عند إيقافه لن يتمكن المتدربون من إرسال
                      إجابات جديدة.
                    </small>
                  </span>
                </label>

                <button
                  className="evaluation-management__primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? 'جارٍ الحفظ...'
                    : evaluation
                      ? 'حفظ التعديلات'
                      : 'إنشاء التقييم'}
                </button>
              </form>
            )}
          </section>

          {evaluation && (
            <section className="evaluation-management__panel">
              <div className="evaluation-management__section-heading">
                <span className="evaluation-management__step">03</span>

                <div>
                  <h2>أسئلة التقييم</h2>
                  <p>
                    أضف الأسئلة ورتّب ظهورها للمتدربين.
                  </p>
                </div>

                <span className="evaluation-management__count">
                  {questions.length} سؤال
                </span>
              </div>

              <form
                onSubmit={handleAddQuestion}
                className="evaluation-management__question-form"
              >
                <label className="evaluation-management__field evaluation-management__field--wide">
                  <span>نص السؤال</span>

                  <input
                    value={questionText}
                    onChange={(event) =>
                      setQuestionText(event.target.value)
                    }
                    placeholder="اكتب السؤال هنا"
                    maxLength={1000}
                  />
                </label>

                <label className="evaluation-management__field">
                  <span>نوع الإجابة</span>

                  <select
                    value={questionType}
                    onChange={(event) =>
                      setQuestionType(event.target.value)
                    }
                  >
                    <option value="rating">
                      تقييم من 1 إلى 5
                    </option>
                    <option value="text">إجابة نصية</option>
                  </select>
                </label>

                <label className="evaluation-management__field evaluation-management__field--order">
                  <span>الترتيب</span>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={questionOrder}
                    onChange={(event) =>
                      setQuestionOrder(event.target.value)
                    }
                  />
                </label>

                <button
                  className="evaluation-management__primary evaluation-management__add-button"
                  type="submit"
                  disabled={saving}
                >
                  إضافة السؤال
                </button>
              </form>

              {questions.length === 0 ? (
                <div className="evaluation-management__empty">
                  <span>؟</span>
                  <strong>لا توجد أسئلة بعد</strong>
                  <p>ابدأ بإضافة أول سؤال للتقييم.</p>
                </div>
              ) : (
                <div className="evaluation-management__questions">
                  {questions.map((question) => (
                    <article
                      className="evaluation-management__question"
                      key={question.id}
                    >
                      {editingQuestionId === question.id ? (
                        <form
                          className="evaluation-management__edit-form"
                          onSubmit={handleUpdateQuestion}
                        >
                          <label className="evaluation-management__field evaluation-management__field--wide">
                            <span>نص السؤال</span>

                            <input
                              value={editDraft.question_text}
                              onChange={(event) =>
                                setEditDraft({
                                  ...editDraft,
                                  question_text: event.target.value,
                                })
                              }
                              maxLength={1000}
                            />
                          </label>

                          <label className="evaluation-management__field">
                            <span>نوع الإجابة</span>

                            <select
                              value={editDraft.question_type}
                              onChange={(event) =>
                                setEditDraft({
                                  ...editDraft,
                                  question_type: event.target.value,
                                })
                              }
                            >
                              <option value="rating">
                                تقييم من 1 إلى 5
                              </option>
                              <option value="text">
                                إجابة نصية
                              </option>
                            </select>
                          </label>

                          <label className="evaluation-management__field evaluation-management__field--order">
                            <span>الترتيب</span>

                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={editDraft.order}
                              onChange={(event) =>
                                setEditDraft({
                                  ...editDraft,
                                  order: event.target.value,
                                })
                              }
                            />
                          </label>

                          <div className="evaluation-management__question-actions">
                            <button
                              type="submit"
                              className="evaluation-management__primary"
                              disabled={saving}
                            >
                              حفظ
                            </button>

                            <button
                              type="button"
                              className="evaluation-management__secondary"
                              onClick={() =>
                                setEditingQuestionId(null)
                              }
                              disabled={saving}
                            >
                              إلغاء
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="evaluation-management__question-number">
                            {question.order}
                          </div>

                          <div className="evaluation-management__question-content">
                            <h3>{question.question_text}</h3>

                            <div className="evaluation-management__question-meta">
                              <span>
                                {question.question_type === 'rating'
                                  ? 'تقييم من 1 إلى 5'
                                  : 'إجابة نصية'}
                              </span>

                              <span>
                                معرّف السؤال: {question.id}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="evaluation-management__secondary"
                            onClick={() => startEditing(question)}
                          >
                            تعديل السؤال
                          </button>
                        </>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}

      <footer className="evaluation-management__footer">
        أثر — من التعلم إلى التغيير
      </footer>
    </main>
  )
}