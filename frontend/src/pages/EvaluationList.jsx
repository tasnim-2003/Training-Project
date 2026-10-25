
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getCourses,
  getMyEnrollments,
} from '../services/api'
import { getEvaluationStatus } from '../services/evaluationApi'
import './EvaluationList.css'

function getCourseName(course, courseId) {
  return (
    course?.title ||
    course?.name ||
    course?.course_name ||
    `البرنامج التدريبي رقم ${courseId}`
  )
}

function EvaluationList() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadEvaluations() {
      try {
        setLoading(true)
        setError('')

        const [enrollmentsResult, coursesResult] = await Promise.all([
          getMyEnrollments(),
          getCourses(),
        ])

        const enrollments = Array.isArray(enrollmentsResult)
          ? enrollmentsResult
          : []

        const courses = Array.isArray(coursesResult)
          ? coursesResult
          : []

        const approvedEnrollments = enrollments.filter(
          (enrollment) => enrollment.status === 'approved',
        )

        const evaluationItems = await Promise.all(
          approvedEnrollments.map(async (enrollment) => {
            const courseId = enrollment.course_id

            const course = courses.find(
              (item) => Number(item.id) === Number(courseId),
            )

            const baseItem = {
              courseId,
              courseName: getCourseName(course, courseId),
            }

            try {
              const status = await getEvaluationStatus(courseId)

              return {
                ...baseItem,
                available: Boolean(status?.evaluation_available),
                completed: Boolean(status?.completed),
                error: '',
              }
            } catch (err) {
              return {
  ...baseItem,
  available: Boolean(status?.evaluation_available),
  completed: Boolean(status?.completed),
  contentCompleted: Boolean(status?.content_completed),
  completedLectures: status?.completed_lectures ?? 0,
  totalLectures: status?.total_lectures ?? 0,
  error: '',
}
            }
          }),
        )

        if (active) {
          setItems(evaluationItems)
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'تعذر تحميل قائمة التقييمات.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadEvaluations()

    return () => {
      active = false
    }
  }, [])

  const availableCount = items.filter(
    (item) => item.available && !item.completed,
  ).length

  const completedCount = items.filter(
    (item) => item.completed,
  ).length

  const pendingCount = items.filter(
    (item) => !item.available && !item.completed,
  ).length

  return (
    <main className="evaluation-list-page" dir="rtl">
      <header className="evaluation-topbar">
        <div className="evaluation-topbar-inner">
          <Link
            to="/trainee"
            className="evaluation-university-brand"
            aria-label="العودة إلى مساحة المتدرب"
          >
            <span className="evaluation-brand-emblem" aria-hidden="true">
              أ
            </span>

            <span className="evaluation-brand-copy">
              <strong>جامعة الملك سعود</strong>
              <span>نظام إدارة التدريب وقياس الأثر المؤسسي</span>
            </span>
          </Link>

          <nav className="evaluation-topnav" aria-label="التنقل الرئيسي">
            <Link to="/trainee" className="evaluation-nav-link">
              مساحة المتدرب
            </Link>

            <Link to="/programs" className="evaluation-nav-link">
              البرامج التدريبية
            </Link>

            <span
              className="evaluation-nav-link evaluation-nav-link-active"
              aria-current="page"
            >
              التقييمات
            </span>
          </nav>

          <Link
            to="/trainee"
            className="evaluation-topbar-back"
          >
            <span aria-hidden="true">→</span>
            العودة للمساحة
          </Link>
        </div>
      </header>

      <div className="evaluation-list-container">
        <section className="evaluation-page-heading">
          <div className="evaluation-breadcrumb">
            <Link to="/trainee">مساحة المتدرب</Link>
            <span aria-hidden="true">/</span>
            <span>التقييمات</span>
          </div>

          <div className="evaluation-heading-content">
            <div>
              <span className="evaluation-section-kicker">
                متابعة وتطوير التجربة التدريبية
              </span>

              <h1>سجل تقييمات البرامج التدريبية</h1>

              <p>
                استعرض حالة تقييمات البرامج المقبول فيها، وساهم بملاحظاتك
                في تحسين جودة التدريب وقياس أثره.
              </p>
            </div>

            <div className="evaluation-heading-reference" aria-hidden="true">
              <span className="evaluation-reference-line" />
              <span className="evaluation-reference-label">
                مركز التقييم
              </span>
              <strong>أثر</strong>
            </div>
          </div>
        </section>

        {error && (
          <div className="evaluation-list-alert" role="alert">
            <span className="evaluation-alert-symbol" aria-hidden="true">
              !
            </span>
            <div>
              <strong>تعذر تحميل البيانات</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        <section
          className="evaluation-metrics-panel"
          aria-labelledby="evaluation-metrics-title"
        >
          <div className="evaluation-panel-heading">
            <div>
              <span className="evaluation-panel-overline">
                ملخص الحالة
              </span>
              <h2 id="evaluation-metrics-title">
                مؤشرات التقييم
              </h2>
            </div>

            <span className="evaluation-live-label">
              {loading ? 'جارٍ تحديث البيانات' : 'حسب بيانات حسابك'}
            </span>
          </div>

          <div className="evaluation-metrics-grid">
            <article className="evaluation-metric">
              <span className="evaluation-metric-label">
                تقييمات متاحة
              </span>
              <div className="evaluation-metric-value">
                <strong>{loading ? '—' : availableCount}</strong>
                <span className="evaluation-metric-indicator evaluation-indicator-blue" />
              </div>
              <p>بانتظار مشاركتك</p>
            </article>

            <article className="evaluation-metric">
              <span className="evaluation-metric-label">
                تقييمات مكتملة
              </span>
              <div className="evaluation-metric-value">
                <strong>{loading ? '—' : completedCount}</strong>
                <span className="evaluation-metric-indicator evaluation-indicator-green" />
              </div>
              <p>تم إرسال التقييم</p>
            </article>

            <article className="evaluation-metric">
              <span className="evaluation-metric-label">
                بانتظار الإتاحة
              </span>
              <div className="evaluation-metric-value">
                <strong>{loading ? '—' : pendingCount}</strong>
                <span className="evaluation-metric-indicator evaluation-indicator-gray" />
              </div>
              <p>غير متاحة حاليًا</p>
            </article>

            <article className="evaluation-metric evaluation-metric-total">
              <span className="evaluation-metric-label">
                إجمالي البرامج المقبول فيها
              </span>
              <div className="evaluation-metric-value">
                <strong>{loading ? '—' : items.length}</strong>
                <span className="evaluation-metric-unit">برنامج</span>
              </div>
              <p>وفق حالة التسجيل الحالية</p>
            </article>
          </div>
        </section>

        <section
          className="evaluation-register-panel"
          aria-labelledby="evaluation-register-title"
        >
          <div className="evaluation-register-heading">
            <div>
              <span className="evaluation-panel-overline">
                سجل البرامج
              </span>
              <h2 id="evaluation-register-title">
                البرامج وحالة التقييم
              </h2>
              <p>
                تظهر في هذا السجل البرامج التي تم قبول التسجيل فيها.
              </p>
            </div>

            <span className="evaluation-record-count">
              {loading ? '...' : `${items.length} برنامج`}
            </span>
          </div>

          {loading ? (
            <div className="evaluation-list-state">
              <span className="evaluation-loading-indicator" />
              <strong>جارٍ تحميل سجل التقييمات</strong>
              <p>يتم التحقق من البرامج وحالة التقييم لكل برنامج.</p>
            </div>
          ) : items.length === 0 ? (
            <div className="evaluation-list-state">
              <span className="evaluation-empty-icon" aria-hidden="true">
                —
              </span>
              <strong>لا توجد برامج مقبول فيها حتى الآن</strong>
              <p>
                ستظهر البرامج هنا بعد قبول التسجيل فيها.
              </p>
              <Link
                to="/programs"
                className="evaluation-action-button"
              >
                استعراض البرامج التدريبية
                <span aria-hidden="true">←</span>
              </Link>
            </div>
          ) : (
            <>
              <div className="evaluation-table-wrap">
                <table className="evaluation-register-table">
                  <thead>
                    <tr>
                      <th scope="col" className="evaluation-number-column">
                        م
                      </th>
                      <th scope="col">البرنامج التدريبي</th>
                      <th scope="col">حالة التقييم</th>
                      <th scope="col">الإجراء</th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.courseId}>
                        <td className="evaluation-number-cell">
                          {String(index + 1).padStart(2, '0')}
                        </td>

                        <td>
                          <div className="evaluation-program-cell">
                            <span
                              className="evaluation-program-marker"
                              aria-hidden="true"
                            />
                            <div>
                              <strong>{item.courseName}</strong>
                              <span>
                                رقم البرنامج: {item.courseId}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          {item.completed ? (
                            <span className="evaluation-status-badge evaluation-status-completed">
                              <span aria-hidden="true">✓</span>
                              مكتمل
                            </span>
                          ) : item.available ? (
                            <span className="evaluation-status-badge evaluation-status-available">
                              <span aria-hidden="true">●</span>
                              متاح للتقييم
                            </span>
                          ) : (
                            <span
  className="evaluation-status-badge evaluation-status-pending"
  title={item.error || undefined}
>
  <span aria-hidden="true">—</span>
  {!item.contentCompleted && item.totalLectures > 0
    ? `إكمال المحاضرات (${item.completedLectures}/${item.totalLectures})`
    : 'غير متاح حاليًا'}
</span>
                          )}
                        </td>

                        <td>
                          {item.available && !item.completed ? (
                            <Link
                              to={`/trainee/evaluations/${item.courseId}`}
                              className="evaluation-row-action"
                            >
                              بدء التقييم
                              <span aria-hidden="true">←</span>
                            </Link>
                          ) : item.completed ? (
                            <span className="evaluation-row-completed">
                              تم الإرسال
                              <span aria-hidden="true">✓</span>
                            </span>
                          ) : (
                            <span className="evaluation-row-unavailable">
                              بانتظار الإتاحة
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="evaluation-register-footer">
                <span>
                  تُحدَّث حالة كل تقييم وفق البيانات المتاحة في النظام.
                </span>
                <Link to="/trainee">
                  العودة إلى مساحة المتدرب
                  <span aria-hidden="true">←</span>
                </Link>
              </div>
            </>
          )}
        </section>

        <footer className="evaluation-page-footer">
          <span>جامعة الملك سعود</span>
          <span className="evaluation-footer-divider" />
          <span>نظام إدارة التدريب وقياس الأثر المؤسسي — أثر</span>
        </footer>
      </div>
    </main>
  )
}

export default EvaluationList
