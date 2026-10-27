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

export type ProfileUpdatePayload = {
  full_name?: string
  course_offering_id: string
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
  term?: AcademicTerm | null
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

export type StudyFolder = {
  id: string
  name: string
  color: string
  icon: string
  notes_count: number
  created_at: string
  updated_at: string
}

export type StudyFolderPayload = {
  name: string
  color?: string
  icon?: string
}

export type StudyNote = {
  id: string
  folder: string | null
  folder_name?: string
  student_subject: string | null
  subject_name?: string
  task: string | null
  task_title?: string
  reading?: string | null
  reading_title?: string
  title: string
  content: string
  methodology: string
  created_at: string
  updated_at: string
}

export type StudyNotePayload = {
  folder?: string | null
  student_subject?: string | null
  task?: string | null
  reading?: string | null
  title?: string
  content?: string
  methodology?: string
}

export type PomodoroMode = 'focus' | 'short_break' | 'long_break'

export type PomodoroSettings = {
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  longBreakInterval: number
  soundEnabled: boolean
}

export type StudyMethodologyKey =
  | 'feynman'
  | 'spaced_repetition'
  | 'mind_map'
  | 'elaborative_interrogation'

export type AcademicReadingStatus =
  | 'NOT_STARTED'
  | 'READING'
  | 'COMPLETED'
  | 'PAUSED'
  | 'DROPPED'

export type AcademicReading = {
  id: string
  student_subject: string | null
  subject_name?: string
  title: string
  author: string
  total_pages: number
  current_page: number
  status: AcademicReadingStatus
  exam_name: string
  exam_questions_count: number
  exam_date: string | null
  target_date: string | null
  progress_percent: number
  suggested_pages_per_day: number
  created_at: string
  updated_at: string
}

export type AcademicReadingPayload = {
  student_subject?: string | null
  title: string
  author?: string
  total_pages: number
  current_page?: number
  status?: AcademicReadingStatus
  exam_name?: string
  exam_questions_count?: number
  exam_date?: string | null
  target_date?: string | null
}

export type ReadingLog = {
  id: string
  reading: string
  reading_title?: string
  pages_read: number
  current_page_after?: number
  date?: string
  read_date?: string
  created_at: string
}

export type ReadingLogPayload = {
  pages?: number
  pages_read?: number
  date?: string
  read_date?: string
  current_page?: number
}

export type ReadingDayData = {
  date: string
  dayLabel: string
  pages: number
  goalMet: boolean
}

export type ReadingSummary = {
  daily_goal: number
  today_pages_read: number
  active_streak: number
  last_14_days: ReadingDayData[]
}


export type AcademicTerm = {
  id: string
  name: string
  start_date: string
  end_date: string
  timezone: string
  created_at: string
  updated_at: string
}

export type AcademicTermPayload = {
  name: string
  start_date: string
  end_date: string
  timezone?: string
}

export type ClassSchedule = {
  id: string
  student_subject_id: string
  weekday: number
  start_time: string
  end_time: string
  room: string
  valid_from: string | null
  valid_until: string | null
  occurrences_count: number
  created_at: string
  updated_at: string
}

export type ClassSchedulePayload = {
  student_subject_id: string
  weekday: number
  start_time: string
  end_time: string
  room?: string
  valid_from?: string | null
  valid_until?: string | null
}

export type AttendanceStatus = 'present' | 'absent' | 'unrecorded'

export type ClassOccurrence = {
  id: string
  student_subject_id: string
  schedule_id: string | null
  origin_date: string | null
  replaces: string | null
  starts_at: string
  ends_at: string
  room: string
  cancelled: boolean
  attendance_status: AttendanceStatus
  individually_edited: boolean
  subject_name: string
  created_at: string
  updated_at: string
}
