
export const API_BASE_URL = 'http://127.0.0.1:8000'

async function parseResponse(response, defaultMessage) {
  if (response.status === 204) {
    return null
  }

  const text = await response.text()
  let data = {}

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(defaultMessage)
    }
  }

  if (!response.ok) {
    if (Array.isArray(data.detail)) {
      throw new Error(
        data.detail.map((item) => item.msg).join('، '),
      )
    }

    throw new Error(
      typeof data.detail === 'string'
        ? data.detail
        : defaultMessage,
    )
  }

  return data
}

function getAuthHeaders() {
  const token = sessionStorage.getItem('access_token')

  return token
    ? { Authorization: `Bearer ${token}` }
    : {}
}

// المصادقة والحسابات

export async function registerUser(userData) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(userData),
  })

  return parseResponse(response, 'تعذر إنشاء الحساب')
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ email, password }),
  })

  return parseResponse(response, 'تعذر تسجيل الدخول')
}

export function saveAuthData(loginData) {
  sessionStorage.setItem('access_token', loginData.access_token)
  sessionStorage.setItem('user', JSON.stringify(loginData.user))
}

export function clearAuthData() {
  sessionStorage.removeItem('access_token')
  sessionStorage.removeItem('user')
}

export function getStoredUser() {
  const user = sessionStorage.getItem('user')

  if (!user) return null

  try {
    return JSON.parse(user)
  } catch {
    return null
  }
}

// الدورات التدريبية

export async function getCourses() {
  const response = await fetch(`${API_BASE_URL}/courses/`, {
    headers: { Accept: 'application/json' },
  })

  return parseResponse(response, 'تعذر تحميل الدورات')
}

export async function getAdminCourses() {
  const response = await fetch(`${API_BASE_URL}/courses/admin`, {
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
  })

  return parseResponse(response, 'تعذر تحميل الدورات')
}

export async function getActiveTrainers() {
  const response = await fetch(`${API_BASE_URL}/trainers/active`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
  })

  return parseResponse(response, 'تعذر تحميل قائمة المدربين')
}

export async function getTrainerCourses() {
  const response = await fetch(`${API_BASE_URL}/courses/trainer`, {
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
  })

  return parseResponse(response, 'تعذر تحميل الدورات المسندة إليك')
}

export async function getCourseById(id) {
  const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
    headers: { Accept: 'application/json' },
  })

  return parseResponse(response, 'تعذر تحميل بيانات الدورة')
}

export async function getAdminCourseById(id) {
  const response = await fetch(
    `${API_BASE_URL}/courses/admin/${id}`,
    {
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    },
  )

  return parseResponse(response, 'تعذر تحميل بيانات الدورة')
}

export async function createCourse(courseData) {
  const response = await fetch(`${API_BASE_URL}/courses/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(courseData),
  })

  return parseResponse(response, 'حدث خطأ أثناء إنشاء الدورة')
}

export async function updateCourse(id, courseData) {
  const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(courseData),
  })

  return parseResponse(response, 'حدث خطأ أثناء تعديل الدورة')
}

export async function deleteCourse(id) {
  const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
  })

  return parseResponse(response, 'حدث خطأ أثناء حذف الدورة')
}

export async function uploadCourseCover(courseId, file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/cover`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      body: formData,
    },
  )

  return parseResponse(response, 'تعذر رفع صورة غلاف الدورة')
}

export async function deleteCourseCover(courseId) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/cover`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    },
  )

  return parseResponse(response, 'تعذر حذف صورة غلاف الدورة')
}

// المحتوى القديم - نحتفظ به مؤقتًا للتوافق مع الوظائف الحالية

export async function getCourseContents(courseId) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/contents`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    },
  )

  return parseResponse(response, 'تعذر تحميل محتوى الدورة')
}

