
import { useEffect, useState } from 'react'
import { API_BASE_URL, getLearningSections } from '../services/api'
import './TraineeCourseContent.css'

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
      return id
        ? `https://www.youtube-nocookie.com/embed/${id}`
        : url
    }

    if (['youtube.com', 'm.youtube.com'].includes(host)) {
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

function isDirectVideo(url, sourceType) {
  return (
    sourceType === 'upload' ||
    /\.(mp4|webm|mov)(?:$|[?#])/i.test(url || '')
  )
}

function formatFileSize(bytes) {
  if (!bytes || bytes < 1) return 'ملف'

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} كيلوبايت`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} ميغابايت`
}

function TraineeCourseContent({ courseId, courseName }) {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadContent() {
      try {
        setLoading(true)
        setError('')

        const result = await getLearningSections(courseId)

        if (active) {
          setSections(Array.isArray(result) ? result : [])
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'تعذر تحميل محتوى البرنامج.')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadContent()

    return () => {
      active = false
    }
  }, [courseId])

  return (
    <article className="trainee-learning-course">
      <h3 className="trainee-learning-course-title">{courseName}</h3>

      {loading ? (
        <p className="trainee-learning-message">جارٍ تحميل المحتوى...</p>
      ) : error ? (
        <p className="trainee-learning-message error" role="alert">
          {error}
        </p>
      ) : sections.length === 0 ? (
        <p className="trainee-learning-message">
          لا يوجد محتوى مضاف لهذا البرنامج حتى الآن.
        </p>
      ) : (
        <div className="trainee-learning-sections">
          {sections.map((section) => (
            <section
              className="trainee-learning-section"
              key={section.id}
            >
              <h4>{section.title}</h4>

              {section.description && (
                <p className="trainee-learning-description">
                  {section.description}
                </p>
              )}

              {(section.lectures || []).length === 0 ? (
                <p className="trainee-learning-message">
                  لا توجد محاضرات في هذا القسم.
                </p>
              ) : (
                <div className="trainee-learning-lectures">
                  {section.lectures.map((lecture) => (
                    <article
                      className="trainee-learning-lecture"
                      key={lecture.id}
                    >
                      <h5>{lecture.title}</h5>

                      {lecture.description && (
                        <p className="trainee-learning-description">
                          {lecture.description}
                        </p>
                      )}

                      {lecture.video_url && (
                        <div className="trainee-learning-video">
                          {isDirectVideo(
                            lecture.video_url,
                            lecture.video_source_type,
                          ) ? (
                            <video
                              controls
                              preload="metadata"
                              playsInline
                              src={getMediaUrl(lecture.video_url)}
                            >
                              متصفحك لا يدعم تشغيل الفيديو.
                            </video>
                          ) : (
                            <iframe
                              src={getEmbedUrl(lecture.video_url)}
                              title={lecture.title}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                              referrerPolicy="strict-origin-when-cross-origin"
                            />
                          )}
                        </div>
                      )}

                      {(lecture.attachments || []).length > 0 && (
                        <div className="trainee-learning-attachments">
                          {lecture.attachments.map((attachment) => (
                            <a
                              key={attachment.id}
                              href={getMediaUrl(attachment.file_path)}
                              target="_blank"
                              rel="noreferrer"
                              download={attachment.original_filename || undefined}
                              className="trainee-learning-attachment"
                            >
                              <span>
                                {attachment.title ||
                                  attachment.original_filename ||
                                  'ملف مرفق'}
                              </span>

                              <small>
                                {formatFileSize(attachment.file_size)}
                              </small>

                              <span aria-hidden="true">↓</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </article>
  )
}

export default TraineeCourseContent
