
import { Link } from 'react-router-dom'
import './About.css'

const journey = [
  {
    number: '01',
    icon: '▤',
    title: 'التعلّم',
    description: 'اكتساب المعرفة والمهارات من خلال البرامج والدورات التدريبية.',
    color: 'indigo',
  },
  {
    number: '02',
    icon: '✳',
    title: 'التطبيق',
    description: 'تحويل المعرفة المكتسبة إلى مهارات وممارسات قابلة للتطبيق.',
    color: 'blue',
  },
  {
    number: '03',
    icon: '◎',
    title: 'التقييم',
    description: 'تقييم التجربة التدريبية والتعرّف على فرص التطوير والتحسين.',
    color: 'sky',
  },
  {
    number: '04',
    icon: '↗',
    title: 'الأثر',
    description: 'التعرّف على أثر التعلّم في تنمية المهارات وتحسين الممارسات.',
    color: 'cyan',
  },
]

export default function About() {
  return (
    <main className="about-page" dir="rtl">
      <div className="about-top-navigation">
        <Link to="/" className="about-home-button">
          <span className="about-home-arrow">←</span>
          <span>الرئيسية</span>
        </Link>
      </div>

      <section className="about-intro">
        <div className="about-intro-content">
          <span className="about-eyebrow">
            <span className="about-eyebrow-dot" />
            عن منصة أثر
          </span>

          <h1>
            لأن التعلّم الحقيقي
            <br />
            <span>يتجاوز حدود المعرفة.</span>
          </h1>

          <p className="about-description">
            صُممت منصة أثر لتجمع البرامج والدورات التدريبية في تجربة
            تعليمية مترابطة، تساعد المتدربين على اكتساب المعرفة،
            وتنمية المهارات، والاستفادة مما يتعلمونه في تطوير
            ممارساتهم بصورة مستمرة.
          </p>

          <p className="about-description secondary">
            قيمة التدريب لا تتوقف عند اكتساب المعلومة،
            بل تمتد إلى تطبيقها، وتقييم التجربة، والتعرّف على
            أثرها في التطوير والتحسين المستمر.
          </p>

          <div className="about-signature">
            <span className="about-signature-line" />
            <span>أثر — من التعلّم إلى التغيير</span>
          </div>
        </div>

        <div className="about-intro-visual" aria-hidden="true">
          <div className="about-orbit orbit-one" />
          <div className="about-orbit orbit-two" />
          <div className="about-orbit orbit-three" />

          <div className="about-orbit-center">
            <span className="about-center-label">أثــر</span>
          </div>

          <span className="about-floating-symbol symbol-one">✳</span>
          <span className="about-floating-symbol symbol-two">◎</span>
          <span className="about-floating-symbol symbol-three">↗</span>
          <span className="about-floating-symbol symbol-four">✦</span>
        </div>
      </section>

      <section className="about-journey">
        <div className="about-section-heading">
          <span className="about-section-number">02</span>

          <div>
            <span className="about-eyebrow">رحلة أثر</span>
            <h2>أربع مراحل، وهدف واحد.</h2>
            <p>
              رحلة مترابطة تبدأ بالتعلّم، وتنتهي بأثر حقيقي.
            </p>
          </div>
        </div>

        <div className="journey-track">
          <div className="journey-track-line" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>

          {journey.map((step) => (
            <article
              className={`journey-step journey-${step.color}`}
              key={step.number}
            >
              <div className="journey-step-top">
                <span className="journey-number">{step.number}</span>
                <span className="journey-icon" aria-hidden="true">
                  {step.icon}
                </span>
              </div>

              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="about-footer">
        <span>أثر</span>
        <span className="about-footer-divider" />
        <span className="about-footer-caption">
          من التعلّم إلى التغيير
        </span>
      </footer>
    </main>
  )
}
