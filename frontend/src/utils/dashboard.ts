import type { AcademicTask, CalendarItem } from '../api/types'
import { itemToDateKey, toLocalDateKey, WEEKDAYS_FULL, WEEKDAYS_SHORT } from './calendar'

export function getGreeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function formatLongDate(date = new Date()): string {
  return date
    .toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
    .toUpperCase()
}

export function getInitials(name: string | null | undefined): string {
  const parts = (name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : ''
  return `${first}${last}`.toUpperCase()
}

export function formatMinutes(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes))
  if (safe < 60) return `${safe}min`
  const hours = Math.floor(safe / 60)
  const rest = safe % 60
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}min`
}

export type DueLabel = { label: string; urgent: boolean; overdue: boolean }

export function formatDueLabel(value: string | null, now = new Date()): DueLabel {
  if (!value) return { label: 'Sem prazo', urgent: false, overdue: false }
  const due = new Date(value)
  if (Number.isNaN(due.getTime())) return { label: 'Sem prazo', urgent: false, overdue: false }

  const diffMs = due.getTime() - now.getTime()
  if (diffMs < 0) {
    const lateDays = Math.max(1, Math.ceil(-diffMs / 86_400_000))
    return {
      label: `Vencida há ${lateDays} ${lateDays === 1 ? 'dia' : 'dias'}`,
      urgent: true,
      overdue: true,
    }
  }

  const hoursRemaining = Math.ceil(diffMs / 3_600_000)
  if (hoursRemaining < 24) {
    const shown = Math.max(1, hoursRemaining)
    return { label: `Vence em ${shown}h`, urgent: true, overdue: false }
  }

  const daysRemaining = Math.ceil(hoursRemaining / 24)
  return {
    label: `Em ${daysRemaining} ${daysRemaining === 1 ? 'dia' : 'dias'}`,
    urgent: hoursRemaining < 48,
    overdue: false,
  }
}

/** Segunda-feira 00:00 da semana que contém `date`. */
export function startOfWeek(date = new Date()): Date {
  const offset = (date.getDay() + 6) % 7
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - offset)
}

/** Sete dias (segunda a domingo) da semana que contém `date`. */
export function getWeekDays(date = new Date()): Date[] {
  const start = startOfWeek(date)
  return Array.from(
    { length: 7 },
    (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index),
  )
}

export type WeekLoad = {
  key: string
  weekdayShort: string
  weekdayFull: string
  minutes: number
  items: number
  isToday: boolean
}

function calendarItemMinutes(item: CalendarItem): number {
  if (item.all_day || !item.ends_at) return 0
  const start = new Date(item.starts_at).getTime()
  const end = new Date(item.ends_at).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return 0
  return Math.max(0, Math.round((end - start) / 60_000))
}

/**
 * Carga planejada por dia: duração de aulas/eventos + tempo estimado das tarefas
 * pendentes com prazo no dia. `items` conta os itens de calendário não cancelados.
 */
export function buildWeekLoad(
  days: Date[],
  calendarItems: CalendarItem[],
  tasks: AcademicTask[],
  now = new Date(),
): WeekLoad[] {
  const todayKey = toLocalDateKey(now)
  const byDay = new Map<string, { minutes: number; items: number }>()

  for (const item of calendarItems) {
    if (item.cancelled) continue
    const key = itemToDateKey(item)
    const bucket = byDay.get(key) ?? { minutes: 0, items: 0 }
    bucket.items += 1
    if (item.source_type === 'class' || item.source_type === 'event') {
      bucket.minutes += calendarItemMinutes(item)
    }
    byDay.set(key, bucket)
  }

  for (const task of tasks) {
    if (task.status === 'completed' || !task.due_date) continue
    const due = new Date(task.due_date)
    if (Number.isNaN(due.getTime())) continue
    const key = toLocalDateKey(due)
    const bucket = byDay.get(key) ?? { minutes: 0, items: 0 }
    bucket.minutes += Math.max(0, task.estimated_minutes || 0)
    byDay.set(key, bucket)
  }

  return days.map((day) => {
    const key = toLocalDateKey(day)
    const idx = (day.getDay() + 6) % 7
    const bucket = byDay.get(key)
    return {
      key,
      weekdayShort: WEEKDAYS_SHORT[idx],
      weekdayFull: WEEKDAYS_FULL[idx],
      minutes: bucket?.minutes ?? 0,
      items: bucket?.items ?? 0,
      isToday: key === todayKey,
    }
  })
}
