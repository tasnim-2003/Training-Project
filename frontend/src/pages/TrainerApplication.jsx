import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createTrainerApplication } from '../services/api'
import './TrainerApplication.css'

const initialForm = {
  name: '',
  email: '',
  password: '',
  employee_id: '',
  department: '',
  specialization: '',
  qualifications: '',
  experience: '',
  motivation: '',
}

function TrainerApplication() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await createTrainerApplication({
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        employee_id: form.employee_id.trim() || null,
        department: form.department.trim(),
        specialization: form.specialization.trim(),
        qualifications: form.qualifications.trim(),
        experience: form.experience.trim(),
        motivation: form.motivation.trim(),
      })

      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'تعذر إرسال الطلب. يرجى المحاولة مجددًا.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <main className="trainer-application-page" dir="rtl">
        <section className="trainer-application-card application-success">
          <div className="application-success-icon">✓</div>
          <h1>تم استلام طلبك</h1>
          <p>
            شكرًا لاهتمامك بالمشاركة في تقديم البرامج التدريبية في جامعة
            الملك سعود. سيُراجع مسؤول التدريب طلبك، وستظهر نتيجة المراجعة
            بعد اتخاذ القرار.
          </p>
          <Link to="/" className="application-submit-button">
            العودة إلى الرئيسية
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="trainer-application-page" dir="rtl">
      <section className="trainer-application-card">
        <Link to="/" className="application-back-link">
          ← الرئيسية
        </Link>

        <p className="application-eyebrow">منصة أثر · جامعة الملك سعود</p>
        <h1>طلب الانضمام كمدرب</h1>
        <p className="application-intro">
          قدّم بياناتك المهنية ليتمكن مسؤول التدريب من مراجعة طلبك.
          إرسال الطلب لا يعني تفعيل حساب مدرب تلقائيًا.
        </p>

        <form onSubmit={handleSubmit} className="trainer-application-form">
          <div className="application-field">
            <label htmlFor="name">الاسم الكامل *</label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={updateField}
              minLength={2}
              maxLength={255}
              autoComplete="name"
              required
            />
          </div>

          <div className="application-field">
            <label htmlFor="email">البريد الإلكتروني *</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              autoComplete="email"
              required
            />
          </div>

          <div className="application-field">
            <label htmlFor="password">كلمة المرور للحساب عند الموافقة *</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={updateField}
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              required
            />
            <small>ثمانية أحرف على الأقل.</small>
          </div>

          <div className="application-field">
            <label htmlFor="employee_id">الرقم الوظيفي أو الجامعي</label>
            <input
              id="employee_id"
              name="employee_id"
              value={form.employee_id}
              onChange={updateField}
              maxLength={100}
            />
          </div>

          <div className="application-field">
            <label htmlFor="department">الكلية أو العمادة أو القسم *</label>
            <input
              id="department"
              name="department"
              value={form.department}
              onChange={updateField}
              maxLength={255}
              required
            />
          </div>

          <div className="application-field">
            <label htmlFor="specialization">مجال التخصص *</label>
            <input
              id="specialization"
              name="specialization"
              value={form.specialization}
              onChange={updateField}
              maxLength={255}
              required
            />
          </div>

          <div className="application-field">
            <label htmlFor="qualifications">المؤهلات والشهادات *</label>
            <textarea
              id="qualifications"
              name="qualifications"
              value={form.qualifications}
              onChange={updateField}
              minLength={5}
              rows={3}
              required
            />
          </div>

          <div className="application-field">
            <label htmlFor="experience">الخبرات التدريبية أو المهنية *</label>
            <textarea
              id="experience"
              name="experience"
              value={form.experience}
              onChange={updateField}
              minLength={5}
              rows={3}
              required
            />
          </div>

          <div className="application-field">
            <label htmlFor="motivation">ما الذي يمكنك تقديمه للمتدربين؟ *</label>
            <textarea
              id="motivation"
              name="motivation"
              value={form.motivation}
              onChange={updateField}
              minLength={10}
              rows={4}
              required
            />
          </div>

          {error && (
            <p className="application-error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="application-submit-button"
            disabled={loading}
          >
            {loading ? 'جارٍ إرسال الطلب...' : 'إرسال الطلب للمراجعة'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default TrainerApplication