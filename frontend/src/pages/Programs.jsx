import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './Programs.css'
import { getCourses } from '../services/api'


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
        setError(
          err.message || 'تعذر تحميل البرامج التدريبية',
        )
      } finally {
        setLoading(false)
      }
    }

    loadCourses()
  }, [])


  function formatDate(date) {
    return new Intl.DateTimeFormat('ar-SA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date))
  }


  return (
    <main
      className="programs-page"
      dir="rtl"
    >

      <header className="programs-header">

        <Link
          to="/"
          className="programs-brand"
        >
          <strong>
            أثر
          </strong>

          <span>
            من التعلم إلى التغيير.
          </span>
        </Link>


        <Link
          to="/"
          className="programs-home-link"
        >
          الرئيسية
        </Link>

      </header>


      <section className="programs-hero">

        <div>

          <span className="programs-eyebrow">
            البرامج التدريبية
          </span>

          <h1>
            برامج تنطلق من احتياج حقيقي
          </h1>

          <p>
            تضم هذه الصفحة البرامج التدريبية المتاحة لمنسوبي جامعة الملك سعود،
            مع عرض المعلومات الأساسية التي يحتاجها المشارك قبل الانتقال إلى التسجيل.
          </p>

        </div>

      </section>


      <section className="programs-content">

        <div className="programs-toolbar">

          <div>

            <h2>
              البرامج المتاحة
            </h2>

            <span>
              {loading
                ? 'جاري تحميل البرامج'
                : `${programs.length} برامج متاحة`}
            </span>

          </div>

        </div>


        {loading && (

          <div className="programs-state">

            <strong>
              جاري تحميل البرامج
            </strong>

            <span>
              يتم جلب البرامج المنشورة من نظام أثر.
            </span>

          </div>

        )}


        {!loading && error && (

          <div className="programs-state programs-state-error">

            <strong>
              تعذر تحميل البرامج
            </strong>

            <span>
              {error}
            </span>

          </div>

        )}


        {!loading && !error && programs.length === 0 && (

          <div className="programs-state">

            <strong>
              لا توجد برامج منشورة حاليًا
            </strong>

            <span>
              ستظهر البرامج هنا بعد اعتمادها ونشرها في النظام.
            </span>

          </div>

        )}


        {!loading && !error && programs.length > 0 && (

          <div className="programs-grid">

            {programs.map((program) => (

              <article
                key={program.id}
                className="program-card"
              >

                <div className="program-card-top">

                  <span className="program-category">
                    برنامج تدريبي
                  </span>

                  <span className="program-status">
                    متاح
                  </span>

                </div>


                <div className="program-card-content">

                  <h3>
                    {program.name}
                  </h3>


                  <p className="program-card-description">
                    {program.description}
                  </p>


                  <div className="program-details">

                    <span>
                      المدة

                      <strong>
                        {program.duration} ساعة
                      </strong>
                    </span>


                    <span>
                      المقاعد

                      <strong>
                        {program.seats} مقعد
                      </strong>
                    </span>


                    <span>
                      البداية

                      <strong>
                        {formatDate(program.start_date)}
                      </strong>
                    </span>

                  </div>

                </div>


                <Link
                  to={`/programs/${program.id}`}
                  className="program-card-button"
                >
                  عرض البرنامج
                </Link>

              </article>

            ))}

          </div>

        )}

      </section>

    </main>
  )
}


export default Programs