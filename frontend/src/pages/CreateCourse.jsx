import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './CreateCourse.css'
import { createCourse } from '../services/api'


function CreateCourse() {
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

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')


  function handleChange(event) {
    const { name, value } = event.target

    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
  }


  async function handleSubmit(event) {
    event.preventDefault()

    setLoading(true)
    setError('')
    setSuccess('')

    const submitter = event.nativeEvent.submitter
    const courseStatus = submitter?.value || 'draft'

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
        impact_wait_days: Number(formData.impact_wait_days),
        status: courseStatus,
      }

      const createdCourse = await createCourse(courseData)

      if (courseStatus === 'published') {
        setSuccess(
          `تم نشر الدورة بنجاح. رقم الدورة: ${createdCourse.id}`,
        )
      } else {
        setSuccess(
          `تم حفظ الدورة كمسودة بنجاح. رقم الدورة: ${createdCourse.id}`,
        )
      }

      setTimeout(() => {
        navigate('/admin')
      }, 1200)
    } catch (err) {
      setError(
        err.message || 'حدث خطأ أثناء إنشاء الدورة',
      )
    } finally {
      setLoading(false)
    }
  }


  return (
    <main
      className="create-course-page"
      dir="rtl"
    >

      <header className="create-course-header">

        <Link
          to="/"
          className="create-course-brand"
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
          className="create-course-back"
        >
          العودة إلى لوحة التحكم
        </Link>

      </header>


      <section className="create-course-container">

        <div className="create-course-intro">

          <span>
            إدارة البرامج التدريبية
          </span>

          <h1>
            إنشاء دورة تدريبية
          </h1>

          <p>
            أدخل البيانات الأساسية للدورة، ثم احفظها كمسودة
            أو انشرها مباشرة لتظهر للمتدربين.
          </p>

        </div>


        <form
          className="create-course-form"
          onSubmit={handleSubmit}
        >

          <section className="create-course-section">

            <div className="create-course-section-heading">

              <span>
                01
              </span>

              <div>
                <h2>
                  المعلومات الأساسية
                </h2>

                <p>
                  البيانات التي تظهر للمشارك عند استعراض الدورة.
                </p>
              </div>

            </div>


            <div className="create-course-fields">

              <label className="create-course-field full">

                <span>
                  اسم الدورة
                </span>

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

                <span>
                  وصف الدورة
                </span>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="اكتب وصفًا واضحًا ومختصرًا للدورة..."
                  rows="5"
                  required
                />

              </label>


              <label className="create-course-field full">

                <span>
                  أهداف الدورة
                </span>

                <textarea
                  name="objectives"
                  value={formData.objectives}
                  onChange={handleChange}
                  placeholder="اكتب كل هدف في سطر مستقل..."
                  rows="5"
                  required
                />

              </label>

            </div>

          </section>


          <section className="create-course-section">

            <div className="create-course-section-heading">

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


            <div className="create-course-fields">

              <label className="create-course-field">

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


              <label className="create-course-field">

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


              <label className="create-course-field">

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
                  placeholder="مثال: 15"
                  required
                />

              </label>


              <label className="create-course-field">

                <span>
                  عدد المقاعد
                </span>

                <input
                  type="number"
                  name="seats"
                  value={formData.seats}
                  onChange={handleChange}
                  min="1"
                  placeholder="مثال: 30"
                  required
                />

              </label>

            </div>

          </section>


          <section className="create-course-section">

            <div className="create-course-section-heading">

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


            <div className="create-course-fields">

              <label className="create-course-field full">

                <span>
                  الفئة المستهدفة
                </span>

                <textarea
                  name="target_audience"
                  value={formData.target_audience}
                  onChange={handleChange}
                  placeholder="مثال: أعضاء هيئة التدريس وطلاب جامعة الملك سعود"
                  rows="3"
                  required
                />

              </label>


              <label className="create-course-field">

                <span>
                  المتطلبات السابقة
                </span>

                <textarea
                  name="prerequisites"
                  value={formData.prerequisites}
                  onChange={handleChange}
                  placeholder="لا توجد متطلبات سابقة..."
                  rows="4"
                />

              </label>


              <label className="create-course-field">

                <span>
                  شروط التسجيل
                </span>

                <textarea
                  name="registration_conditions"
                  value={formData.registration_conditions}
                  onChange={handleChange}
                  placeholder="اكتب شروط التسجيل إن وجدت..."
                  rows="4"
                />

              </label>

            </div>

          </section>


          <section className="create-course-section">

            <div className="create-course-section-heading">

              <span>
                04
              </span>

              <div>
                <h2>
                  قياس الأثر
                </h2>

                <p>
                  تحديد المدة التي ينتظرها النظام قبل إرسال قياس أثر الدورة.
                </p>
              </div>

            </div>


            <div className="create-course-fields">

              <label className="create-course-field">

                <span>
                  فترة الانتظار لقياس الأثر
                </span>

                <div className="create-course-input-with-unit">

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

            <div className="create-course-message error">
              {error}
            </div>

          )}


          {success && (

            <div className="create-course-message success">
              {success}
            </div>

          )}


          <div className="create-course-actions">

            <Link
              to="/admin"
              className="create-course-cancel"
            >
              إلغاء
            </Link>


            <button
              type="submit"
              name="action"
              value="draft"
              className="create-course-submit"
              disabled={loading}
            >
              {loading
                ? 'جاري الحفظ...'
                : 'حفظ الدورة كمسودة'}
            </button>


            <button
              type="submit"
              name="action"
              value="published"
              className="create-course-publish"
              disabled={loading}
            >
              {loading
                ? 'جاري النشر...'
                : 'نشر الدورة'}
            </button>

          </div>

        </form>

      </section>

    </main>
  )
}


export default CreateCourse