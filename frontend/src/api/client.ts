import type { AuthResponse, AuthUser, CourseOffering, ProfilePayload } from './types'

const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || '').replace(/\/$/, '')

export class ApiError extends Error {
  status: number
  fieldErrors: Record<string, string>

  constructor(message: string, status = 0, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

function csrfToken(): string {
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith('edutrack_csrf='))
  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : ''
}

function errorFrom(body: any, status: number): ApiError {
  const fieldErrors: Record<string, string> = {}
  if (Array.isArray(body?.errors)) {
    for (const error of body.errors) {
      if (error.param) fieldErrors[error.param] = error.message
    }
    const first = body.errors[0]?.message
    return new ApiError(first || 'Não foi possível concluir a solicitação.', status, fieldErrors)
  }
  if (body?.errors && typeof body.errors === 'object') {
    for (const [key, value] of Object.entries(body.errors)) {
      fieldErrors[key] = Array.isArray(value) ? String(value[0]) : String(value)
    }
    return new ApiError(Object.values(fieldErrors)[0] || 'Confira os dados informados.', status, fieldErrors)
  }
  return new ApiError('Não foi possível concluir a solicitação.', status)
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  allowedStatuses: number[] = [],
): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
    const token = csrfToken()
    if (token) headers.set('X-CSRFToken', token)
  }
  const response = await fetch(`${API_ORIGIN}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })
  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json') ? await response.json() : null
  if (!response.ok && !allowedStatuses.includes(response.status)) throw errorFrom(body, response.status)
  return body as T
}

export async function initializeAuth(): Promise<void> {
  await request('/_allauth/browser/v1/config', {}, [401])
}

export async function getSession(): Promise<AuthUser | null> {
  const body = await request<AuthResponse>('/_allauth/browser/v1/auth/session', {}, [401])
  return body.data?.user || null
}

export async function signUp(payload: {
  full_name: string
  email: string
  course_offering_id: string
  password: string
  accept_legal: boolean
}): Promise<AuthResponse> {
  return request(
    '/_allauth/browser/v1/auth/signup',
    { method: 'POST', body: JSON.stringify(payload) },
    [401],
  )
}

export async function verifyEmail(key: string): Promise<AuthResponse> {
  return request('/_allauth/browser/v1/auth/email/verify', {
    method: 'POST',
    body: JSON.stringify({ key }),
  })
}

export async function resendVerification(): Promise<AuthResponse> {
  return request('/_allauth/browser/v1/auth/email/verify/resend', { method: 'POST' }, [401])
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return request(
    '/_allauth/browser/v1/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    [401],
  )
}

export async function setSessionPreference(remember: boolean): Promise<void> {
  await request('/api/v1/session', { method: 'PUT', body: JSON.stringify({ remember }) })
}

export async function logout(): Promise<void> {
  await request('/_allauth/browser/v1/auth/session', { method: 'DELETE' }, [401])
}

export async function requestPasswordReset(email: string): Promise<void> {
  await request(
    '/_allauth/browser/v1/auth/password/request',
    { method: 'POST', body: JSON.stringify({ email }) },
    [401],
  )
}

export async function resetPassword(key: string, password: string): Promise<void> {
  await request(
    '/_allauth/browser/v1/auth/password/reset',
    { method: 'POST', body: JSON.stringify({ key, password }) },
    [401],
  )
}

export async function listCourseOfferings(): Promise<CourseOffering[]> {
  return request<CourseOffering[]>('/api/v1/course-offerings')
}

export async function completeProfile(payload: ProfilePayload): Promise<AuthUser> {
  return request<AuthUser>('/api/v1/profile', { method: 'PUT', body: JSON.stringify(payload) })
}

export function googleLoginAction(): string {
  return `${API_ORIGIN}/_allauth/browser/v1/auth/provider/redirect`
}

export function getCsrfToken(): string {
  return csrfToken()
}
