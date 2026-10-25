import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Programs.css'
import { getCourses } from '../services/api'

const API_BASE_URL = 'http://127.0.0.1:8000'

function getCoverImage(program) {
  const image =
    program.cover_image ||
    program.image_url ||
    program.image ||
    program.thumbnail_url

  if (!image) return ''

  if (image.startsWith('http://') || image.startsWith('https://')) {
    return image
  }

  return `${API_BASE_URL}${image.startsWith('/') ? '' : '/'}${image}`
}

function Programs() {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true)
        setError('')

        const data = await getCourses()
        setPrograms(data)
      } catch (err) {
        setError(err.message || 'تعذر تحميل البرامج التدريبية')
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [])

  return (
    <main className="programs-page" dir="rtl">
      <header className="programs-header">
        <Link to="/" className="programs-brand">
          <strong>أثر</strong>
          <span>من التعلم إلى التغيير.</span>
        </Link>

        <nav className="programs-header-actions">
          <Link to="/" className="programs-home-link">
            الرئيسية
          </Link>

          <Link to="/login" className="programs-login-link">
            تسجيل الدخول
          </Link>
        </nav>
      </header>

      <section className="programs-hero">
        <div>
          <span className="programs-eyebrow">البرامج التدريبية</span>

          <h1>برامج تنطلق من احتياج حقيقي</h1>

          <p>
            تضم هذه الصفحة البرامج التدريبية المتاحة لمنسوبي جامعة الملك سعود،
            مع عرض المعلومات الأساسية التي يحتاجها المشارك قبل الانتقال إلى التسجيل.
          </p>
        </div>
      </section>

      <section className="programs-content">
        <div className="programs-toolbar">
          <div>
            <h2>البرامج المتاحة</h2>

            <span>
              {loading
                ? 'جاري تحميل البرامج'
                : `${programs.length} برامج متاحة`}
            </span>
          </div>
        </div>

        {loading && (
          <div className="programs-state">
            <strong>جاري تحميل البرامج</strong>
            <span>يتم جلب البرامج المنشورة من نظام أثر.</span>
          </div>
        )}

        {!loading && error && (
          <div className="programs-state programs-state-error">
            <strong>تعذر تحميل البرامج</strong>
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && programs.length === 0 && (
          <div className="programs-state">
            <strong>لا توجد برامج منشورة حاليًا</strong>
            <span>ستظهر البرامج هنا بعد اعتمادها ونشرها في النظام.</span>
          </div>
        )}

        {!loading && !error && programs.length > 0 && (
          <div className="programs-grid">
            {programs.map((program) => {
              const coverImage = getCoverImage(program)

              return (
                <article key={program.id} className="program-card">
                  <div className="program-card-image">
                    {coverImage ? (
                      <img
                        src={coverImage}
                        alt={`غلاف دورة ${program.name}`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="program-card-image-placeholder">
                        <span className="program-category">
                          برنامج تدريبي
                        </span>
                        <strong>أثر</strong>
                        <span>من التعلم إلى التغيير.</span>
                      </div>
                    )}
                  </div>

                  <div className="program-card-content">
                    <h3>{program.name}</h3>

                    <p className="program-card-description">
                      {program.description}
                    </p>
                  </div>

                  <Link
                    to={`/programs/${program.id}`}
                    className="program-card-button"
                  >
                    عرض البرنامج
                  </Link>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

export default Programs