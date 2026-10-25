
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCourses } from '../services/api'
import ksuLogo from '../assets/ksu-logo.png'
import './Home.css'

const API_BASE_URL = 'http://127.0.0.1:8000'

function formatDate(date) {
  if (!date) return 'يُحدد لاحقًا'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'يُحدد لاحقًا'
  }

  return new Intl.DateTimeFormat('ar-SA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsedDate)
}

function getCourseCover(course) {
  const cover =
    course.cover_image ||
    course.image_url ||
    course.image ||
    course.thumbnail_url

  if (!cover || typeof cover !== 'string') return ''

  if (/^https?:\/\//i.test(cover)) return cover

  return `${API_BASE_URL}${cover.startsWith('/') ? '' : '/'}${cover}`
}

function CourseCard({ course }) {
  const coverImage = getCourseCover(course)
  const [imageError, setImageError] = useState(false)

  return (
    <article className="home-course-card">
      <Link
        to={`/programs/${course.id}`}
        className="home-course-cover"
        aria-label={`عرض تفاصيل برنامج ${course.name}`}
      >
        {coverImage && !imageError ? (
          <img
            src={coverImage}
            alt={`غلاف ${course.name}`}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="home-course-cover-placeholder">
            <span className="home-course-cover-mark">أثر</span>
            <span>من التعلّم إلى التغيير</span>
          </div>
        )}
      </Link>

      <div className="home-course-card-content">
        <div className="home-course-card-top">
          <span className="home-course-tag">برنامج تدريبي</span>

          <span className="home-course-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M4 7.5L12 3L20 7.5L12 12L4 7.5Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M7 9.3V14.5C7 15.8 9.2 17 12 17C14.8 17 17 15.8 17 14.5V9.3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M20 8V14"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </div>

        <h3>{course.name}</h3>

        <p className="home-course-trainer">
          <span>المدرب:</span>{' '}
          {course.trainer_name || 'لم يُعيّن مدرب لهذه الدورة بعد'}
        </p>

        <p className="home-course-description">
          {course.description || 'برنامج تدريبي لتطوير المهارات والمعارف.'}
        </p>

        <div className="home-course-meta">
          <span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle
                cx="12"
                cy="12"
                r="8.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M12 7V12L15.5 14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {course.duration
              ? `${course.duration} ساعة تدريبية`
              : 'المدة حسب البرنامج'}
          </span>

          <span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect
                x="3.5"
                y="5"
                width="17"
                height="15.5"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M7.5 3.5V7M16.5 3.5V7M3.5 9.5H20.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            {formatDate(course.start_date)}
          </span>
        </div>

        <Link
          to={`/programs/${course.id}`}
          className="home-course-link"
          aria-label={`عرض تفاصيل برنامج ${course.name}`}
        >
          عرض تفاصيل البرنامج
          <span aria-hidden="true">←</span>
        </Link>
      </div>
    </article>
  )
}

