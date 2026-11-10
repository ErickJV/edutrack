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
  email?: string
  course_offering_id?: string
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
export type AcademicTaskCategory = 'task' | 'assignment' | 'exam' | 'other'

export type AcademicTask = {
  id: string
  student_subject: string | null
  subject_id: string | null
  subject_name: string
  subject_semester: number | null
  category?: AcademicTaskCategory
  title: string
  description: string
  due_date: string | null
  end_date?: string | null
  all_day?: boolean
  room?: string
  status: AcademicTaskStatus
  estimated_minutes: number
  actual_minutes: number
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type AcademicTaskPayload = {
  student_subject?: string | null
  category?: AcademicTaskCategory
  title: string
  description?: string
  due_date?: string | null
  end_date?: string | null
  all_day?: boolean
  room?: string
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

export type AcademicEventKind = 'exam' | 'assignment' | 'other'

export type AcademicEvent = {
  id: string
  title: string
  kind: AcademicEventKind
  starts_at: string
  ends_at: string | null
  all_day: boolean
  room: string
  description: string
  student_subject_id: string | null
  subject_name?: string | null
  created_at: string
  updated_at: string
}

export type AcademicEventPayload = {
  title: string
  kind: AcademicEventKind
  starts_at: string
  ends_at?: string | null
  all_day?: boolean
  room?: string
  description?: string
  student_subject_id?: string | null
}

export type CalendarItemKind = 'class' | 'task' | 'exam' | 'assignment' | 'other' | 'reading'

export type CalendarItem = {
  id: string
  source_type: 'class' | 'event' | 'task' | 'reading'
  source_id: string
  title: string
  description?: string
  starts_at: string
  ends_at: string | null
  room: string
  student_subject_id: string | null
  subject_name: string | null
  cancelled: boolean
  attendance_status: AttendanceStatus | null
  all_day: boolean
  kind: CalendarItemKind
  task_status?: AcademicTaskStatus
  reading_progress?: number
  reading_pages?: string
}

export type FlashcardState = 'new' | 'learning' | 'review'
export type FlashcardRating = 'again' | 'hard' | 'good' | 'easy'

export type Flashcard = {
  id: string
  student_subject: string | null
  subject_name?: string | null
  deck_name: string
  front: string
  back: string
  hint: string
  tags: string
  state: FlashcardState
  ease_factor: number
  interval_days: number
  repetitions: number
  lapses: number
  due_at: string
  is_due: boolean
  last_reviewed_at: string | null
  created_at: string
  updated_at: string
}

export type FlashcardPayload = {
  student_subject?: string | null
  deck_name?: string
  front: string
  back: string
  hint?: string
  tags?: string
}

export type FlashcardAIGeneratePayload = {
  topic?: string
  source_text?: string
  note_id?: string | null
  student_subject?: string | null
  deck_name?: string
  count?: number
}

export type FlashcardAIGenerateResponse = {
  created_count: number
  items: Flashcard[]
}

export type AssistantChatMessage = {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  animation?: string
}

export type AssistantChatRequest = {
  message: string
  history?: Array<{ role: string; content: string }>
}

export type AssistantChatResponse = {
  reply: string
  animation: string
  timestamp: string
}

export type AssistantStatus = {
  configured: boolean
  mode: string
  model: string
}

export type AssistantStudentContext = {
  generated_at: string
  student: {
    full_name: string
    email: string
    course: string
    degree_type: string
    modality: string
  }
  subjects: Array<{
    id: string
    name: string
    code: string
    semester: number
    professor: string
    workload_hours: number
    period: string
    faltas: number
    aulas_registradas: number
    tarefas_total: number
    tarefas_concluidas: number
  }>
  tasks: {
    overdue: Array<{ id: string; title: string; subject: string; status: string; due_date: string | null }>
    pending: Array<{ id: string; title: string; subject: string; status: string; due_date: string | null }>
    completed_recent: Array<{ id: string; title: string; subject: string; status: string }>
  }
  upcoming_events: Array<{
    id: string
    title: string
    kind: string
    subject: string
    starts_at: string
    all_day: boolean
    room: string
  }>
  readings: Array<{
    id: string
    title: string
    author: string
    subject: string
    current_page: number
    total_pages: number
    progress_percent: number
  }>
}

export type StudyDocumentPage = {
  id: string
  page_number: number
  content: string
  token_count: number
  created_at?: string
}

export type ComplexTopic = {
  topic: string
  explanation: string
  citation: string
  example: string
}

export type KeyConcept = {
  term: string
  definition: string
  citation: string
}

export type StudyRoadmapStep = {
  step: number
  goal: string
  recommended_pages: string
  action: string
}

export type ComplementaryMaterial = {
  title: string
  type: string
  description: string
}

export type StudyDocumentAnalysis = {
  summary: string
  complex_topics: ComplexTopic[]
  key_concepts: KeyConcept[]
  mental_map_mermaid: string
  study_roadmap: StudyRoadmapStep[]
  reinforcement_topics: string[]
  complementary_materials: ComplementaryMaterial[]
}

export type StudyDocument = {
  id: string
  title: string
  file?: string
  file_url?: string | null
  file_type: string
  file_size: number
  page_count: number
  pages_count: number
  student_subject?: string | null
  student_subject_name?: string | null
  folder?: string | null
  folder_name?: string | null
  topic?: string
  extracted_text?: string
  analysis_cache?: StudyDocumentAnalysis | null
  pages?: StudyDocumentPage[]
  created_at: string
  updated_at: string
}

export type QuizQuestion = {
  id: number
  question: string
  options: string[]
  correct_option_index: number
  citation: string
  explanation: string
}

export type StudyQuiz = {
  id: string
  title: string
  document?: string | null
  document_title?: string | null
  student_subject?: string | null
  student_subject_name?: string | null
  questions: QuizQuestion[]
  score?: number | null
  total_questions: number
  completed_at?: string | null
  user_answers?: Record<string, number>
  created_at: string
}

export type QuizSubmissionResult = {
  quiz_id: string
  score: number
  total_questions: number
  percentage: number
  feedback: Array<{
    question_id: string
    is_correct: boolean
    user_selected: number
    correct_option_index: number
    explanation: string
    citation: string
  }>
}

