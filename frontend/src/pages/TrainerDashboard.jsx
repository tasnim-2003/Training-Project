import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getTrainerCourses, getStoredUser } from '../services/api'
import './TrainerDashboard.css'

function Icon({ name, size = 20 }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9" /><path d="M9 20v-6h6v6" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    chart: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-5 5" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    arrow: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h8" /></>,
    star: <><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z" /></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></>,
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.file}
    </svg>
  )
}

function getCourseName(course) {
  return course?.name || course?.title || course?.course_name || 'دورة تدريبية'
}

function getCourseId(course) {
  return course?.id ?? course?.course_id
}

function getCourseStatus(course) {
  return String(course?.status || 'draft').toLowerCase()
}

function getStatusLabel(status) {
  const labels = {
    published: 'منشورة',
    draft: 'مسودة',
    archived: 'مؤرشفة',
    active: 'جارية',
    upcoming: 'قادمة',
    completed: 'مكتملة',
  }

  return labels[status] || status || 'غير محددة'
}

function formatDate(dateValue) {
  if (!dateValue) return 'لم يحدد بعد'

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) return 'لم يحدد بعد'

  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function getTrainerName(user) {
  return (
    user?.name ||
    user?.full_name ||
    user?.username ||
    user?.email?.split('@')[0] ||
    'المدرب'
  )
}

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return 'م'
  if (parts.length === 1) return parts[0].slice(0, 1)

  return `${parts[0][0]}${parts[1][0]}`
}

