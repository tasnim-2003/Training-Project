
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Login.css'
import { loginUser, saveAuthData } from '../services/api'

function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const data = await loginUser(email.trim(), password)
      saveAuthData(data)

      const routes = {
        admin: '/admin',
        trainer: '/trainer',
        trainee: '/trainee',
      }

      navigate(routes[data.user.role] || '/login', {
        replace: true,
      })
    } catch (err) {
      setError(err.message || 'تعذر تسجيل الدخول، تحققي من بياناتك.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page" dir="rtl">
      <section className="login-form-panel">
        <div className="login-form-wrapper">
          <div className="login-heading">
            <span>تسجيل الدخول</span>
            <h2>مرحبًا بك في أثر</h2>
            <p>
              قم بتسجيل الدخول للوصول إلى الخدمات التدريبية الخاصة بمنسوبي جامعة الملك سعود
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label htmlFor="email">البريد الإلكتروني</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="أدخلي بريدك الإلكتروني"
                autoComplete="username"
                maxLength={254}
                required
              />
            </div>

            <div className="login-field">
              <div className="login-password-label">
                <label htmlFor="password">كلمة المرور</label>
                <Link to="/reset-password" className="login-forgot-link">
                   نسيت كلمة المرور؟
                </Link>
              </div>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="أدخلي كلمة المرور"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              {loading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <p className="login-register-text">
            ليس لديك حساب؟{' '}
            <Link to="/register">إنشاء حساب جديد</Link>
          </p>

          <Link to="/" className="login-back-link">
            العودة إلى الرئيسية
          </Link>
        </div>
      </section>

      <section className="login-brand-panel">
        <div className="login-brand-content">
          <Link to="/" className="login-brand">
            <strong>أثر</strong>
            <span>من التعلم إلى التغيير</span>
          </Link>

          <div className="login-message">
            <span>نظام التدريب في جامعة الملك سعود</span>
            <h1>
              من التعلم
              <br />
              إلى <strong>التغيير.</strong>
            </h1>
            <p>
              منصة أثر لإدارة الدورات التدريبية وقياس أثرها،
              ومتابعة رحلة التعلم والتطبيق لدى منسوبي جامعة الملك سعود
            </p>
          </div>

          <div className="login-brand-footer">
            <span>الدورات التدريبية</span>
            <span>قياس الأثر</span>
            <span>الشهادات</span>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Login
