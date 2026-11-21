import type { StudentSubject } from '../api/types'

/** Capas usadas na prateleira de disciplinas (página Disciplinas e dashboard). */
export const BOOK_COVER_STYLES = [
  'bg-gradient-to-br from-[#0d3950] via-[#092b3d] to-[#051c28] text-white',
  'bg-gradient-to-br from-[#006768] via-[#005253] to-[#003b3c] text-white',
  'bg-gradient-to-br from-[#124e66] via-[#0d3b4f] to-[#082735] text-white',
  'bg-gradient-to-br from-[#1e4363] via-[#15314b] to-[#0c2033] text-white',
  'bg-gradient-to-br from-[#0e6b7c] via-[#0a5260] to-[#063842] text-white',
  'bg-gradient-to-br from-[#1b5e5a] via-[#134643] to-[#0b2e2c] text-white',
]

export function toSemesterLabel(semester: number): string {
  return `${semester}º semestre`
}

export function getProfessorDisplay(item: StudentSubject): string {
  const fromRelation = item.professor?.name?.trim()
  if (fromRelation) return fromRelation
  const fromDisplay = item.display_professor_name?.trim()
  if (fromDisplay) return fromDisplay
  const fromName = item.professor_name?.trim()
  if (fromName) return fromName
  return 'Professor não informado'
}
