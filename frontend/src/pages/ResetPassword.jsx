import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/api'
import './PasswordRecovery.css'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') || ''

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!token) {
      setError('رابط الاستعادة غير صالح أو لا يحتوي على رمز.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('كلمتا المرور غير متطابقتين.')
      return
    }

    if (newPassword.length < 8) {
      setError('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.')
      return
    }

    if (new TextEncoder().encode(newPassword).length > 72) {
      setError('كلمة المرور طويلة جدًا. اختاري كلمة أقصر.')
      return
    }

    setLoading(true)

    try {
      const result = await resetPassword(token, newPassword)
      setMessage(result.message)
      setNewPassword('')
      setConfirmPassword('')

      window.setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1800)
    } catch (err) {
      setError(
        err.message ||
        'تعذر تغيير كلمة المرور. قد يكون الرابط منتهي الصلاحية.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="recovery-page" dir="rtl">
      <section className="recovery-card">
        <Link to="/login" className="recovery-back">
          العودة لتسجيل الدخول
        </Link>

        <div className="recovery-brand">
          <span className="recovery-brand-mark">أ</span>
          <span>أثر</span>
        </div>

        <div className="recovery-heading">
          <span className="recovery-icon" aria-hidden="true">
            ✓
          </span>
          <h1>تعيين كلمة مرور جديدة</h1>
          <p>
            اختاري كلمة مرور جديدة لحماية حسابك،
            ثم أعيدي كتابتها للتأكيد.
          </p>
        </div>

        {!token && (
          <div className="recovery-error" role="alert">
            رابط الاستعادة غير صالح أو لا يحتوي على رمز.
            اطلبي رابطًا جديدًا.
          </div>
        )}

        <form onSubmit={handleSubmit} className="recovery-form">
          <label htmlFor="new-password">
            كلمة المرور الجديدة
          </label>

          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            placeholder="8 أحرف على الأقل"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={8}
            required
          />

          <label htmlFor="confirm-password">
            تأكيد كلمة المرور
          </label>

          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="أعيدي كتابة كلمة المرور"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={8}
            required
          />

          <button type="submit" disabled={loading || !token}>
            {loading ? 'جارٍ حفظ كلمة المرور...' : 'حفظ كلمة المرور الجديدة'}
          </button>
        </form>

        {message && (
          <div className="recovery-message" role="status">
            {message}
            <p>سيتم تحويلك إلى صفحة تسجيل الدخول.</p>
          </div>
        )}

        {error && (
          <div className="recovery-error" role="alert">
            {error}
          </div>
        )}

        <p className="recovery-footer">
          <Link to="/forgot-password">طلب رابط استعادة جديد</Link>
        </p>
      </section>
    </main>
  )
}

export default ResetPassword