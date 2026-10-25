import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import './EditCourse.css'
import {
  API_BASE_URL,
  getAdminCourseById,
  updateCourse,
  uploadCourseCover,
  deleteCourseCover,
} from '../services/api'

function getImageUrl(path) {
  if (!path) return ''

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

function EditCourse() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    objectives: '',
    start_date: '',
    end_date: '',
    duration: '',
    seats: '',
    target_audience: '',
    prerequisites: '',
    registration_conditions: '',
    impact_wait_days: 30,
  })

  const [courseStatus, setCourseStatus] = useState('draft')
  const [coverImage, setCoverImage] = useState('')
  const [selectedCover, setSelectedCover] = useState(null)
  const [removeCover, setRemoveCover] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [coverSaving, setCoverSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true)
        setError('')

        const course = await getAdminCourseById(id)

        setCourseStatus(course.status)
        setCoverImage(course.cover_image || '')

        setFormData({
          name: course.name || '',
          description: course.description || '',
          objectives: course.objectives || '',
          start_date: course.start_date
            ? course.start_date.slice(0, 10)
            : '',
          end_date: course.end_date
            ? course.end_date.slice(0, 10)
            : '',
          duration: course.duration ?? '',
          seats: course.seats ?? '',
          target_audience: course.target_audience || '',
          prerequisites: course.prerequisites || '',
          registration_conditions: course.registration_conditions || '',
          impact_wait_days: course.impact_wait_days ?? 30,
        })
      } catch (err) {
        setError(err.message || 'تعذر تحميل بيانات الدورة')
      } finally {
        setLoading(false)
      }
    }

    loadCourse()
  }, [id])

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

    if (!file.type.startsWith('image/')) {
      setError('يرجى اختيار ملف صورة صالح.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('حجم صورة الغلاف يجب ألا يتجاوز 5 ميجابايت.')
      return
    }

    setError('')
    setSuccess('')
    setSelectedCover(file)
    setRemoveCover(false)
  }

  function getCourseData() {
    return {
      name: formData.name,
      description: formData.description,
      objectives: formData.objectives,
      start_date: formData.start_date,
      end_date: formData.end_date,
      duration: Number(formData.duration),
      seats: Number(formData.seats),
      target_audience: formData.target_audience,
      prerequisites: formData.prerequisites || null,
      registration_conditions: formData.registration_conditions || null,
      impact_wait_days: Number(formData.impact_wait_days),
    }
  }

  async function sendCoverRequest(method, file) {
    const token = sessionStorage.getItem('access_token')

    if (!token) {
      throw new Error('انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مجددًا.')
    }

    let response

    if (method === 'POST') {
      const body = new FormData()
      body.append('file', file)

      response = await fetch(`${API_BASE_URL}/courses/${id}/cover`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body,
      })
    } else {
      response = await fetch(`${API_BASE_URL}/courses/${id}/cover`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
    }

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(
        data.detail || 'تعذر تحديث صورة غلاف الدورة.',
      )
    }

    return data
  }

  
