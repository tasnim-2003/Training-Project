
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  API_BASE_URL,
  getTrainerCourses,
  getCourseSessions,
  updateSessionMeetingLink,
  createTrainingSession,
  updateTrainingSession,
  getLearningSections,
  createLearningSection,
  updateLearningSection,
  deleteLearningSection,
  createLearningLecture,
  updateLearningLecture,
  deleteLearningLecture,
  setLearningLectureVideoLink,
  uploadLearningLectureVideo,
  uploadLectureAttachment,
  deleteLectureAttachment,
} from '../services/api'
import './TrainerCourseContent.css'

const statusLabels = {
  draft: 'مسودة',
  published: 'منشورة',
  archived: 'مؤرشفة',
}

const emptySection = { title: '', description: '' }
const emptyLecture = { title: '', description: '' }
const emptySession = {
  title: '',
  session_date: '',
  start_time: '',
  end_time: '',
  attendance_open_at: '',
  attendance_close_at: '',
}

function asArray(value, key) {
  if (Array.isArray(value)) return value
  if (key && Array.isArray(value?.[key])) return value[key]
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value?.data)) return value.data
  return []
}

function formatDate(value) {
  if (!value) return 'غير محدد'
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ar-SA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function contentUrl(value) {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return `${API_BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`
}

function toDateTimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16)

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)
}

function sessionFormFrom(session) {
  return {
    title: session.title || '',
    session_date: session.session_date || '',
    start_time: String(session.start_time || '').slice(0, 5),
    end_time: String(session.end_time || '').slice(0, 5),
    attendance_open_at: toDateTimeLocal(session.attendance_open_at),
    attendance_close_at: toDateTimeLocal(session.attendance_close_at),
  }
}

