
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './CreateCourse.css'
import {
  API_BASE_URL,
  createCourse,
  getActiveTrainers,
  uploadCourseCover,
} from '../services/api'

function CreateCourse() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    objectives: '',
    trainer_id: '',
    start_date: '',
    end_date: '',
    duration: '',
    seats: '',
    target_audience: '',
    prerequisites: '',
    registration_conditions: '',
    impact_wait_days: 30,
  })

  const [trainers, setTrainers] = useState([])
  const [loadingTrainers, setLoadingTrainers] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedCover, setSelectedCover] = useState(null)
  const [coverPreview, setCoverPreview] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadTrainers() {
      setLoadingTrainers(true)

      try {
        const data = await getActiveTrainers()

        if (!cancelled) {
          setTrainers(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'تعذر تحميل قائمة المدربين')
        }
      } finally {
        if (!cancelled) {
          setLoadingTrainers(false)
        }
      }
    }

    loadTrainers()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedCover) {
      setCoverPreview('')
      return
    }

    const objectUrl = URL.createObjectURL(selectedCover)
    setCoverPreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedCover])

  function handleChange(event) {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleCoverChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      setError('صيغة صورة الغلاف يجب أن تكون JPG أو PNG أو WebP.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('حجم صورة الغلاف يجب ألا يتجاوز 5 ميجابايت.')
      return
    }

    setError('')
    setSuccess('')
    setSelectedCover(file)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setLoading(true)
    setError('')
    setSuccess('')

    const submitter = event.nativeEvent.submitter
    const courseStatus = submitter?.value || 'draft'

    if (
      formData.start_date &&
      formData.end_date &&
      formData.end_date < formData.start_date
    ) {
      setError('تاريخ نهاية الدورة يجب ألا يسبق تاريخ بدايتها.')
      setLoading(false)
      return
    }

    if (courseStatus === 'published' && !formData.trainer_id) {
      setError('يرجى اختيار مدرب نشط قبل نشر الدورة.')
      setLoading(false)
      return
    }

    try {
      const courseData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        objectives: formData.objectives.trim(),
        trainer_id: formData.trainer_id
          ? Number(formData.trainer_id)
          : null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        duration: Number(formData.duration),
        seats: Number(formData.seats),
        target_audience: formData.target_audience.trim(),
        prerequisites: formData.prerequisites.trim() || null,
        registration_conditions:
          formData.registration_conditions.trim() || null,
        impact_wait_days: Number(formData.impact_wait_days),
        status: courseStatus,
      }

      const createdCourse = await createCourse(courseData)

      if (selectedCover) {
        try {
          await uploadCourseCover(createdCourse.id, selectedCover)
        } catch (coverError) {
          setError(
            `تم إنشاء الدورة برقم ${createdCourse.id}، لكن تعذر رفع صورة الغلاف: ${
              coverError.message || 'حدث خطأ غير متوقع'
            } يمكنك رفع الصورة من صفحة تعديل الدورة.`,
          )
          setLoading(false)
          return
        }
      }

      setSuccess(
        courseStatus === 'published'
          ? 'تم إنشاء الدورة ونشرها بنجاح.'
          : 'تم حفظ الدورة كمسودة بنجاح.',
      )

      window.setTimeout(() => {
        navigate('/admin')
      }, 1000)
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الدورة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="create-course-page" dir="rtl">
      <header className="create-course-header">
        <Link to="/" className="create-course-brand">
          <strong>أثر</strong>
          <span>من التعلّم إلى التغيير.</span>
        </Link>

        <Link to="/admin" className="create-course-back">
          العودة إلى لوحة التحكم
        </Link>
      </header>

      <section className="create-course-container">
        <div className="create-course-intro">
          <span>إدارة البرامج التدريبية</span>
          <h1>إنشاء دورة تدريبية</h1>
          <p>
            أدخل بيانات الدورة، واختر المدرب المسؤول عنها،
            ثم احفظها كمسودة أو انشرها للمتدربين.
          </p>
        </div>

        <form className="create-course-form" onSubmit={handleSubmit}>
          <section className="create-course-section">
            <div className="create-course-section-heading">
              <span>01</span>
              <div>
                <h2>المعلومات الأساسية</h2>
                <p>البيانات التي تظهر للمشارك عند استعراض الدورة.</p>
              </div>
            </div>

            <div className="create-course-fields">
              <label className="create-course-field full">
                <span>اسم الدورة</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="مثال: أساسيات تطوير الويب"
                  required
                />
              </label>

              <label className="create-course-field full">
                <span>وصف الدورة</span>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="اكتب وصفًا واضحًا ومختصرًا للدورة..."
                  rows={5}
                  required
                />
              </label>

              <label className="create-course-field full">
                <span>أهداف الدورة</span>
                <textarea
                  name="objectives"
                  value={formData.objectives}
                  onChange={handleChange}
                  placeholder="اكتب أهداف الدورة..."
                  rows={4}
                  required
                />
              </label>
            </div>
          </section>

          <section className="create-course-section">
            <div className="create-course-section-heading">
              <span>02</span>
              <div>
                <h2>صورة غلاف الدورة</h2>
                <p>
                  اختر صورة تظهر في بطاقة البرنامج وصفحة تفاصيل الدورة.
                </p>
              </div>
            </div>

            <div className="create-course-cover">
              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="معاينة صورة غلاف الدورة"
                  className="create-course-cover-preview"
                />
              ) : (
                <div className="create-course-cover-placeholder">
                  <strong>أثر</strong>
                  <span>معاينة صورة غلاف الدورة</span>
                </div>
              )}

              <label className="create-course-submit create-course-cover-select">
                {selectedCover ? 'اختيار صورة أخرى' : 'اختيار صورة الغلاف'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverChange}
                  hidden
                />
              </label>

              {selectedCover && (
                <button
                  type="button"
                  className="create-course-cancel"
                  onClick={() => setSelectedCover(null)}
                  disabled={loading}
                >
                  إزالة الصورة المختارة
                </button>
              )}

              <p className="create-course-cover-hint">
                الصيغ المدعومة: JPG وPNG وWebP. الحد الأقصى 5 ميجابايت.
                يمكنك أيضًا إنشاء الدورة دون صورة وإضافتها لاحقًا.
              </p>
            </div>
          </section>

          <section className="create-course-section">
            <div className="create-course-section-heading">
              <span>03</span>
              <div>
                <h2>تعيين المدرب</h2>
                <p>اختر المدرب المسؤول عن تقديم الدورة ومتابعتها.</p>
              </div>
            </div>

            <div className="create-course-fields">
              <label className="create-course-field full">
                <span>المدرب المسؤول</span>
                <select
                  name="trainer_id"
                  value={formData.trainer_id}
                  onChange={handleChange}
                  disabled={loadingTrainers}
                >
                  <option value="">
                    {loadingTrainers
                      ? 'جارٍ تحميل المدربين...'
                      : 'بدون تعيين — للمسودة فقط'}
                  </option>

                  {trainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.name} — {trainer.email}
                    </option>
                  ))}
                </select>

                {!loadingTrainers && trainers.length === 0 && (
                  <small>
                    لا توجد حسابات مدربين نشطة. أنشئ حساب مدرب وفعّله
                    أولًا حتى يظهر هنا.
                  </small>
                )}
              </label>
            </div>
          </section>

          <section className="create-course-section">
            <div className="create-course-section-heading">
              <span>04</span>
              <div>
                <h2>بيانات التنفيذ</h2>
                <p>المدة الزمنية والسعة والمواعيد الخاصة بالدورة.</p>
              </div>
            </div>

            <div className="create-course-fields">
              <label className="create-course-field">
                <span>تاريخ البداية</span>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="create-course-field">
                <span>تاريخ النهاية</span>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  min={formData.start_date || undefined}
                  required
                />
              </label>

              <label className="create-course-field">
                <span>مدة الدورة بالساعات</span>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="0.5"
                  step="0.5"
                  placeholder="مثال: 15"
                  required
                />
              </label>

              <label className="create-course-field">
                <span>عدد المقاعد</span>
                <input
                  type="number"
                  name="seats"
                  value={formData.seats}
                  onChange={handleChange}
                  min="1"
                  step="1"
                  placeholder="مثال: 30"
                  required
                />
              </label>
            </div>
          </section>

          <section className="create-course-section">
            <div className="create-course-section-heading">
              <span>05</span>
              <div>
                <h2>الفئة والمتطلبات</h2>
                <p>تحديد الفئة المستهدفة ومتطلبات التسجيل.</p>
              </div>
            </div>

            <div className="create-course-fields">
              <label className="create-course-field full">
                <span>الفئة المستهدفة</span>
                <textarea
                  name="target_audience"
                  value={formData.target_audience}
                  onChange={handleChange}
                  placeholder="أعضاء هيئة التدريس وطلاب جامعة الملك سعود..."
                  rows={3}
                  required
                />
              </label>

              <label className="create-course-field">
                <span>المتطلبات السابقة</span>
                <textarea
                  name="prerequisites"
                  value={formData.prerequisites}
                  onChange={handleChange}
                  placeholder="لا توجد متطلبات سابقة..."
                  rows={4}
                />
              </label>

              <label className="create-course-field">
                <span>شروط التسجيل</span>
                <textarea
                  name="registration_conditions"
                  value={formData.registration_conditions}
                  onChange={handleChange}
                  placeholder="شروط التسجيل إن وجدت..."
                  rows={4}
                />
              </label>
            </div>
          </section>

          <section className="create-course-section">
            <div className="create-course-section-heading">
              <span>06</span>
              <div>
                <h2>قياس الأثر</h2>
                <p>
                  تحديد المدة التي ينتظرها النظام قبل إرسال قياس أثر الدورة.
                </p>
              </div>
            </div>

            <div className="create-course-fields">
              <label className="create-course-field">
                <span>فترة الانتظار لقياس الأثر</span>
                <div className="create-course-input-with-unit">
                  <input
                    type="number"
                    name="impact_wait_days"
                    value={formData.impact_wait_days}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    required
                  />
                  <span>يوم</span>
                </div>
              </label>
            </div>
          </section>

          {error && (
            <div className="create-course-message error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="create-course-message success" role="status">
              {success}
            </div>
          )}

          <div className="create-course-actions">
            <Link to="/admin" className="create-course-cancel">
              إلغاء
            </Link>

            <button
              type="submit"
              name="action"
              value="draft"
              className="create-course-submit"
              disabled={loading || loadingTrainers}
            >
              {loading ? 'جارٍ الحفظ...' : 'حفظ الدورة كمسودة'}
            </button>

            <button
              type="submit"
              name="action"
              value="published"
              className="create-course-publish"
              disabled={loading || loadingTrainers}
            >
              {loading ? 'جارٍ النشر...' : 'نشر الدورة'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default CreateCourse
