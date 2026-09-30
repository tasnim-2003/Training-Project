import { Link } from 'react-router-dom'
import './Trainers.css'

function Trainers() {
  return (
    <main className="trainers-page" dir="rtl">

      <header className="trainers-header">

        <Link
          to="/"
          className="trainers-brand"
        >
          <strong>أثر</strong>

          <span>
            من التعلم إلى التغيير.
          </span>
        </Link>


        <nav className="trainers-nav">

          <Link to="/">
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

          <Link
            to="/trainers"
            className="active"
          >
            كن مدربًا في أثر
          </Link>

          <Link to="/verify-certificate">
            التحقق من الشهادات
          </Link>

          <Link to="/faq">
            الأسئلة الشائعة
          </Link>

        </nav>


        <Link
          to="/login"
          className="trainers-login-button"
        >
          تسجيل الدخول
        </Link>

      </header>


      <section className="trainers-hero">

        <div className="trainers-hero-content">

          <span className="trainers-eyebrow">
            للخبرات والكفاءات
          </span>

          <h1>
            شارك خبرتك،
            <br />
            <strong>واصنع أثرًا.</strong>
          </h1>

          <p>
            هل لديك خبرة أو تخصص يمكن أن يتحول إلى تجربة تدريبية؟
            انضم إلى أثر وساهم في تقديم برامج تدريبية يستفيد منها
            منسوبو جامعة الملك سعود.
          </p>


          <div className="trainers-hero-actions">

            <Link
              to="/trainer-application"
              className="trainers-primary-button"
            >
              تقديم طلب انضمام
            </Link>

            <a
              href="#trainer-journey"
              className="trainers-secondary-button"
            >
              تعرّف على الرحلة
            </a>

          </div>

        </div>


        <div className="trainers-hero-card">

          <div className="trainers-card-header">

            <span>
              رحلة المدرب في أثر
            </span>

            <span className="trainers-card-badge">
              أثر
            </span>

          </div>


          <div className="trainers-card-step active">

            <span>
              01
            </span>

            <div>

              <strong>
                شارك خبرتك
              </strong>

              <small>
                قدّم طلب الانضمام
              </small>

            </div>

          </div>


          <div className="trainers-card-line"></div>


          <div className="trainers-card-step">

            <span>
              02
            </span>

            <div>

              <strong>
                نراجع طلبك
              </strong>

              <small>
                التحقق من الخبرة والتخصص
              </small>

            </div>

          </div>


          <div className="trainers-card-line"></div>


          <div className="trainers-card-step">

            <span>
              03
            </span>

            <div>

              <strong>
                قدّم برنامجك
              </strong>

              <small>
                إنشاء البرنامج وإرساله للمراجعة
              </small>

            </div>

          </div>


          <div className="trainers-card-line"></div>


          <div className="trainers-card-step">

            <span>
              04
            </span>

            <div>

              <strong>
                اصنع أثرًا
              </strong>

              <small>
                تابع نتائج التدريب وقياس أثره
              </small>

            </div>

          </div>


          <div className="trainers-card-footer">
            من الخبرة إلى التغيير
          </div>

        </div>

      </section>


      <section className="trainers-intro">

        <div className="trainers-intro-heading">

          <span>
            لماذا الانضمام؟
          </span>

          <h2>
            لأن المعرفة تصبح
            <br />
            أكثر قيمة عندما تُشارك.
          </h2>

        </div>


        <div className="trainers-intro-content">

          <p>
            تتيح أثر للخبرات والكفاءات تقديم برامج تدريبية
            منظمة ضمن منظومة التدريب في جامعة الملك سعود.
          </p>

          <p>
            ويمكن للمتخصصين من داخل الجامعة أو خارجها
            التقدم بطلب الانضمام، وفق المتطلبات وآلية المراجعة
            والاعتماد المعتمدة للبرامج التدريبية.
          </p>

        </div>

      </section>


      <section
        id="trainer-journey"
        className="trainers-journey"
      >

        <div className="trainers-section-heading">

          <span>
            كيف تبدأ؟
          </span>

          <h2>
            رحلة واضحة من الطلب
            <br />
            إلى تقديم البرنامج.
          </h2>

        </div>


        <div className="trainers-journey-grid">

          <article className="trainer-journey-item">

            <div className="trainer-journey-number">
              01
            </div>

            <div className="trainer-journey-icon">
              +
            </div>

            <h3>
              تقديم الطلب
            </h3>

            <p>
              أدخل معلوماتك وتخصصك ومؤهلاتك وخبرتك
              من خلال نموذج الانضمام.
            </p>

          </article>


          <article className="trainer-journey-item featured">

            <div className="trainer-journey-number">
              02
            </div>

            <div className="trainer-journey-icon">
              ✓
            </div>

            <h3>
              المراجعة
            </h3>

            <p>
              تتم مراجعة الطلب من مسؤول التدريب
              للتحقق من ملاءمة الخبرة وطبيعة التدريب.
            </p>

          </article>


          <article className="trainer-journey-item">

            <div className="trainer-journey-number">
              03
            </div>

            <div className="trainer-journey-icon">
              →
            </div>

            <h3>
              بدء التدريب
            </h3>

            <p>
              بعد الموافقة، يمكنك الدخول إلى حسابك
              كمدرب والبدء بإنشاء برامجك التدريبية.
            </p>

          </article>

        </div>

      </section>


      <section className="trainers-who">

        <div className="trainers-who-content">

          <span>
            من يمكنه التقديم؟
          </span>

          <h2>
            كل خبرة يمكن أن
            <br />
            تصنع فرقًا.
          </h2>

          <p>
            تستقبل أثر طلبات الخبرات والكفاءات الراغبة
            في تقديم برامج تدريبية مفيدة لمجتمع الجامعة،
            سواء من داخل الجامعة أو من خارجها.
          </p>

        </div>


        <div className="trainers-who-list">

          <div className="trainers-who-item">

            <span>
              01
            </span>

            <div>
              <strong>
                خبرات الجامعة
              </strong>

              <p>
                أعضاء هيئة التدريس والموظفون والمختصون.
              </p>
            </div>

          </div>


          <div className="trainers-who-item">

            <span>
              02
            </span>

            <div>
              <strong>
                الخبرات الخارجية
              </strong>

              <p>
                خبراء ومتخصصون من خارج الجامعة.
              </p>
            </div>

          </div>


          <div className="trainers-who-item">

            <span>
              03
            </span>

            <div>
              <strong>
                المدربون المتخصصون
              </strong>

              <p>
                أصحاب الخبرة في المجالات ذات الصلة.
              </p>
            </div>

          </div>

        </div>

      </section>


      <section className="trainers-after">

        <div className="trainers-section-heading">

          <span>
            بعد قبولك
          </span>

          <h2>
            قبولك كمدرب هو
            <br />
            بداية الرحلة.
          </h2>

        </div>


        <div className="trainers-after-flow">

          <div className="trainers-flow-item">

            <strong>
              مدرب
            </strong>

            <span>
              حسابك في أثر
            </span>

          </div>


          <i>
            ←
          </i>


          <div className="trainers-flow-item">

            <strong>
              برنامج
            </strong>

            <span>
              إنشاء البرنامج
            </span>

          </div>


          <i>
            ←
          </i>


          <div className="trainers-flow-item">

            <strong>
              مراجعة
            </strong>

            <span>
              اعتماد البرنامج
            </span>

          </div>


          <i>
            ←
          </i>


          <div className="trainers-flow-item final">

            <strong>
              أثر
            </strong>

            <span>
              متابعة النتائج
            </span>

          </div>

        </div>

      </section>


      <section className="trainers-cta">

        <div className="trainers-cta-content">

          <span>
            خطوتك الأولى
          </span>

          <h2>
            لديك الخبرة.
            <br />
            <strong>شاركها مع أثر.</strong>
          </h2>

          <p>
            قدّم طلب الانضمام وابدأ رحلة تحويل خبرتك
            إلى تجربة تدريبية ذات أثر.
          </p>


          <Link
            to="/trainer-application"
            className="trainers-cta-button"
          >
            تقديم طلب انضمام
          </Link>

        </div>


        <div className="trainers-cta-mark">

          <strong>
            أثر
          </strong>

          <span>
            من التعلم إلى التغيير.
          </span>

        </div>

      </section>


      <footer className="trainers-footer">

        <div className="trainers-footer-brand">

          <strong>
            أثر
          </strong>

          <span>
            من التعلم إلى التغيير.
          </span>

        </div>


        <div className="trainers-footer-links">

          <Link to="/programs">
            البرامج التدريبية
          </Link>

          <Link to="/paths">
            المسارات
          </Link>

          <Link to="/about">
            عن أثر
          </Link>

          <Link to="/trainers">
            كن مدربًا
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

export default Trainers