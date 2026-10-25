
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import './ProgramDetails.css'
import {
  getCourseById,
  createEnrollment,
  getStoredUser,
  getLearningSections,
  getLearningPreview,
  getLectureProgress,
  setLectureCompleted,
} from '../services/api'

const API_BASE_URL = 'http://127.0.0.1:8000'

function formatDate(date) {
  if (!date) return 'غير محدد'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return 'غير محدد'
  return new Intl.DateTimeFormat('ar-SA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed)
}

function formatFileSize(bytes) {
  if (!bytes || bytes < 1) return 'ملف'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} كيلوبايت`
  return `${(bytes / (1024 * 1024)).toFixed(1)} ميغابايت`
}

function getMediaUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

function getEmbedUrl(url) {
  if (!url) return ''
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : url
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = parsed.searchParams.get('v')
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`
      if (parsed.pathname.startsWith('/embed/')) return url
      if (parsed.pathname.startsWith('/shorts/')) {
        const idFromPath = parsed.pathname.split('/')[2]
        return idFromPath
          ? `https://www.youtube-nocookie.com/embed/${idFromPath}`
          : url
      }
    }

    if (host === 'vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      return id ? `https://player.vimeo.com/video/${id}` : url
    }

    return url
  } catch {
    return url
  }
}

function isDirectVideo(url) {
  return /\.(mp4|webm|mov)(?:$|[?#])/i.test(url || '')
}

function Header() {
  const user = getStoredUser()

  return (
    <header className="program-details-header">
      <Link to="/" className="program-details-brand" aria-label="العودة إلى أثر">
        <span className="brand-mark">أ</span>
        <span className="brand-copy">
          <strong>أثر</strong>
          <small>من التعلّم إلى التغيير.</small>
        </span>
      </Link>

      <nav className="program-details-nav" aria-label="القائمة الرئيسية">
        <Link to="/">الرئيسية</Link>
        <Link to="/programs" className="active">البرامج التدريبية</Link>
        <Link to="/paths">المسارات</Link>
      </nav>

      <div className="program-header-secondary">
        {user ? (
          <span className="signed-in-label">مرحباً بك في أثر</span>
        ) : (
          <Link to="/login" className="program-login-button">تسجيل الدخول</Link>
        )}
      </div>
    </header>
  )
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const minutes = Math.floor(total / 60)
  const remainingSeconds = String(total % 60).padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

function VideoPlayer({ lecture }) {
  const videoRef = useRef(null)
  const playerRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [brightness, setBrightness] = useState(100)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === playerRef.current)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    setPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setPlaybackRate(1)

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      videoRef.current.playbackRate = 1
      videoRef.current.volume = volume
    }
  }, [lecture.id, lecture.video_url])

  function togglePlayback() {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      const result = video.play()
      if (result?.catch) result.catch(() => setPlaying(false))
    } else {
      video.pause()
    }
  }

  function skip(seconds) {
    const video = videoRef.current
    if (!video || !Number.isFinite(video.duration)) return

    video.currentTime = Math.max(
      0,
      Math.min(video.duration, video.currentTime + seconds),
    )
  }

  function changeProgress(value) {
    const video = videoRef.current
    const next = Number(value)
    setCurrentTime(next)

    if (video && Number.isFinite(video.duration)) {
      video.currentTime = next
    }
  }

  function changeVolume(value) {
    const next = Number(value)
    setVolume(next)
    if (videoRef.current) videoRef.current.volume = next
  }

  function changeSpeed(value) {
    const next = Number(value)
    setPlaybackRate(next)
    if (videoRef.current) videoRef.current.playbackRate = next
  }

  async function toggleFullscreen() {
    const player = playerRef.current
    if (!player) return

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else if (player.requestFullscreen) {
        await player.requestFullscreen()
      }
    } catch (error) {
      console.error('تعذّر تغيير وضع ملء الشاشة:', error)
    }
  }

  return (
    <div className="custom-video-player" ref={playerRef}>
      <div className="video-stage">
        <video
          ref={videoRef}
          key={`${lecture.id}-${lecture.video_url}`}
          preload="metadata"
          playsInline
          src={getMediaUrl(lecture.video_url)}
          style={{ filter: `brightness(${brightness}%)` }}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
          onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        >
          متصفحك لا يدعم تشغيل الفيديو.
        </video>
      </div>

      <div className="video-controls" dir="rtl">
        <div className="video-progress-heading">
          <span>تقدّم المشاهدة</span>
          <strong>
            {duration
              ? Math.min(100, Math.round((currentTime / duration) * 100))
              : 0}%
          </strong>
        </div>

        <div className="video-progress-row">
          <span className="video-time">{formatTime(currentTime)}</span>
          <input
            className="video-progress"
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={Math.min(currentTime, duration || 0)}
            onChange={(event) => changeProgress(event.target.value)}
            aria-label="موضع الفيديو"
            style={{
              '--progress': `${duration ? (currentTime / duration) * 100 : 0}%`,
            }}
          />
          <span className="video-time">{formatTime(duration)}</span>
        </div>

        <div className="video-control-toolbar">
          <div className="video-control-group main-controls">
            <button
              type="button"
              onClick={() => skip(10)}
              aria-label="تقديم عشر ثوانٍ"
              title="تقديم 10 ثوانٍ"
            >
              <span>+10</span>
            </button>

            <button
              type="button"
              onClick={togglePlayback}
              className="video-play-toggle"
              aria-label={playing ? 'إيقاف مؤقت' : 'تشغيل'}
            >
              {playing ? 'Ⅱ' : '▶'}
            </button>

            <button
              type="button"
              onClick={() => skip(-10)}
              aria-label="رجوع عشر ثوانٍ"
              title="رجوع 10 ثوانٍ"
            >
              <span>−10</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}
              title={isFullscreen ? 'الخروج من ملء الشاشة' : 'ملء الشاشة'}
              aria-pressed={isFullscreen}
            >
              <span aria-hidden="true">⛶</span>
            </button>
          </div>

          <div className="video-control-group video-settings">
            <label className="video-speed-control">
              <span>السرعة</span>
              <select
                value={playbackRate}
                onChange={(event) => changeSpeed(event.target.value)}
                aria-label="سرعة الفيديو"
              >
                {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                  <option key={rate} value={rate}>
                    {rate === 1 ? 'عادية (1x)' : `${rate}x`}
                  </option>
                ))}
              </select>
            </label>

            <label className="video-range-control">
              <span>سطوع</span>
              <input
                type="range"
                min="50"
                max="150"
                step="5"
                value={brightness}
                onChange={(event) => setBrightness(Number(event.target.value))}
                aria-label="سطوع الصورة"
              />
            </label>

            <label className="video-range-control volume-control">
              <span>الصوت</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(event) => changeVolume(event.target.value)}
                aria-label="مستوى الصوت"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}

