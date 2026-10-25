import { API_BASE_URL } from './api'

function getAuthHeaders() {
  const token = sessionStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...getAuthHeaders(),
      ...options.headers,
    },
  })

  const text = await response.text()
  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const detail =
      typeof data === 'object' && data !== null
        ? data.detail
        : data

    const message = Array.isArray(detail)
      ? detail.map((item) => item.msg || String(item)).join('، ')
      : typeof detail === 'string'
        ? detail
        : 'تعذر تنفيذ العملية. حاول مرة أخرى.'

    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return data
}

// إدارة التقييمات - المسؤول

export function getEvaluationForCourse(courseId) {
  return request(`/evaluations/course/${courseId}`)
}

export function createEvaluation(payload) {
  return request('/evaluations/', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateEvaluation(evaluationId, payload) {
  return request(`/evaluations/${evaluationId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function getEvaluationQuestions(evaluationId) {
  return request(`/evaluations/${evaluationId}/questions`)
}

export function createEvaluationQuestion(payload) {
  return request('/evaluations/questions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateEvaluationQuestion(questionId, payload) {
  return request(`/evaluations/questions/${questionId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

// التقييمات - المتدرب

export function getEvaluationStatus(courseId) {
  return request(`/evaluations/status/${courseId}`)
}

export function getAvailableEvaluation(courseId) {
  return request(`/evaluations/available/${courseId}`)
}

export function getAvailableEvaluationQuestions(courseId) {
  return request(`/evaluations/available/${courseId}/questions`)
}

export function submitEvaluation(payload) {
  return request('/evaluations/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
