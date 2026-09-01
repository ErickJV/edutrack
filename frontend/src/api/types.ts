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
}
