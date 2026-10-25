
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../App.css'
import { getAdminCourses } from '../services/api'

const API_BASE_URL = 'http://127.0.0.1:8000'

function Dashboard() {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [courses, setCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(true)

  const [enrollments, setEnrollments] = useState([])
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true)
  const [enrollmentActionId, setEnrollmentActionId] = useState(null)

  const [trainerApplications, setTrainerApplications] = useState([])
  const [trainerApplicationsLoading, setTrainerApplicationsLoading] =
    useState(true)
  const [trainerApplicationActionId, setTrainerApplicationActionId] =
    useState(null)

  const [notifications, setNotifications] = useState([])
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationActionId, setNotificationActionId] = useState(null)
  const [notificationsError, setNotificationsError] = useState('')

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [settingsMessage, setSettingsMessage] = useState('')
  const [profileName, setProfileName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [settingsAction, setSettingsAction] = useState('')

  const unreadNotificationsCount = notifications.filter(
    (notification) => !notification.is_read,
  ).length
const approvedEnrollments = enrollments.filter(
  (enrollment) => enrollment.status === 'approved',
)
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user')

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        setUser(null)
      }
    }
  }, [])

  const isAdmin = user?.role === 'admin'
  const isTrainer = user?.role === 'trainer'
  const isTrainee = user?.role === 'trainee'

  const roleTitle = isAdmin
    ? 'مسؤول التدريب'
    : isTrainer
      ? 'المدرب'
      : 'المتدرب'

  const roleEnglish = isAdmin
    ? 'Administrator'
    : isTrainer
      ? 'Trainer'
      : 'Trainee'

  const userName = user?.name || roleTitle
  const firstLetter = userName.charAt(0)

  const pendingEnrollments = enrollments.filter(
    (enrollment) => enrollment.status === 'pending',
  )

  const pendingTrainerApplications = trainerApplications.filter(
    (application) => application.status === 'pending',
  )

  function getToken() {
    return sessionStorage.getItem('access_token')
  }

  async function readError(response, fallback) {
    const data = await response.json().catch(() => ({}))

    if (Array.isArray(data.detail)) {
      throw new Error(data.detail.map((item) => item.msg).join('، '))
    }

    throw new Error(data.detail || data.message || fallback)
  }

  async function loadNotifications() {
    const token = getToken()

    if (!token) {
      setNotificationsError(
        'انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مجددًا.',
      )
      return
    }

    try {
      setNotificationsLoading(true)
      setNotificationsError('')

      const response = await fetch(`${API_BASE_URL}/notifications/my`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        await readError(response, 'تعذر تحميل الإشعارات.')
      }

      const data = await response.json()
      setNotifications(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('خطأ في تحميل الإشعارات:', error)
      setNotificationsError(error.message || 'تعذر تحميل الإشعارات.')
    } finally {
      setNotificationsLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) return
    loadNotifications()
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin) {
      setCoursesLoading(false)
      setEnrollmentsLoading(false)
      setTrainerApplicationsLoading(false)
      return
    }

    async function loadDashboardData() {
      try {
        setCoursesLoading(true)
        setEnrollmentsLoading(true)
        setTrainerApplicationsLoading(true)

        const token = getToken()

        if (!token) {
          throw new Error(
            'انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مجددًا.',
          )
        }

        const [
          coursesData,
          enrollmentsResponse,
          trainerApplicationsResponse,
        ] = await Promise.all([
          getAdminCourses(),

          fetch(`${API_BASE_URL}/enrollments/admin`, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }),

          fetch(`${API_BASE_URL}/trainer-applications/admin`, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }),
        ])

        if (!enrollmentsResponse.ok) {
          await readError(
            enrollmentsResponse,
            'تعذر تحميل طلبات التسجيل.',
          )
        }

        if (!trainerApplicationsResponse.ok) {
          await readError(
            trainerApplicationsResponse,
            'تعذر تحميل طلبات المدربين.',
          )
        }

        const enrollmentsData = await enrollmentsResponse.json()
        const trainerApplicationsData =
          await trainerApplicationsResponse.json()

        setCourses(Array.isArray(coursesData) ? coursesData : [])
        setEnrollments(
          Array.isArray(enrollmentsData) ? enrollmentsData : [],
        )
        setTrainerApplications(
          Array.isArray(trainerApplicationsData)
            ? trainerApplicationsData
            : [],
        )
      } catch (error) {
        console.error('خطأ في تحميل لوحة التحكم:', error)
        window.alert(error.message || 'تعذر تحميل بيانات لوحة التحكم.')
      } finally {
        setCoursesLoading(false)
        setEnrollmentsLoading(false)
        setTrainerApplicationsLoading(false)
      }
    }

    loadDashboardData()
  }, [isAdmin])

  async function openSettings() {
    setSettingsOpen(true)
    setSettingsError('')
    setSettingsMessage('')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')

    const token = getToken()

    if (!token) {
      setSettingsError(
        'انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مجددًا.',
      )
      return
    }

    try {
      setSettingsLoading(true)
      setSettingsAction('profile')

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        await readError(response, 'تعذر تحميل بيانات الحساب.')
      }

      const profile = await response.json()
      const actualUser = profile.user || profile

      setProfileName(actualUser.name || '')
      setProfileEmail(actualUser.email || '')

      if (actualUser.id != null) {
        const storedUser = {
          ...(user || {}),
          ...actualUser,
        }

        sessionStorage.setItem('user', JSON.stringify(storedUser))
        setUser(storedUser)
      }
    } catch (error) {
      setSettingsError(error.message || 'تعذر تحميل بيانات الحساب.')
    } finally {
      setSettingsLoading(false)
      setSettingsAction('')
    }
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSettingsError('')
    setSettingsMessage('')

    if (!profileName.trim() || !profileEmail.trim()) {
      setSettingsError('يرجى إدخال الاسم والبريد الإلكتروني.')
      return
    }

    const token = getToken()

    if (!token) {
      setSettingsError('انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مجددًا.')
      return
    }

    try {
      setSettingsLoading(true)
      setSettingsAction('profile')

      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profileName.trim(),
          email: profileEmail.trim(),
        }),
      })

      if (!response.ok) {
        await readError(response, 'تعذر تحديث بيانات الحساب.')
      }

      const result = await response.json()
      const updatedUser = result.user || result

      const storedUser = {
        ...(user || {}),
        ...updatedUser,
      }

      sessionStorage.setItem('user', JSON.stringify(storedUser))
      setUser(storedUser)
      setProfileName(storedUser.name || '')
      setProfileEmail(storedUser.email || '')
      setSettingsMessage('تم تحديث بيانات الحساب بنجاح.')
    } catch (error) {
      setSettingsError(error.message || 'تعذر تحديث بيانات الحساب.')
    } finally {
      setSettingsLoading(false)
      setSettingsAction('')
    }
  }

  async function savePassword(event) {
    event.preventDefault()
    setSettingsError('')
    setSettingsMessage('')

    if (newPassword !== confirmPassword) {
      setSettingsError('كلمتا المرور الجديدتان غير متطابقتين.')
      return
    }

    if (newPassword.length < 8) {
      setSettingsError('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.')
      return
    }

    if (new TextEncoder().encode(newPassword).length > 72) {
      setSettingsError('كلمة المرور طويلة جدًا؛ الحد الأقصى 72 بايت.')
      return
    }

    const token = getToken()

    if (!token) {
      setSettingsError('انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مجددًا.')
      return
    }

    try {
      setSettingsLoading(true)
      setSettingsAction('password')

      const response = await fetch(
        `${API_BASE_URL}/auth/change-password`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        },
      )

      if (!response.ok) {
        await readError(response, 'تعذر تغيير كلمة المرور.')
      }

      await response.json().catch(() => ({}))

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSettingsMessage('تم تغيير كلمة المرور بنجاح.')
    } catch (error) {
      setSettingsError(error.message || 'تعذر تغيير كلمة المرور.')
    } finally {
      setSettingsLoading(false)
      setSettingsAction('')
    }
  }

  async function handleNotificationClick(notification) {
    const token = getToken()

    if (!token) {
      window.alert('انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مجددًا.')
      return
    }

    if (!notification.is_read) {
      try {
        setNotificationActionId(notification.id)

        const response = await fetch(
          `${API_BASE_URL}/notifications/${notification.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ is_read: true }),
          },
        )

        if (!response.ok) {
          await readError(response, 'تعذر تحديث حالة الإشعار.')
        }

        const updatedNotification = await response.json()

        setNotifications((current) =>
          current.map((item) =>
            item.id === updatedNotification.id ? updatedNotification : item,
          ),
        )
      } catch (error) {
        window.alert(error.message || 'تعذر تحديث الإشعار.')
        return
      } finally {
        setNotificationActionId(null)
      }
    }

    setNotificationsOpen(false)

    if (notification.type === 'trainer_application') {
      scrollToSection('trainer-application-requests')
    } else if (notification.type === 'registration') {
      scrollToSection('registration-requests')
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('user')
    navigate('/login')
  }

  function getCourseStatusLabel(status) {
    if (status === 'published') return 'منشورة'
    if (status === 'archived') return 'مؤرشفة'
    return 'مسودة'
  }

  function getEnrollmentStatusLabel(status) {
    if (status === 'approved') return 'مقبول'
    if (status === 'rejected') return 'مرفوض'
    return 'قيد المراجعة'
  }

  function getTrainerApplicationStatusLabel(status) {
    if (status === 'approved') return 'مقبول'
    if (status === 'rejected') return 'مرفوض'
    return 'قيد المراجعة'
  }

  async function handleEnrollmentAction(enrollmentId, action) {
    let rejectionReason = null

    if (action === 'rejected') {
      rejectionReason = window.prompt('اكتب سبب رفض طلب التسجيل:')

      if (!rejectionReason || !rejectionReason.trim()) return
    }

    try {
      setEnrollmentActionId(enrollmentId)

      const token = getToken()

      const response = await fetch(
        `${API_BASE_URL}/enrollments/admin/${enrollmentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: action,
            rejection_reason: rejectionReason,
          }),
        },
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (Array.isArray(data.detail)) {
          throw new Error(data.detail.map((item) => item.msg).join('، '))
        }

        throw new Error(data.detail || 'حدث خطأ أثناء تحديث طلب التسجيل.')
      }

      setEnrollments((current) =>
        current.map((enrollment) =>
          enrollment.id === enrollmentId ? data : enrollment,
        ),
      )
    } catch (error) {
      window.alert(error.message || 'حدث خطأ أثناء تحديث طلب التسجيل.')
    } finally {
      setEnrollmentActionId(null)
    }
  }

  async function handleTrainerApplicationAction(applicationId, action) {
    let rejectionReason = null

    if (action === 'rejected') {
      rejectionReason = window.prompt('اكتب سبب رفض طلب المدرب:')

      if (!rejectionReason || !rejectionReason.trim()) return
    }

    try {
      setTrainerApplicationActionId(applicationId)

      const token = getToken()

      const response = await fetch(
        `${API_BASE_URL}/trainer-applications/admin/${applicationId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: action,
            rejection_reason: rejectionReason,
          }),
        },
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (Array.isArray(data.detail)) {
          throw new Error(data.detail.map((item) => item.msg).join('، '))
        }

        throw new Error(data.detail || 'تعذر تحديث طلب المدرب.')
      }

      setTrainerApplications((current) =>
        current.map((application) =>
          application.id === applicationId ? data : application,
        ),
      )

      window.alert(
        action === 'approved'
          ? 'تم قبول الطلب وإنشاء حساب المدرب.'
          : 'تم رفض طلب الانضمام كمدرب.',
      )
    } catch (error) {
      window.alert(error.message || 'حدث خطأ أثناء معالجة طلب المدرب.')
    } finally {
      setTrainerApplicationActionId(null)
    }
  }

  function showTrainerApplicationDetails(application) {
    window.alert(
      `الاسم: ${application.name}\n` +
        `البريد: ${application.email}\n` +
        `الجهة: ${application.department}\n` +
        `التخصص: ${application.specialization}\n` +
        `الرقم الوظيفي أو الجامعي: ${application.employee_id || 'غير مضاف'}\n\n` +
        `المؤهلات:\n${application.qualifications || 'غير مضافة'}\n\n` +
        `الخبرات:\n${application.experience || 'غير مضافة'}\n\n` +
        `ما يمكن تقديمه للمتدربين:\n${application.motivation || 'غير مضاف'}`,
    )
  }

  function scrollToSection(sectionId) {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  function formatNotificationDate(dateValue) {
    if (!dateValue) return ''

    const date = new Date(dateValue)

    if (Number.isNaN(date.getTime())) return ''

    return date.toLocaleString('ar-SA', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  return (
    <div className="dashboard-page" dir="rtl">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <h1>أثر</h1>
          <span>من التعلم إلى التغيير.</span>
        </div>

        <div className="sidebar-label">مساحة الإدارة</div>

        <nav className="sidebar-nav">
          <Link to="/admin" className="nav-item active">
            <span className="nav-icon">⌂</span>
            <span>الرئيسية</span>
          </Link>

          <Link to="/programs" className="nav-item">
            <span className="nav-icon">▤</span>
            <span>الدورات التدريبية</span>
          </Link>

          {isAdmin && (
            <>
              <Link
                to="/admin/courses/new"
                className="nav-item nav-item-create"
              >
                <span className="nav-icon">＋</span>
                <span>إنشاء دورة تدريبية</span>
              </Link>

              <Link to="/admin/evaluations" className="nav-item">
                <span className="nav-icon">✓</span>
                <span>إدارة التقييمات</span>
              </Link>

              <button
                type="button"
                className="nav-item"
                onClick={() => scrollToSection('registration-requests')}
              >
                <span className="nav-icon">◫</span>
                <span>طلبات التسجيل</span>
              </button>

              <button
                type="button"
                className="nav-item"
                onClick={() =>
                  scrollToSection('trainer-application-requests')
                }
              >
                <span className="nav-icon">♙</span>
                <span>طلبات المدربين</span>
              </button>

              <button type="button" className="nav-item">
                <span className="nav-icon">♙</span>
                <span>المستخدمون</span>
              </button>

              <button type="button" className="nav-item">
                <span className="nav-icon">▥</span>
                <span>التقارير والمؤشرات</span>
              </button>
            </>
          )}

          {isTrainer && (
            <Link to="/trainer" className="nav-item">
              <span className="nav-icon">▤</span>
              <span>دوراتي</span>
            </Link>
          )}

          {isTrainee && (
            <>
              <Link to="/programs" className="nav-item">
                <span className="nav-icon">✓</span>
                <span>دوراتي</span>
              </Link>

              <button type="button" className="nav-item">
                <span className="nav-icon">▧</span>
                <span>الشهادات</span>
              </button>
            </>
          )}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="nav-item"
            onClick={openSettings}
          >
            <span className="nav-icon">⚙</span>
            <span>الإعدادات</span>
          </button>

          <button
            type="button"
            className="nav-item logout-item"
            onClick={handleLogout}
          >
            <span className="nav-icon">↪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">لوحة التحكم</p>
            <h2>صباح الخير، {userName}</h2>

            <p className="dashboard-subtitle">
              {isAdmin
                ? 'إدارة البرامج التدريبية ومتابعة سير العملية التدريبية من مكان واحد.'
                : isTrainer
                  ? 'تابع دوراتك التدريبية والمشاركين من مكان واحد.'
                  : 'تابع دوراتك التدريبية وتقدمك وشهاداتك من مكان واحد.'}
            </p>
          </div>

          <div className="header-actions">
            {isAdmin && (
              <div className="notification-wrapper">
                <button
                  type="button"
                  className="notification-button"
                  aria-label="الإشعارات"
                  aria-expanded={notificationsOpen}
                  onClick={() => {
                    const willOpen = !notificationsOpen
                    setNotificationsOpen(willOpen)

                    if (willOpen) loadNotifications()
                  }}
                >
                  <span className="notification-icon">♧</span>

                  {unreadNotificationsCount > 0 && (
                    <b>
                      {unreadNotificationsCount > 99
                        ? '99+'
                        : unreadNotificationsCount}
                    </b>
                  )}
                </button>

                {notificationsOpen && (
                  <div
                    className="notifications-dropdown"
                    dir="rtl"
                    role="dialog"
                    aria-label="قائمة الإشعارات"
                  >
                    <div className="notifications-header">
                      <div>
                        <strong>الإشعارات</strong>
                        <span>{unreadNotificationsCount} غير مقروء</span>
                      </div>

                      <button
                        type="button"
                        onClick={loadNotifications}
                        aria-label="تحديث الإشعارات"
                        title="تحديث الإشعارات"
                        disabled={notificationsLoading}
                      >
                        ↻
                      </button>
                    </div>

                    <div className="notifications-list">
                      {notificationsLoading ? (
                        <div className="notifications-empty">
                          جارٍ تحميل الإشعارات...
                        </div>
                      ) : notificationsError ? (
                        <div className="notifications-empty notification-error">
                          <span>{notificationsError}</span>
                          <button type="button" onClick={loadNotifications}>
                            إعادة المحاولة
                          </button>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="notifications-empty">
                          لا توجد إشعارات حاليًا.
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            type="button"
                            key={notification.id}
                            className={`notification-item ${
                              notification.is_read ? 'is-read' : 'is-unread'
                            }`}
                            disabled={notificationActionId === notification.id}
                            onClick={() =>
                              handleNotificationClick(notification)
                            }
                          >
                            <span className="notification-item-dot" />

                            <span className="notification-item-content">
                              <strong>{notification.title}</strong>
                              <span className="notification-item-message">
                                {notification.message}
                              </span>
                              <time>
                                {formatNotificationDate(
                                  notification.created_at,
                                )}
                              </time>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="user-profile">
              <div className="user-avatar">{firstLetter}</div>
              <div>
                <strong>{userName}</strong>
                <span>{roleEnglish}</span>
              </div>
            </div>
          </div>
        </header>

        {isAdmin && (
          <>
            <section className="admin-welcome">
              <div className="admin-welcome-content">
                <div className="admin-welcome-label">إدارة التدريب</div>

                <h3>
                  إدارة البرامج التدريبية
                  <br />
                  تبدأ من هنا.
                </h3>

                <p>
                  أنشئ الدورات التدريبية، راجع التسجيلات،
                  وتابع مؤشرات التدريب والأثر.
                </p>
              </div>

              <div className="admin-welcome-action">
                <span>برنامج تدريبي جديد؟</span>

                <Link
                  to="/admin/courses/new"
                  className="create-course-button"
                >
                  <span>＋</span>
                  إنشاء دورة تدريبية
                </Link>
              </div>
            </section>

            <section className="dashboard-section">
              <div className="section-heading">
                <div>
                  <p>نظرة عامة</p>
                  <h3>مؤشرات التدريب</h3>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-card-top">
                    <span className="stat-icon">▤</span>
                    <span className="stat-label">الدورات التدريبية</span>
                  </div>
                  <strong>{coursesLoading ? '—' : courses.length}</strong>
                  <p>دورة مسجلة في النظام</p>
                </div>

                <div className="stat-card">
                  <div className="stat-card-top">
                    <span className="stat-icon">♙</span>
                    <span className="stat-label">طلبات التسجيل</span>
                  </div>
                  <strong>
                    {enrollmentsLoading ? '—' : enrollments.length}
                  </strong>
                  <p>طلب تسجيل في النظام</p>
                </div>

                <div className="stat-card">
                  <div className="stat-card-top">
                    <span className="stat-icon">◷</span>
                    <span className="stat-label">قيد المراجعة</span>
                  </div>
                  <strong>
                    {enrollmentsLoading ? '—' : pendingEnrollments.length}
                  </strong>
                  <p>طلب يحتاج إلى إجراء</p>
                </div>

                <div className="stat-card">
                  <div className="stat-card-top">
                    <span className="stat-icon">✓</span>
                    <span className="stat-label">الطلبات المقبولة</span>
                  </div>
                  <strong>
                    {enrollmentsLoading
                      ? '—'
                      : enrollments.filter(
                          (enrollment) => enrollment.status === 'approved',
                        ).length}
                  </strong>
                  <p>تسجيل مقبول</p>
                </div>
              </div>
            </section>

            <section className="dashboard-section">
              <div className="section-heading">
                <div>
                  <p>إدارة البرامج</p>
                  <h3>الدورات التدريبية</h3>
                </div>

                <Link to="/programs" className="view-all-button">
                  عرض جميع الدورات
                </Link>
              </div>

              <div className="dashboard-panel">
                <div className="admin-course-table">
                  <div className="admin-course-table-header">
                    <span>اسم الدورة</span>
                    <span>تاريخ التنفيذ</span>
                    <span>الحالة</span>
                    <span>الإجراء</span>
                  </div>

                  {coursesLoading ? (
                    <div className="admin-course-row">
                      <span>جاري تحميل الدورات...</span>
                    </div>
                  ) : courses.length === 0 ? (
                    <div className="admin-course-row">
                      <span>لا توجد دورات مسجلة حاليًا.</span>
                    </div>
                  ) : (
                    courses.slice(0, 5).map((course) => (
                      <div className="admin-course-row" key={course.id}>
                        <div className="course-title-cell">
                          <div className="course-table-icon">أ</div>
                          <div>
                            <strong>{course.name}</strong>
                            <span>دورة تدريبية</span>
                          </div>
                        </div>

                        <span>{course.start_date || '—'}</span>

                        <span
                          className={`course-status ${
                            course.status === 'published'
                              ? 'published'
                              : 'draft'
                          }`}
                        >
                          {getCourseStatusLabel(course.status)}
                        </span>

                        <Link
                          to={`/admin/courses/${course.id}/edit`}
                          className="course-action"
                        >
                          تعديل
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section
              className="dashboard-section"
              id="registration-requests"
            >
              <div className="section-heading">
                <div>
                  <p>إدارة التسجيل</p>
                  <h3>طلبات التسجيل</h3>
                </div>

                <span className="view-all-button">
                  {pendingEnrollments.length} قيد المراجعة
                </span>
              </div>

              <div className="dashboard-panel">
                <div className="admin-course-table">
                  <div className="admin-course-table-header">
                    <span>البرنامج</span>
                    <span>رقم المتدرب</span>
                    <span>الحالة</span>
                    <span>الإجراء</span>
                  </div>

                  {enrollmentsLoading ? (
                    <div className="admin-course-row">
                      <span>جاري تحميل طلبات التسجيل...</span>
                    </div>
                  ) : enrollments.length === 0 ? (
                    <div className="admin-course-row">
                      <span>لا توجد طلبات تسجيل حاليًا.</span>
                    </div>
                  ) : (
                    enrollments.map((enrollment) => (
                      <div className="admin-course-row" key={enrollment.id}>
                        <div className="course-title-cell">
                          <div className="course-table-icon">أ</div>
                          <div>
                            <strong>{enrollment.course_title}</strong>
                            <span>طلب رقم {enrollment.id}</span>
                          </div>
                        </div>

                        <span>{enrollment.trainee_id ?? '—'}</span>

                        <span
                          className={`course-status ${
                            enrollment.status === 'approved'
                              ? 'published'
                              : enrollment.status === 'rejected'
                                ? 'draft'
                                : ''
                          }`}
                        >
                          {getEnrollmentStatusLabel(enrollment.status)}
                        </span>

                        <div className="dashboard-action-buttons">
                          {enrollment.status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                className="course-action"
                                disabled={
                                  enrollmentActionId === enrollment.id
                                }
                                onClick={() =>
                                  handleEnrollmentAction(
                                    enrollment.id,
                                    'approved',
                                  )
                                }
                              >
                                {enrollmentActionId === enrollment.id
                                  ? '...'
                                  : 'قبول'}
                              </button>

                              <button
                                type="button"
                                className="course-action"
                                disabled={
                                  enrollmentActionId === enrollment.id
                                }
                                onClick={() =>
                                  handleEnrollmentAction(
                                    enrollment.id,
                                    'rejected',
                                  )
                                }
                              >
                                رفض
                              </button>
                            </>
                          ) : (
                            <span>
                              {enrollment.status === 'rejected'
                                ? enrollment.rejection_reason ||
                                  'تم رفض الطلب'
                                : 'تمت معالجة الطلب'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section
              className="dashboard-section"
              id="trainer-application-requests"
            >
              <div className="section-heading">
                <div>
                  <p>استقطاب المدربين</p>
                  <h3>طلبات الانضمام كمدرب</h3>
                </div>

                <span className="view-all-button">
                  {pendingTrainerApplications.length} قيد المراجعة
                </span>
              </div>

              <div className="dashboard-panel">
                <div className="admin-course-table">
                  <div className="admin-course-table-header">
                    <span>المتقدم</span>
                    <span>التخصص والجهة</span>
                    <span>الحالة</span>
                    <span>الإجراء</span>
                  </div>

                  {trainerApplicationsLoading ? (
                    <div className="admin-course-row">
                      <span>جارٍ تحميل طلبات المدربين...</span>
                    </div>
                  ) : trainerApplications.length === 0 ? (
                    <div className="admin-course-row">
                      <span>لا توجد طلبات انضمام كمدرب حاليًا.</span>
                    </div>
                  ) : (
                    trainerApplications.map((application) => (
                      <div className="admin-course-row" key={application.id}>
                        <div className="course-title-cell">
                          <div className="course-table-icon">م</div>
                          <div>
                            <strong>{application.name}</strong>
                            <span>{application.email}</span>
                            {application.employee_id && (
                              <span>الرقم: {application.employee_id}</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <strong>
                            {application.specialization || 'غير محدد'}
                          </strong>
                          <span>{application.department || 'غير محددة'}</span>
                        </div>

                        <span
                          className={`course-status ${
                            application.status === 'approved'
                              ? 'published'
                              : application.status === 'rejected'
                                ? 'draft'
                                : ''
                          }`}
                        >
                          {getTrainerApplicationStatusLabel(
                            application.status,
                          )}
                        </span>

                        <div className="dashboard-action-buttons">
                          <button
                            type="button"
                            className="course-action"
                            onClick={() =>
                              showTrainerApplicationDetails(application)
                            }
                          >
                            التفاصيل
                          </button>

                          {application.status === 'pending' ? (
                            <>
                              <button
                                type="button"
                                className="course-action"
                                disabled={
                                  trainerApplicationActionId ===
                                  application.id
                                }
                                onClick={() =>
                                  handleTrainerApplicationAction(
                                    application.id,
                                    'approved',
                                  )
                                }
                              >
                                {trainerApplicationActionId === application.id
                                  ? '...'
                                  : 'قبول'}
                              </button>

                              <button
                                type="button"
                                className="course-action"
                                disabled={
                                  trainerApplicationActionId ===
                                  application.id
                                }
                                onClick={() =>
                                  handleTrainerApplicationAction(
                                    application.id,
                                    'rejected',
                                  )
                                }
                              >
                                رفض
                              </button>
                            </>
                          ) : (
                            <span>
                              {application.status === 'rejected'
                                ? application.rejection_reason ||
                                  'تم رفض الطلب'
                                : 'تمت معالجة الطلب'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            <section className="dashboard-section">
              <div className="section-heading">
                <div>
                  <p>الوصول السريع</p>
                  <h3>ماذا تريد أن تفعل؟</h3>
                </div>
              </div>

              <div className="quick-actions">
                <Link to="/admin/courses/new" className="quick-action">
                  <div className="quick-action-icon">＋</div>
                  <div>
                    <strong>إنشاء دورة تدريبية</strong>
                    <span>إضافة برنامج جديد إلى المنصة</span>
                  </div>
                  <span className="quick-arrow">←</span>
                </Link>

                <Link to="/admin/evaluations" className="quick-action">
                  <div className="quick-action-icon">✓</div>
                  <div>
                    <strong>إدارة تقييمات الدورات</strong>
                    <span>
                      إنشاء التقييمات وإضافة الأسئلة وتفعيلها للمتدربين
                    </span>
                  </div>
                  <span className="quick-arrow">←</span>
                </Link>

                <button
                  type="button"
                  className="quick-action"
                  onClick={() => scrollToSection('registration-requests')}
                >
                  <div className="quick-action-icon">◫</div>
                  <div>
                    <strong>مراجعة طلبات التسجيل</strong>
                    <span>متابعة الطلبات التي تحتاج إجراء</span>
                  </div>
                  <span className="quick-arrow">←</span>
                </button>

                <button
                  type="button"
                  className="quick-action"
                  onClick={() =>
                    scrollToSection('trainer-application-requests')
                  }
                >
                  <div className="quick-action-icon">♙</div>
                  <div>
                    <strong>مراجعة طلبات المدربين</strong>
                    <span>قبول طلبات الانضمام أو رفضها</span>
                  </div>
                  <span className="quick-arrow">←</span>
                </button>

                <button type="button" className="quick-action">
                  <div className="quick-action-icon">▥</div>
                  <div>
                    <strong>متابعة المؤشرات</strong>
                    <span>الاطلاع على بيانات التدريب والأثر</span>
                  </div>
                  <span className="quick-arrow">←</span>
                </button>
              </div>
            </section>
          </>
        )}

        {isTrainer && (
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <p>مساحتك التدريبية</p>
                <h3>دوراتي</h3>
              </div>
            </div>

            <div className="dashboard-panel">
              <div className="empty-state">
                <div className="empty-state-icon">▤</div>
                <h3>تابع دوراتك التدريبية</h3>
                <p>ستظهر هنا الدورات المسندة إليك.</p>

                <Link to="/trainer" className="empty-state-button">
                  الانتقال إلى دوراتي
                </Link>
              </div>
            </div>
          </section>
        )}

        {isTrainee && (
          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <p>رحلتك التدريبية</p>
                <h3>الدورات المتاحة</h3>
              </div>

              <Link to="/programs" className="view-all-button">
                استعراض الدورات
              </Link>
            </div>

            <div className="dashboard-panel">
              <div className="empty-state">
                <div className="empty-state-icon">▤</div>
                <h3>استكشف الدورات التدريبية</h3>
                <p>اختر برنامجًا مناسبًا وابدأ رحلتك التدريبية.</p>

                <Link to="/programs" className="empty-state-button">
                  استعراض الدورات
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>

      {settingsOpen && (
        <div
          className="account-settings-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSettingsOpen(false)
            }
          }}
        >
          <section
            className="account-settings-modal"
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-settings-title"
          >
            <button
              type="button"
              className="account-settings-close"
              onClick={() => setSettingsOpen(false)}
              aria-label="إغلاق الإعدادات"
            >
              ×
            </button>

            <h2 id="account-settings-title">إعدادات الحساب</h2>
            <p className="account-settings-description">
              تعديل البيانات الشخصية وتغيير كلمة المرور.
            </p>

            {settingsLoading && (
              <p className="account-settings-status">جارٍ تنفيذ الطلب...</p>
            )}

            {settingsError && (
              <p className="account-settings-error" role="alert">
                {settingsError}
              </p>
            )}

            {settingsMessage && (
              <p className="account-settings-success" role="status">
                {settingsMessage}
              </p>
            )}

            <form
              onSubmit={saveProfile}
              className="account-settings-form"
            >
              <h3>البيانات الشخصية</h3>

              <label htmlFor="profile-name">الاسم</label>
              <input
                id="profile-name"
                type="text"
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                autoComplete="name"
                required
                maxLength={255}
                disabled={settingsLoading}
              />

              <label htmlFor="profile-email">البريد الإلكتروني</label>
              <input
                id="profile-email"
                type="email"
                value={profileEmail}
                onChange={(event) => setProfileEmail(event.target.value)}
                autoComplete="email"
                required
                maxLength={255}
                disabled={settingsLoading}
              />

              <button
                type="submit"
                disabled={settingsLoading || settingsAction !== ''}
              >
                {settingsAction === 'profile'
                  ? 'جارٍ الحفظ...'
                  : 'حفظ البيانات'}
              </button>
            </form>

            <form
              onSubmit={savePassword}
              className="account-settings-form"
            >
              <h3>تغيير كلمة المرور</h3>

              <label htmlFor="current-password">
                كلمة المرور الحالية
              </label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
                required
                disabled={settingsLoading}
              />

              <label htmlFor="new-password">كلمة المرور الجديدة</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
                disabled={settingsLoading}
              />

              <label htmlFor="confirm-password">
                تأكيد كلمة المرور الجديدة
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                minLength={8}
                maxLength={72}
                required
                disabled={settingsLoading}
              />

              <button
                type="submit"
                disabled={settingsLoading || settingsAction !== ''}
              >
                {settingsAction === 'password'
                  ? 'جارٍ التغيير...'
                  : 'تغيير كلمة المرور'}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default Dashboard