function TrainerDashboard() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  const storedUser = useMemo(() => {
    try {
      return getStoredUser() || {}
    } catch {
      return {}
    }
  }, [])

  const trainerName = getTrainerName(storedUser)

  useEffect(() => {
    let cancelled = false

    async function loadCourses() {
      setLoading(true)
      setError('')

      try {
        const data = await getTrainerCourses()

        if (!cancelled) {
          setCourses(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'تعذر تحميل الدورات التدريبية.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCourses()

    return () => {
      cancelled = true
    }
  }, [])

  const publishedCourses = courses.filter(
    (course) => getCourseStatus(course) === 'published',
  )

  const draftCourses = courses.filter(
    (course) => getCourseStatus(course) === 'draft',
  )

  const archivedCourses = courses.filter(
    (course) => getCourseStatus(course) === 'archived',
  )

  const filteredCourses = courses.filter((course) => {
    if (filter === 'all') return true
    return getCourseStatus(course) === filter
  })

  const upcomingCourses = courses.filter((course) => {
    if (getCourseStatus(course) !== 'published' || !course.start_date) {
      return false
    }

    const startDate = new Date(course.start_date)
    return !Number.isNaN(startDate.getTime()) && startDate > new Date()
  })

  const navigationItems = [
    { label: 'الرئيسية', to: '/trainer', icon: 'home' },
    { label: 'دوراتي التدريبية', to: '/trainer/courses', icon: 'book' },
    { label: 'المشاركون', to: '/trainer/participants', icon: 'users' },
    { label: 'الجدول التدريبي', to: '/trainer/schedule', icon: 'calendar' },
    { label: 'التقييمات', to: '/trainer/evaluations', icon: 'chart' },
  ]

  return (
    <div className="trainer-app" dir="rtl">
      <aside className="trainer-nav">
        <Link to="/" className="trainer-brand">
          <span className="trainer-brand-mark">أ</span>
          <span className="trainer-brand-copy">
            <strong>أثر</strong>
            <small>من التعلّم إلى التغيير.</small>
          </span>
        </Link>

        <div className="trainer-nav-heading">مساحة المدرب</div>

        <nav className="trainer-nav-links" aria-label="التنقل الرئيسي">
          {navigationItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`trainer-nav-link ${
                item.to === '/trainer' ? 'active' : ''
              }`}
              aria-current={item.to === '/trainer' ? 'page' : undefined}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.to === '/trainer' && (
                <span className="trainer-nav-indicator" />
              )}
            </Link>
          ))}
        </nav>

        <div className="trainer-nav-bottom">
          <div className="trainer-help-card">
            <span className="trainer-help-icon">
              <Icon name="file" size={21} />
            </span>
            <strong>هل تحتاج إلى مساعدة؟</strong>
            <p>يمكنك الرجوع إلى تفاصيل دوراتك ومواعيدك من القائمة الرئيسية.</p>
          </div>

          <Link to="/" className="trainer-nav-home">
            <Icon name="arrow" size={18} />
            <span>العودة إلى الموقع</span>
          </Link>
        </div>
      </aside>

      <main className="trainer-content">
        <header className="trainer-topbar">
          <div className="trainer-breadcrumb">
            <span>أثر</span>
            <Icon name="arrow" size={14} />
            <strong>لوحة المدرب</strong>
          </div>

          <div className="trainer-topbar-user">
            <div className="trainer-topbar-user-copy">
              <strong>{trainerName}</strong>
              <span>المدرب</span>
            </div>
            <div className="trainer-avatar" aria-label={trainerName}>
              {getInitials(trainerName)}
            </div>
          </div>
        </header>

        <div className="trainer-page-inner">
          <section className="trainer-welcome">
            <div className="trainer-welcome-content">
              <span className="trainer-eyebrow">
                <span className="trainer-eyebrow-dot" />
                مساحة التطوير والتدريب
              </span>

              <h1>
                أهلًا بك، {trainerName}
                <span className="trainer-welcome-period">.</span>
              </h1>

              <p>
                من هنا يمكنك متابعة دوراتك التدريبية، وتنظيم محتواها،
                والاطلاع على مواعيدها وتقييماتها.
              </p>

              <div className="trainer-welcome-actions">
                <Link to="/trainer/courses" className="trainer-primary-button">
                  استعراض دوراتي
                  <Icon name="arrow" size={17} />
                </Link>

                <Link to="/trainer/schedule" className="trainer-secondary-button">
                  <Icon name="calendar" size={17} />
                  الجدول التدريبي
                </Link>
              </div>
            </div>

            <div className="trainer-welcome-art" aria-hidden="true">
              <div className="trainer-art-orbit trainer-art-orbit-one" />
              <div className="trainer-art-orbit trainer-art-orbit-two" />
              <div className="trainer-art-card">
                <span className="trainer-art-card-icon">
                  <Icon name="book" size={29} />
                </span>
                <span className="trainer-art-card-line long" />
                <span className="trainer-art-card-line short" />
                <span className="trainer-art-card-footer">
                  <Icon name="star" size={15} />
                  أثر يصنع فرقًا
                </span>
              </div>
              <span className="trainer-art-dot trainer-art-dot-one" />
              <span className="trainer-art-dot trainer-art-dot-two" />
            </div>
          </section>

          <section className="trainer-section">
            <div className="trainer-section-heading">
              <div>
                <span className="trainer-section-kicker">نظرة عامة</span>
                <h2>ملخص دوراتك</h2>
                <p>متابعة سريعة لحالة الدورات المسندة إليك.</p>
              </div>
              <Link to="/trainer/courses" className="trainer-text-link">
                جميع الدورات
                <Icon name="arrow" size={16} />
              </Link>
            </div>

            <div className="trainer-stats-grid">
              <article className="trainer-stat-card">
                <div className="trainer-stat-top">
                  <span className="trainer-stat-icon blue">
                    <Icon name="book" size={22} />
                  </span>
                  <span className="trainer-stat-caption">إجمالي الدورات</span>
                </div>
                <div className="trainer-stat-value">
                  {loading ? '—' : courses.length}
                </div>
                <div className="trainer-stat-foot">
                  جميع الدورات المسندة إليك
                </div>
              </article>

              <article className="trainer-stat-card">
                <div className="trainer-stat-top">
                  <span className="trainer-stat-icon green">
                    <Icon name="file" size={22} />
                  </span>
                  <span className="trainer-stat-caption">الدورات المنشورة</span>
                </div>
                <div className="trainer-stat-value">
                  {loading ? '—' : publishedCourses.length}
                </div>
                <div className="trainer-stat-foot">
                  الدورات المتاحة للتدريب
                </div>
              </article>

              <article className="trainer-stat-card">
                <div className="trainer-stat-top">
                  <span className="trainer-stat-icon amber">
                    <Icon name="clock" size={22} />
                  </span>
                  <span className="trainer-stat-caption">الدورات القادمة</span>
                </div>
                <div className="trainer-stat-value">
                  {loading ? '—' : upcomingCourses.length}
                </div>
                <div className="trainer-stat-foot">
                  وفق تاريخ بداية الدورة
                </div>
              </article>

              <article className="trainer-stat-card">
                <div className="trainer-stat-top">
                  <span className="trainer-stat-icon violet">
                    <Icon name="file" size={22} />
                  </span>
                  <span className="trainer-stat-caption">المسودات</span>
                </div>
                <div className="trainer-stat-value">
                  {loading ? '—' : draftCourses.length}
                </div>
                <div className="trainer-stat-foot">
                  دورات محفوظة غير منشورة
                </div>
              </article>
            </div>
          </section>

          <section className="trainer-lower-grid">
            <div className="trainer-panel trainer-courses-panel">
              <div className="trainer-panel-heading">
                <div>
                  <span className="trainer-section-kicker">إدارة المحتوى</span>
                  <h2>دوراتي التدريبية</h2>
                </div>

                <Link to="/trainer/courses" className="trainer-panel-link">
                  عرض الكل
                  <Icon name="arrow" size={15} />
                </Link>
              </div>

              <div className="trainer-course-filters" aria-label="تصفية الدورات">
                {[
                  { value: 'all', label: 'الكل' },
                  { value: 'published', label: 'منشورة' },
                  { value: 'draft', label: 'مسودات' },
                  { value: 'archived', label: 'مؤرشفة' },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    className={`trainer-filter-button ${
                      filter === item.value ? 'active' : ''
                    }`}
                    onClick={() => setFilter(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="trainer-message error" role="alert">
                  <Icon name="bell" size={18} />
                  <div>
                    <strong>تعذر تحميل الدورات</strong>
                    <p>{error}</p>
                    <button
                      type="button"
                      className="trainer-retry-button"
                      onClick={() => window.location.reload()}
                    >
                      إعادة المحاولة
                    </button>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="trainer-state">
                  <span className="trainer-loader" />
                  <p>جارٍ تحميل دوراتك التدريبية...</p>
                </div>
              ) : !error && filteredCourses.length === 0 ? (
                <div className="trainer-state">
                  <span className="trainer-empty-icon">
                    <Icon name="book" size={26} />
                  </span>
                  <strong>
                    {filter === 'all'
                      ? 'لا توجد دورات لعرضها حاليًا'
                      : 'لا توجد دورات ضمن هذه الحالة'}
                  </strong>
                  <p>
                    ستظهر هنا تفاصيل الدورات المسندة إليك عند توفرها.
                  </p>
                  <Link to="/trainer/courses" className="trainer-state-link">
                    الانتقال إلى دوراتي
                    <Icon name="arrow" size={16} />
                  </Link>
                </div>
              ) : !error ? (
                <div className="trainer-course-list">
                  {filteredCourses.slice(0, 5).map((course, index) => {
                    const id = getCourseId(course)
                    const status = getCourseStatus(course)
                    const duration =
                      course.duration_hours ??
                      course.duration ??
                      course.duration_days

                    return (
                      <article className="trainer-course-row" key={id ?? index}>
                        <div className="trainer-course-icon">
                          <Icon name="book" size={21} />
                        </div>

                        <div className="trainer-course-info">
                          <Link
                            to={
                              id != null
                                ? `/trainer/courses/${id}`
                                : '/trainer/courses'
                            }
                            className="trainer-course-name"
                          >
                            {getCourseName(course)}
                          </Link>

                          <div className="trainer-course-meta">
                            <span>
                              <Icon name="calendar" size={14} />
                              {formatDate(course.start_date)}
                            </span>
                            {duration != null && duration !== '' && (
                              <span>
                                <Icon name="clock" size={14} />
                                {duration} {course.duration_days ? 'يوم' : 'ساعة'}
                              </span>
                            )}
                          </div>
                        </div>

                        <span
                          className={`trainer-status status-${status.replace(
                            /[^a-z0-9_-]/g,
                            '',
                          )}`}
                        >
                          <span />
                          {getStatusLabel(status)}
                        </span>

                        <Link
                          to={
                            id != null
                              ? `/trainer/courses/${id}`
                              : '/trainer/courses'
                          }
                          className="trainer-course-open"
                          aria-label={`عرض ${getCourseName(course)}`}
                        >
                          <Icon name="arrow" size={17} />
                        </Link>
                      </article>
                    )
                  })}
                </div>
              ) : null}

              {!loading && !error && filteredCourses.length > 5 && (
                <Link to="/trainer/courses" className="trainer-view-all">
                  عرض بقية الدورات ({filteredCourses.length - 5})
                  <Icon name="arrow" size={16} />
                </Link>
              )}

              {!loading && !error && archivedCourses.length > 0 && (
                <p className="trainer-archived-note">
                  لديك {archivedCourses.length} دورة مؤرشفة.
                </p>
              )}
            </div>

            <div className="trainer-side-panels">
              <section className="trainer-panel trainer-quick-panel">
                <div className="trainer-panel-heading">
                  <div>
                    <span className="trainer-section-kicker">وصول سريع</span>
                    <h2>اختصارات المدرب</h2>
                  </div>
                </div>

                <div className="trainer-quick-links">
                  <Link to="/trainer/courses" className="trainer-quick-link">
                    <span className="trainer-quick-icon blue">
                      <Icon name="book" size={20} />
                    </span>
                    <span className="trainer-quick-copy">
                      <strong>إدارة الدورات</strong>
                      <small>استعراض المحتوى وتفاصيل الدورات</small>
                    </span>
                    <Icon name="arrow" size={17} />
                  </Link>

                  <Link to="/trainer/participants" className="trainer-quick-link">
                    <span className="trainer-quick-icon green">
                      <Icon name="users" size={20} />
                    </span>
                    <span className="trainer-quick-copy">
                      <strong>المشاركون</strong>
                      <small>متابعة المشاركين في دوراتك</small>
                    </span>
                    <Icon name="arrow" size={17} />
                  </Link>

                  <Link to="/trainer/schedule" className="trainer-quick-link">
                    <span className="trainer-quick-icon amber">
                      <Icon name="calendar" size={20} />
                    </span>
                    <span className="trainer-quick-copy">
                      <strong>الجدول التدريبي</strong>
                      <small>الاطلاع على مواعيد الدورات</small>
                    </span>
                    <Icon name="arrow" size={17} />
                  </Link>

                  <Link to="/trainer/evaluations" className="trainer-quick-link">
                    <span className="trainer-quick-icon violet">
                      <Icon name="chart" size={20} />
                    </span>
                    <span className="trainer-quick-copy">
                      <strong>التقييمات</strong>
                      <small>الاطلاع على تقييمات الدورات</small>
                    </span>
                    <Icon name="arrow" size={17} />
                  </Link>
                </div>
              </section>

              <section className="trainer-impact-card">
                <div className="trainer-impact-icon">
                  <Icon name="star" size={23} />
                </div>
                <span className="trainer-impact-kicker">رسالة أثر</span>
                <h3>كل تجربة تعلّم تصنع فرقًا</h3>
                <p>
                  ساهم في تطوير المهارات، وامنح كل متدرب فرصة لتطبيق ما تعلّمه.
                </p>
                <span className="trainer-impact-decoration">أثر</span>
              </section>
            </div>
          </section>

          <footer className="trainer-footer">
            <span>أثر — من التعلّم إلى التغيير.</span>
            <span>منصة التدريب والتطوير · جامعة الملك سعود</span>
          </footer>
        </div>
      </main>
    </div>
  )
}

export default TrainerDashboard