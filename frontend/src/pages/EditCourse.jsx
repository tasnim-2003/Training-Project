import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import './EditCourse.css'
import {
  getAdminCourseById,
  updateCourse,
} from '../services/api'


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

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')


  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true)
        setError('')

        const course = await getAdminCourseById(id)

        setFormData({
          name: course.name || '',
          description: course.description || '',
          objectives: course.objectives || '',
          start_date: course.start_date || '',
          end_date: course.end_date || '',
          duration: course.duration || '',
          seats: course.seats || '',
          target_audience: course.target_audience || '',
          prerequisites: course.prerequisites || '',
          registration_conditions:
            course.registration_conditions || '',
          impact_wait_days:
            course.impact_wait_days ?? 30,
        })
      } catch (err) {
        setError(
          err.message || 'تعذر تحميل بيانات الدورة',
        )
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


  async function handleSubmit(event) {
    event.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const courseData = {
        name: formData.name,
        description: formData.description,
        objectives: formData.objectives,
        start_date: formData.start_date,
        end_date: formData.end_date,
        duration: Number(formData.duration),
        seats: Number(formData.seats),
        target_audience: formData.target_audience,
        prerequisites: formData.prerequisites || null,
        registration_conditions:
          formData.registration_conditions || null,
        impact_wait_days:
          Number(formData.impact_wait_days),
      }

      await updateCourse(id, courseData)

      setSuccess(
        'تم حفظ تعديلات الدورة بنجاح.',
      )

      setTimeout(() => {
        navigate('/admin')
      }, 1000)
    } catch (err) {
      setError(
        err.message || 'حدث خطأ أثناء حفظ التعديلات',
      )
    } finally {
      setSaving(false)
    }
  }


  if (loading) {
    return (
      <main
        className="edit-course-page"
        dir="rtl"
      >
        <div className="edit-course-state">
          <strong>
            جاري تحميل بيانات الدورة...
          </strong>

          <span>
            يتم جلب بيانات الدورة من نظام أثر.
          </span>
        </div>
      </main>
    )
  }


  if (error && !formData.name) {
    return (
      <main
        className="edit-course-page"
        dir="rtl"
      >
        <div className="edit-course-state edit-course-state-error">
          <strong>
            تعذر تحميل الدورة
          </strong>

          <span>
            {error}
          </span>

          <Link to="/admin">
            العودة إلى لوحة التحكم
          </Link>
        </div>
      </main>
    )
  }


  return (
    <main
      className="edit-course-page"
      dir="rtl"
    >

      <header className="edit-course-header">

        <Link
          to="/"
          className="edit-course-brand"
        >
          <strong>
            أثر
          </strong>

          <span>
            من التعلم إلى التغيير.
          </span>
        </Link>


        <Link
          to="/admin"
          className="edit-course-back"
        >
          العودة إلى لوحة التحكم
        </Link>

      </header>


      <section className="edit-course-container">

        <div className="edit-course-intro">

          <span>
            إدارة البرامج التدريبية
          </span>

          <h1>
            تعديل الدورة التدريبية
          </h1>

          <p>
            راجع بيانات الدورة وعدّلها قبل الانتقال إلى مرحلة النشر.
          </p>

        </div>


        <form
          className="edit-course-form"
          onSubmit={handleSubmit}
        >

          <section className="edit-course-section">

            <div className="edit-course-section-heading">

              <span>
                01
              </span>

              <div>
                <h2>
                  المعلومات الأساسية
                </h2>

                <p>
                  البيانات الأساسية التي تظهر للمشارك عند استعراض الدورة.
                </p>
              </div>

            </div>


            <div className="edit-course-fields">

              <label className="edit-course-field full">

                <span>
                  اسم الدورة
                </span>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />

              </label>


              <label className="edit-course-field full">

                <span>
                  وصف الدورة
                </span>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="5"
                  required
                />

              </label>


              <label className="edit-course-field full">

                <span>
                  أهداف الدورة
                </span>

                <textarea
                  name="objectives"
                  value={formData.objectives}
                  onChange={handleChange}
                  rows="5"
                  required
                />

              </label>

            </div>

          </section>


          <section className="edit-course-section">

            <div className="edit-course-section-heading">

              <span>
                02
              </span>

              <div>
                <h2>
                  بيانات التنفيذ
                </h2>

                <p>
                  المدة الزمنية والسعة والمواعيد الخاصة بالدورة.
                </p>
              </div>

            </div>


            <div className="edit-course-fields">

              <label className="edit-course-field">

                <span>
                  تاريخ البداية
                </span>

                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />

              </label>


              <label className="edit-course-field">

                <span>
                  تاريخ النهاية
                </span>

                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                />

              </label>


              <label className="edit-course-field">

                <span>
                  مدة الدورة بالساعات
                </span>

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

                <span>
                  عدد المقاعد
                </span>

                <input
                  type="number"
                  name="seats"
                  value={formData.seats}
                  onChange={handleChange}
                  min="1"
                  required
                />

              </label>

            </div>

          </section>


          <section className="edit-course-section">

            <div className="edit-course-section-heading">

              <span>
                03
              </span>

              <div>
                <h2>
                  الفئة والمتطلبات
                </h2>

                <p>
                  تحديد الفئة المستهدفة وما يرتبط بالتسجيل.
                </p>
              </div>

            </div>


            <div className="edit-course-fields">

              <label className="edit-course-field full">

                <span>
                  الفئة المستهدفة
                </span>

                <textarea
                  name="target_audience"
                  value={formData.target_audience}
                  onChange={handleChange}
                  rows="3"
                  required
                />

              </label>


              <label className="edit-course-field">

                <span>
                  المتطلبات السابقة
                </span>

                <textarea
                  name="prerequisites"
                  value={formData.prerequisites}
                  onChange={handleChange}
                  rows="4"
                />

              </label>


              <label className="edit-course-field">

                <span>
                  شروط التسجيل
                </span>

                <textarea
                  name="registration_conditions"
                  value={formData.registration_conditions}
                  onChange={handleChange}
                  rows="4"
                />

              </label>

            </div>

          </section>


          <section className="edit-course-section">

            <div className="edit-course-section-heading">

              <span>
                04
              </span>

              <div>
                <h2>
                  قياس الأثر
                </h2>

                <p>
                  المدة التي ينتظرها النظام قبل إرسال قياس أثر الدورة.
                </p>
              </div>

            </div>


            <div className="edit-course-fields">

              <label className="edit-course-field">

                <span>
                  فترة الانتظار لقياس الأثر
                </span>

                <div className="edit-course-input-with-unit">

                  <input
                    type="number"
                    name="impact_wait_days"
                    value={formData.impact_wait_days}
                    onChange={handleChange}
                    min="0"
                    required
                  />

                  <span>
                    يوم
                  </span>

                </div>

              </label>

            </div>

          </section>


          {error && (

            <div className="edit-course-message error">
              {error}
            </div>

          )}


          {success && (

            <div className="edit-course-message success">
              {success}
            </div>

          )}


          <div className="edit-course-actions">

            <Link
              to="/admin"
              className="edit-course-cancel"
            >
              إلغاء
            </Link>


            <button
              type="submit"
              className="edit-course-submit"
              disabled={saving}
            >
              {saving
                ? 'جاري حفظ التعديلات...'
                : 'حفظ التعديلات'}
            </button>

          </div>

        </form>

      </section>

    </main>
  )
}


export default EditCourse