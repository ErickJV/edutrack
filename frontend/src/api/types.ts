export type CourseOffering = {
  id: string
  course_name: string
  course_slug: string
  degree_type: 'bachelor' | 'technologist'
  degree_type_label: string
  modality: 'in_person' | 'digital'
  modality_label: string
  label: string
}

export type AuthUser = {
  id: string
  email: string
  display: string
  full_name: string
  has_usable_password: boolean
  profile_complete: boolean
  course_offering: CourseOffering | null
}

export type AuthResponse = {
  status: number
  data?: {
    user?: AuthUser
    methods?: Array<{ method: string; at: number }>
    flows?: Array<{ id: string; is_pending?: boolean; providers?: string[] }>
  }
  meta?: { is_authenticated: boolean }
  errors?: Array<{ message: string; code: string; param?: string }>
}

export type ProfilePayload = {
  full_name: string
  course_offering_id: string
  accept_legal: boolean
  password?: string
}

export type AcademicSubject = {
  id: string
  course: string
  course_name: string
  name: string
  code: string
  semester: number
  workload_hours: number
  description: string
  active: boolean
}

export type Professor = {
  id: string
  name: string
  active: boolean
  created_at: string
}

export type StudentSubject = {
  id: string
  subject: AcademicSubject
  professor?: Professor | null
  professor_name: string
  display_professor_name?: string
  custom_workload_hours?: number | null
  effective_workload_hours?: number
  status: 'active' | 'completed' | 'dropped'
  semester_period: string
  progress_percent: number
  created_at: string
  updated_at: string
}
export type AcademicTaskStatus = 'pending' | 'in_progress' | 'completed'

export type AcademicTask = {
  id: string
  student_subject: string
  subject_id: string
  subject_name: string
  subject_semester: number
  title: string
  description: string
  due_date: string | null
  status: AcademicTaskStatus
  estimated_minutes: number
  actual_minutes: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type AcademicTaskPayload = {
  student_subject: string
  title: string
  description?: string
  due_date?: string | null
  status?: AcademicTaskStatus
  estimated_minutes?: number
  actual_minutes?: number
}

export type DashboardSummary = {
  subjects_count: number
  pending_tasks_count: number
  overdue_tasks_count: number
  completed_tasks_count: number
  planned_minutes_total: number
  actual_minutes_total: number
  weighted_progress_percent: number
  upcoming_tasks: AcademicTask[]
}
