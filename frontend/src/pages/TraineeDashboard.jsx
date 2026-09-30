import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './TraineeDashboard.css'
import {
  getMyEnrollments,
  getCourses,
  getStoredUser,
} from '../services/api'


function TraineeDashboard() {
  const user = getStoredUser()

  const [enrollments, setEnrollments] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')


  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        setError('')

        const [myEnrollments, availableCourses] =
          await Promise.all([
            getMyEnrollments(),
            getCourses(),
          ])

        setEnrollments(myEnrollments)
        setCourses(availableCourses)
      } catch (err) {
        setError(
          err.message || 'تعذر تحميل بيانات مساحة المتدرب',
        )
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])


  const approvedCount = enrollments.filter(
    (item) => item.status === 'approved',
  ).length


  const pendingCount = enrollments.filter(
    (item) => item.status === 'pending',
  ).length


  const completedCount = enrollments.filter(
    (item) => item.status === 'approved',
  ).length


  const availableCount = courses.length


  function getStatusLabel(status) {
    if (status === 'approved') {
      return 'مقبول'
    }

    if (status === 'rejected') {
      return 'مرفوض'
    }

    return 'قيد المراجعة'
  }


  function getStatusClass(status) {
    if (status === 'approved') {
      return 'status-approved'
    }

    if (status === 'rejected') {
      return 'status-rejected'
    }

    return 'status-pending'
  }


  return (
    <main
      className="trainee-dashboard"
      dir="rtl"
    >

      <header className="trainee-header">

        <Link
          to="/"
          className="trainee-brand"
        >
          <strong>
            أثر
          </strong>

          <span>
            من التعلم إلى التغيير.
          </span>
        </Link>


        <nav className="trainee-nav">

          <Link to="/trainee" className="active">
            الرئيسية
          </Link>

          <Link to="/programs">
            البرامج التدريبية
          </Link>

          <Link to="/paths">
            المسارات
          </Link>

          <Link to="/about">
            عن أثر
          </Link>

        </nav>


        <div className="trainee-header-user">

          <div className="trainee-user-avatar">
            {(user?.name || 'م').charAt(0)}
          </div>

          <div className="trainee-user-info">

            <strong>
              {user?.name || 'المتدرب'}
            </strong>

            <span>
              متدرب
            </span>

          </div>

        </div>

      </header>


      <section className="trainee-main">

        <aside className="trainee-sidebar">

          <div className="trainee-sidebar-profile">

            <div className="trainee-large-avatar">
              {(user?.name || 'م').charAt(0)}
            </div>

            <strong>
              {user?.name || 'المتدرب'}
            </strong>

            <span>
              {user?.email || 'حساب المتدرب'}
            </span>

          </div>


          <nav className="trainee-sidebar-nav">

            <span className="trainee-sidebar-label">
              مساحتي
            </span>

            <Link
              to="/trainee"
              className="sidebar-link active"
            >
              <span className="sidebar-icon">⌂</span>
              الرئيسية
            </Link>

            <Link
              to="/programs"
              className="sidebar-link"
            >
              <span className="sidebar-icon">▣</span>
              البرامج التدريبية
            </Link>

            <a
              href="#my-programs"
              className="sidebar-link"
            >
              <span className="sidebar-icon">◫</span>
              برامجي
            </a>

            <a
              href="#actions"
              className="sidebar-link"
            >
              <span className="sidebar-icon">✓</span>
              الإجراءات المطلوبة
            </a>

            <span className="trainee-sidebar-label second">
              حسابي
            </span>

            <a
              href="#certificates"
              className="sidebar-link"
            >
              <span className="sidebar-icon">◇</span>
              الشهادات
            </a>

            <a
              href="#profile"
              className="sidebar-link"
            >
              <span className="sidebar-icon">○</span>
              الملف الشخصي
            </a>

          </nav>


          <div className="trainee-sidebar-bottom">

            <span>
              أثر
            </span>

            <p>
              تعلّم، طبّق، واترك أثرًا.
            </p>

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
                <strong>
                  {user?.name || 'في أثر'}
                </strong>
              </h1>

              <p>
                تابع برامجك التدريبية، راقب تقدمك،
                واستكمل خطوات رحلتك التعليمية من مكان واحد.
              </p>


              <div className="trainee-welcome-actions">

                <Link
                  to="/programs"
                  className="trainee-primary-button"
                >
                  استعراض البرامج
                  <span>←</span>
                </Link>

                <a
                  href="#my-programs"
                  className="trainee-secondary-button"
                >
                  متابعة برامجي
                </a>

              </div>

            </div>


            <div className="trainee-welcome-mark">

              <span className="mark-small">
                مسارك
              </span>

              <strong>
                أثر
              </strong>

              <span>
                من التعلم إلى التغيير.
              </span>

            </div>

          </section>


          {error && (

            <div className="trainee-error">
              <strong>
                تعذر تحميل البيانات
              </strong>

              <span>
                {error}
              </span>
            </div>

          )}


          <section className="trainee-stats">

            <article className="trainee-stat-card">

              <div className="stat-icon blue">
                ◫
              </div>

              <div>
                <span>
                  برامجي
                </span>

                <strong>
                  {loading ? '—' : approvedCount}
                </strong>

                <small>
                  برامج مقبولة
                </small>
              </div>

            </article>


            <article className="trainee-stat-card">

              <div className="stat-icon amber">
                ◷
              </div>

              <div>
                <span>
                  طلبات قيد المراجعة
                </span>

                <strong>
                  {loading ? '—' : pendingCount}
                </strong>

                <small>
                  بانتظار المعالجة
                </small>
              </div>

            </article>


            <article className="trainee-stat-card">

              <div className="stat-icon green">
                ✓
              </div>

              <div>
                <span>
                  مكتملة
                </span>

                <strong>
                  {loading ? '—' : completedCount}
                </strong>

                <small>
                  برامج مسجلة
                </small>
              </div>

            </article>


            <article className="trainee-stat-card">

              <div className="stat-icon dark">
                +
              </div>

              <div>
                <span>
                  المتاحة الآن
                </span>

                <strong>
                  {loading ? '—' : availableCount}
                </strong>

                <small>
                  برامج منشورة
                </small>
              </div>

            </article>

          </section>


          <section
            className="trainee-section"
            id="my-programs"
          >

            <div className="trainee-section-heading">

              <div>

                <span>
                  رحلتي التدريبية
                </span>

                <h2>
                  برامجي
                </h2>

              </div>

              <Link to="/programs">
                استعراض الكل
                <span>←</span>
              </Link>

            </div>


            {!loading && enrollments.length === 0 && (

              <div className="trainee-empty">

                <div className="empty-symbol">
                  +
                </div>

                <div>

                  <strong>
                    لم تبدأ رحلتك التدريبية بعد
                  </strong>

                  <p>
                    استعرض البرامج المتاحة واختر ما يناسب احتياجك
                    التدريبي.
                  </p>

                </div>

                <Link to="/programs">
                  استعراض البرامج
                </Link>

              </div>

            )}


            {!loading && enrollments.length > 0 && (

              <div className="trainee-program-list">

                {enrollments.slice(0, 4).map((enrollment) => (

                  <article
                    key={enrollment.id}
                    className="trainee-program-row"
                  >

                    <div className="program-row-number">
                      {String(enrollment.course_id).padStart(2, '0')}
                    </div>

                    <div className="program-row-main">

                      <span>
                        برنامج تدريبي
                      </span>

                      <strong>
                        البرنامج التدريبي رقم {enrollment.course_id}
                      </strong>

                      <small>
                        تم إرسال الطلب بتاريخ{' '}
                        {new Date(
                          enrollment.registered_at,
                        ).toLocaleDateString('ar-SA')}
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

          </section>


          <section
            className="trainee-lower-grid"
            id="actions"
          >

            <div className="trainee-section trainee-actions-section">

              <div className="trainee-section-heading compact">

                <div>

                  <span>
                    الخطوة التالية
                  </span>

                  <h2>
                    الإجراءات المطلوبة
                  </h2>

                </div>

              </div>


              <div className="trainee-action-card">

                <div className="action-number">
                  01
                </div>

                <div className="action-content">

                  <strong>
                    استكمل رحلتك التدريبية
                  </strong>

                  <p>
                    بعد قبول التسجيل، ستظهر هنا الإجراءات
                    والمهام المطلوبة منك لإكمال البرنامج.
                  </p>

                </div>

                <span className="action-arrow">
                  ←
                </span>

              </div>


              <div className="trainee-action-card muted">

                <div className="action-number">
                  02
                </div>

                <div className="action-content">

                  <strong>
                    التقييم وقياس الأثر
                  </strong>

                  <p>
                    ستظهر التقييمات وقياس الأثر عند توفرها
                    ضمن رحلتك التدريبية.
                  </p>

                </div>

                <span className="action-arrow">
                  ←
                </span>

              </div>

            </div>


            <aside
              className="trainee-quick-card"
              id="certificates"
            >

              <span className="quick-label">
                وصول سريع
              </span>

              <h3>
                كل ما تحتاجه
                <br />
                في مكان واحد.
              </h3>

              <p>
                من البرامج إلى الشهادات، تتابع أثر رحلتك
                التدريبية خطوة بخطوة.
              </p>


              <div className="quick-links">

                <Link to="/programs">
                  <span>
                    البرامج التدريبية
                  </span>

                  <b>
                    ←
                  </b>
                </Link>

                <a href="#certificates">
                  <span>
                    الشهادات
                  </span>

                  <b>
                    ←
                  </b>
                </a>

                <a href="#profile">
                  <span>
                    بيانات الحساب
                  </span>

                  <b>
                    ←
                  </b>
                </a>

              </div>

            </aside>

          </section>


          <section className="trainee-impact-banner">

            <div>

              <span>
                أثر رحلتك
              </span>

              <h2>
                التعلم لا ينتهي
                <strong>
                  عند نهاية الدورة.
                </strong>
              </h2>

            </div>

            <p>
              في أثر، تمتد الرحلة من التسجيل والتعلم
              إلى التطبيق والتقييم وقياس الأثر.
            </p>

          </section>


          <footer className="trainee-footer">

            <div className="trainee-footer-brand">

              <strong>
                أثر
              </strong>

              <span>
                من التعلم إلى التغيير.
              </span>

            </div>

            <div className="trainee-footer-links">

              <Link to="/programs">
                البرامج التدريبية
              </Link>

              <Link to="/paths">
                المسارات
              </Link>

              <Link to="/about">
                عن أثر
              </Link>

              <Link to="/verify-certificate">
                التحقق من الشهادات
              </Link>

              <Link to="/faq">
                الأسئلة الشائعة
              </Link>

            </div>

          </footer>

        </div>

      </section>

    </main>
  )
}


export default TraineeDashboard