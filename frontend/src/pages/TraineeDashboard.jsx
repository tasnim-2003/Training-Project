import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './TraineeDashboard.css'
import {
  getMyEnrollments,
  getCourses,
  getStoredUser,
  getMyNotifications,
  updateNotification,
  clearAuthData,
} from '../services/api'

function TraineeDashboard() {
  const user = getStoredUser()
  const navigate = useNavigate()

  const [enrollments, setEnrollments] = useState([])
  const [courses, setCourses] = useState([])
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notificationError, setNotificationError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDashboard() {
      try {
        setLoading(true)
        setError('')

        const [myEnrollments, availableCourses, myNotifications] =
          await Promise.all([
            getMyEnrollments(),
            getCourses(),
            getMyNotifications(),
          ])

        if (!active) return

        setEnrollments(
          Array.isArray(myEnrollments) ? myEnrollments : [],
        )
        setCourses(
          Array.isArray(availableCourses) ? availableCourses : [],
        )
        setNotifications(
          Array.isArray(myNotifications) ? myNotifications : [],
        )
      } catch (err) {
        if (active) {
          setError(err.message || 'تعذر تحميل بيانات مساحة المتدرب.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [])

  function handleLogout() {
    clearAuthData()
    navigate('/login', { replace: true })
  }

  const approvedCount = enrollments.filter(
    (item) => item.status === 'approved',
  ).length

  const pendingCount = enrollments.filter(
    (item) => item.status === 'pending',
  ).length

  const rejectedCount = enrollments.filter(
    (item) => item.status === 'rejected',
  ).length

  const unreadNotificationsCount = notifications.filter(
    (item) => !item.is_read,
  ).length

  function getStatusLabel(status) {
    if (status === 'approved') return 'مقبول'
    if (status === 'rejected') return 'مرفوض'
    return 'قيد المراجعة'
  }

  function getStatusClass(status) {
    if (status === 'approved') return 'status-approved'
    if (status === 'rejected') return 'status-rejected'
    return 'status-pending'
  }

  function getCourseName(enrollment) {
    const courseId = enrollment.course_id

    const course = courses.find(
      (item) => Number(item.id) === Number(courseId),
    )

    return (
      course?.title ||
      course?.name ||
      course?.course_name ||
      `البرنامج التدريبي رقم ${courseId}`
    )
  }

  function formatDate(date) {
    if (!date) return 'غير محدد'

    const parsedDate = new Date(date)

    if (Number.isNaN(parsedDate.getTime())) return 'غير محدد'

    return parsedDate.toLocaleDateString('ar-SA')
  }

  async function handleNotificationClick(notification) {
    setNotificationError('')

    // إشعار التقييم يفتح قائمة التقييمات حتى لو كان مقروءًا.
    if (notification.type === 'evaluation') {
      setShowNotifications(false)

      if (!notification.is_read) {
        try {
          await updateNotification(notification.id, true)

          setNotifications((current) =>
            current.map((item) =>
              item.id === notification.id
                ? { ...item, is_read: true }
                : item,
            ),
          )
        } catch (err) {
          setNotificationError(
            err.message || 'تعذر تحديث حالة الإشعار.',
          )
        }
      }

      navigate('/trainee/evaluations')
      return
    }

    // بقية الإشعارات تحتفظ بسلوك تحديدها كمقروءة.
    if (notification.is_read) return

    try {
      const updatedNotification = await updateNotification(
        notification.id,
        true,
      )

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? updatedNotification
            : item,
        ),
      )
    } catch (err) {
      setNotificationError(
        err.message || 'تعذر تحديث حالة الإشعار.',
      )
    }
  }

  return (
    <main className="trainee-dashboard" dir="rtl">
      <header className="trainee-header">
        <Link to="/" className="trainee-brand">
          <strong>أثر</strong>
          <span>من التعلم إلى التغيير.</span>
        </Link>

        <nav className="trainee-nav" aria-label="التنقل الرئيسي">
          <Link to="/trainee" className="active">
            الرئيسية
          </Link>
          <Link to="/programs">البرامج التدريبية</Link>
          <Link to="/paths">المسارات</Link>
          <Link to="/about">عن أثر</Link>
        </nav>

        <div className="trainee-header-user">
          <div className="trainee-notifications">
            <button
              type="button"
              className="trainee-notification-button"
              onClick={() => {
                setShowNotifications((value) => !value)
                setNotificationError('')
              }}
              aria-label="الإشعارات"
              aria-expanded={showNotifications}
            >
              <span aria-hidden="true">♧</span>

              {unreadNotificationsCount > 0 && (
                <span className="trainee-notification-count">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <section
                className="trainee-notification-panel"
                aria-label="قائمة الإشعارات"
              >
                <div className="trainee-notification-heading">
                  <strong>الإشعارات</strong>
                  <span>{unreadNotificationsCount} غير مقروء</span>
                </div>

                {notificationError && (
                  <p
                    className="trainee-notification-error"
                    role="alert"
                  >
                    {notificationError}
                  </p>
                )}

                {notifications.length === 0 ? (
                  <div className="trainee-notification-empty">
                    لا توجد إشعارات حاليًا.
                  </div>
                ) : (
                  <div className="trainee-notification-list">
                    {notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        className={`trainee-notification-item ${
                          notification.is_read ? '' : 'unread'
                        }`}
                        onClick={() =>
                          handleNotificationClick(notification)
                        }
                      >
                        <strong>{notification.title}</strong>
                        <span>{notification.message}</span>
                        <small>
                          {formatDate(notification.created_at)}
                        </small>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="trainee-user-avatar">
            {(user?.name || 'م').charAt(0)}
          </div>

          <div className="trainee-user-info">
            <strong>{user?.name || 'المتدرب'}</strong>
            <span>متدرب</span>
          </div>
        </div>

        <Link to="/" className="trainee-home-button">
          العودة للموقع
        </Link>
      </header>

      <section className="trainee-main">
        <aside className="trainee-sidebar">
          <div className="trainee-sidebar-profile">
            <div className="trainee-large-avatar">
              {(user?.name || 'م').charAt(0)}
            </div>

            <strong>{user?.name || 'المتدرب'}</strong>
            <span>{user?.email || 'حساب المتدرب'}</span>
          </div>

          <nav
            className="trainee-sidebar-nav"
            aria-label="قائمة المتدرب"
          >
            <span className="trainee-sidebar-label">مساحتي</span>

            <Link to="/trainee" className="sidebar-link active">
              <span className="sidebar-icon">⌂</span>
              الرئيسية
            </Link>

            <Link to="/programs" className="sidebar-link">
              <span className="sidebar-icon">▣</span>
              البرامج التدريبية
            </Link>

            <Link to="/trainee/evaluations" className="sidebar-link">
              <span className="sidebar-icon">✓</span>
              تقييماتي
            </Link>

            <a href="#my-programs" className="sidebar-link">
              <span className="sidebar-icon">◫</span>
              برامجي وطلباتي
            </a>

            <span className="trainee-sidebar-label second">
              حسابي
            </span>

            <a href="#profile" className="sidebar-link">
              <span className="sidebar-icon">○</span>
              بيانات الحساب
            </a>

            <button
              type="button"
              className="sidebar-link sidebar-logout-link"
              onClick={handleLogout}
            >
              <span className="sidebar-icon">↪</span>
              تسجيل الخروج
            </button>
          </nav>

          <div className="trainee-sidebar-bottom">
            <span>أثر</span>
            <p>تعلّم، طبّق، واترك أثرًا.</p>
          </div>
        </aside>

        <div className="trainee-content">
          <section className="trainee-welcome">
            <div className="trainee-welcome-content">
              <span className="trainee-eyebrow">
                مساحة المتدرب
              </span>

              <h1>
                أهلًا بك،
                <strong>{user?.name || 'في أثر'}</strong>
              </h1>

              <p>
                رحلتك التعليمية تبدأ بخطوة. تابع طلباتك،
                واكتشف البرامج التدريبية، واستكمل رحلتك
                من مكان واحد.
              </p>

              <div className="trainee-welcome-actions">
                <Link
                  to="/programs"
                  className="trainee-primary-button"
                >
                  استكشاف البرامج
                  <span>←</span>
                </Link>

                <a
                  href="#my-programs"
                  className="trainee-secondary-button"
                >
                  متابعة طلباتي
                </a>
              </div>
            </div>

            <div
              className="trainee-welcome-mark"
              aria-hidden="true"
            >
              <span className="mark-small">رحلتك تصنع</span>
              <strong>أثر</strong>
              <span>من التعلم إلى التغيير.</span>
            </div>
          </section>

          {error && (
            <div className="trainee-error" role="alert">
              <strong>تعذر تحميل البيانات</strong>
              <span>{error}</span>
            </div>
          )}

          <section className="trainee-stats">
            <article className="trainee-stat-card">
              <div className="stat-icon blue">◫</div>
              <div>
                <span>طلبات مقبولة</span>
                <strong>{loading ? '—' : approvedCount}</strong>
                <small>طلبات تمت الموافقة عليها</small>
              </div>
            </article>

            <article className="trainee-stat-card">
              <div className="stat-icon amber">◷</div>
              <div>
                <span>قيد المراجعة</span>
                <strong>{loading ? '—' : pendingCount}</strong>
                <small>طلبات بانتظار القرار</small>
              </div>
            </article>

            <article className="trainee-stat-card">
              <div className="stat-icon green">✓</div>
              <div>
                <span>إجمالي طلباتي</span>
                <strong>{loading ? '—' : enrollments.length}</strong>
                <small>جميع طلبات التسجيل</small>
              </div>
            </article>

            <article className="trainee-stat-card">
              <div className="stat-icon dark">+</div>
              <div>
                <span>البرامج المتاحة</span>
                <strong>{loading ? '—' : courses.length}</strong>
                <small>البرامج التي أعادها النظام</small>
              </div>
            </article>
          </section>

          <section className="trainee-section" id="my-programs">
            <div className="trainee-section-heading">
              <div>
                <span>رحلتي التدريبية</span>
                <h2>برامجي وطلباتي</h2>
              </div>

              <Link to="/programs">
                استكشاف البرامج
                <span>←</span>
              </Link>
            </div>

            {loading ? (
              <div className="trainee-empty">
                <div className="empty-symbol">…</div>
                <div>
                  <strong>نجهّز مساحة التعلّم الخاصة بك</strong>
                  <p>يتم تحميل البرامج والطلبات.</p>
                </div>
              </div>
            ) : enrollments.length === 0 ? (
              <div className="trainee-empty">
                <div className="empty-symbol">+</div>
                <div>
                  <strong>رحلتك التدريبية بانتظار بدايتها</strong>
                  <p>
                    استكشف البرامج المتاحة واختر ما يناسب
                    احتياجك التدريبي.
                  </p>
                </div>
                <Link to="/programs">استكشاف البرامج</Link>
              </div>
            ) : (
              <div className="trainee-program-list">
                {enrollments.slice(0, 4).map((enrollment, index) => (
                  <article
                    key={enrollment.id}
                    className="trainee-program-row"
                  >
                    <div className="program-row-number">
                      {String(index + 1).padStart(2, '0')}
                    </div>

                    <div className="program-row-main">
                      <span>طلب تسجيل تدريبي</span>
                      <strong>{getCourseName(enrollment)}</strong>
                      <small>
                        تاريخ الطلب:{' '}
                        {formatDate(enrollment.registered_at)}
                      </small>
                    </div>

                    <span
                      className={`trainee-status ${getStatusClass(
                        enrollment.status,
                      )}`}
                    >
                      {getStatusLabel(enrollment.status)}
                    </span>

                    <Link
                      to={`/programs/${enrollment.course_id}`}
                      className="program-row-link"
                    >
                      التفاصيل
                      <span>←</span>
                    </Link>
                  </article>
                ))}
              </div>
            )}

            {!loading && enrollments.length > 4 && (
              <p className="trainee-data-note">
                تعرض الصفحة أحدث أربعة طلبات فقط.
              </p>
            )}
          </section>

          <section className="trainee-lower-grid" id="actions">
            <div className="trainee-section trainee-actions-section">
              <div className="trainee-section-heading compact">
                <div>
                  <span>الخطوة التالية</span>
                  <h2>ما الذي يمكنك فعله؟</h2>
                </div>
              </div>

              <Link
                to="/programs"
                className="trainee-action-card"
              >
                <div className="action-number">01</div>
                <div className="action-content">
                  <strong>اكتشف البرامج التدريبية</strong>
                  <p>
                    تعرّف على البرامج المنشورة وتفاصيلها
                    قبل إرسال طلب التسجيل.
                  </p>
                </div>
                <span className="action-arrow">←</span>
              </Link>

              <a
                href="#my-programs"
                className="trainee-action-card"
              >
                <div className="action-number">02</div>
                <div className="action-content">
                  <strong>تابع حالة طلباتك</strong>
                  <p>
                    راجع الطلبات المقبولة أو المرفوضة
                    أو التي ما زالت قيد المراجعة.
                  </p>
                </div>
                <span className="action-arrow">←</span>
              </a>

              <Link
                to="/trainee/evaluations"
                className="trainee-action-card"
              >
                <div className="action-number">03</div>
                <div className="action-content">
                  <strong>استكمل تقييماتك</strong>
                  <p>
                    افتح تقييمات البرامج التدريبية المتاحة
                    وساهم في تحسين التجربة التدريبية.
                  </p>
                </div>
                <span className="action-arrow">←</span>
              </Link>
            </div>

            <aside className="trainee-quick-card">
              <span className="quick-label">مساحة واحدة لرحلتك</span>

              <h3>
                تعلّم اليوم،
                <br />
                واصنع أثرًا غدًا.
              </h3>

              <p>
                تابع رحلتك التدريبية خطوة بخطوة،
                من استكشاف البرامج حتى التقييم وقياس الأثر.
              </p>

              <div className="quick-links">
                <Link to="/programs">
                  <span>البرامج التدريبية</span>
                  <b>←</b>
                </Link>
                <a href="#my-programs">
                  <span>طلبات التسجيل</span>
                  <b>←</b>
                </a>
                <Link to="/trainee/evaluations">
                  <span>تقييماتي</span>
                  <b>←</b>
                </Link>
                <a href="#profile">
                  <span>بيانات الحساب</span>
                  <b>←</b>
                </a>
              </div>
            </aside>
          </section>

          <section className="trainee-impact-banner">
            <div>
              <span>فلسفة أثر</span>
              <h2>
                التعلم لا ينتهي
                <strong>عند نهاية الدورة.</strong>
              </h2>
            </div>

            <p>
              تمتد الرحلة من التسجيل والتعلّم إلى التطبيق
              والتقييم وقياس الأثر، لتصبح المعرفة تغييرًا ملموسًا.
            </p>
          </section>

          <footer className="trainee-footer">
            <div className="trainee-footer-brand">
              <strong>أثر</strong>
              <span>من التعلم إلى التغيير.</span>
            </div>

            <div className="trainee-footer-links">
              <Link to="/programs">البرامج التدريبية</Link>
              <Link to="/paths">المسارات</Link>
              <Link to="/about">عن أثر</Link>
              <Link to="/verify-certificate">
                التحقق من الشهادات
              </Link>
              <Link to="/faq">الأسئلة الشائعة</Link>
            </div>
          </footer>
        </div>
      </section>
    </main>
  )
}

export default TraineeDashboard