export async function uploadCourseContent(courseId, {
  title,
  description,
  type,
  file,
  is_required = true,
}) {
  const formData = new FormData()

  formData.append('title', title)
  formData.append('description', description || '')
  formData.append('type', type)
  formData.append('is_required', String(is_required))
  formData.append('file', file)

  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/contents/upload`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      body: formData,
    },
  )

  return parseResponse(response, 'تعذر رفع محتوى الدورة')
}

export async function createCourseContentLink(courseId, {
  title,
  description,
  type,
  content_url,
  is_required = true,
}) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/contents`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        title,
        description: description || null,
        type,
        content_url,
        is_required,
      }),
    },
  )

  return parseResponse(response, 'تعذر إضافة محتوى الدورة')
}

export async function deleteCourseContent(courseId, contentId) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/contents/${contentId}`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    },
  )

  return parseResponse(response, 'تعذر حذف محتوى الدورة')
}

// معاينة المنهج العامة — عناوين وأوصاف فقط، دون روابط الفيديو والمرفقات

export async function getLearningPreview(courseId) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/learning/preview`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  )

  return parseResponse(response, 'تعذر تحميل معاينة المنهج')
}



// نظام المحتوى الجديد: الأقسام

export async function getLearningSections(courseId) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/learning/sections`,
    {
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    },
  )

  return parseResponse(response, 'تعذر تحميل أقسام الدورة')
}


// تقدّم المتدرب في فيديوهات الدورة

export async function getLectureProgress(courseId) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/learning/progress`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    },
  )

  return parseResponse(response, 'تعذر تحميل تقدّم الدورة')
}

export async function setLectureCompleted(
  courseId,
  lectureId,
  completed,
) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/learning/lectures/${lectureId}/completion`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ completed }),
    },
  )

  return parseResponse(response, 'تعذر حفظ إكمال الفيديو')
}

export async function createLearningSection(courseId, {
  title,
  description,
}) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/learning/sections`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        title,
        description: description || null,
      }),
    },
  )

  return parseResponse(response, 'تعذر إنشاء القسم')
}

export async function updateLearningSection(courseId, sectionId, {
  title,
  description,
}) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/learning/sections/${sectionId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        title,
        description: description || null,
      }),
    },
  )

  return parseResponse(response, 'تعذر تعديل القسم')
}

export async function deleteLearningSection(courseId, sectionId) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/learning/sections/${sectionId}`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    },
  )

  return parseResponse(response, 'تعذر حذف القسم')
}

// نظام المحتوى الجديد: المحاضرات

export async function createLearningLecture(courseId, sectionId, {
  title,
  description,
}) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/learning/sections/${sectionId}/lectures`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        title,
        description: description || null,
      }),
    },
  )

  return parseResponse(response, 'تعذر إنشاء المحاضرة')
}

export async function updateLearningLecture(courseId, lectureId, {
  title,
  description,
}) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/learning/lectures/${lectureId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        title,
        description: description || null,
      }),
    },
  )

  return parseResponse(response, 'تعذر تعديل المحاضرة')
}

export async function deleteLearningLecture(courseId, lectureId) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/learning/lectures/${lectureId}`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    },
  )

  return parseResponse(response, 'تعذر حذف المحاضرة')
}

// فيديو المحاضرة: رابط خارجي

export async function setLearningLectureVideoLink(
  courseId,
  lectureId,
  videoUrl,
) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/learning/lectures/${lectureId}/video-link`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        video_url: videoUrl,
      }),
    },
  )

  return parseResponse(response, 'تعذر حفظ رابط الفيديو')
}

// فيديو المحاضرة: رفع ملف من الجهاز

