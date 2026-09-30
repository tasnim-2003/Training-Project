const API_BASE_URL = 'http://127.0.0.1:8000'


async function parseResponse(response, defaultMessage) {
  const data = await response.json()

  if (!response.ok) {
    if (Array.isArray(data.detail)) {
      throw new Error(
        data.detail
          .map((item) => item.msg)
          .join('، '),
      )
    }

    throw new Error(
      data.detail || defaultMessage,
    )
  }

  return data
}


function getAuthHeaders() {
  const token = sessionStorage.getItem('access_token')

  if (!token) {
    return {}
  }

  return {
    Authorization: `Bearer ${token}`,
  }
}


export async function registerUser(userData) {
  const response = await fetch(
    `${API_BASE_URL}/auth/register`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(userData),
    },
  )

  return parseResponse(
    response,
    'حدث خطأ أثناء إنشاء الحساب',
  )
}


export async function loginUser(email, password) {
  const params = new URLSearchParams({
    email,
    password,
  })

  const response = await fetch(
    `${API_BASE_URL}/auth/login?${params.toString()}`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
    },
  )

  return parseResponse(
    response,
    'حدث خطأ أثناء تسجيل الدخول',
  )
}


export async function getCourses() {
  const response = await fetch(
    `${API_BASE_URL}/courses/`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
  )

  return parseResponse(
    response,
    'تعذر تحميل البرامج التدريبية',
  )
}


export async function getAdminCourses() {
  const response = await fetch(
    `${API_BASE_URL}/courses/admin`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    },
  )

  return parseResponse(
    response,
    'تعذر تحميل الدورات',
  )
}


export async function getCourseById(id) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${id}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    },
  )

  return parseResponse(
    response,
    'تعذر تحميل بيانات البرنامج',
  )
}


export async function getAdminCourseById(id) {
  const response = await fetch(
    `${API_BASE_URL}/courses/admin/${id}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    },
  )

  return parseResponse(
    response,
    'تعذر تحميل بيانات الدورة',
  )
}


export async function createCourse(courseData) {
  const response = await fetch(
    `${API_BASE_URL}/courses/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(courseData),
    },
  )

  return parseResponse(
    response,
    'حدث خطأ أثناء إنشاء الدورة',
  )
}


export async function updateCourse(id, courseData) {
  const response = await fetch(
    `${API_BASE_URL}/courses/${id}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(courseData),
    },
  )

  return parseResponse(
    response,
    'حدث خطأ أثناء تعديل الدورة',
  )
}


export async function createEnrollment(courseId) {
  const response = await fetch(
    `${API_BASE_URL}/enrollments/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        course_id: courseId,
      }),
    },
  )

  return parseResponse(
    response,
    'حدث خطأ أثناء إرسال طلب التسجيل',
  )
}


export async function getMyEnrollments() {
  const response = await fetch(
    `${API_BASE_URL}/enrollments/my`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...getAuthHeaders(),
      },
    },
  )

  return parseResponse(
    response,
    'تعذر تحميل برامجك التدريبية',
  )
}


export function saveAuthData(loginData) {
  sessionStorage.setItem(
    'access_token',
    loginData.access_token,
  )

  sessionStorage.setItem(
    'user',
    JSON.stringify(loginData.user),
  )
}


export function clearAuthData() {
  sessionStorage.removeItem('access_token')
  sessionStorage.removeItem('user')
}


export function getStoredUser() {
  const user = sessionStorage.getItem('user')

  if (!user) {
    return null
  }

  try {
    return JSON.parse(user)
  } catch {
    return null
  }
}