function Home() {
  const [courses, setCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [coursesError, setCoursesError] = useState(false)

  useEffect(() => {
    let isMounted = true

    async function loadCourses() {
      try {
        setLoadingCourses(true)
        setCoursesError(false)

        const result = await getCourses()

        if (!isMounted) return

        const publishedCourses = Array.isArray(result)
          ? result.filter((course) => course.status === 'published')
          : []

        setCourses(publishedCourses.slice(0, 3))
      } catch (error) {
        console.error('تعذر تحميل البرامج التدريبية:', error)

        if (isMounted) {
          setCoursesError(true)
          setCourses([])
        }
      } finally {
        if (isMounted) {
          setLoadingCourses(false)
        }
      }
    }

    loadCourses()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <main className="home-page" dir="rtl">
      <header className="home-header">
        <div className="home-header-inner">
          <Link to="/" className="home-brand" aria-label="أثر - الرئيسية">
            <span className="home-brand-mark">
              <img src={ksuLogo} alt="" className="home-brand-logo" />
            </span>

            <span className="home-brand-name">أثر</span>
          </Link>

          <nav className="home-nav" aria-label="القائمة الرئيسية">
            <Link to="/" className="home-nav-link active">
              الرئيسية
            </Link>

            <Link to="/programs" className="home-nav-link">
              البرامج التدريبية
            </Link>

            <Link to="/trainer-application" className="home-nav-link">
              كن مدربًا
            </Link>

            <Link to="/about" className="home-nav-link">
              عن أثر
            </Link>
          </nav>

          <Link to="/login" className="home-login-button">
            تسجيل الدخول
          </Link>

          <button
            className="home-mobile-menu"
            type="button"
            aria-label="عرض البرامج التدريبية"
            onClick={() => {
              window.location.href = '/programs'
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 7H20M4 12H20M4 17H20"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="home-institution-bar">
          <div className="home-institution-copy">
            <strong>عمادة التعاملات الإلكترونية والاتصالات</strong>
            <span>جامعة الملك سعود</span>
          </div>
        </div>
      </header>

      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <p className="home-hero-eyebrow">
              مرحباً بك في عالم المعرفة
            </p>

            <h1>
              تعلم مهارات جديدة
              <br />
              <span>واصنع أثرًا حقيقيًا</span>
            </h1>

            <p className="home-hero-description">
              تجربة تدريبية متكاملة لمنسوبي جامعة الملك سعود،
              تبدأ بالتعلّم وتمتد إلى التطبيق وقياس الأثر في الواقع.
            </p>

            <div className="home-hero-actions">
              <Link to="/programs" className="home-primary-button">
                استكشف البرامج التدريبية
                <span aria-hidden="true">←</span>
              </Link>

              <Link to="/about" className="home-secondary-button">
                تعرّف على المنصة
              </Link>
            </div>

            <div className="home-hero-note">
              <span className="home-note-line" />
              <span>التطوير المستمر يبدأ بخطوة</span>
            </div>
          </div>

          <div className="home-hero-visual" aria-hidden="true">
            <div className="home-visual-glow" />
            <div className="home-visual-orbit home-orbit-outer" />
            <div className="home-visual-orbit home-orbit-inner" />

            <div className="home-visual-card home-visual-card-top">
              <span className="home-visual-card-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 7.5L12 3L20 7.5L12 12L4 7.5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 9.5V14.5C7 15.8 9.2 17 12 17C14.8 17 17 15.8 17 14.5V9.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <span>
                <strong>تعلم</strong>
                <small>اكتساب المعرفة</small>
              </span>
            </div>

            <div className="home-visual-card home-visual-card-bottom">
              <span className="home-visual-card-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 18.5V12.5M10 18.5V8.5M15 18.5V5.5M20 18.5V10"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>

              <span>
                <strong>اصنع أثراً</strong>
                <small>متابعة النتائج</small>
              </span>
            </div>

            <div className="home-visual-card home-visual-card-apply">
              <span className="home-visual-card-icon">
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12.5L9.5 17L19 7"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <span>
                <strong>طبّق</strong>
                <small>ممارسة المهارات</small>
              </span>
            </div>

            <div className="home-visual-center">
              <div className="home-visual-center-ring">
                <span className="home-visual-center-mark">أثر</span>
              </div>

              <strong>من التعلّم إلى التغيير</strong>
            </div>

            <span className="home-visual-point home-point-one" />
            <span className="home-visual-point home-point-two" />
            <span className="home-visual-point home-point-three" />
          </div>
        </div>

        <div className="home-hero-bottom-line" />
      </section>

      <section className="home-courses-section" id="programs">
        <div className="home-section-container">
          <div className="home-section-heading">
            <div>
              <span className="home-section-eyebrow">فرص التطوير</span>
              <h2>البرامج التدريبية</h2>
              <p>
                اكتشف البرامج المتاحة وابدأ رحلتك نحو تطوير مهاراتك.
              </p>
            </div>

            <Link to="/programs" className="home-view-all">
              جميع البرامج
              <span aria-hidden="true">←</span>
            </Link>
          </div>

          {loadingCourses ? (
            <div className="home-courses-message" role="status">
              <span className="home-loading-spinner" />
              <p>جارٍ تحميل البرامج التدريبية...</p>
            </div>
          ) : coursesError ? (
            <div
              className="home-courses-message home-courses-error"
              role="alert"
            >
              <h3>تعذر تحميل البرامج حاليًا</h3>
              <p>يرجى المحاولة مرة أخرى بعد قليل.</p>
              <Link to="/programs" className="home-message-link">
                الانتقال إلى البرامج التدريبية
              </Link>
            </div>
          ) : courses.length === 0 ? (
            <div className="home-courses-message">
              <h3>لا توجد برامج منشورة حاليًا</h3>
              <p>ستظهر البرامج التدريبية هنا عند نشرها على المنصة.</p>
            </div>
          ) : (
            <div className="home-courses-grid">
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="home-journey-section">
        <div className="home-section-container">
          <div className="home-journey-heading">
            <span className="home-section-eyebrow">رحلة التطوير</span>
            <h2>تدريب يتجاوز حدود المعرفة</h2>
            <p>
              لأن قيمة التدريب لا تقف عند اكتساب المعلومة،
              بل تظهر في القدرة على تطبيقها وقياس نتائجها.
            </p>
          </div>

          <div className="home-journey-grid">
            <article className="home-journey-card">
              <span className="home-journey-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 7.5L12 3L20 7.5L12 12L4 7.5Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 9.5V14.5C7 15.8 9.2 17 12 17C14.8 17 17 15.8 17 14.5V9.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <h3>تعلّم</h3>
              <p>
                اكتساب معارف ومهارات جديدة من خلال البرامج التدريبية.
              </p>
            </article>

            <article className="home-journey-card">
              <span className="home-journey-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 12.5L9.5 17L19 7.5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M20 12A8 8 0 1 1 12 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <h3>طبّق</h3>
              <p>
                تحويل ما تعلّمته إلى ممارسة عملية في بيئة العمل.
              </p>
            </article>

            <article className="home-journey-card">
              <span className="home-journey-icon">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M4 19V12M10 19V6M16 19V9M22 19V3"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <h3>اصنع أثراً حقيقياً</h3>
              <p>
                متابعة نتائج التطبيق والتعرّف على أثر التدريب وتطوره.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="home-impact-section">
        <div className="home-impact-inner">
          <div className="home-impact-copy">
            <span className="home-section-eyebrow">أثر مستدام</span>
            <h2>استثمر في نفسك، وتعلّم من أي مكان وفي أي وقت</h2>
            <p>
              تربط منصة أثر بين التجربة التدريبية وتطبيق المعرفة،
              وتتيح متابعة النتائج لفهم القيمة التي يضيفها التدريب
              إلى التطوير المهني.
            </p>
            <Link to="/about" className="home-impact-link">
              اكتشف أثر المنصة
              <span aria-hidden="true">←</span>
            </Link>
          </div>

          <div className="home-impact-visual" aria-hidden="true">
            <div className="home-impact-circle home-impact-circle-outer" />
            <div className="home-impact-circle home-impact-circle-middle" />

            <div className="home-impact-circle home-impact-circle-inner">
              <svg viewBox="0 0 64 64" fill="none">
                <path
                  d="M12 45L25 32L35 39L52 19"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M40 19H52V31"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-footer-content">
          <img src={ksuLogo} alt="شعار جامعة الملك سعود" />

          <div className="home-footer-institution">
            <strong>عمادة التعاملات الإلكترونية والاتصالات</strong>
            <span>جامعة الملك سعود</span>
          </div>
        </div>

        <div className="home-footer-bottom">
          © 2026 جامعة الملك سعود
        </div>
      </footer>
    </main>
  )
}

export default Home