export async function uploadLearningLectureVideo(
  courseId,
  lectureId,
  file,
) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/learning/lectures/${lectureId}/video-upload`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      body: formData,
    },
  )

  return parseResponse(response, 'تعذر رفع فيديو المحاضرة')
}

// مرفقات المحاضرة: رفع عدة ملفات بشكل مستقل

export async function uploadLectureAttachment(
  courseId,
  lectureId,
  file,
  title = '',
) {
  const formData = new FormData()
  formData.append('file', file)

  if (title.trim()) {
    formData.append('title', title.trim())
  }

  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/learning/lectures/${lectureId}/attachments`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      body: formData,
    },
  )

  return parseResponse(response, 'تعذر رفع مرفق المحاضرة')
}

export async function deleteLectureAttachment(
  courseId,
  lectureId,
  attachmentId,
) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/learning/lectures/${lectureId}/attachments/${attachmentId}`,
    {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    },
  )

  return parseResponse(response, 'تعذر حذف المرفق')
}

// الجلسات التدريبية - المدرب

export async function getCourseSessions(courseId) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/sessions`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    },
  )

  return parseResponse(response, 'تعذر تحميل جلسات الدورة')
}

export async function createTrainingSession(sessionData) {
  const response = await fetch(`${API_BASE_URL}/sessions/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(sessionData),
  })

  return parseResponse(response, 'تعذر إنشاء الجلسة التدريبية')
}

export async function updateTrainingSession(sessionId, sessionData) {
  const response = await fetch(
    `${API_BASE_URL}/sessions/${sessionId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(sessionData),
    },
  )

  return parseResponse(response, 'تعذر تعديل الجلسة التدريبية')
}

export async function updateSessionMeetingLink(
  courseId,
  sessionId,
  meetingUrl,
) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${courseId}/sessions/${sessionId}/meeting-link`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        meeting_url: meetingUrl?.trim() || null,
      }),
    },
  )

  return parseResponse(response, 'تعذر تحديث رابط الجلسة')
}

// التسجيل بالدورات

export async function createEnrollment(courseId) {
  const response = await fetch(`${API_BASE_URL}/enrollments/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ course_id: courseId }),
  })

  return parseResponse(response, 'تعذر إرسال طلب التسجيل')
}

export async function getMyEnrollments() {
  const response = await fetch(`${API_BASE_URL}/enrollments/my`, {
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
  })

  return parseResponse(response, 'تعذر تحميل دوراتك التدريبية')
}

// مؤشرات الدورة

export async function getCourseAnalyticsDashboard(courseId) {
  const response = await fetch(
    `${API_BASE_URL}/analytics/courses/${courseId}/dashboard`,
    {
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    },
  )

  return parseResponse(response, 'تعذر تحميل مؤشرات الدورة')
}

// الإشعارات

export async function getMyNotifications() {
  const response = await fetch(`${API_BASE_URL}/notifications/my`, {
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders(),
    },
  })

  return parseResponse(response, 'تعذر تحميل الإشعارات')
}

export async function updateNotification(id, isRead) {
  const response = await fetch(
    `${API_BASE_URL}/notifications/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ is_read: isRead }),
    },
  )

  return parseResponse(response, 'تعذر تحديث الإشعار')
}

// استعادة كلمة المرور

export async function requestPasswordReset(email) {
  const response = await fetch(
    `${API_BASE_URL}/auth/forgot-password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email }),
    },
  )

  return parseResponse(
    response,
    'تعذر إرسال طلب استعادة كلمة المرور',
  )
}

// تعيين كلمة مرور جديدة

export async function resetPassword(token, newPassword) {
  const response = await fetch(
    `${API_BASE_URL}/auth/reset-password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        token,
        new_password: newPassword,
      }),
    },
  )

  return parseResponse(
    response,
    'تعذر تغيير كلمة المرور',
  )
}

export async function createTrainerApplication(applicationData) {
  const response = await fetch(`${API_BASE_URL}/trainer-applications/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(applicationData),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (Array.isArray(data.detail)) {
      throw new Error(data.detail.map((item) => item.msg).join('، '))
    }

    throw new Error(data.detail || 'تعذر إرسال طلب المدرب.')
  }

  return data
}

