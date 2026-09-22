import type {
  AcademicReading,
  AcademicReadingPayload,
  AcademicSubject,
  AcademicTask,
  AcademicTaskPayload,
  AcademicTaskStatus,
  AcademicTerm,
  AcademicTermPayload,
  AuthResponse,
  AuthUser,
  ClassOccurrence,
  ClassSchedule,
  ClassSchedulePayload,
  CourseOffering,
  DashboardSummary,
  Professor,
  ProfilePayload,
  ReadingLog,
  ReadingLogPayload,
  StudentSubject,
  StudyFolder,
  StudyFolderPayload,
  StudyNote,
  StudyNotePayload,
} from './types'

const API_ORIGIN = (import.meta.env.VITE_API_ORIGIN || '').replace(/\/$/, '')

type ErrorWithParams = {
  message: string
  code: string
  param?: string
}

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

function errorFrom(body: unknown, status: number): ApiError {
  const fieldErrors: Record<string, string> = {}
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return new ApiError('Não foi possível concluir a solicitação.', status)
  }

  const payload = body as { errors?: unknown }
  const errors = payload.errors
  if (Array.isArray(errors)) {
    for (const error of errors as ErrorWithParams[]) {
      if (error.param) fieldErrors[error.param] = error.message
    }
    const firstMessage = (errors[0] as ErrorWithParams | undefined)?.message
    return new ApiError(firstMessage || 'Não foi possível concluir a solicitação.', status, fieldErrors)
  }

  if (typeof errors === 'object' && errors !== null && !Array.isArray(errors)) {
    for (const [key, value] of Object.entries(errors as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        fieldErrors[key] = String(value[0] ?? '')
      } else {
        fieldErrors[key] = String(value)
      }
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

export async function listCurriculum(): Promise<AcademicSubject[]> {
  return request<AcademicSubject[]>('/api/v1/curriculum')
}

export async function listStudentSubjects(): Promise<StudentSubject[]> {
  return request<StudentSubject[]>('/api/v1/student-subjects')
}

export async function saveStudentSubjects(payload: { semester_period?: string; subject_ids: string[] }): Promise<StudentSubject[]> {
  return request<StudentSubject[]>('/api/v1/student-subjects', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, [201])
}

export async function updateStudentSubject(
  id: string,
  payload: {
    professor_name?: string
    custom_workload_hours?: number | null
    professor_id?: string | null
    term_id?: string | null
  },
): Promise<StudentSubject> {
  return request<StudentSubject>(`/api/v1/student-subjects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function listProfessors(includeArchived = false): Promise<Professor[]> {
  const query = includeArchived ? '?include_archived=true' : ''
  return request<Professor[]>(`/api/v1/professors${query}`)
}

export async function createProfessor(payload: { name: string }): Promise<Professor> {
  return request<Professor>('/api/v1/professors', { method: 'POST', body: JSON.stringify(payload) }, [201])
}

export async function updateProfessor(id: string, payload: { name: string }): Promise<Professor> {
  return request<Professor>(`/api/v1/professors/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function deleteProfessor(id: string): Promise<void> {
  await request(`/api/v1/professors/${id}`, { method: 'DELETE' }, [204])
}

export async function listAcademicTasks(params: { student_subject?: string; status?: AcademicTaskStatus } = {}): Promise<AcademicTask[]> {
  const search = new URLSearchParams()
  if (params.student_subject) search.set('student_subject', params.student_subject)
  if (params.status) search.set('status', params.status)
  const suffix = search.toString() ? `?${search.toString()}` : ''
  return request<AcademicTask[]>(`/api/v1/tasks${suffix}`)
}

export async function createAcademicTask(payload: AcademicTaskPayload): Promise<AcademicTask> {
  return request<AcademicTask>('/api/v1/tasks', { method: 'POST', body: JSON.stringify(payload) }, [201])
}

export async function updateAcademicTask(id: string, payload: Partial<AcademicTaskPayload>): Promise<AcademicTask> {
  return request<AcademicTask>(`/api/v1/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function deleteAcademicTask(id: string): Promise<void> {
  await request(`/api/v1/tasks/${id}`, { method: 'DELETE' }, [204])
}

export async function toggleAcademicTaskComplete(id: string): Promise<AcademicTask> {
  return request<AcademicTask>(`/api/v1/tasks/${id}/toggle-complete`, { method: 'POST' })
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return request<DashboardSummary>('/api/v1/dashboard/summary')
}

export function googleLoginAction(): string {
  return `${API_ORIGIN}/_allauth/browser/v1/auth/provider/redirect`
}

export function getCsrfToken(): string {
  return csrfToken()
}

export async function listStudyFolders(): Promise<StudyFolder[]> {
  return request<StudyFolder[]>('/api/v1/study-folders')
}

export async function createStudyFolder(payload: StudyFolderPayload): Promise<StudyFolder> {
  return request<StudyFolder>('/api/v1/study-folders', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, [201])
}

export async function updateStudyFolder(id: string, payload: Partial<StudyFolderPayload>): Promise<StudyFolder> {
  return request<StudyFolder>(`/api/v1/study-folders/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteStudyFolder(id: string): Promise<void> {
  await request(`/api/v1/study-folders/${id}`, { method: 'DELETE' }, [204])
}

export async function listStudyNotes(params: {
  folder?: string
  student_subject?: string
  task?: string
  reading?: string
  search?: string
} = {}): Promise<StudyNote[]> {
  const search = new URLSearchParams()
  if (params.folder) search.set('folder', params.folder)
  if (params.student_subject) search.set('student_subject', params.student_subject)
  if (params.task) search.set('task', params.task)
  if (params.reading) search.set('reading', params.reading)
  if (params.search) search.set('search', params.search)
  const suffix = search.toString() ? `?${search.toString()}` : ''
  return request<StudyNote[]>(`/api/v1/study-notes${suffix}`)
}

export async function createStudyNote(payload: StudyNotePayload): Promise<StudyNote> {
  return request<StudyNote>('/api/v1/study-notes', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, [201])
}

export async function updateStudyNote(id: string, payload: Partial<StudyNotePayload>): Promise<StudyNote> {
  return request<StudyNote>(`/api/v1/study-notes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteStudyNote(id: string): Promise<void> {
  await request(`/api/v1/study-notes/${id}`, { method: 'DELETE' }, [204])
}

export async function listAcademicReadings(params: {
  status?: string
  student_subject?: string
} = {}): Promise<AcademicReading[]> {
  const search = new URLSearchParams()
  if (params.status) search.set('status', params.status)
  if (params.student_subject) search.set('student_subject', params.student_subject)
  const suffix = search.toString() ? `?${search.toString()}` : ''
  return request<AcademicReading[]>(`/api/v1/academic-readings${suffix}`)
}

export async function createAcademicReading(payload: AcademicReadingPayload): Promise<AcademicReading> {
  return request<AcademicReading>('/api/v1/academic-readings', {
    method: 'POST',
    body: JSON.stringify(payload),
  }, [201])
}

export async function updateAcademicReading(
  id: string,
  payload: Partial<AcademicReadingPayload>
): Promise<AcademicReading> {
  return request<AcademicReading>(`/api/v1/academic-readings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export async function deleteAcademicReading(id: string): Promise<void> {
  await request(`/api/v1/academic-readings/${id}`, { method: 'DELETE' }, [204])
}

export async function logReadingPages(id: string, payload: ReadingLogPayload): Promise<AcademicReading> {
  const pages = payload.pages ?? payload.pages_read ?? 0
  const date = payload.read_date || payload.date || new Date().toISOString().split('T')[0]
  return request<AcademicReading>(`/api/v1/academic-readings/${id}/log`, {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      pages,
      pages_read: pages,
      date,
      read_date: date,
    }),
  })
}

export async function listReadingLogs(params: { reading?: string } = {}): Promise<ReadingLog[]> {
  const search = new URLSearchParams()
  if (params.reading) search.set('reading', params.reading)
  const suffix = search.toString() ? `?${search.toString()}` : ''
  return request<ReadingLog[]>(`/api/v1/reading-logs${suffix}`)
}


// Academic Terms
export async function listAcademicTerms(): Promise<AcademicTerm[]> {
  return request<AcademicTerm[]>('/api/v1/academic-terms')
}

export async function createAcademicTerm(payload: AcademicTermPayload): Promise<AcademicTerm> {
  return request<AcademicTerm>('/api/v1/academic-terms', { method: 'POST', body: JSON.stringify(payload) }, [201])
}

export async function updateAcademicTerm(id: string, payload: Partial<AcademicTermPayload>): Promise<AcademicTerm> {
  return request<AcademicTerm>(`/api/v1/academic-terms/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

// Class Schedules
export async function listClassSchedules(params: { student_subject_id?: string } = {}): Promise<ClassSchedule[]> {
  const search = new URLSearchParams()
  if (params.student_subject_id) search.set('student_subject_id', params.student_subject_id)
  const suffix = search.toString() ? `?${search}` : ''
  return request<ClassSchedule[]>(`/api/v1/class-schedules${suffix}`)
}

export async function createClassSchedule(payload: ClassSchedulePayload): Promise<ClassSchedule> {
  return request<ClassSchedule>('/api/v1/class-schedules', { method: 'POST', body: JSON.stringify(payload) }, [201])
}

export async function updateClassSchedule(id: string, payload: Partial<Omit<ClassSchedulePayload, 'student_subject_id'>>): Promise<ClassSchedule> {
  return request<ClassSchedule>(`/api/v1/class-schedules/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function deleteClassSchedule(id: string): Promise<void> {
  await request(`/api/v1/class-schedules/${id}`, { method: 'DELETE' }, [204])
}

// Class Occurrences
export async function listClassOccurrences(params: {
  student_subject_id?: string
  from?: string
  to?: string
} = {}): Promise<ClassOccurrence[]> {
  const search = new URLSearchParams()
  if (params.student_subject_id) search.set('student_subject_id', params.student_subject_id)
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)
  const suffix = search.toString() ? `?${search}` : ''
  return request<ClassOccurrence[]>(`/api/v1/class-occurrences${suffix}`)
}

export async function updateClassOccurrence(
  id: string,
  payload: { room?: string; cancelled?: boolean; starts_at?: string; ends_at?: string },
): Promise<ClassOccurrence> {
  return request<ClassOccurrence>(`/api/v1/class-occurrences/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })
}

export async function recordAttendance(
  occurrenceId: string,
  status: 'present' | 'absent' | 'unrecorded',
): Promise<ClassOccurrence> {
  return request<ClassOccurrence>(
    `/api/v1/class-occurrences/${occurrenceId}/attendance`,
    { method: 'PUT', body: JSON.stringify({ status }) },
  )
}

