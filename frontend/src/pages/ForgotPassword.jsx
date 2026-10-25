
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/api';
import './PasswordRecovery.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError('يرجى إدخال البريد الإلكتروني.');
      return;
    }

    setLoading(true);

    try {
      await requestPasswordReset(normalizedEmail);
    } catch (err) {
      setError(
        err?.message || 'تعذّر إرسال الطلب. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="recovery-page" dir="rtl">
      <section className="recovery-card">
        <Link to="/login" className="recovery-back-link">
          <span aria-hidden="true">→</span>
          العودة لتسجيل الدخول
        </Link>

        <div className="recovery-brand">أثر</div>

        <div className="recovery-heading">
          <h1>استعادة كلمة المرور</h1>
          <p>
            أدخل البريد الإلكتروني المرتبط بحسابك لاستعادة كلمة المرور.
          </p>
        </div>

        <form className="recovery-form" onSubmit={handleSubmit}>
          <div className="recovery-field">
            <label htmlFor="recovery-email">البريد الإلكتروني</label>

            <input
              id="recovery-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="أدخل البريد الإلكتروني"
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="recovery-submit"
            disabled={loading}
          >
            {loading ? 'جارٍ إرسال الطلب...' : 'إرسال طلب الاستعادة'}
          </button>

          {error && (
            <div
              className="recovery-feedback recovery-error"
              role="alert"
            >
              {error}
            </div>
          )}
        </form>

        <div className="recovery-footer">
          <span>تذكّرت كلمة المرور؟</span>
          <Link to="/login">تسجيل الدخول</Link>
        </div>
      </section>
    </main>
  );
}

