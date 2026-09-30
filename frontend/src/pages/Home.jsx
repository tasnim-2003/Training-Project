import { Link } from 'react-router-dom'
import './Home.css'

const featuredPrograms = [
  {
    id: 1,
    category: 'التقنية',
    title: 'أساسيات تطوير الويب',
    description: 'مقدمة عملية لفهم أساسيات تطوير صفحات الويب وبنائها.',
    level: 'مبتدئ',
    duration: '12 ساعة',
  },
  {
    id: 2,
    category: 'المهارات المهنية',
    title: 'مهارات التواصل المهني',
    description: 'تطوير مهارات التواصل والعمل بفعالية في البيئة المهنية.',
    level: 'مبتدئ',
    duration: '8 ساعات',
  },
  {
    id: 3,
    category: 'الإدارة',
    title: 'إدارة المشاريع',
    description: 'التعرف على أساسيات تخطيط المشاريع وتنفيذها ومتابعتها.',
    level: 'متوسط',
    duration: '10 ساعات',
  },
]

const trainingPaths = [
  {
    title: 'مسار تطوير الويب',
    description:
      'رحلة تدريبية متدرجة تبدأ من الأساسيات وتصل إلى التطبيق.',
    courses: '4 برامج تدريبية',
  },
  {
    title: 'مسار المهارات المهنية',
    description:
      'برامج تساعدك على تطوير مهاراتك المهنية وتعزيز جاهزيتك.',
    courses: '3 برامج تدريبية',
  },
]

function Home() {
  return (
    <main className="home-page" dir="rtl">

      <header className="home-header">

        <Link
          to="/"
          className="home-brand"
        >
          <strong>أثر</strong>

          <span>
            من التعلم إلى التغيير.
          </span>
        </Link>


        <nav className="home-nav">

          <Link to="/">
            الرئيسية
          </Link>

          <Link to="/programs">
            البرامج التدريبية
          </Link>

          <Link to="/paths">
            المسارات
          </Link>

        </nav>


        <div className="home-header-secondary">

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
            className="home-login-button"
          >
            تسجيل الدخول
          </Link>

        </div>

      </header>


      <section className="home-hero">

        <div className="home-hero-content">

          <span className="home-hero-label">
            منصة التدريب وقياس الأثر
          </span>

          <h1>
            تعلّم مهارات جديدة،
            <br />
            <strong>واصنع أثرًا حقيقيًا.</strong>
          </h1>

          <p>
            اكتشف البرامج التدريبية والمسارات التي تساعدك
            على تطوير مهاراتك وتحويل ما تتعلمه إلى تطبيق وأثر قابل للقياس.
          </p>


          <div className="home-hero-actions">

            <Link
              to="/programs"
              className="home-primary-button"
            >
              استكشف البرامج التدريبية
            </Link>

            <Link
              to="/paths"
              className="home-secondary-button"
            >
              اكتشف المسارات
            </Link>

          </div>


          <div className="home-hero-meta">

            <div>
              <strong>برامج تدريبية</strong>
              <span>لتطوير المهارات</span>
            </div>

            <div>
              <strong>مسارات متدرجة</strong>
              <span>تعلّم بخطوة واضحة</span>
            </div>

            <div>
              <strong>قياس الأثر</strong>
              <span>من التعلم إلى التطبيق</span>
            </div>

          </div>

        </div>


        <div className="home-hero-panel">

          <div className="hero-panel-header">

            <span>
              رحلتك في أثر
            </span>

            <span className="hero-panel-status">
              أثر
            </span>

          </div>


          <div className="hero-learning-path">

            <div className="hero-path-step active">

              <span>
                01
              </span>

              <div>
                <strong>
                  تعلّم
                </strong>

                <small>
                  اختر برنامجك التدريبي
                </small>
              </div>

            </div>


            <div className="hero-path-line"></div>


            <div className="hero-path-step">

              <span>
                02
              </span>

              <div>
                <strong>
                  طبّق
                </strong>

                <small>
                  حوّل المعرفة إلى ممارسة
                </small>
              </div>

            </div>


            <div className="hero-path-line"></div>


            <div className="hero-path-step">

              <span>
                03
              </span>

              <div>
                <strong>
                  قِس الأثر
                </strong>

                <small>
                  تابع ما تغيّر بعد التعلم
                </small>
              </div>

            </div>

          </div>


          <div className="hero-panel-footer">
            من التعلم إلى التغيير.
          </div>

        </div>

      </section>


      <section className="home-section home-programs-section">

        <div className="home-section-heading">

          <div>

            <span>
              ابدأ رحلة التعلم
            </span>

            <h2>
              البرامج التدريبية
            </h2>

            <p>
              اختر البرنامج الذي يناسب احتياجاتك وابدأ خطوتك القادمة.
            </p>

          </div>


          <Link
            to="/programs"
            className="home-view-all"
          >
            عرض جميع البرامج
            <span>←</span>
          </Link>

        </div>


        <div className="home-programs-grid">

          {featuredPrograms.map((program) => (

            <article
              key={program.id}
              className="home-program-card"
            >

              <div className="home-program-card-top">

                <span>
                  {program.category}
                </span>

                <small>
                  {program.level}
                </small>

              </div>


              <div className="home-program-card-body">

                <h3>
                  {program.title}
                </h3>

                <p>
                  {program.description}
                </p>

              </div>


              <div className="home-program-card-footer">

                <span>
                  {program.duration}
                </span>

                <Link
                  to={`/programs/${program.id}`}
                >
                  عرض البرنامج
                  <span>←</span>
                </Link>

              </div>

            </article>

          ))}

        </div>

      </section>


      <section className="home-section home-paths-section">

        <div className="home-section-heading">

          <div>

            <span>
              تعلّم بشكل متدرج
            </span>

            <h2>
              المسارات التدريبية
            </h2>

            <p>
              مجموعة برامج مترابطة تساعدك على بناء مهاراتك خطوة بخطوة.
            </p>

          </div>


          <Link
            to="/paths"
            className="home-view-all"
          >
            عرض المسارات
            <span>←</span>
          </Link>

        </div>


        <div className="home-paths-grid">

          {trainingPaths.map((path, index) => (

            <Link
              to="/paths"
              key={path.title}
              className="home-path-card"
            >

              <div className="home-path-number">
                0{index + 1}
              </div>


              <div className="home-path-content">

                <h3>
                  {path.title}
                </h3>

                <p>
                  {path.description}
                </p>

                <span>
                  {path.courses}
                </span>

              </div>


              <div className="home-path-arrow">
                ←
              </div>

            </Link>

          ))}

        </div>

      </section>


      <footer className="home-footer">

        <div className="home-footer-brand">

          <strong>
            أثر
          </strong>

          <span>
            من التعلم إلى التغيير.
          </span>

        </div>


        <div className="home-footer-links">

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

export default Home