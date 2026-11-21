import type { CalendarItem } from '../api/types'

export const WEEKDAYS_FULL = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
]
export const WEEKDAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function toLocalDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  if (!y || !m || !d) return new Date()
  return new Date(y, m - 1, d)
}

export function itemToDateKey(item: CalendarItem): string {
  const parsed = new Date(item.starts_at)
  if (Number.isNaN(parsed.getTime())) {
    return item.starts_at.slice(0, 10)
  }
  return toLocalDateKey(parsed)
}

export function formatShortTime(item: CalendarItem): string {
  if (item.all_day) return 'Dia todo'
  const start = new Date(item.starts_at)
  if (Number.isNaN(start.getTime())) return ''
  return start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function formatTimeRange(item: CalendarItem): string {
  if (item.all_day) return 'Dia inteiro'
  const start = new Date(item.starts_at)
  if (Number.isNaN(start.getTime())) return ''
  const startStr = start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (!item.ends_at || item.ends_at === item.starts_at) return startStr
  const end = new Date(item.ends_at)
  if (Number.isNaN(end.getTime())) return startStr
  const endStr = end.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  return `${startStr} – ${endStr}`
}

export type CategoryMeta = {
  label: string
  shortLabel: string
  originLabel: string
  originLink: string
  cardClass: string
  dotClass: string
  badgeClass: string
}

export function getCategoryMeta(item: CalendarItem): CategoryMeta {
  if (item.source_type === 'class') {
    return {
      label: 'Aula',
      shortLabel: 'Aula',
      originLabel: 'Disciplinas',
      originLink: '/disciplinas',
      cardClass: item.cancelled
        ? 'border-l-4 border-l-slate-400 border-slate-200 bg-slate-100/80 text-slate-500 line-through dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400'
        : 'border-l-4 border-l-emerald-500 border-emerald-500/25 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100',
      dotClass: 'bg-emerald-500',
      badgeClass:
        'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
    }
  }
  if (item.source_type === 'reading') {
    return {
      label: 'Anotações & Leitura',
      shortLabel: 'Leitura',
      originLabel: 'Anotações',
      originLink: '/estudo',
      cardClass:
        'border-l-4 border-l-cyan-500 border-cyan-500/25 bg-cyan-500/10 text-cyan-950 dark:text-cyan-100',
      dotClass: 'bg-cyan-500',
      badgeClass: 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30',
    }
  }
  const isDone = item.task_status === 'completed'
  if (item.kind === 'exam') {
    return {
      label: isDone ? 'Prova concluída' : 'Prova | Avaliação',
      shortLabel: isDone ? 'Prova ✓' : 'Prova',
      originLabel: 'Tarefas',
      originLink: '/tarefas',
      cardClass: isDone
        ? 'border-l-4 border-l-emerald-500 border-emerald-500/25 bg-emerald-500/10 text-emerald-900 line-through dark:text-emerald-200/80'
        : 'border-l-4 border-l-rose-500 border-rose-500/25 bg-rose-500/10 text-rose-950 dark:text-rose-100',
      dotClass: isDone ? 'bg-emerald-500' : 'bg-rose-500',
      badgeClass: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30',
    }
  }
  if (item.kind === 'assignment') {
    return {
      label: isDone ? 'Trabalho concluído' : 'Trabalho | Projeto',
      shortLabel: isDone ? 'Trabalho ✓' : 'Trabalho',
      originLabel: 'Tarefas',
      originLink: '/tarefas',
      cardClass: isDone
        ? 'border-l-4 border-l-emerald-500 border-emerald-500/25 bg-emerald-500/10 text-emerald-900 line-through dark:text-emerald-200/80'
        : 'border-l-4 border-l-violet-500 border-violet-500/25 bg-violet-500/10 text-violet-950 dark:text-violet-100',
      dotClass: isDone ? 'bg-emerald-500' : 'bg-violet-500',
      badgeClass: 'bg-violet-500/15 text-violet-800 dark:text-violet-300 border-violet-500/30',
    }
  }
  if (item.source_type === 'task' || item.kind === 'task') {
    return {
      label: isDone ? 'Tarefa concluída' : 'Tarefa | Entrega',
      shortLabel: isDone ? 'Concluída' : 'Tarefa',
      originLabel: 'Tarefas',
      originLink: '/tarefas',
      cardClass: isDone
        ? 'border-l-4 border-l-emerald-500 border-emerald-500/25 bg-emerald-500/10 text-emerald-900 line-through dark:text-emerald-200/80'
        : 'border-l-4 border-l-amber-500 border-amber-500/25 bg-amber-500/10 text-amber-950 dark:text-amber-100',
      dotClass: isDone ? 'bg-emerald-500' : 'bg-amber-500',
      badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
    }
  }
  return {
    label: isDone ? 'Atividade concluída' : 'Estudo | Atividade',
    shortLabel: isDone ? 'Atividade ✓' : 'Atividade',
    originLabel: 'Tarefas',
    originLink: '/tarefas',
    cardClass: isDone
      ? 'border-l-4 border-l-emerald-500 border-emerald-500/25 bg-emerald-500/10 text-emerald-900 line-through dark:text-emerald-200/80'
      : 'border-l-4 border-l-sky-500 border-sky-500/25 bg-sky-500/10 text-sky-950 dark:text-sky-100',
    dotClass: isDone ? 'bg-emerald-500' : 'bg-sky-500',
    badgeClass: 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30',
  }
}

export type MonthCell = {
  date: Date
  key: string
  isCurrentMonth: boolean
  isToday: boolean
  weekdayShort: string
  weekdayFull: string
}

/** Grade mensal (segunda a domingo) cobrindo todas as semanas do mês. */
export function buildMonthCells(month: Date, today = new Date()): MonthCell[] {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstDayOfMonth = new Date(year, monthIndex, 1)
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0)

  const startOffset = (firstDayOfMonth.getDay() + 6) % 7
  const totalDaysInMonth = lastDayOfMonth.getDate()
  const totalCells = Math.ceil((startOffset + totalDaysInMonth) / 7) * 7
  const gridStart = new Date(year, monthIndex, 1 - startOffset)

  const cells: MonthCell[] = []
  const todayKey = toLocalDateKey(today)
  for (let i = 0; i < totalCells; i++) {
    const cellDate = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i,
    )
    const key = toLocalDateKey(cellDate)
    const wdIdx = (cellDate.getDay() + 6) % 7
    cells.push({
      date: cellDate,
      key,
      isCurrentMonth: cellDate.getMonth() === monthIndex,
      isToday: key === todayKey,
      weekdayShort: WEEKDAYS_SHORT[wdIdx],
      weekdayFull: WEEKDAYS_FULL[wdIdx],
    })
  }
  return cells
}
