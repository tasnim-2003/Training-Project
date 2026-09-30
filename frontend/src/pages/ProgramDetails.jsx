import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import './ProgramDetails.css'
import {
  getCourseById,
  createEnrollment,
  getStoredUser,
} from '../services/api'


function ProgramDetails() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [registering, setRegistering] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registrationError, setRegistrationError] = useState('')


  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true)
        setError('')

        const data = await getCourseById(id)

        setProgram(data)
      } catch (err) {
        setError(
          err.message || 'تعذر تحميل بيانات البرنامج',
        )
      } finally {
        setLoading(false)
      }
    }

    loadCourse()
  }, [id])


  function formatDate(date) {
    return new Intl.DateTimeFormat('ar-SA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date))
  }


  async function handleRegistration() {
    const user = getStoredUser()

    if (!user) {
      navigate('/login')
      return
    }

    if (user.role !== 'trainee') {
      setRegistrationError(
        'التسجيل في البرامج متاح لحسابات المتدربين فقط.',
      )
      return
    }

    try {
      setRegistering(true)
      setRegistrationError('')
      setRegistrationSuccess(false)

      await createEnrollment(program.id)

      setRegistrationSuccess(true)
    } catch (err) {
      setRegistrationError(
        err.message || 'حدث خطأ أثناء إرسال طلب التسجيل',
      )
    } finally {
      setRegistering(false)
    }
  }


  if (loading) {
    return (
      <main
        className="program-details-page"
        dir="rtl"
      >
        <Header />

        <section className="program-page-state">
          <strong>
            جاري تحميل البرنامج
          </strong>

          <span>
            يتم جلب بيانات البرنامج من نظام أثر.
          </span>
        </section>
      </main>
    )
  }


  if (error || !program) {
    return (
      <main
        className="program-details-page"
        dir="rtl"
      >
        <Header />

        <section className="program-not-found">
          <span>
            404
          </span>

          <h1>
            البرنامج غير موجود
          </h1>

          <p>
            لم نتمكن من العثور على البرنامج المطلوب أو لم يعد متاحًا.
          </p>

          <Link
            to="/programs"
            className="program-primary-button"
          >
            العودة إلى البرامج
          </Link>
        </section>
      </main>
    )
  }


  const objectives = program.objectives
    .split('\n')
    .map((objective) => objective.trim())
    .filter(Boolean)


  return (
    <main
      className="program-details-page"
      dir="rtl"
    >

      <Header />


      <section className="program-details-hero">

        <div className="program-details-hero-content">

          <Link
            to="/programs"
            className="program-breadcrumb"
          >
            البرامج التدريبية
            <span>←</span>
          </Link>


          <span className="program-category">
            برنامج تدريبي
          </span>


          <h1>
            {program.name}
          </h1>


          <p className="program-description">
            {program.description}
          </p>


          <div className="program-meta">

            <div>
              <span>
                مدة البرنامج
              </span>

              <strong>
                {program.duration} ساعة
              </strong>
            </div>


            <div>
              <span>
                المقاعد
              </span>

              <strong>
                {program.seats} مقعد
              </strong>
            </div>


            <div>
              <span>
                تاريخ البدء
              </span>

              <strong>
                {formatDate(program.start_date)}
              </strong>
            </div>


            <div>
              <span>
                تاريخ الانتهاء
              </span>

              <strong>
                {formatDate(program.end_date)}
              </strong>
            </div>

          </div>

        </div>


        <aside className="program-registration-card">

          <span>
            التسجيل في البرنامج
          </span>

          <h2>
            التفاصيل قبل التسجيل
          </h2>

          <p>
            اطّلع على أهداف البرنامج ومتطلباته ومدته قبل إتمام التسجيل.
          </p>


          <div className="program-registration-date">

            <span>
              فترة البرنامج
            </span>

            <strong>
              من {formatDate(program.start_date)}
              <br />
              إلى {formatDate(program.end_date)}
            </strong>

          </div>


          {registrationSuccess && (
            <div className="program-registration-message success">
              تم إرسال طلب التسجيل بنجاح، وسيظهر لك بعد مراجعته من مسؤول التدريب.
            </div>
          )}


          {registrationError && (
            <div className="program-registration-message error">
              {registrationError}
            </div>
          )}


          <button
            type="button"
            className="program-primary-button"
            onClick={handleRegistration}
            disabled={registering || registrationSuccess}
          >
            {registering
              ? 'جاري إرسال الطلب...'
              : registrationSuccess
                ? 'تم إرسال طلب التسجيل'
                : 'التسجيل في البرنامج'}
          </button>


          <small>
            يعتمد التسجيل على المقاعد المتاحة وشروط البرنامج.
          </small>

        </aside>

      </section>


      <section className="program-details-body">

        <div className="program-main-content">

          <section className="program-content-section">

            <span className="program-section-label">
              عن البرنامج
            </span>

            <h2>
              وصف البرنامج
            </h2>

            <p className="program-section-text">
              {program.description}
            </p>

          </section>


          <section className="program-content-section">

            <span className="program-section-label">
              أهداف البرنامج
            </span>

            <h2>
              ما الذي يقدمه البرنامج؟
            </h2>


            <div className="program-objectives">

              {objectives.map((objective, index) => (

                <div
                  key={`${objective}-${index}`}
                  className="program-objective"
                >

                  <span>
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <p>
                    {objective}
                  </p>

                </div>

              ))}

            </div>

          </section>


          <section className="program-content-section">

            <span className="program-section-label">
              متطلبات البرنامج
            </span>

            <h2>
              ما ينبغي معرفته قبل التسجيل
            </h2>


            <div className="program-information-list">

              <div className="program-information-item">

                <span>
                  الفئة المستهدفة
                </span>

                <p>
                  {program.target_audience}
                </p>

              </div>


              <div className="program-information-item">

                <span>
                  المتطلبات السابقة
                </span>

                <p>
                  {program.prerequisites ||
                    'لا توجد متطلبات سابقة محددة.'}
                </p>

              </div>


              <div className="program-information-item">

                <span>
                  شروط التسجيل
                </span>

                <p>
                  {program.registration_conditions ||
                    'تخضع عملية التسجيل للشروط المعتمدة للبرنامج والمقاعد المتاحة.'}
                </p>

              </div>

            </div>

          </section>

        </div>


        <aside className="program-side-card">

          <span>
            تفاصيل البرنامج
          </span>

          <h3>
            المعلومات التي تحتاجها قبل التسجيل
          </h3>

          <p>
            يجمع هذا القسم أبرز البيانات التي تساعد المشارك على تكوين
            صورة واضحة عن البرنامج قبل اتخاذ خطوة التسجيل.
          </p>


          <div className="program-side-divider"></div>


          <div className="program-side-info">

            <div>
              <span>
                المقاعد
              </span>

              <strong>
                {program.seats}
              </strong>
            </div>


            <div>
              <span>
                المدة
              </span>

              <strong>
                {program.duration} ساعة
              </strong>
            </div>


            <div>
              <span>
                يبدأ في
              </span>

              <strong>
                {formatDate(program.start_date)}
              </strong>
            </div>

          </div>

        </aside>

      </section>


      <footer className="program-details-footer">

        <div className="program-footer-brand">

          <strong>
            أثر
          </strong>

          <span>
            من التعلم إلى التغيير.
          </span>

        </div>


        <div className="program-footer-links">

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

    </main>
  )
}


function Header() {
  return (
    <header className="program-details-header">

      <Link
        to="/"
        className="program-details-brand"
      >
        <strong>
          أثر
        </strong>

        <span>
          من التعلم إلى التغيير.
        </span>
      </Link>


      <nav className="program-details-nav">

        <Link to="/">
          الرئيسية
        </Link>

        <Link
          to="/programs"
          className="active"
        >
          البرامج التدريبية
        </Link>

        <Link to="/paths">
          المسارات
        </Link>

      </nav>


      <div className="program-header-secondary">

        <Link to="/about">
          عن أثر
        </Link>

        <Link to="/verify-certificate">
          التحقق من الشهادات
        </Link>

        <Link to="/faq">
          الأسئلة الشائعة
        </Link>

        <Link
          to="/login"
          className="program-login-button"
        >
          تسجيل الدخول
        </Link>

      </div>

    </header>
  )
}


export default ProgramDetails