export default function TrainerCourses() {
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [sections, setSections] = useState([])
  const [sessions, setSessions] = useState([])

  const [loading, setLoading] = useState(true)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [sectionFormOpen, setSectionFormOpen] = useState(false)
  const [sectionForm, setSectionForm] = useState(emptySection)
  const [editingSectionId, setEditingSectionId] = useState(null)

  const [lectureForm, setLectureForm] = useState(emptyLecture)
  const [lectureSectionId, setLectureSectionId] = useState(null)
  const [editingLectureId, setEditingLectureId] = useState(null)

  const [videoEditorId, setVideoEditorId] = useState(null)
  const [videoUrls, setVideoUrls] = useState({})
  const [videoFiles, setVideoFiles] = useState({})

  const [attachmentEditorId, setAttachmentEditorId] = useState(null)
  const [attachmentFiles, setAttachmentFiles] = useState({})
  const [attachmentTitles, setAttachmentTitles] = useState({})

  const [sessionFormOpen, setSessionFormOpen] = useState(false)
  const [sessionForm, setSessionForm] = useState(emptySession)
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [activeSessionId, setActiveSessionId] = useState('')
  const [meetingUrl, setMeetingUrl] = useState('')

  useEffect(() => {
    loadCourses()
  }, [])

  function clearAlerts() {
    setError('')
    setMessage('')
  }

  async function loadCourses() {
    setLoading(true)
    setError('')
    try {
      setCourses(asArray(await getTrainerCourses()))
    } catch (err) {
      setError(err.message || 'تعذّر تحميل الدورات التدريبية.')
    } finally {
      setLoading(false)
    }
  }

  async function refreshSections(courseId = selectedCourse?.id) {
    if (!courseId) return
    const data = await getLearningSections(courseId)
    setSections(asArray(data, 'sections'))
  }

  async function refreshSessions(courseId = selectedCourse?.id) {
    if (!courseId) return
    const data = asArray(await getCourseSessions(courseId), 'sessions')
    setSessions(data)

    const active = data.find(
      (item) => String(item.id) === String(activeSessionId),
    )
    if (active) setMeetingUrl(active.meeting_url || '')
  }

  async function loadCourseDetails(course) {
    setSelectedCourse(course)
    setDetailsLoading(true)
    clearAlerts()

    setSections([])
    setSessions([])
    setSectionFormOpen(false)
    setSectionForm(emptySection)
    setEditingSectionId(null)
    setLectureForm(emptyLecture)
    setLectureSectionId(null)
    setEditingLectureId(null)
    setVideoEditorId(null)
    setAttachmentEditorId(null)
    setActiveSessionId('')
    setMeetingUrl('')
    setSessionFormOpen(false)
    setSessionForm(emptySession)
    setEditingSessionId(null)

    const results = await Promise.allSettled([
      getLearningSections(course.id),
      getCourseSessions(course.id),
    ])

    if (results[0].status === 'fulfilled') {
      setSections(asArray(results[0].value, 'sections'))
    } else {
      setError(
        `تعذّر تحميل محتوى الدورة: ${
          results[0].reason?.message || 'خطأ غير معروف'
        }`,
      )
    }

    if (results[1].status === 'fulfilled') {
      setSessions(asArray(results[1].value, 'sessions'))
    } else {
      setError((previous) =>
        `${previous ? `${previous} ` : ''}تعذّر تحميل الجلسات: ${
          results[1].reason?.message || 'خطأ غير معروف'
        }`,
      )
    }

    setDetailsLoading(false)
  }

  // الأقسام

  function openSectionForm(section = null) {
    clearAlerts()
    setEditingSectionId(section?.id ?? null)
    setSectionForm({
      title: section?.title || '',
      description: section?.description || '',
    })
    setSectionFormOpen(true)
  }

  function resetSectionForm() {
    setSectionFormOpen(false)
    setSectionForm(emptySection)
    setEditingSectionId(null)
  }

  async function saveSection(event) {
    event.preventDefault()
    if (!selectedCourse) return

    if (!sectionForm.title.trim()) {
      setError('اكتبي عنوان القسم أولًا.')
      return
    }

    setSaving(true)
    clearAlerts()

    try {
      const payload = {
        title: sectionForm.title.trim(),
        description: sectionForm.description.trim(),
      }

      if (editingSectionId) {
        await updateLearningSection(
          selectedCourse.id,
          editingSectionId,
          payload,
        )
        setMessage('تم تعديل القسم.')
      } else {
        await createLearningSection(selectedCourse.id, payload)
        setMessage('تمت إضافة القسم.')
      }

      resetSectionForm()
      await refreshSections(selectedCourse.id)
    } catch (err) {
      setError(err.message || 'تعذّر حفظ القسم.')
    } finally {
      setSaving(false)
    }
  }

  async function removeSection(section) {
    if (
      !window.confirm(
        `حذف القسم «${section.title}»؟ قد يؤدي ذلك إلى حذف المحاضرات التابعة له.`,
      )
    ) return

    setSaving(true)
    clearAlerts()

    try {
      await deleteLearningSection(selectedCourse.id, section.id)
      if (String(lectureSectionId) === String(section.id)) resetLectureForm()
      await refreshSections(selectedCourse.id)
      setMessage('تم حذف القسم.')
    } catch (err) {
      setError(err.message || 'تعذّر حذف القسم.')
    } finally {
      setSaving(false)
    }
  }

  // المحاضرات

  function openLectureForm(sectionId, lecture = null) {
    clearAlerts()
    setLectureSectionId(sectionId)
    setEditingLectureId(lecture?.id ?? null)
    setLectureForm({
      title: lecture?.title || '',
      description: lecture?.description || '',
    })
  }

  function resetLectureForm() {
    setLectureSectionId(null)
    setEditingLectureId(null)
    setLectureForm(emptyLecture)
  }

  async function saveLecture(event) {
    event.preventDefault()
    if (!selectedCourse || !lectureSectionId) return

    if (!lectureForm.title.trim()) {
      setError('اكتبي عنوان المحاضرة أولًا.')
      return
    }

    setSaving(true)
    clearAlerts()

    try {
      const payload = {
        title: lectureForm.title.trim(),
        description: lectureForm.description.trim(),
      }

      if (editingLectureId) {
        await updateLearningLecture(
          selectedCourse.id,
          editingLectureId,
          payload,
        )
        setMessage('تم تعديل المحاضرة.')
      } else {
        await createLearningLecture(
          selectedCourse.id,
          lectureSectionId,
          payload,
        )
        setMessage('تمت إضافة المحاضرة.')
      }

      resetLectureForm()
      await refreshSections(selectedCourse.id)
    } catch (err) {
      setError(err.message || 'تعذّر حفظ المحاضرة.')
    } finally {
      setSaving(false)
    }
  }

  async function removeLecture(lecture) {
    if (
      !window.confirm(
        `حذف المحاضرة «${lecture.title}» والفيديو والمرفقات التابعة لها؟`,
      )
    ) return

    setSaving(true)
    clearAlerts()

    try {
      await deleteLearningLecture(selectedCourse.id, lecture.id)
      if (String(editingLectureId) === String(lecture.id)) resetLectureForm()
      setVideoEditorId(null)
      setAttachmentEditorId(null)
      await refreshSections(selectedCourse.id)
      setMessage('تم حذف المحاضرة.')
    } catch (err) {
      setError(err.message || 'تعذّر حذف المحاضرة.')
    } finally {
      setSaving(false)
    }
  }

  // الفيديو: رابط أو ملف

  function openVideoEditor(lecture) {
    clearAlerts()
    setVideoEditorId(
      String(videoEditorId) === String(lecture.id) ? null : lecture.id,
    )
    setVideoUrls((previous) => ({
      ...previous,
      [lecture.id]:
        lecture.video_source_type === 'upload' ? '' : lecture.video_url || '',
    }))
    setVideoFiles((previous) => ({ ...previous, [lecture.id]: null }))
  }

  async function saveVideoLink(lecture) {
    const url = (videoUrls[lecture.id] || '').trim()

    if (!/^https?:\/\/\S+$/i.test(url)) {
      setError('أدخلي رابط فيديو صحيحًا يبدأ بـ http:// أو https://.')
      return
    }

    setSaving(true)
    clearAlerts()

    try {
      await setLearningLectureVideoLink(selectedCourse.id, lecture.id, url)
      await refreshSections(selectedCourse.id)
      setVideoEditorId(null)
      setMessage('تم حفظ رابط الفيديو.')
    } catch (err) {
      setError(err.message || 'تعذّر حفظ رابط الفيديو.')
    } finally {
      setSaving(false)
    }
  }

  async function uploadVideo(lecture) {
    const file = videoFiles[lecture.id]

    if (!file) {
      setError('اختاري ملف الفيديو أولًا.')
      return
    }

    if (file.size > 500 * 1024 * 1024) {
      setError('حجم الفيديو يتجاوز 500 ميجابايت.')
      return
    }

    setSaving(true)
    clearAlerts()

    try {
      await uploadLearningLectureVideo(selectedCourse.id, lecture.id, file)
      await refreshSections(selectedCourse.id)
      setVideoFiles((previous) => ({ ...previous, [lecture.id]: null }))
      setVideoEditorId(null)
      setMessage('تم رفع الفيديو أو استبداله بنجاح.')
    } catch (err) {
      setError(err.message || 'تعذّر رفع الفيديو.')
    } finally {
      setSaving(false)
    }
  }

  // المرفقات

  function openAttachmentEditor(lectureId) {
    clearAlerts()
    setAttachmentEditorId(
      String(attachmentEditorId) === String(lectureId) ? null : lectureId,
    )
    setAttachmentFiles((previous) => ({ ...previous, [lectureId]: null }))
    setAttachmentTitles((previous) => ({ ...previous, [lectureId]: '' }))
  }

  async function uploadAttachment(lecture) {
    const file = attachmentFiles[lecture.id]
    if (!file) {
      setError('اختاري الملف الذي تريدين إرفاقه.')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('حجم المرفق يتجاوز 50 ميجابايت.')
      return
    }

    setSaving(true)
    clearAlerts()

    try {
      await uploadLectureAttachment(
        selectedCourse.id,
        lecture.id,
        file,
        attachmentTitles[lecture.id] || '',
      )
      await refreshSections(selectedCourse.id)
      setAttachmentFiles((previous) => ({ ...previous, [lecture.id]: null }))
      setAttachmentTitles((previous) => ({ ...previous, [lecture.id]: '' }))
      setAttachmentEditorId(null)
      setMessage('تم رفع المرفق.')
    } catch (err) {
      setError(err.message || 'تعذّر رفع المرفق.')
    } finally {
      setSaving(false)
    }
  }

  async function replaceAttachment(lecture, attachment) {
    const input = document.createElement('input')
    input.type = 'file'

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      if (file.size > 50 * 1024 * 1024) {
        setError('حجم الملف يتجاوز 50 ميجابايت.')
        return
      }

      setSaving(true)
      clearAlerts()

      try {
        // نرفع البديل أولًا حتى لا نخسر الملف القديم إذا فشل الرفع.
        await uploadLectureAttachment(
          selectedCourse.id,
          lecture.id,
          file,
          attachment.title || file.name,
        )

        try {
          await deleteLectureAttachment(
            selectedCourse.id,
            lecture.id,
            attachment.id,
          )
          setMessage('تم استبدال المرفق.')
        } catch {
          setMessage(
            'تم رفع الملف البديل، لكن تعذّر حذف النسخة القديمة. احذفيها يدويًا.',
          )
        }

        await refreshSections(selectedCourse.id)
      } catch (err) {
        setError(err.message || 'تعذّر رفع الملف البديل.')
      } finally {
        setSaving(false)
      }
    }

    input.click()
  }

  async function removeAttachment(lecture, attachment) {
    if (
      !window.confirm(
        `حذف المرفق «${attachment.title || attachment.original_filename || 'المرفق'}»؟`,
      )
    ) return

    setSaving(true)
    clearAlerts()

    try {
      await deleteLectureAttachment(
        selectedCourse.id,
        lecture.id,
        attachment.id,
      )
      await refreshSections(selectedCourse.id)
      setMessage('تم حذف المرفق.')
    } catch (err) {
      setError(err.message || 'تعذّر حذف المرفق.')
    } finally {
      setSaving(false)
    }
  }

  // الجلسات التدريبية

  function resetSessionForm() {
    setSessionFormOpen(false)
    setSessionForm(emptySession)
    setEditingSessionId(null)
  }

  function openSessionForm(session = null) {
    clearAlerts()
    setEditingSessionId(session?.id ?? null)
    setSessionForm(session ? sessionFormFrom(session) : emptySession)
    setSessionFormOpen(true)
  }

  function chooseSession(sessionId) {
    setActiveSessionId(sessionId)
    const session = sessions.find(
      (item) => String(item.id) === String(sessionId),
    )
    setMeetingUrl(session?.meeting_url || '')
  }

  async function saveSession(event) {
    event.preventDefault()

    const {
      title,
      session_date,
      start_time,
      end_time,
      attendance_open_at,
      attendance_close_at,
    } = sessionForm

    if (
      !title.trim() ||
      !session_date ||
      !start_time ||
      !end_time ||
      !attendance_open_at ||
      !attendance_close_at
    ) {
      setError('أكملي جميع حقول الجلسة وأوقات الحضور.')
      return
    }

    if (end_time <= start_time) {
      setError('وقت نهاية الجلسة يجب أن يكون بعد وقت بدايتها.')
      return
    }

    if (
      new Date(attendance_close_at).getTime() <=
      new Date(attendance_open_at).getTime()
    ) {
      setError('وقت إغلاق الحضور يجب أن يكون بعد وقت فتحه.')
      return
    }

    const payload = {
      course_id: selectedCourse.id,
      title: title.trim(),
      session_date,
      start_time,
      end_time,
      attendance_open_at:
        attendance_open_at.length === 16
          ? `${attendance_open_at}:00`
          : attendance_open_at,
      attendance_close_at:
        attendance_close_at.length === 16
          ? `${attendance_close_at}:00`
          : attendance_close_at,
      meeting_url: editingSessionId
        ? sessions.find(
            (item) => String(item.id) === String(editingSessionId),
          )?.meeting_url || null
        : null,
    }

    setSaving(true)
    clearAlerts()

    try {
      if (editingSessionId) {
        const { course_id, ...updatePayload } = payload
        await updateTrainingSession(editingSessionId, updatePayload)
        setMessage('تم تعديل الجلسة.')
      } else {
        await createTrainingSession(payload)
        setMessage('تم إنشاء الجلسة.')
      }

      resetSessionForm()
      await refreshSessions(selectedCourse.id)
    } catch (err) {
      setError(err.message || 'تعذّر حفظ الجلسة.')
    } finally {
      setSaving(false)
    }
  }

  async function saveMeetingLink(event) {
    event.preventDefault()

    if (!activeSessionId) {
      setError('اختاري الجلسة أولًا.')
      return
    }

    const url = meetingUrl.trim()
    if (url && !/^https?:\/\/\S+$/i.test(url)) {
      setError('أدخلي رابطًا صحيحًا يبدأ بـ http:// أو https://.')
      return
    }

    setSaving(true)
    clearAlerts()

    try {
      await updateSessionMeetingLink(
        selectedCourse.id,
        Number(activeSessionId),
        url,
      )
      await refreshSessions(selectedCourse.id)
      setMessage(url ? 'تم حفظ رابط الاجتماع.' : 'تم حذف رابط الاجتماع.')
    } catch (err) {
      setError(err.message || 'تعذّر حفظ رابط الاجتماع.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="trainer-content-page" dir="rtl">
      <header className="trainer-content-header">
        <Link to="/trainer" className="trainer-content-brand">
          <span className="trainer-content-brand-mark">أ</span>
          <span>
            <strong>أثر</strong>
            <small>من التعلّم إلى التغيير</small>
          </span>
        </Link>
        <Link to="/trainer" className="trainer-content-back">
          العودة إلى لوحة المدرب
        </Link>
      </header>

      <div className="trainer-content-main">
        <div className="trainer-content-heading">
          <span className="trainer-content-eyebrow">مساحة المدرب</span>
          <h1>دوراتي التدريبية</h1>
          <p>
            أديري محتوى دوراتك وجلساتها من مكان واحد، من دون ازدحام النماذج.
          </p>
        </div>

        {error && (
          <div className="trainer-content-alert trainer-content-alert-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')}>إغلاق</button>
          </div>
        )}

        {message && (
          <div className="trainer-content-alert trainer-content-alert-success" role="status">
            <span>{message}</span>
            <button type="button" onClick={() => setMessage('')}>إغلاق</button>
          </div>
        )}

        {loading ? (
          <div className="trainer-content-empty">جارٍ تحميل الدورات...</div>
        ) : courses.length === 0 ? (
          <div className="trainer-content-empty">
            <h2>لا توجد دورات مسندة إليك حاليًا</h2>
            <p>ستظهر هنا الدورات التي يعيّنها مسؤول التدريب.</p>
            <button className="trainer-content-primary-button" onClick={loadCourses}>
              إعادة التحميل
            </button>
          </div>
        ) : (
          <>
            <div className="trainer-content-course-grid">
              {courses.map((course) => (
                <article
                  key={course.id}
                  className={`trainer-content-course-card ${
                    String(selectedCourse?.id) === String(course.id)
                      ? 'trainer-content-course-card-active'
                      : ''
                  }`}
                >
                  <div className="trainer-content-course-top">
                    <span className="trainer-content-course-label">دورة تدريبية</span>
                    <span className={`trainer-content-status status-${course.status}`}>
                      {statusLabels[course.status] || course.status || '—'}
                    </span>
                  </div>
                  <h2>{course.name || course.title || 'دورة تدريبية'}</h2>
                  <p className="trainer-content-course-description">
                    {course.description || 'لا يوجد وصف متاح لهذه الدورة.'}
                  </p>
                  <div className="trainer-content-course-meta">
                    <span>البداية: {formatDate(course.start_date)}</span>
                    <span>النهاية: {formatDate(course.end_date)}</span>
                    <span>المدة: {course.duration ?? '—'} ساعة</span>
                    <span>المقاعد: {course.seats ?? '—'}</span>
                  </div>
                  <button
                    type="button"
                    className="trainer-content-primary-button"
                    onClick={() => loadCourseDetails(course)}
                    disabled={detailsLoading}
                  >
                    {String(selectedCourse?.id) === String(course.id)
                      ? 'تحديث التفاصيل'
                      : 'إدارة الدورة'}
                  </button>
                </article>
              ))}
            </div>

            {selectedCourse && (
              <section className="trainer-content-manager">
                <div className="trainer-content-manager-heading">
                  <span className="trainer-content-eyebrow">إدارة المحتوى</span>
                  <h2>{selectedCourse.name || selectedCourse.title}</h2>
                  <p>أضيفي الأقسام والمحاضرات، ثم أرفقي الفيديوهات والملفات.</p>
                </div>

                {detailsLoading ? (
                  <div className="trainer-content-empty">جارٍ تحميل التفاصيل...</div>
                ) : (
                  <>
                    <section className="trainer-content-panel">
                      <div className="trainer-content-section-heading">
                        <div>
                          <h3>المحتوى التعليمي</h3>
                          <p>نظّمي الدورة ضمن أقسام ومحاضرات واضحة.</p>
                        </div>
                        <button
                          type="button"
                          className="trainer-content-primary-button compact"
                          onClick={() =>
                            sectionFormOpen ? resetSectionForm() : openSectionForm()
                          }
                        >
                          {sectionFormOpen ? 'إغلاق' : '+ إضافة قسم'}
                        </button>
                      </div>

                      {sectionFormOpen && (
                        <form className="trainer-learning-form compact-form" onSubmit={saveSection}>
                          <h4>{editingSectionId ? 'تعديل القسم' : 'قسم جديد'}</h4>
                          <div className="trainer-learning-form-grid">
                            <label>
                              عنوان القسم
                              <input
                                value={sectionForm.title}
                                onChange={(e) =>
                                  setSectionForm({ ...sectionForm, title: e.target.value })
                                }
                                placeholder="مثال: مقدمة الدورة"
                                required
                              />
                            </label>
                            <label className="form-field-wide">
                              وصف مختصر <span className="optional-label">اختياري</span>
                              <textarea
                                rows="2"
                                value={sectionForm.description}
                                onChange={(e) =>
                                  setSectionForm({
                                    ...sectionForm,
                                    description: e.target.value,
                                  })
                                }
                                placeholder="ماذا يتضمن هذا القسم؟"
                              />
                            </label>
                          </div>
                          <div className="trainer-content-form-actions">
                            <button className="trainer-content-primary-button compact" disabled={saving}>
                              {saving ? 'جارٍ الحفظ...' : 'حفظ القسم'}
                            </button>
                            <button type="button" className="trainer-content-secondary-button compact" onClick={resetSectionForm}>
                              إلغاء
                            </button>
                          </div>
                        </form>
                      )}

                      {sections.length === 0 ? (
                        <div className="trainer-content-empty small-empty">
                          لا توجد أقسام لهذه الدورة حتى الآن.
                        </div>
                      ) : (
                        <div className="trainer-learning-sections">
                          {sections.map((section, index) => (
                            <article className="trainer-learning-section" key={section.id}>
                              <div className="trainer-learning-section-header">
                                <span className="trainer-learning-section-number">
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                                <div className="trainer-learning-section-title">
                                  <h4>{section.title}</h4>
                                  {section.description && <p>{section.description}</p>}
                                  <small>{asArray(section.lectures).length} محاضرة</small>
                                </div>
                                <div className="trainer-learning-actions">
                                  <button type="button" className="trainer-content-secondary-button compact" onClick={() => openSectionForm(section)}>
                                    تعديل
                                  </button>
                                  <button type="button" className="trainer-content-danger-button compact" disabled={saving} onClick={() => removeSection(section)}>
                                    حذف
                                  </button>
                                </div>
                              </div>

                              <div className="trainer-learning-lectures">
                                {asArray(section.lectures).map((lecture, lectureIndex) => {
                                  const attachments = asArray(lecture.attachments)
                                  const videoOpen = String(videoEditorId) === String(lecture.id)
                                  const attachmentOpen = String(attachmentEditorId) === String(lecture.id)

                                  return (
                                    <article className="trainer-learning-lecture" key={lecture.id}>
                                      <div className="trainer-learning-lecture-header">
                                        <div className="trainer-learning-lecture-icon">▶</div>
                                        <div className="trainer-learning-lecture-info">
                                          <strong>{lecture.title}</strong>
                                          <small>المحاضرة {lectureIndex + 1}</small>
                                          {lecture.description && <p>{lecture.description}</p>}
                                        </div>
                                        <div className="trainer-learning-actions">
                                          <button type="button" className="trainer-content-secondary-button compact" onClick={() => openLectureForm(section.id, lecture)}>
                                            تعديل
                                          </button>
                                          <button type="button" className="trainer-content-danger-button compact" disabled={saving} onClick={() => removeLecture(lecture)}>
                                            حذف
                                          </button>
                                        </div>
                                      </div>

                                      <div className="trainer-learning-resource">
                                        <div className="trainer-learning-resource-info">
                                          <strong>فيديو المحاضرة</strong>
                                          <small>{lecture.video_url ? 'يوجد فيديو محفوظ' : 'لم تتم إضافة فيديو'}</small>
                                          {lecture.video_url && (
                                            <a href={contentUrl(lecture.video_url)} target="_blank" rel="noreferrer">
                                              فتح الفيديو الحالي ↗
                                            </a>
                                          )}
                                        </div>
                                        <button type="button" className="trainer-content-secondary-button compact" onClick={() => openVideoEditor(lecture)}>
                                          {videoOpen ? 'إغلاق' : lecture.video_url ? 'تبديل الفيديو' : 'إضافة فيديو'}
                                        </button>
                                      </div>

                                      {videoOpen && (
                                        <div className="trainer-learning-form compact-form">
                                          <h4>{lecture.video_url ? 'استبدال الفيديو' : 'إضافة فيديو'}</h4>
                                          <label>
                                            رابط فيديو خارجي
                                            <input
                                              type="url"
                                              value={videoUrls[lecture.id] || ''}
                                              onChange={(e) =>
                                                setVideoUrls((old) => ({
                                                  ...old,
                                                  [lecture.id]: e.target.value,
                                                }))
                                              }
                                              placeholder="https://..."
                                            />
                                          </label>
                                          <button type="button" className="trainer-content-primary-button compact" disabled={saving} onClick={() => saveVideoLink(lecture)}>
                                            حفظ الرابط
                                          </button>
                                          <div className="trainer-content-upload-divider"><span>أو ارفعي ملف فيديو</span></div>
                                          <label>
                                            ملف الفيديو <span className="optional-label">حد أقصى 500 ميجابايت</span>
                                            <input
                                              type="file"
                                              accept="video/*"
                                              onChange={(e) =>
                                                setVideoFiles((old) => ({
                                                  ...old,
                                                  [lecture.id]: e.target.files?.[0] || null,
                                                }))
                                              }
                                            />
                                          </label>
                                          <div className="trainer-content-form-actions">
                                            <button type="button" className="trainer-content-primary-button compact" disabled={saving || !videoFiles[lecture.id]} onClick={() => uploadVideo(lecture)}>
                                              {saving ? 'جارٍ الرفع...' : 'رفع الفيديو'}
                                            </button>
                                            <button type="button" className="trainer-content-secondary-button compact" onClick={() => setVideoEditorId(null)}>
                                              إلغاء
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      <div className="trainer-learning-attachments-heading">
                                        <div>
                                          <strong>المرفقات</strong>
                                          <small>{attachments.length} ملف</small>
                                        </div>
                                        <button type="button" className="trainer-content-secondary-button compact" onClick={() => openAttachmentEditor(lecture.id)}>
                                          {attachmentOpen ? 'إغلاق' : '+ إضافة مرفق'}
                                        </button>
                                      </div>

                                      {attachmentOpen && (
                                        <div className="trainer-learning-form compact-form">
                                          <h4>رفع مرفق جديد</h4>
                                          <label>
                                            اسم المرفق <span className="optional-label">اختياري</span>
                                            <input
                                              value={attachmentTitles[lecture.id] || ''}
                                              onChange={(e) =>
                                                setAttachmentTitles((old) => ({
                                                  ...old,
                                                  [lecture.id]: e.target.value,
                                                }))
                                              }
                                              placeholder="مثال: ملخص المحاضرة"
                                            />
                                          </label>
                                          <label>
                                            الملف <span className="optional-label">حد أقصى 50 ميجابايت</span>
                                            <input
                                              type="file"
                                              onChange={(e) =>
                                                setAttachmentFiles((old) => ({
                                                  ...old,
                                                  [lecture.id]: e.target.files?.[0] || null,
                                                }))
                                              }
                                            />
                                          </label>
                                          <div className="trainer-content-form-actions">
                                            <button type="button" className="trainer-content-primary-button compact" disabled={saving || !attachmentFiles[lecture.id]} onClick={() => uploadAttachment(lecture)}>
                                              {saving ? 'جارٍ الرفع...' : 'رفع المرفق'}
                                            </button>
                                            <button type="button" className="trainer-content-secondary-button compact" onClick={() => setAttachmentEditorId(null)}>
                                              إلغاء
                                            </button>
                                          </div>
                                        </div>
                                      )}

                                      {attachments.length > 0 && (
                                        <div className="trainer-learning-attachment-list">
                                          {attachments.map((attachment) => {
                                            const filename =
                                              attachment.original_filename ||
                                              attachment.filename ||
                                              attachment.file_name ||
                                              attachment.title ||
                                              'مرفق تدريبي'
                                            const filePath =
                                              attachment.file_path ||
                                              attachment.file_url ||
                                              attachment.url

                                            return (
                                              <div className="trainer-learning-attachment" key={attachment.id}>
                                                <div className="trainer-learning-file-icon">↧</div>
                                                <div className="trainer-learning-attachment-info">
                                                  <strong>{attachment.title || filename}</strong>
                                                  <small>{filename}</small>
                                                  {filePath && (
                                                    <a href={contentUrl(filePath)} target="_blank" rel="noreferrer" download>
                                                      فتح / تنزيل الملف
                                                    </a>
                                                  )}
                                                </div>
                                                <div className="trainer-learning-actions">
                                                  <button type="button" className="trainer-content-secondary-button compact" disabled={saving} onClick={() => replaceAttachment(lecture, attachment)}>
                                                    استبدال
                                                  </button>
                                                  <button type="button" className="trainer-content-danger-button compact" disabled={saving} onClick={() => removeAttachment(lecture, attachment)}>
                                                    حذف
                                                  </button>
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </article>
                                  )
                                })}

                                {String(lectureSectionId) === String(section.id) && (
                                  <form className="trainer-learning-form compact-form" onSubmit={saveLecture}>
                                    <h4>{editingLectureId ? 'تعديل المحاضرة' : 'محاضرة جديدة'}</h4>
                                    <label>
                                      عنوان المحاضرة
                                      <input
                                        value={lectureForm.title}
                                        onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
                                        required
                                        placeholder="عنوان المحاضرة"
                                      />
                                    </label>
                                    <label>
                                      وصف مختصر <span className="optional-label">اختياري</span>
                                      <textarea
                                        rows="2"
                                        value={lectureForm.description}
                                        onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })}
                                        placeholder="نبذة عن المحاضرة"
                                      />
                                    </label>
                                    <div className="trainer-content-form-actions">
                                      <button className="trainer-content-primary-button compact" disabled={saving}>
                                        {saving ? 'جارٍ الحفظ...' : 'حفظ المحاضرة'}
                                      </button>
                                      <button type="button" className="trainer-content-secondary-button compact" onClick={resetLectureForm}>
                                        إلغاء
                                      </button>
                                    </div>
                                  </form>
                                )}

                                <button
                                  type="button"
                                  className="trainer-learning-add-lecture"
                                  onClick={() =>
                                    String(lectureSectionId) === String(section.id)
                                      ? resetLectureForm()
                                      : openLectureForm(section.id)
                                  }
                                >
                                  {String(lectureSectionId) === String(section.id)
                                    ? 'إغلاق نموذج المحاضرة'
                                    : '+ إضافة محاضرة'}
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* الجلسات التدريبية */}
                    <section className="trainer-content-panel">
                      <div className="trainer-content-section-heading">
                        <div>
                          <h3>الجلسات التدريبية</h3>
                          <p>حددي مواعيد الجلسات وإعدادات الحضور ورابط الاجتماع.</p>
                        </div>
                        <button type="button" className="trainer-content-primary-button compact" onClick={() => sessionFormOpen ? resetSessionForm() : openSessionForm()}>
                          {sessionFormOpen ? 'إغلاق' : '+ إنشاء جلسة'}
                        </button>
                      </div>

                      {sessionFormOpen && (
                        <form className="trainer-learning-form compact-form" onSubmit={saveSession}>
                          <h4>{editingSessionId ? 'تعديل الجلسة' : 'جلسة جديدة'}</h4>
                          <div className="trainer-learning-form-grid">
                            <label>
                              عنوان الجلسة
                              <input value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} required />
                            </label>
                            <label>
                              تاريخ الجلسة
                              <input type="date" value={sessionForm.session_date} onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })} required />
                            </label>
                            <label>
                              وقت البداية
                              <input type="time" value={sessionForm.start_time} onChange={(e) => setSessionForm({ ...sessionForm, start_time: e.target.value })} required />
                            </label>
                            <label>
                              وقت النهاية
                              <input type="time" value={sessionForm.end_time} onChange={(e) => setSessionForm({ ...sessionForm, end_time: e.target.value })} required />
                            </label>
                            <label>
                              فتح الحضور
                              <input type="datetime-local" value={sessionForm.attendance_open_at} onChange={(e) => setSessionForm({ ...sessionForm, attendance_open_at: e.target.value })} required />
                            </label>
                            <label>
                              إغلاق الحضور
                              <input type="datetime-local" value={sessionForm.attendance_close_at} onChange={(e) => setSessionForm({ ...sessionForm, attendance_close_at: e.target.value })} required />
                            </label>
                          </div>
                          <div className="trainer-content-form-actions">
                            <button className="trainer-content-primary-button compact" disabled={saving}>
                              {saving ? 'جارٍ الحفظ...' : 'حفظ الجلسة'}
                            </button>
                            <button type="button" className="trainer-content-secondary-button compact" onClick={resetSessionForm}>
                              إلغاء
                            </button>
                          </div>
                        </form>
                      )}

                      {sessions.length === 0 ? (
                        <div className="trainer-content-empty small-empty">لا توجد جلسات مضافة لهذه الدورة.</div>
                      ) : (
                        <div className="trainer-learning-session-list">
                          {sessions.map((session) => (
                            <article className="trainer-learning-session" key={session.id}>
                              <div>
                                <strong>{session.title}</strong>
                                <p>
                                  {formatDate(session.session_date)} · {String(session.start_time || '').slice(0, 5)}
                                  {' – '}{String(session.end_time || '').slice(0, 5)}
                                </p>
                                <small>{session.meeting_url ? 'رابط الاجتماع مضاف' : 'لم يُضف رابط الاجتماع'}</small>
                              </div>
                              <button type="button" className="trainer-content-secondary-button compact" onClick={() => openSessionForm(session)}>
                                تعديل
                              </button>
                            </article>
                          ))}
                        </div>
                      )}

                      {sessions.length > 0 && (
                        <form className="trainer-learning-form compact-form" onSubmit={saveMeetingLink}>
                          <h4>رابط الاجتماع المباشر</h4>
                          <label>
                            اختاري الجلسة
                            <select value={activeSessionId} onChange={(e) => chooseSession(e.target.value)} required>
                              <option value="">اختاري جلسة</option>
                              {sessions.map((session) => (
                                <option key={session.id} value={session.id}>
                                  {session.title} — {formatDate(session.session_date)}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            رابط الاجتماع
                            <input type="url" value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://zoom.us/..." />
                          </label>
                          <button className="trainer-content-primary-button compact" disabled={saving || !activeSessionId}>
                            {saving ? 'جارٍ الحفظ...' : 'حفظ رابط الاجتماع'}
                          </button>
                        </form>
                      )}
                    </section>
                  </>
                )}
              </section>
            )}
          </>
        )}
      </div>

      <footer className="trainer-content-footer">أثر · من التعلّم إلى التغيير</footer>
    </main>
  )
}

