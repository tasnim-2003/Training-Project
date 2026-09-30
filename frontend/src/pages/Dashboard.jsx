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

  useEffect(() => {
    if (!isAdmin) {
      setCoursesLoading(false)
      setEnrollmentsLoading(false)
      return
    }

    async function loadDashboardData() {
      try {
        setCoursesLoading(true)
        setEnrollmentsLoading(true)

        const token = sessionStorage.getItem('access_token')

        const [coursesData, enrollmentsResponse] = await Promise.all([
          getAdminCourses(),
          fetch(`${API_BASE_URL}/enrollments/admin`, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }),
        ])

        if (!enrollmentsResponse.ok) {
          const errorData = await enrollmentsResponse.json()
          throw new Error(
            errorData.detail || 'تعذر تحميل طلبات التسجيل',
          )
        }

        const enrollmentsData = await enrollmentsResponse.json()

        setCourses(coursesData)
        setEnrollments(enrollmentsData)
      } catch (error) {
        console.error(error)
      } finally {
        setCoursesLoading(false)
        setEnrollmentsLoading(false)
      }
    }

    loadDashboardData()
  }, [isAdmin])

  function handleLogout() {
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('user')
    navigate('/login')
  }

  function getCourseStatusLabel(status) {
    if (status === 'published') {
      return 'منشورة'
    }

    if (status === 'archived') {
      return 'مؤرشفة'
    }

    return 'مسودة'
  }

  function getEnrollmentStatusLabel(status) {
    if (status === 'approved') {
      return 'مقبول'
    }

    if (status === 'rejected') {
      return 'مرفوض'
    }

    return 'قيد المراجعة'
  }

  async function handleEnrollmentAction(
    enrollmentId,
    action,
  ) {
    let rejectionReason = null

    if (action === 'rejected') {
      rejectionReason = window.prompt(
        'اكتب سبب رفض طلب التسجيل:',
      )

      if (!rejectionReason || !rejectionReason.trim()) {
        return
      }
    }

    try {
      setEnrollmentActionId(enrollmentId)

      const token = sessionStorage.getItem('access_token')

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

      const data = await response.json()

      if (!response.ok) {
        if (Array.isArray(data.detail)) {
          throw new Error(
            data.detail
              .map((item) => item.msg)
              .join('، '),
          )
        }

        throw new Error(
          data.detail || 'حدث خطأ أثناء تحديث طلب التسجيل',
        )
      }

      setEnrollments((current) =>
        current.map((enrollment) =>
          enrollment.id === enrollmentId
            ? data
            : enrollment,
        ),
      )
    } catch (error) {
      window.alert(
        error.message || 'حدث خطأ أثناء تحديث طلب التسجيل',
      )
    } finally {
      setEnrollmentActionId(null)
    }
  }

  const pendingEnrollments = enrollments.filter(
    (enrollment) => enrollment.status === 'pending',
  )

  const processedEnrollments = enrollments.filter(
    (enrollment) => enrollment.status !== 'pending',
  )

  return (
    <div className="dashboard-page" dir="rtl">

      <aside className="dashboard-sidebar">

        <div className="sidebar-brand">
          <h1>أثر</h1>
          <span>من التعلم إلى التغيير.</span>
        </div>

        <div className="sidebar-label">
          مساحة الإدارة
        </div>

        <nav className="sidebar-nav">

          <Link
            to="/admin"
            className="nav-item active"
          >
            <span className="nav-icon">⌂</span>
            <span>الرئيسية</span>
          </Link>

          <Link
            to="/programs"
            className="nav-item"
          >
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

              <button
                type="button"
                className="nav-item"
                onClick={() => {
                  document
                    .getElementById('registration-requests')
                    ?.scrollIntoView({
                      behavior: 'smooth',
                    })
                }}
              >
                <span className="nav-icon">◫</span>
                <span>طلبات التسجيل</span>
              </button>

              <button
                type="button"
                className="nav-item"
              >
                <span className="nav-icon">♙</span>
                <span>المستخدمون</span>
              </button>

              <button
                type="button"
                className="nav-item"
              >
                <span className="nav-icon">▥</span>
                <span>التقارير والمؤشرات</span>
              </button>
            </>
          )}

          {isTrainer && (
            <button
              type="button"
              className="nav-item"
            >
              <span className="nav-icon">▤</span>
              <span>دوراتي</span>
            </button>
          )}

          {isTrainee && (
            <>
              <button
                type="button"
                className="nav-item"
              >
                <span className="nav-icon">✓</span>
                <span>دوراتي</span>
              </button>

              <button
                type="button"
                className="nav-item"
              >
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

            <p className="dashboard-eyebrow">
              لوحة التحكم
            </p>

            <h2>
              صباح الخير، {userName}
            </h2>

            <p className="dashboard-subtitle">
              {isAdmin
                ? 'إدارة البرامج التدريبية ومتابعة سير العملية التدريبية من مكان واحد.'
                : isTrainer
                  ? 'تابع دوراتك التدريبية والمشاركين من مكان واحد.'
                  : 'تابع دوراتك التدريبية وتقدمك وشهاداتك من مكان واحد.'}
            </p>

          </div>

          <div className="header-actions">

            <button
              type="button"
              className="notification-button"
              aria-label="الإشعارات"
            >
              <span className="notification-icon">
                ♧
              </span>

              <b>
                {pendingEnrollments.length}
              </b>
            </button>

            <div className="user-profile">

              <div className="user-avatar">
                {firstLetter}
              </div>

              <div>

                <strong>
                  {userName}
                </strong>

                <span>
                  {roleEnglish}
                </span>

              </div>

            </div>

          </div>

        </header>

        {isAdmin && (
          <>

            <section className="admin-welcome">

              <div className="admin-welcome-content">

                <div className="admin-welcome-label">
                  إدارة التدريب
                </div>

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

                <span>
                  برنامج تدريبي جديد؟
                </span>

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

                  <p>
                    نظرة عامة
                  </p>

                  <h3>
                    مؤشرات التدريب
                  </h3>

                </div>

              </div>

              <div className="stats-grid">

                <div className="stat-card">

                  <div className="stat-card-top">

                    <span className="stat-icon">
                      ▤
                    </span>

                    <span className="stat-label">
                      الدورات التدريبية
                    </span>

                  </div>

                  <strong>
                    {coursesLoading ? '—' : courses.length}
                  </strong>

                  <p>
                    دورة مسجلة في النظام
                  </p>

                </div>

                <div className="stat-card">

                  <div className="stat-card-top">

                    <span className="stat-icon">
                      ♙
                    </span>

                    <span className="stat-label">
                      طلبات التسجيل
                    </span>

                  </div>

                  <strong>
                    {enrollmentsLoading
                      ? '—'
                      : enrollments.length}
                  </strong>

                  <p>
                    طلب تسجيل في النظام
                  </p>

                </div>

                <div className="stat-card">

                  <div className="stat-card-top">

                    <span className="stat-icon">
                      ◷
                    </span>

                    <span className="stat-label">
                      قيد المراجعة
                    </span>

                  </div>

                  <strong>
                    {enrollmentsLoading
                      ? '—'
                      : pendingEnrollments.length}
                  </strong>

                  <p>
                    طلب يحتاج إلى إجراء
                  </p>

                </div>

                <div className="stat-card">

                  <div className="stat-card-top">

                    <span className="stat-icon">
                      ✓
                    </span>

                    <span className="stat-label">
                      الطلبات المقبولة
                    </span>

                  </div>

                  <strong>
                    {enrollmentsLoading
                      ? '—'
                      : enrollments.filter(
                          (enrollment) =>
                            enrollment.status === 'approved',
                        ).length}
                  </strong>

                  <p>
                    تسجيل مقبول
                  </p>

                </div>

              </div>

            </section>

            <section className="dashboard-section">

              <div className="section-heading">

                <div>

                  <p>
                    إدارة البرامج
                  </p>

                  <h3>
                    الدورات التدريبية
                  </h3>

                </div>

                <Link
                  to="/programs"
                  className="view-all-button"
                >
                  عرض جميع الدورات
                </Link>

              </div>

              <div className="dashboard-panel">

                <div className="admin-course-table">

                  <div className="admin-course-table-header">

                    <span>
                      اسم الدورة
                    </span>

                    <span>
                      تاريخ التنفيذ
                    </span>

                    <span>
                      الحالة
                    </span>

                    <span>
                      الإجراء
                    </span>

                  </div>

                  {coursesLoading ? (

                    <div className="admin-course-row">

                      <span>
                        جاري تحميل الدورات...
                      </span>

                    </div>

                  ) : courses.length === 0 ? (

                    <div className="admin-course-row">

                      <span>
                        لا توجد دورات مسجلة حاليًا.
                      </span>

                    </div>

                  ) : (

                    courses
                      .slice(0, 5)
                      .map((course) => (

                        <div
                          className="admin-course-row"
                          key={course.id}
                        >

                          <div className="course-title-cell">

                            <div className="course-table-icon">
                              أ
                            </div>

                            <div>

                              <strong>
                                {course.name}
                              </strong>

                              <span>
                                دورة تدريبية
                              </span>

                            </div>

                          </div>

                          <span>
                            {course.start_date}
                          </span>

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

                  <p>
                    إدارة التسجيل
                  </p>

                  <h3>
                    طلبات التسجيل
                  </h3>

                </div>

                <span className="view-all-button">
                  {pendingEnrollments.length} قيد المراجعة
                </span>

              </div>

              <div className="dashboard-panel">

                <div className="admin-course-table">

                  <div className="admin-course-table-header">

                    <span>
                      البرنامج
                    </span>

                    <span>
                      رقم المتدرب
                    </span>

                    <span>
                      الحالة
                    </span>

                    <span>
                      الإجراء
                    </span>

                  </div>

                  {enrollmentsLoading ? (

                    <div className="admin-course-row">

                      <span>
                        جاري تحميل طلبات التسجيل...
                      </span>

                    </div>

                  ) : enrollments.length === 0 ? (

                    <div className="admin-course-row">

                      <span>
                        لا توجد طلبات تسجيل حاليًا.
                      </span>

                    </div>

                  ) : (

                    enrollments.map((enrollment) => (

                      <div
                        className="admin-course-row"
                        key={enrollment.id}
                      >

                        <div className="course-title-cell">

                          <div className="course-table-icon">
                            أ
                          </div>

                          <div>

                            <strong>
                              {enrollment.course_title}
                            </strong>

                            <span>
                              طلب رقم {enrollment.id}
                            </span>

                          </div>

                        </div>

                        <span>
                          {enrollment.trainee_id}
                        </span>

                        <span
                          className={`course-status ${
                            enrollment.status === 'approved'
                              ? 'published'
                              : enrollment.status === 'rejected'
                                ? 'draft'
                                : ''
                          }`}
                        >
                          {getEnrollmentStatusLabel(
                            enrollment.status,
                          )}
                        </span>

                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                          }}
                        >

                          {enrollment.status === 'pending' ? (

                            <>
                              <button
                                type="button"
                                className="course-action"
                                disabled={
                                  enrollmentActionId ===
                                  enrollment.id
                                }
                                onClick={() =>
                                  handleEnrollmentAction(
                                    enrollment.id,
                                    'approved',
                                  )
                                }
                              >
                                {enrollmentActionId ===
                                enrollment.id
                                  ? '...'
                                  : 'قبول'}
                              </button>

                              <button
                                type="button"
                                className="course-action"
                                disabled={
                                  enrollmentActionId ===
                                  enrollment.id
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
                                ? enrollment.rejection_reason
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

                  <p>
                    الوصول السريع
                  </p>

                  <h3>
                    ماذا تريد أن تفعل؟
                  </h3>

                </div>

              </div>

              <div className="quick-actions">

                <Link
                  to="/admin/courses/new"
                  className="quick-action"
                >

                  <div className="quick-action-icon">
                    ＋
                  </div>

                  <div>

                    <strong>
                      إنشاء دورة تدريبية
                    </strong>

                    <span>
                      إضافة برنامج جديد إلى المنصة
                    </span>

                  </div>

                  <span className="quick-arrow">
                    ←
                  </span>

                </Link>

                <button
                  type="button"
                  className="quick-action"
                  onClick={() => {
                    document
                      .getElementById('registration-requests')
                      ?.scrollIntoView({
                        behavior: 'smooth',
                      })
                  }}
                >

                  <div className="quick-action-icon">
                    ◫
                  </div>

                  <div>

                    <strong>
                      مراجعة طلبات التسجيل
                    </strong>

                    <span>
                      متابعة الطلبات التي تحتاج إجراء
                    </span>

                  </div>

                  <span className="quick-arrow">
                    ←
                  </span>

                </button>

                <button
                  type="button"
                  className="quick-action"
                >

                  <div className="quick-action-icon">
                    ▥
                  </div>

                  <div>

                    <strong>
                      متابعة المؤشرات
                    </strong>

                    <span>
                      الاطلاع على بيانات التدريب والأثر
                    </span>

                  </div>

                  <span className="quick-arrow">
                    ←
                  </span>

                </button>

              </div>

            </section>

          </>
        )}

        {isTrainer && (

          <section className="dashboard-section">

            <div className="section-heading">

              <div>

                <p>
                  مساحتك التدريبية
                </p>

                <h3>
                  دوراتي
                </h3>

              </div>

            </div>

            <div className="dashboard-panel">

              <div className="empty-state">

                <div className="empty-state-icon">
                  ▤
                </div>

                <h3>
                  لا توجد دورات مضافة بعد
                </h3>

                <p>
                  ستظهر هنا الدورات المسندة إليك.
                </p>

              </div>

            </div>

          </section>

        )}

        {isTrainee && (

          <section className="dashboard-section">

            <div className="section-heading">

              <div>

                <p>
                  رحلتك التدريبية
                </p>

                <h3>
                  الدورات المتاحة
                </h3>

              </div>

              <Link
                to="/programs"
                className="view-all-button"
              >
                استعراض الدورات
              </Link>

            </div>

            <div className="dashboard-panel">

              <div className="empty-state">

                <div className="empty-state-icon">
                  ▤
                </div>

                <h3>
                  استكشف الدورات التدريبية
                </h3>

                <p>
                  اختر برنامجًا مناسبًا وابدأ رحلتك التدريبية.
                </p>

                <Link
                  to="/programs"
                  className="empty-state-button"
                >
                  استعراض الدورات
                </Link>

              </div>

            </div>

          </section>

        )}

      </main>

    </div>
  )
}

export default Dashboard