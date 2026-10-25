
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registerUser } from '../services/api'
import './Register.css'

function Register() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }))

    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
      })

      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.message || 'تعذر إنشاء الحساب. حاولي مرة أخرى.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="register-page" dir="rtl">
      <section className="register-form-panel">
        <div className="register-form-wrapper">
          <div className="register-heading">
            <span>منصة أثر</span>
            <h2>إنشاء حساب جديد</h2>
            <p>
              أنشئ حسابك لاستكشاف البرامج التدريبية المتاحة لمنسوبي
              جامعة الملك سعود.
            </p>
          </div>

          <form className="register-form" onSubmit={handleSubmit}>
            <div className="register-field">
              <label htmlFor="name">الاسم الكامل</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="أدخل اسمك الكامل"
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                maxLength={150}
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="email">البريد الإلكتروني</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                maxLength={254}
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="password">كلمة المرور</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="أنشئ كلمة مرور"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="register-field">
              <label htmlFor="confirmPassword">تأكيد كلمة المرور</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="أعد إدخال كلمة المرور"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            {error && (
              <p className="register-error" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="register-submit-button"
              disabled={isLoading}
            >
              {isLoading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}
            </button>
          </form>

          <div className="register-login-link">
            <span>لديك حساب بالفعل؟</span>
            <Link to="/login">تسجيل الدخول</Link>
          </div>

          <Link to="/" className="register-back-link">
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </section>

      <section className="register-brand-panel">
        <div className="register-brand-content">
          <Link to="/" className="register-brand">
            <strong>أثر</strong>
            <span>من التعلم إلى التغيير</span>
          </Link>

          <div className="register-message">
            <span>ابدأ رحلتك</span>
            <h1>
              خطوتك الأولى
              <br />
              <strong>تبدأ من هنا</strong>
            </h1>
            <p>
              استكشف البرامج التدريبية، واكتسب المعرفة، وحوّل ما تتعلمه
              إلى أثر ملموس.
            </p>
          </div>

          <div className="register-brand-footer">
            <span>تعلّم</span>
            <span>طبّق</span>
            <span>تطوّر</span>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Register