async function saveCoverChanges() {
  if (!selectedCover && !removeCover) return true

  setCoverSaving(true)
  setError('')
  setSuccess('')

  try {
    if (removeCover) {
      await deleteCourseCover(id)
      setCoverImage('')
      setRemoveCover(false)
    } else if (selectedCover) {
      const result = await uploadCourseCover(id, selectedCover)
      setCoverImage(result.cover_image || '')
      setSelectedCover(null)
    }

    setSuccess('تم تحديث صورة الغلاف بنجاح.')
    return true
  } catch (err) {
    setError(err.message || 'تعذر تحديث صورة الغلاف.')
    return false
  } finally {
    setCoverSaving(false)
  }
}


  async function handleSubmit(event) {
    event.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      await updateCourse(id, getCourseData())

      if (selectedCover || removeCover) {
        await saveCoverChanges()

        if (selectedCover || removeCover) {
          // saveCoverChanges handles its own error feedback.
          // Keep the course data saved even if the cover request fails.
        }
      }

      setSuccess('تم حفظ تعديلات الدورة بنجاح.')
      setTimeout(() => navigate('/admin'), 1000)
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء حفظ التعديلات')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    const confirmed = window.confirm(
      'هل أنت متأكد من نشر هذه الدورة؟',
    )

    if (!confirmed) return

    setPublishing(true)
    setError('')
    setSuccess('')

    try {
      await updateCourse(id, {
        ...getCourseData(),
        status: 'published',
      })

      if (selectedCover || removeCover) {
        await saveCoverChanges()
      }

      setCourseStatus('published')
      setSuccess('تم نشر الدورة بنجاح.')

      setTimeout(() => navigate('/admin'), 1000)
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء نشر الدورة')
    } finally {
      setPublishing(false)
    }
  }

  if (loading) {
    return (
      <main className="edit-course-page" dir="rtl">
        <div className="edit-course-state">
          <strong>جاري تحميل بيانات الدورة...</strong>
          <span>يتم جلب بيانات الدورة من نظام أثر.</span>
        </div>
      </main>
    )
  }

  if (error && !formData.name) {
    return (
      <main className="edit-course-page" dir="rtl">
        <div className="edit-course-state edit-course-state-error">
          <strong>تعذر تحميل الدورة</strong>
          <span>{error}</span>
          <Link to="/admin">العودة إلى لوحة التحكم</Link>
        </div>
      </main>
    )
  }

  const previewUrl = selectedCover
    ? URL.createObjectURL(selectedCover)
    : removeCover
      ? ''
      : getImageUrl(coverImage)

  return (
    <main className="edit-course-page" dir="rtl">
      <header className="edit-course-header">
        <Link to="/" className="edit-course-brand">
          <strong>أثر</strong>
          <span>من التعلم إلى التغيير.</span>
        </Link>

        <Link to="/admin" className="edit-course-back">
          العودة إلى لوحة التحكم
        </Link>
      </header>

      <section className="edit-course-container">
        <div className="edit-course-intro">
          <span>إدارة البرامج التدريبية</span>
          <h1>تعديل الدورة التدريبية</h1>
          <p>راجع بيانات الدورة وعدّلها قبل الانتقال إلى مرحلة النشر.</p>
        </div>

        <form className="edit-course-form" onSubmit={handleSubmit}>
          <section className="edit-course-section">
            <div className="edit-course-section-heading">
              <span>01</span>
              <div>
                <h2>المعلومات الأساسية</h2>
                <p>البيانات الأساسية التي تظهر للمشارك عند استعراض الدورة.</p>
              </div>
            </div>

            <div className="edit-course-fields">
              <label className="edit-course-field full">
                <span>اسم الدورة</span>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="edit-course-field full">
                <span>وصف الدورة</span>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  required
                />
              </label>

              <label className="edit-course-field full">
                <span>أهداف الدورة</span>
                <textarea
                  name="objectives"
                  value={formData.objectives}
                  onChange={handleChange}
                  rows={5}
                  required
                />
              </label>
            </div>
          </section>

          <section className="edit-course-section">
            <div className="edit-course-section-heading">
              <span>02</span>
              <div>
                <h2>صورة غلاف الدورة</h2>
                <p>تظهر الصورة في بطاقات الدورات وصفحة تفاصيل الدورة.</p>
              </div>
            </div>

            <div className="edit-course-cover">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="معاينة غلاف الدورة"
                  className="edit-course-cover-preview"
                />
              ) : (
                <div className="edit-course-cover-placeholder">
                  لا توجد صورة غلاف محددة
                </div>
              )}

              <div className="edit-course-cover-actions">
                <label className="edit-course-submit edit-course-cover-select">
                  {selectedCover ? 'اختيار صورة أخرى' : 'اختيار صورة الغلاف'}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                    hidden
                  />
                </label>

                {(coverImage || selectedCover) && !removeCover && (
                  <button
                    type="button"
                    className="edit-course-cancel"
                    onClick={() => {
                      setSelectedCover(null)
                      setRemoveCover(true)
                    }}
                  >
                    حذف الغلاف
                  </button>
                )}

                {removeCover && (
                  <button
                    type="button"
                    className="edit-course-cancel"
                    onClick={() => setRemoveCover(false)}
                  >
                    التراجع عن الحذف
                  </button>
                )}

                {(selectedCover || removeCover) && (
                  <button
                    type="button"
                    className="edit-course-submit"
                    onClick={saveCoverChanges}
                    disabled={coverSaving || saving || publishing}
                  >
                    {coverSaving ? 'جاري تحديث الغلاف...' : 'حفظ صورة الغلاف'}
                  </button>
                )}
              </div>

              <p className="edit-course-cover-hint">
                صيغ الصور المدعومة تعتمد على إعدادات الخادم. الحد الأقصى
                لحجم الصورة 5 ميجابايت.
              </p>
            </div>
          </section>

          <section className="edit-course-section">
            <div className="edit-course-section-heading">
              <span>03</span>
              <div>
                <h2>بيانات التنفيذ</h2>
                <p>المدة الزمنية والسعة والمواعيد الخاصة بالدورة.</p>
              </div>
            </div>

            <div className="edit-course-fields">
              <label className="edit-course-field">
                <span>تاريخ البداية</span>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className="edit-course-field">
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

              <label className="edit-course-field">
                <span>مدة الدورة بالساعات</span>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  min="0.5"
                  step="0.5"
                  required
                />
              </label>

              <label className="edit-course-field">
                <span>عدد المقاعد</span>
                <input
                  type="number"
                  name="seats"
                  value={formData.seats}
                  onChange={handleChange}
                  min="1"
                  step="1"
                  required
                />
              </label>
            </div>
          </section>

          <section className="edit-course-section">
            <div className="edit-course-section-heading">
              <span>04</span>
              <div>
                <h2>الفئة والمتطلبات</h2>
                <p>تحديد الفئة المستهدفة وما يرتبط بالتسجيل.</p>
              </div>
            </div>

            <div className="edit-course-fields">
              <label className="edit-course-field full">
                <span>الفئة المستهدفة</span>
                <textarea
                  name="target_audience"
                  value={formData.target_audience}
                  onChange={handleChange}
                  rows={3}
                  required
                />
              </label>

              <label className="edit-course-field">
                <span>المتطلبات السابقة</span>
                <textarea
                  name="prerequisites"
                  value={formData.prerequisites}
                  onChange={handleChange}
                  rows={4}
                />
              </label>

              <label className="edit-course-field">
                <span>شروط التسجيل</span>
                <textarea
                  name="registration_conditions"
                  value={formData.registration_conditions}
                  onChange={handleChange}
                  rows={4}
                />
              </label>
            </div>
          </section>

          <section className="edit-course-section">
            <div className="edit-course-section-heading">
              <span>05</span>
              <div>
                <h2>قياس الأثر</h2>
                <p>المدة التي ينتظرها النظام قبل إرسال قياس أثر الدورة.</p>
              </div>
            </div>

            <div className="edit-course-fields">
              <label className="edit-course-field">
                <span>فترة الانتظار لقياس الأثر</span>
                <div className="edit-course-input-with-unit">
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
            <div className="edit-course-message error" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="edit-course-message success" role="status">
              {success}
            </div>
          )}

          <div className="edit-course-actions">
            <Link to="/admin" className="edit-course-cancel">
              إلغاء
            </Link>

            <button
              type="submit"
              className="edit-course-submit"
              disabled={saving || publishing || coverSaving}
            >
              {saving ? 'جاري حفظ التعديلات...' : 'حفظ التعديلات'}
            </button>

            {courseStatus === 'draft' && (
              <button
                type="button"
                className="edit-course-submit"
                disabled={saving || publishing || coverSaving}
                onClick={handlePublish}
              >
                {publishing ? 'جاري نشر الدورة...' : 'نشر الدورة'}
              </button>
            )}
          </div>
        </form>
      </section>
    </main>
  )
}

export default EditCourse