function PublicCurriculumPreview({ sections, loading, error, onRetry, state }) {
  const lectureCount = sections.reduce(
    (total, section) => total + (section.lectures || []).length,
    0,
  )

  return (
    <section
      className="learning-panel public-curriculum-preview"
      aria-labelledby="public-curriculum-title"
    >
      <div className="learning-panel-heading">
        <div>
          <span className="program-section-label">تعرّف على محتوى البرنامج</span>
          <h2 id="public-curriculum-title">منهج البرنامج</h2>
          <p>
            تصفّح عناوين الأقسام والمحاضرات قبل التسجيل. المحتوى الكامل متاح
            للمستخدمين المخوّلين.
          </p>
        </div>
        <span className="learning-heading-icon" aria-hidden="true">▤</span>
      </div>

      {loading ? (
        <div className="learning-loading">
          <span className="loading-spinner" />
          <span>جارٍ تحميل معاينة المنهج...</span>
        </div>
      ) : error ? (
        <div className="public-preview-message">
          <p>{error}</p>
          <button
            type="button"
            className="program-primary-button learning-action"
            onClick={onRetry}
          >
            إعادة المحاولة
          </button>
        </div>
      ) : sections.length === 0 ? (
        <div className="learning-empty public-preview-empty">
          <span className="empty-icon" aria-hidden="true">▤</span>
          <h3>المنهج قيد الإعداد</h3>
          <p>سيظهر هنا فهرس الأقسام والمحاضرات عندما يضيف المدرب محتوى البرنامج.</p>
        </div>
      ) : (
        <>
          <div className="public-preview-summary">
            <span>{sections.length} أقسام</span>
            <span>{lectureCount} محاضرات</span>
            <span><span aria-hidden="true">🔒</span> المحتوى الكامل محمي</span>
          </div>

          <div className="public-preview-sections">
            {sections.map((section, sectionIndex) => (
              <details
                className="public-preview-section"
                key={section.id}
                open={sectionIndex === 0}
              >
                <summary>
                  <span className="section-number">
                    {String(sectionIndex + 1).padStart(2, '0')}
                  </span>
                  <span className="section-title-wrap">
                    <strong>{section.title}</strong>
                    <small>{(section.lectures || []).length} محاضرات</small>
                  </span>
                  <span className="section-chevron" aria-hidden="true">⌄</span>
                </summary>

                {section.description && (
                  <p className="curriculum-description">{section.description}</p>
                )}

                {(section.lectures || []).length ? (
                  <div className="public-preview-lectures">
                    {section.lectures.map((lecture, lectureIndex) => {
                      const content = (
                        <>
                          <span className="public-preview-lock" aria-hidden="true">🔒</span>
                          <span className="lecture-title-wrap">
                            <strong>{lecture.title}</strong>
                            <small>المحاضرة {lectureIndex + 1}</small>
                            {lecture.description && (
                              <span className="public-preview-lecture-description">
                                {lecture.description}
                              </span>
                            )}
                          </span>
                          <span className="public-preview-locked-label">
                            {state === 'login' ? 'تسجيل الدخول' : 'مقفل'}
                          </span>
                        </>
                      )

                      return state === 'login' ? (
                        <Link
                          className="public-preview-lecture"
                          key={lecture.id}
                          to="/login"
                          title="سجّل الدخول للوصول إلى المحاضرة"
                        >
                          {content}
                        </Link>
                      ) : (
                        <div
                          className="public-preview-lecture is-locked"
                          key={lecture.id}
                          title="يتاح المحتوى بعد قبول التسجيل أو للمدرب المعيّن"
                        >
                          {content}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="curriculum-description">
                    لا توجد محاضرات في هذا القسم بعد.
                  </p>
                )}
              </details>
            ))}
          </div>

          <div className="public-preview-cta">
            <span className="public-preview-cta-icon" aria-hidden="true">🔒</span>
            <div>
              <strong>
                {state === 'login'
                  ? 'سجّل الدخول للوصول إلى المحاضرات'
                  : 'المحاضرات متاحة للمستخدمين المخوّلين'}
              </strong>
              <p>
                {state === 'login'
                  ? 'بعد تسجيل الدخول، يتحقق النظام من صلاحية الوصول إلى الدورة.'
                  : 'يجب أن يكون التسجيل مقبولًا، أو أن يكون الحساب هو المدرب المعيّن للدورة.'}
              </p>
            </div>
            {state === 'login' && (
              <Link className="program-primary-button" to="/login">
                تسجيل الدخول
              </Link>
            )}
          </div>
        </>
      )}
    </section>
  )
}

function LearningContent({ sections, loading, state, onRetry, courseId }) {
  const [completedLectureIds, setCompletedLectureIds] = useState([])
  const [progressLoading, setProgressLoading] = useState(false)
  const [completionBusyId, setCompletionBusyId] = useState(null)
  const [progressError, setProgressError] = useState('')
  const [openSections, setOpenSections] = useState({})
  const [selectedLectureId, setSelectedLectureId] = useState(null)

  const allLectures = useMemo(
    () =>
      sections.flatMap((section) =>
        (section.lectures || []).map((lecture) => ({
          ...lecture,
          sectionTitle: section.title,
        })),
      ),
    [sections],
  )

  const videoLectures = useMemo(
    () => allLectures.filter((lecture) => Boolean(lecture.video_url || lecture.video_file_path)),
    [allLectures],
  )

  useEffect(() => {
    let cancelled = false

    if (state !== 'ready' || !courseId || getStoredUser()?.role !== 'trainee') {
      setCompletedLectureIds([])
      return undefined
    }

    async function loadProgress() {
      setProgressLoading(true)
      setProgressError('')

      try {
        const result = await getLectureProgress(courseId)
        if (!cancelled) {
          setCompletedLectureIds((result.completed_lecture_ids || []).map(Number))
        }
      } catch (err) {
        if (!cancelled) {
          setProgressError(err.message || 'تعذّر تحميل تقدّم الدورة.')
        }
      } finally {
        if (!cancelled) setProgressLoading(false)
      }
    }

    loadProgress()
    return () => {
      cancelled = true
    }
  }, [courseId, state, sections])

  const completedCount = videoLectures.filter(
    (lecture) => completedLectureIds.includes(Number(lecture.id)),
  ).length

  const progressPercentage = videoLectures.length
    ? Math.round((completedCount / videoLectures.length) * 100)
    : 0

  async function toggleLectureCompletion(lecture) {
    const lectureId = Number(lecture.id)
    const wasCompleted = completedLectureIds.includes(lectureId)

    setCompletionBusyId(lectureId)
    setProgressError('')

    setCompletedLectureIds((current) =>
      wasCompleted
        ? current.filter((id) => id !== lectureId)
        : [...current, lectureId],
    )

    try {
      await setLectureCompleted(courseId, lectureId, !wasCompleted)
    } catch (err) {
      setCompletedLectureIds((current) =>
        wasCompleted
          ? [...new Set([...current, lectureId])]
          : current.filter((id) => id !== lectureId),
      )
      setProgressError(err.message || 'تعذّر حفظ حالة إكمال المحاضرة.')
    } finally {
      setCompletionBusyId(null)
    }
  }

  useEffect(() => {
    if (!allLectures.length) {
      setSelectedLectureId(null)
      return
    }

    setSelectedLectureId((current) =>
      allLectures.some((lecture) => lecture.id === current)
        ? current
        : allLectures[0].id,
    )
  }, [allLectures])

  useEffect(() => {
    if (sections.length && Object.keys(openSections).length === 0) {
      setOpenSections({ [sections[0].id]: true })
    }
  }, [sections, openSections])

  const selectedLecture = allLectures.find(
    (lecture) => lecture.id === selectedLectureId,
  )

  if (state === 'login') {
    return (
      <section className="learning-panel">
        <div className="learning-panel-heading">
          <div>
            <span className="program-section-label">مركز التعلّم</span>
            <h2>محتوى البرنامج</h2>
          </div>
          <span className="learning-heading-icon">▶</span>
        </div>
        <div className="learning-access-state">
          <span className="access-state-icon">🔒</span>
          <h3>سجّل الدخول لمتابعة التعلّم</h3>
          <p>
            بعد تسجيل الدخول والتسجيل في البرنامج، ستتمكن من الوصول إلى
            المحاضرات والمواد التعليمية وفق صلاحيات التسجيل.
          </p>
          <Link className="program-primary-button learning-action" to="/login">
            تسجيل الدخول
          </Link>
        </div>
      </section>
    )
  }

  if (state === 'locked') {
    return (
      <section className="learning-panel">
        <div className="learning-panel-heading">
          <div>
            <span className="program-section-label">مركز التعلّم</span>
            <h2>محتوى البرنامج</h2>
          </div>
          <span className="learning-heading-icon">▶</span>
        </div>
        <div className="learning-access-state">
          <span className="access-state-icon">🔐</span>
          <h3>المحتوى متاح بعد قبول التسجيل</h3>
          <p>
            تم تنظيم محتوى هذا البرنامج للمشاركين المقبولين. إذا أرسلت طلب
            التسجيل، انتظر اعتماد مسؤول التدريب ثم أعد فتح الصفحة.
          </p>
        </div>
      </section>
    )
  }

  if (state === 'error') {
    return (
      <section className="learning-panel">
        <div className="learning-panel-heading">
          <div>
            <span className="program-section-label">مركز التعلّم</span>
            <h2>محتوى البرنامج</h2>
          </div>
        </div>
        <div className="learning-access-state">
          <h3>تعذّر تحميل المحتوى</h3>
          <p>تحقّق من اتصال الخادم ثم أعد المحاولة.</p>
          <button
            type="button"
            className="program-primary-button learning-action"
            onClick={onRetry}
          >
            إعادة المحاولة
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="learning-panel" id="learning-content">
      <div className="learning-panel-heading">
        <div>
          <span className="program-section-label">مركز التعلّم</span>
          <h2>المحاضرات والمواد التعليمية</h2>
          <p>اختر محاضرة من الفهرس لمشاهدة الفيديو والوصول إلى مرفقاتها.</p>
        </div>
        <span className="learning-heading-icon">▶</span>
      </div>

      {state === 'ready' && getStoredUser()?.role === 'trainee' && (
        <div className="course-learning-progress" aria-label="تقدّم إكمال فيديوهات الدورة">
          <div className="course-learning-progress-top">
            <div>
              <strong>تقدّم الدورة</strong>
              <span>{completedCount} من {videoLectures.length} فيديوهات مكتملة</span>
            </div>
            <strong className="course-learning-progress-percent">
              {progressLoading ? '…' : `${progressPercentage}%`}
            </strong>
          </div>
          <div
            className="course-learning-progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercentage}
            aria-label="نسبة إكمال فيديوهات الدورة"
          >
            <span style={{ width: `${progressPercentage}%` }} />
          </div>
          {progressError && (
            <p className="course-learning-progress-error" role="alert">
              {progressError}
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="learning-loading">
          <span className="loading-spinner" />
          <span>جارٍ تحميل المحاضرات والملفات...</span>
        </div>
      ) : sections.length === 0 ? (
        <div className="learning-empty">
          <span className="empty-icon">▤</span>
          <h3>المحتوى قيد الإعداد</h3>
          <p>لم يضف المدرب أقساماً أو محاضرات لهذا البرنامج حتى الآن.</p>
        </div>
      ) : (
        <div className="learning-layout">
          <aside className="learning-curriculum">
            <div className="curriculum-header">
              <div>
                <strong>فهرس المحتوى</strong>
                <span>{sections.length} أقسام · {allLectures.length} محاضرات</span>
              </div>
            </div>

            <div className="curriculum-sections">
              {sections.map((section, sectionIndex) => {
                const isOpen = Boolean(openSections[section.id])
                const lectures = section.lectures || []

                return (
                  <div
                    className={`curriculum-section ${isOpen ? 'is-open' : ''}`}
                    key={section.id}
                  >
                    <button
                      type="button"
                      className="curriculum-section-toggle"
                      onClick={() =>
                        setOpenSections((current) => ({
                          ...current,
                          [section.id]: !current[section.id],
                        }))
                      }
                      aria-expanded={isOpen}
                    >
                      <span className="section-number">
                        {String(sectionIndex + 1).padStart(2, '0')}
                      </span>
                      <span className="section-title-wrap">
                        <strong>{section.title}</strong>
                        <small>{lectures.length} محاضرات</small>
                      </span>
                      <span className="section-chevron">{isOpen ? '−' : '+'}</span>
                    </button>

                    {isOpen && (
                      <div className="curriculum-lectures">
                        {section.description && (
                          <p className="curriculum-description">{section.description}</p>
                        )}

                        {lectures.length ? (
                          lectures.map((lecture, lectureIndex) => (
                            <button
                              type="button"
                              key={lecture.id}
                              className={`curriculum-lecture ${
                                selectedLectureId === lecture.id ? 'selected' : ''
                              }`}
                              onClick={() => setSelectedLectureId(lecture.id)}
                            >
                              <span
                                className={`lecture-play-icon ${
                                  completedLectureIds.includes(Number(lecture.id))
                                    ? 'lecture-completed-mark'
                                    : ''
                                }`}
                              >
                                {completedLectureIds.includes(Number(lecture.id))
                                  ? '✓'
                                  : selectedLectureId === lecture.id
                                    ? '▶'
                                    : '▷'}
                              </span>
                              <span className="lecture-title-wrap">
                                <strong>{lecture.title}</strong>
                                <small>المحاضرة {lectureIndex + 1}</small>
                              </span>
                              {(lecture.attachments || []).length > 0 && (
                                <span className="lecture-attachment-count" title="مرفقات المحاضرة">
                                  ▧ {(lecture.attachments || []).length}
                                </span>
                              )}
                            </button>
                          ))
                        ) : (
                          <p className="curriculum-description">
                            لا توجد محاضرات في هذا القسم بعد.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </aside>

          <div className="learning-viewer">
            {!selectedLecture ? (
              <div className="learning-empty">
                <h3>اختر محاضرة للبدء</h3>
              </div>
            ) : (
              <>
                <div className="lecture-player">
                  {selectedLecture.video_url ? (
                    selectedLecture.video_source_type === 'upload' ||
                    isDirectVideo(selectedLecture.video_url) ? (
                      <VideoPlayer lecture={selectedLecture} />
                    ) : (
                      <iframe
                        key={selectedLecture.id + selectedLecture.video_url}
                        src={getEmbedUrl(selectedLecture.video_url)}
                        title={selectedLecture.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                      />
                    )
                  ) : (
                    <div className="video-placeholder">
                      <span className="video-placeholder-icon">▶</span>
                      <strong>لا يوجد فيديو مضاف لهذه المحاضرة</strong>
                      <small>يمكن للمدرب إضافة فيديو أو رابط للمحاضرة من صفحة إدارة المحتوى.</small>
                    </div>
                  )}
                </div>

                <div className="selected-lecture-details">
                  <div className="selected-lecture-topline">
                    <span className="lecture-content-label">المحاضرة الحالية</span>
                    <span className="lecture-section-pill">{selectedLecture.sectionTitle}</span>
                  </div>
                  <h3>{selectedLecture.title}</h3>
                  {selectedLecture.description && <p>{selectedLecture.description}</p>}

                  {(selectedLecture.video_url || selectedLecture.video_file_path) &&
                    getStoredUser()?.role === 'trainee' && (
                      <label
                        className={`lecture-completion-control ${
                          completedLectureIds.includes(Number(selectedLecture.id))
                            ? 'is-completed'
                            : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={completedLectureIds.includes(Number(selectedLecture.id))}
                          disabled={completionBusyId === Number(selectedLecture.id)}
                          onChange={() => toggleLectureCompletion(selectedLecture)}
                        />
                        <span className="lecture-completion-checkbox" aria-hidden="true">
                          {completedLectureIds.includes(Number(selectedLecture.id)) ? '✓' : ''}
                        </span>
                        <span>
                          {completionBusyId === Number(selectedLecture.id)
                            ? 'جارٍ حفظ الحالة...'
                            : completedLectureIds.includes(Number(selectedLecture.id))
                              ? 'تم إكمال هذا الفيديو'
                              : 'وضع علامة على الفيديو كمكتمل'}
                        </span>
                      </label>
                    )}
                </div>

                <div className="lecture-attachments">
                  <div className="attachments-heading">
                    <div>
                      <span className="program-section-label">ملفات المحاضرة</span>
                      <h4>المواد والمرفقات</h4>
                    </div>
                    <span className="attachments-count">
                      {(selectedLecture.attachments || []).length} ملفات
                    </span>
                  </div>

                  {(selectedLecture.attachments || []).length ? (
                    <div className="attachment-list">
                      {selectedLecture.attachments.map((attachment) => (
                        <div className="attachment-item" key={attachment.id}>
                          <span className="attachment-file-icon">
                            {(attachment.original_filename || '').toLowerCase().endsWith('.pdf')
                              ? 'PDF'
                              : 'FILE'}
                          </span>
                          <div className="attachment-file-info">
                            <strong>{attachment.title || attachment.original_filename}</strong>
                            <span>
                              {attachment.original_filename} · {formatFileSize(attachment.file_size)}
                            </span>
                          </div>
                          <a
                            className="attachment-download"
                            href={getMediaUrl(attachment.file_path)}
                            target="_blank"
                            rel="noreferrer"
                            download={attachment.original_filename || undefined}
                          >
                            تنزيل <span aria-hidden="true">↓</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-attachments">
                      لا توجد ملفات مرفقة بهذه المحاضرة.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function ProgramDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [program, setProgram] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [registering, setRegistering] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registrationError, setRegistrationError] = useState('')
  const [sections, setSections] = useState([])
  const [previewSections, setPreviewSections] = useState([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [learningLoading, setLearningLoading] = useState(false)
  const [learningState, setLearningState] = useState('initial')

  async function loadLearningPreview() {
    try {
      setPreviewLoading(true)
      setPreviewError('')
      const content = await getLearningPreview(id)
      setPreviewSections(Array.isArray(content) ? content : [])
    } catch (err) {
      setPreviewSections([])
      setPreviewError(err.message || 'تعذّر تحميل معاينة المنهج.')
    } finally {
      setPreviewLoading(false)
    }
  }

  async function loadLearningContent() {
    const user = getStoredUser()

    if (!user) {
      setLearningState('login')
      setSections([])
      return
    }

    if (!['trainee', 'trainer'].includes(user.role)) {
      setLearningState('locked')
      setSections([])
      return
    }

    try {
      setLearningLoading(true)
      const content = await getLearningSections(id)
      setSections(Array.isArray(content) ? content : [])
      setLearningState('ready')
    } catch (err) {
      const message = String(err?.message || '').toLowerCase()

      if (
        message.includes('approved enrollment') ||
        message.includes('403') ||
        message.includes('forbidden') ||
        message.includes('مقبول') ||
        message.includes('permission')
      ) {
        setLearningState('locked')
      } else if (
        message.includes('401') ||
        message.includes('token') ||
        message.includes('unauthorized')
      ) {
        setLearningState('login')
      } else {
        setLearningState('error')
      }

      setSections([])
    } finally {
      setLearningLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function loadCourse() {
      try {
        setLoading(true)
        setError('')
        const data = await getCourseById(id)
        if (!cancelled) setProgram(data)
      } catch (err) {
        if (!cancelled) setError(err.message || 'تعذّر تحميل بيانات البرنامج')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadCourse()
    loadLearningPreview()
    loadLearningContent()

    return () => {
      cancelled = true
    }
  }, [id])

  async function handleRegistration() {
    const user = getStoredUser()

    if (!user) {
      navigate('/login')
      return
    }

    if (user.role !== 'trainee') {
      setRegistrationError('التسجيل في البرامج متاح لحسابات المتدربين فقط.')
      return
    }

    try {
      setRegistering(true)
      setRegistrationError('')
      setRegistrationSuccess(false)
      await createEnrollment(program.id)
      setRegistrationSuccess(true)
      await loadLearningContent()
    } catch (err) {
      setRegistrationError(err.message || 'حدث خطأ أثناء إرسال طلب التسجيل')
    } finally {
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <main className="program-details-page" dir="rtl">
        <Header />
        <section className="program-page-state">
          <span className="loading-spinner" />
          <strong>جاري تحميل البرنامج</strong>
          <span>يتم جلب بيانات البرنامج من نظام أثر.</span>
        </section>
      </main>
    )
  }

  if (error || !program) {
    return (
      <main className="program-details-page" dir="rtl">
        <Header />
        <section className="program-not-found">
          <span>404</span>
          <h1>البرنامج غير موجود</h1>
          <p>{error || 'لم نتمكن من العثور على البرنامج المطلوب أو لم يعد متاحاً.'}</p>
          <Link to="/programs" className="program-primary-button">
            العودة إلى البرامج
          </Link>
        </section>
      </main>
    )
  }

  const objectives = (program.objectives || '')
    .split('\n')
    .map((objective) => objective.trim())
    .filter(Boolean)

  // صورة الغلاف المرفوعة لها الأولوية على حقول الصور القديمة.
  const coverImage =
    program.cover_image ||
    program.image_url ||
    program.image ||
    program.thumbnail_url

  return (
    <main className="program-details-page" dir="rtl">
      <Header />

      <section className="program-details-hero">
        <div className="program-details-hero-content">
          <Link to="/programs" className="program-breadcrumb">
            البرامج التدريبية <span>←</span>
          </Link>

          <span className="program-category">برنامج تدريبي</span>
          <h1>{program.name}</h1>

          <p className="program-trainer-name">
            <span>المدرب:</span>{' '}
            {program.trainer_name || 'لم يُعيّن مدرب لهذه الدورة بعد'}
          </p>

          <p className="program-description">{program.description}</p>

          <div className="program-meta">
            <div>
              <span>مدة البرنامج</span>
              <strong>{program.duration ?? '—'} ساعة</strong>
            </div>
            <div>
              <span>المقاعد</span>
              <strong>{program.seats ?? '—'} مقعد</strong>
            </div>
            <div>
              <span>تاريخ البدء</span>
              <strong>{formatDate(program.start_date)}</strong>
            </div>
            <div>
              <span>تاريخ الانتهاء</span>
              <strong>{formatDate(program.end_date)}</strong>
            </div>
          </div>
        </div>

        <aside className="program-cover-card" aria-label="صورة البرنامج التدريبي">
          {coverImage ? (
            <img
              src={getMediaUrl(coverImage)}
              alt={`صورة ${program.name}`}
            />
          ) : (
            <div className="program-cover-placeholder">
              <span className="cover-mark">أ</span>
              <span className="cover-eyebrow">أثر | مركز التعلّم</span>
              <strong>{program.name}</strong>
              <span className="cover-bottom-line">من التعلّم إلى التغيير</span>
            </div>
          )}
        </aside>

        <aside className="program-registration-card">
          <span>التسجيل في البرنامج</span>
          <h2>ابدأ رحلتك التدريبية</h2>
          <p>اطّلع على أهداف البرنامج ومتطلباته ومدته قبل إتمام التسجيل.</p>

          <div className="program-registration-date">
            <span>فترة البرنامج</span>
            <strong>
              من {formatDate(program.start_date)}
              <br />
              إلى {formatDate(program.end_date)}
            </strong>
          </div>

          {registrationSuccess && (
            <div className="program-registration-message success">
              تم إرسال طلب التسجيل بنجاح. سيصبح المحتوى متاحاً بعد اعتماد الطلب.
            </div>
          )}

          {registrationError && (
            <div className="program-registration-message error">
              {registrationError}
            </div>
          )}

          <button
            type="button"
            className="program-primary-button"
            onClick={handleRegistration}
            disabled={registering || registrationSuccess}
          >
            {registering
              ? 'جارٍ إرسال الطلب...'
              : registrationSuccess
                ? 'تم إرسال طلب التسجيل'
                : 'التسجيل في البرنامج'}
          </button>

          <small>يعتمد التسجيل على المقاعد المتاحة وشروط البرنامج.</small>
        </aside>
      </section>

      <section className="learning-section-wrap">
        {learningState !== 'ready' && (
          <PublicCurriculumPreview
            sections={previewSections}
            loading={previewLoading}
            error={previewError}
            onRetry={loadLearningPreview}
            state={learningState === 'login' ? 'login' : 'locked'}
          />
        )}

        <LearningContent
          sections={sections}
          loading={learningLoading}
          state={learningState}
          onRetry={loadLearningContent}
          courseId={id}
        />
      </section>

      <section className="program-details-body">
        <div className="program-main-content">
          <section className="program-content-section">
            <span className="program-section-label">عن البرنامج</span>
            <h2>وصف البرنامج</h2>
            <p className="program-section-text">
              {program.description || 'لا يوجد وصف مضاف لهذا البرنامج.'}
            </p>
          </section>

          <section className="program-content-section">
            <span className="program-section-label">أهداف البرنامج</span>
            <h2>ما الذي يقدمه البرنامج؟</h2>

            {objectives.length ? (
              <div className="program-objectives">
                {objectives.map((objective, index) => (
                  <div key={`${objective}-${index}`} className="program-objective">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <p>{objective}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="program-section-text">
                سيتم عرض أهداف البرنامج عند إضافتها.
              </p>
            )}
          </section>

          <section className="program-content-section">
            <span className="program-section-label">متطلبات البرنامج</span>
            <h2>ما ينبغي معرفته قبل التسجيل</h2>

            <div className="program-information-list">
              <div className="program-information-item">
                <span>الفئة المستهدفة</span>
                <p>
                  {program.target_audience ||
                    'منسوبو جامعة الملك سعود حسب شروط البرنامج.'}
                </p>
              </div>
              <div className="program-information-item">
                <span>المتطلبات السابقة</span>
                <p>{program.prerequisites || 'لا توجد متطلبات سابقة محددة.'}</p>
              </div>
              <div className="program-information-item">
                <span>شروط التسجيل</span>
                <p>
                  {program.registration_conditions ||
                    'تخضع عملية التسجيل للشروط المعتمدة للبرنامج والمقاعد المتاحة.'}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="program-side-card">
          <span>تفاصيل البرنامج</span>
          <h3>المعلومات التي تحتاجها</h3>
          <p>ملخص البيانات الأساسية للبرنامج التدريبي.</p>
          <div className="program-side-divider" />

          <div className="program-side-info">
            <div>
              <span>المقاعد</span>
              <strong>{program.seats ?? '—'}</strong>
            </div>
            <div>
              <span>المدة</span>
              <strong>{program.duration ?? '—'} ساعة</strong>
            </div>
            <div>
              <span>يبدأ في</span>
              <strong>{formatDate(program.start_date)}</strong>
            </div>
          </div>
        </aside>
      </section>

      <footer className="program-details-footer">
        <div className="program-footer-brand">
          <strong>أثر</strong>
          <span>من التعلّم إلى التغيير.</span>
        </div>
        <div className="program-footer-links">
          <Link to="/programs">البرامج التدريبية</Link>
          <Link to="/paths">المسارات</Link>
          <Link to="/about">عن أثر</Link>
          <Link to="/verify-certificate">التحقق من الشهادات</Link>
          <Link to="/faq">الأسئلة الشائعة</Link>
        </div>
      </footer>
    </main>
  )
}

export default ProgramDetails
