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
      const data = await loginUser(
        email,
        password,
      )

      saveAuthData(data)

      const role = data.user.role

      if (role === 'admin') {
        navigate('/admin')
        return
      }

      if (role === 'trainer') {
        navigate('/trainer')
        return
      }

      navigate('/trainee')
    } catch (err) {
      setError(
        err.message || 'تعذر تسجيل الدخول',
      )
    } finally {
      setLoading(false)
    }
  }


  return (
    <main
      className="login-page"
      dir="rtl"
    >

      {/* Login Form - Left */}

      <section className="login-form-panel">

        <div className="login-form-wrapper">

          <div className="login-heading">

            <span>
              تسجيل الدخول
            </span>

            <h2>
              مرحبًا بك في أثر
            </h2>

            <p>
              سجّل الدخول للوصول إلى الخدمات التدريبية الخاصة بمنسوبي جامعة الملك سعود.
            </p>

          </div>


          <form
            className="login-form"
            onSubmit={handleSubmit}
          >

            <div className="login-field">

              <label htmlFor="email">
                البريد الإلكتروني
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="أدخل بريدك الإلكتروني"
                autoComplete="email"
                required
              />

            </div>


            <div className="login-field">

              <div className="login-password-label">

                <label htmlFor="password">
                  كلمة المرور
                </label>

              </div>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="أدخل كلمة المرور"
                autoComplete="current-password"
                required
              />

            </div>


            {error && (

              <div className="login-error">
                {error}
              </div>

            )}


            <button
              type="submit"
              className="login-submit-button"
              disabled={loading}
            >
              {loading
                ? 'جاري تسجيل الدخول...'
                : 'تسجيل الدخول'}
            </button>

          </form>


          <Link
            to="/"
            className="login-back-link"
          >
            العودة إلى الرئيسية
          </Link>

        </div>

      </section>


      {/* Brand Panel - Right */}

      <section className="login-brand-panel">

        <div className="login-brand-content">

          <Link
            to="/"
            className="login-brand"
          >
            <strong>
              أثر
            </strong>

            <span>
              من التعلم إلى التغيير
            </span>
          </Link>


          <div className="login-message">

            <span>
              نظام التدريب في جامعة الملك سعود
            </span>

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

            <span>
              الدورات التدريبية
            </span>

            <span>
              قياس الأثر
            </span>

            <span>
              الشهادات
            </span>

          </div>

        </div>

      </section>

    </main>
  )
}


export default Login