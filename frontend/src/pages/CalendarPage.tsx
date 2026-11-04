import {
  BookOpen,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  GraduationCap,
  ListTodo,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  ApiError,
  createAcademicEvent,
  deleteAcademicEvent,
  listCalendarItems,
  listStudentSubjects,
  recordAttendance,
  toggleAcademicTaskComplete,
} from '../api/client'
import type {
  AcademicEventKind,
  CalendarItem,
  CalendarItemKind,
  StudentSubject,
} from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { AppNavigation } from '../components/AppNavigation'
import { Brand } from '../components/Brand'
import { Alert } from '../components/Feedback'
import { Input, PrimaryButton, Select } from '../components/FormControls'
import { ThemeToggle } from '../components/ThemeToggle'

const WEEKDAYS_FULL = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
]
const WEEKDAYS_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const MONTH_NAMES = [
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

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function itemToDateKey(item: CalendarItem): string {
  const parsed = new Date(item.starts_at)
  if (Number.isNaN(parsed.getTime())) {
    return item.starts_at.slice(0, 10)
  }
  return toLocalDateKey(parsed)
}

function formatShortTime(item: CalendarItem): string {
  if (item.all_day) return 'Dia todo'
  const start = new Date(item.starts_at)
  if (Number.isNaN(start.getTime())) return ''
  return start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatTimeRange(item: CalendarItem): string {
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

function getCategoryMeta(item: CalendarItem) {
  if (item.source_type === 'class') {
    return {
      label: 'Aula',
      originLabel: 'Disciplinas',
      originLink: '/disciplinas',
      cardClass: item.cancelled
        ? 'border-l-4 border-l-slate-400 border-slate-200 bg-slate-100/80 text-slate-500 line-through dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400'
        : 'border-l-4 border-l-emerald-500 border-emerald-500/25 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100',
      dotClass: 'bg-emerald-500',
      badgeClass: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
    }
  }
  if (item.source_type === 'task') {
    const isDone = item.task_status === 'completed'
    return {
      label: isDone ? 'Tarefa concluída' : 'Entrega de Tarefa',
      originLabel: 'Tarefas',
      originLink: '/tarefas',
      cardClass: isDone
        ? 'border-l-4 border-l-emerald-500 border-emerald-500/25 bg-emerald-500/10 text-emerald-900 line-through dark:text-emerald-200/80'
        : 'border-l-4 border-l-amber-500 border-amber-500/25 bg-amber-500/10 text-amber-950 dark:text-amber-100',
      dotClass: isDone ? 'bg-emerald-500' : 'bg-amber-500',
      badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
    }
  }
  if (item.source_type === 'reading') {
    return {
      label: 'Estudo & Leitura',
      originLabel: 'Estudo',
      originLink: '/estudo',
      cardClass:
        'border-l-4 border-l-cyan-500 border-cyan-500/25 bg-cyan-500/10 text-cyan-950 dark:text-cyan-100',
      dotClass: 'bg-cyan-500',
      badgeClass: 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border-cyan-500/30',
    }
  }
  if (item.kind === 'exam') {
    return {
      label: 'Prova / Avaliação',
      originLabel: 'Calendário',
      originLink: '/calendario',
      cardClass:
        'border-l-4 border-l-rose-500 border-rose-500/25 bg-rose-500/10 text-rose-950 dark:text-rose-100',
      dotClass: 'bg-rose-500',
      badgeClass: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30',
    }
  }
  if (item.kind === 'assignment') {
    return {
      label: 'Trabalho / Projeto',
      originLabel: 'Calendário',
      originLink: '/calendario',
      cardClass:
        'border-l-4 border-l-violet-500 border-violet-500/25 bg-violet-500/10 text-violet-950 dark:text-violet-100',
      dotClass: 'bg-violet-500',
      badgeClass: 'bg-violet-500/15 text-violet-800 dark:text-violet-300 border-violet-500/30',
    }
  }
  return {
    label: 'Evento Acadêmico',
    originLabel: 'Calendário',
    originLink: '/calendario',
    cardClass:
      'border-l-4 border-l-sky-500 border-sky-500/25 bg-sky-500/10 text-sky-950 dark:text-sky-100',
    dotClass: 'bg-sky-500',
    badgeClass: 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30',
  }
}

export function CalendarPage() {
  const { signOut } = useAuth()
  const [leaving, setLeaving] = useState(false)

  const today = useMemo(() => new Date(), [])
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedDateKey, setSelectedDateKey] = useState(() => toLocalDateKey(today))

  const [subjects, setSubjects] = useState<StudentSubject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedKind, setSelectedKind] = useState<string>('')

  const [items, setItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)

  // Modal de novo evento acadêmico
  const [showNewEventModal, setShowNewEventModal] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventKind, setEventKind] = useState<AcademicEventKind>('exam')
  const [eventDate, setEventDate] = useState(() => toLocalDateKey(today))
  const [eventStartTime, setEventStartTime] = useState('19:00')
  const [eventEndTime, setEventEndTime] = useState('21:00')
  const [eventAllDay, setEventAllDay] = useState(false)
  const [eventRoom, setEventRoom] = useState('')
  const [eventSubjectId, setEventSubjectId] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [savingEvent, setSavingEvent] = useState(false)

  // Calcula as células da grade mensal (Segunda a Domingo) cobrindo todas as semanas do mês
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)

    const startOffset = (firstDayOfMonth.getDay() + 6) % 7
    const totalDaysInMonth = lastDayOfMonth.getDate()
    const totalCells = Math.ceil((startOffset + totalDaysInMonth) / 7) * 7
    const gridStart = new Date(year, month, 1 - startOffset)

    const cells: Array<{
      date: Date
      key: string
      isCurrentMonth: boolean
      isToday: boolean
      weekdayShort: string
    }> = []
    const todayKey = toLocalDateKey(new Date())
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
        isCurrentMonth: cellDate.getMonth() === month,
        isToday: key === todayKey,
        weekdayShort: WEEKDAYS_SHORT[wdIdx],
      })
    }
    return cells
  }, [currentMonth])

  const loadCalendarData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const firstCell = calendarDays[0].date
      const lastCell = calendarDays[calendarDays.length - 1].date
      const fromIso = new Date(
        firstCell.getFullYear(),
        firstCell.getMonth(),
        firstCell.getDate(),
        0,
        0,
        0,
      ).toISOString()
      const toIso = new Date(
        lastCell.getFullYear(),
        lastCell.getMonth(),
        lastCell.getDate(),
        23,
        59,
        59,
      ).toISOString()

      const data = await listCalendarItems({
        from: fromIso,
        to: toIso,
        student_subject_id: selectedSubjectId || undefined,
        kind: (selectedKind || undefined) as CalendarItemKind | undefined,
      })
      setItems(data)
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : 'Não foi possível carregar os itens do calendário.',
      )
    } finally {
      setLoading(false)
    }
  }, [calendarDays, selectedSubjectId, selectedKind])

  useEffect(() => {
    listStudentSubjects()
      .then((list) => setSubjects(list.filter((s) => s.status === 'active')))
      .catch(() => {})
  }, [])

  useEffect(() => {
    void loadCalendarData()
  }, [loadCalendarData])

  // Agrupamento por data local YYYY-MM-DD
  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const item of items) {
      const key = itemToDateKey(item)
      const bucket = map.get(key)
      if (bucket) {
        bucket.push(item)
      } else {
        map.set(key, [item])
      }
    }
    return map
  }, [items])

  const selectedDayItems = useMemo(
    () => itemsByDate.get(selectedDateKey) || [],
    [itemsByDate, selectedDateKey],
  )

  // Dias do mês atual para visão responsiva em telas pequenas
  const currentMonthDays = useMemo(
    () => calendarDays.filter((c) => c.isCurrentMonth),
    [calendarDays],
  )

  // Resumo numérico do mês visível
  const monthSummary = useMemo(() => {
    const monthPrefix = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`
    let classes = 0
    let tasks = 0
    let readings = 0
    let events = 0
    for (const item of items) {
      const key = itemToDateKey(item)
      if (!key.startsWith(monthPrefix)) continue
      if (item.source_type === 'class' && !item.cancelled) classes++
      else if (item.source_type === 'task') tasks++
      else if (item.source_type === 'reading') readings++
      else if (item.source_type === 'event') events++
    }
    return { classes, tasks, readings, events }
  }, [items, currentMonth])

  async function leave() {
    setLeaving(true)
    try {
      await signOut()
    } finally {
      setLeaving(false)
    }
  }

  function handlePrevMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  function handleNextMonth() {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  function handleJumpToToday() {
    const now = new Date()
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDateKey(toLocalDateKey(now))
  }

  function openNewEventForDate(dateKey: string) {
    setSelectedDateKey(dateKey)
    setEventDate(dateKey)
    setEventTitle('')
    setEventRoom('')
    setEventDescription('')
    setShowNewEventModal(true)
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!eventTitle.trim()) {
      setError('Informe um título para o evento acadêmico.')
      return
    }
    setSavingEvent(true)
    setError('')
    try {
      const startsAtIso = eventAllDay
        ? new Date(`${eventDate}T08:00:00`).toISOString()
        : new Date(`${eventDate}T${eventStartTime || '19:00'}:00`).toISOString()
      const endsAtIso = eventAllDay
        ? new Date(`${eventDate}T22:00:00`).toISOString()
        : eventEndTime
          ? new Date(`${eventDate}T${eventEndTime}:00`).toISOString()
          : null

      await createAcademicEvent({
        title: eventTitle.trim(),
        kind: eventKind,
        starts_at: startsAtIso,
        ends_at: endsAtIso,
        all_day: eventAllDay,
        room: eventRoom.trim(),
        description: eventDescription.trim(),
        student_subject_id: eventSubjectId || null,
      })
      setShowNewEventModal(false)
      setSelectedDateKey(eventDate)
      await loadCalendarData()
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : 'Não foi possível criar o evento no calendário.',
      )
    } finally {
      setSavingEvent(false)
    }
  }

  async function handleToggleTask(item: CalendarItem) {
    setActionBusyId(item.id)
    setError('')
    try {
      await toggleAcademicTaskComplete(item.source_id)
      await loadCalendarData()
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : 'Não foi possível atualizar o status da tarefa.',
      )
    } finally {
      setActionBusyId(null)
    }
  }

  async function handleAttendance(item: CalendarItem, status: 'present' | 'absent') {
    setActionBusyId(item.id)
    setError('')
    try {
      const nextStatus = item.attendance_status === status ? 'unrecorded' : status
      await recordAttendance(item.source_id, nextStatus)
      await loadCalendarData()
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : 'Não foi possível registrar a frequência desta aula.',
      )
    } finally {
      setActionBusyId(null)
    }
  }

  async function handleDeleteEvent(item: CalendarItem) {
    setActionBusyId(item.id)
    setError('')
    try {
      await deleteAcademicEvent(item.source_id)
      await loadCalendarData()
    } catch (reason) {
      setError(
        reason instanceof ApiError ? reason.message : 'Não foi possível remover o evento.',
      )
    } finally {
      setActionBusyId(null)
    }
  }

  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDateKey.split('-').map(Number)
    if (!y || !m || !d) return selectedDateKey
    const dt = new Date(y, m - 1, d)
    return dt.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }, [selectedDateKey])

  return (
    <main className="min-h-dvh bg-[#dce6ef] dark:bg-[#040f17]">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-[#005063]/30 dark:bg-[#081a26]/90">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <Brand />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                type="button"
                aria-label="Sair"
                onClick={() => void leave()}
                disabled={leaving}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-sm font-bold text-[#0d3950] transition hover:bg-slate-50 disabled:opacity-50 dark:border-[#005063]/40 dark:bg-[#041019] dark:text-slate-100 dark:hover:bg-[#0d3950]/40"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{leaving ? 'Saindo...' : 'Sair'}</span>
              </button>
            </div>
          </div>
          <div className="mt-4">
            <AppNavigation />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-8 sm:py-10">
        {/* Cabeçalho + Resumo do Mês + Controles */}
        <section className="w-full rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xl shadow-[#0d3950]/5 sm:p-8 dark:border-[#005063]/30 dark:bg-[#081a26]/90">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#005063]/20 bg-[#0d3950]/5 px-3 py-1 text-xs font-extrabold tracking-wide text-[#0d3950] uppercase dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300">
                <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Visão Consolidada Multi-Tela
              </span>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-[#0d3950] sm:text-3xl dark:text-white">
                Calendário Acadêmico Integrado
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Todos os dias do mês e compromissos sincronizados com{' '}
                <strong>Disciplinas</strong> (aulas), <strong>Tarefas</strong> (prazos) e{' '}
                <strong>Estudo</strong> (metas e leituras).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openNewEventForDate(selectedDateKey)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0d3950] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0d3950]/20 transition hover:bg-[#005063] dark:bg-[#005063] dark:hover:bg-[#006b85]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Novo Evento
              </button>
              <button
                type="button"
                onClick={() => void loadCalendarData()}
                disabled={loading}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-sm font-bold text-[#0d3950] transition hover:bg-slate-100 disabled:opacity-50 dark:border-[#005063]/40 dark:bg-[#041019] dark:text-slate-200"
                title="Sincronizar calendário"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </button>
            </div>
          </div>

          {/* Indicadores do Mês */}
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <GraduationCap className="h-4 w-4 shrink-0" />
                Aulas no mês (Disciplinas)
              </div>
              <p className="mt-1 text-2xl font-black text-emerald-950 dark:text-white">
                {monthSummary.classes}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <ListTodo className="h-4 w-4 shrink-0" />
                Entregas no mês (Tarefas)
              </div>
              <p className="mt-1 text-2xl font-black text-amber-950 dark:text-white">
                {monthSummary.tasks}
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-800 dark:text-cyan-300">
                <BookOpen className="h-4 w-4 shrink-0" />
                Leituras & Metas (Estudo)
              </div>
              <p className="mt-1 text-2xl font-black text-cyan-950 dark:text-white">
                {monthSummary.readings}
              </p>
            </div>
            <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
                <Sparkles className="h-4 w-4 shrink-0" />
                Provas & Eventos
              </div>
              <p className="mt-1 text-2xl font-black text-rose-950 dark:text-white">
                {monthSummary.events}
              </p>
            </div>
          </div>

          {/* Barra de Navegação do Mês e Filtros */}
          <div className="mt-6 flex flex-col gap-4 border-t border-slate-200/70 pt-5 lg:flex-row lg:items-end lg:justify-between dark:border-[#005063]/30">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Mês anterior"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-[#0d3950] transition hover:bg-slate-100 dark:border-[#005063]/40 dark:bg-[#041019] dark:text-slate-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="min-w-52 px-2 text-center">
                <h2 className="text-xl font-black text-[#0d3950] dark:text-white">
                  {MONTH_NAMES[currentMonth.getMonth()]} de {currentMonth.getFullYear()}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Próximo mês"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-[#0d3950] transition hover:bg-slate-100 dark:border-[#005063]/40 dark:bg-[#041019] dark:text-slate-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={handleJumpToToday}
                className="inline-flex min-h-11 items-center rounded-xl border border-slate-200/80 bg-slate-100/80 px-4 text-xs font-extrabold text-[#0d3950] transition hover:bg-slate-200/70 dark:border-[#005063]/40 dark:bg-[#041019] dark:text-cyan-300"
              >
                Ir para Hoje
              </button>
            </div>

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[460px]">
              <Select
                label="Filtrar por disciplina"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                <option value="">Todas as disciplinas</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.subject.name}
                  </option>
                ))}
              </Select>

              <Select
                label="Filtrar por origem / tipo"
                value={selectedKind}
                onChange={(e) => setSelectedKind(e.target.value)}
              >
                <option value="">Todos os itens</option>
                <option value="class">Aulas (Disciplinas)</option>
                <option value="task">Entregas (Tarefas)</option>
                <option value="reading">Leituras & Metas (Estudo)</option>
                <option value="exam">Provas / Avaliações</option>
                <option value="assignment">Trabalhos / Projetos</option>
                <option value="other">Outros Eventos</option>
              </Select>
            </div>
          </div>
        </section>

        {error ? <Alert tone="error">{error}</Alert> : null}

        {/* CALENDÁRIO EM LARGURA TOTAL (100% da tela útil, sem ficar espremido na esquerda) */}
        <section className="w-full rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-xl shadow-[#0d3950]/5 sm:p-6 lg:p-8 dark:border-[#005063]/30 dark:bg-[#081a26]/90">
          {/* Legenda superior rápida */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 pb-4 text-xs font-bold text-slate-600 dark:border-[#005063]/30 dark:text-slate-300">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                Aulas (Disciplinas)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                Prazos (Tarefas)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-cyan-500" />
                Leituras & Páginas (Estudo)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-500" />
                Provas & Avaliações
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-violet-500" />
                Trabalhos & Eventos
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Clique em qualquer dia para gerenciar ou adicionar eventos
            </span>
          </div>

          {/* GRADE MENSAL COMPLETA DE 7 COLUNAS (Tablet & Desktop >= 640px) */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-7 gap-2 pb-2 text-center text-xs font-black tracking-wider text-[#0d3950] uppercase dark:text-cyan-300">
              {WEEKDAYS_FULL.map((day, idx) => (
                <div
                  key={day}
                  className="rounded-xl bg-slate-100/80 py-2.5 dark:bg-[#041019]/80"
                >
                  <span className="hidden lg:inline">{day}</span>
                  <span className="lg:hidden">{WEEKDAYS_SHORT[idx]}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((cell) => {
                const dayItems = itemsByDate.get(cell.key) || []
                const isSelected = cell.key === selectedDateKey
                return (
                  <div
                    key={cell.key}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedDateKey(cell.key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedDateKey(cell.key)
                      }
                    }}
                    className={`group flex min-h-36 cursor-pointer flex-col justify-between rounded-2xl border p-2.5 text-left transition lg:min-h-44 lg:p-3 ${
                      isSelected
                        ? 'border-[#0d3950] bg-[#0d3950]/5 ring-2 ring-[#0d3950]/30 dark:border-cyan-400 dark:bg-cyan-400/10 dark:ring-cyan-400/30'
                        : cell.isCurrentMonth
                          ? 'border-slate-200/90 bg-white hover:border-[#0d3950]/50 hover:shadow-md dark:border-[#005063]/35 dark:bg-[#041019]/80 dark:hover:border-cyan-500/40'
                          : 'border-slate-100 bg-slate-50/50 opacity-50 dark:border-slate-800/50 dark:bg-[#041019]/30'
                    }`}
                  >
                    {/* Topo do dia: Número + Botão rápido '+' + Contador */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black ${
                            cell.isToday
                              ? 'bg-[#0d3950] text-white shadow-xs dark:bg-cyan-400 dark:text-slate-950'
                              : 'text-[#0d3950] dark:text-slate-100'
                          }`}
                        >
                          {cell.date.getDate()}
                        </span>
                        {cell.isToday && (
                          <span className="rounded-md bg-[#0d3950]/10 px-1.5 py-0.5 text-[10px] font-extrabold text-[#0d3950] dark:bg-cyan-400/20 dark:text-cyan-300">
                            Hoje
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {dayItems.length > 0 && (
                          <span className="rounded-full bg-[#0d3950]/10 px-2 py-0.5 text-[11px] font-extrabold text-[#0d3950] dark:bg-cyan-400/15 dark:text-cyan-300">
                            {dayItems.length}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openNewEventForDate(cell.key)
                          }}
                          title={`Adicionar evento em ${cell.date.getDate()}/${cell.date.getMonth() + 1}`}
                          className="hidden h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-[#0d3950] group-hover:inline-flex dark:hover:bg-slate-800 dark:hover:text-cyan-300"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Lista de eventos dentro da célula do dia */}
                    <div className="mt-2 flex-1 space-y-1.5">
                      {dayItems.length === 0 ? (
                        <div className="flex h-full items-end pt-4">
                          <span className="text-[11px] font-medium text-slate-300 opacity-0 transition group-hover:opacity-100 dark:text-slate-600">
                            Sem eventos
                          </span>
                        </div>
                      ) : (
                        dayItems.map((it) => {
                          const meta = getCategoryMeta(it)
                          const timeLabel = formatShortTime(it)
                          return (
                            <div
                              key={it.id}
                              className={`rounded-xl border px-2 py-1.5 text-xs transition ${meta.cardClass}`}
                            >
                              <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold opacity-85">
                                <span className="truncate">{meta.label}</span>
                                {timeLabel && <span className="shrink-0">{timeLabel}</span>}
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-xs leading-snug font-extrabold">
                                {it.title}
                              </p>
                              {it.subject_name && (
                                <p className="mt-0.5 truncate text-[10px] font-semibold opacity-80">
                                  {it.subject_name}
                                </p>
                              )}
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* VISÃO RESPONSIVA MOBILE (< 640px): Seletor compacto + Lista completa de todos os dias do mês */}
          <div className="space-y-4 sm:hidden">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-extrabold text-slate-500 uppercase dark:text-slate-400">
              {WEEKDAYS_SHORT.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
              {calendarDays.map((cell) => {
                const count = (itemsByDate.get(cell.key) || []).length
                const isSelected = cell.key === selectedDateKey
                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelectedDateKey(cell.key)}
                    className={`flex flex-col items-center justify-center rounded-xl py-2 text-xs font-black transition ${
                      isSelected
                        ? 'bg-[#0d3950] text-white dark:bg-cyan-400 dark:text-slate-950'
                        : cell.isCurrentMonth
                          ? 'bg-slate-100/80 text-[#0d3950] dark:bg-[#041019] dark:text-slate-100'
                          : 'opacity-35'
                    }`}
                  >
                    <span>{cell.date.getDate()}</span>
                    <span
                      className={`mt-0.5 h-1.5 w-1.5 rounded-full ${
                        count > 0
                          ? isSelected
                            ? 'bg-white dark:bg-slate-950'
                            : 'bg-emerald-500'
                          : 'bg-transparent'
                      }`}
                    />
                  </button>
                )
              })}
            </div>

            <div className="space-y-2.5 pt-2">
              <h3 className="text-xs font-extrabold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Todos os dias de {MONTH_NAMES[currentMonth.getMonth()]}
              </h3>
              {currentMonthDays.map((cell) => {
                const dayItems = itemsByDate.get(cell.key) || []
                const isSelected = cell.key === selectedDateKey
                return (
                  <div
                    key={cell.key}
                    onClick={() => setSelectedDateKey(cell.key)}
                    className={`rounded-2xl border p-3.5 transition ${
                      isSelected
                        ? 'border-[#0d3950] bg-[#0d3950]/5 dark:border-cyan-400 dark:bg-cyan-400/10'
                        : 'border-slate-200/80 bg-white dark:border-[#005063]/30 dark:bg-[#041019]/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-xl text-sm font-black ${
                            cell.isToday
                              ? 'bg-[#0d3950] text-white dark:bg-cyan-400 dark:text-slate-950'
                              : 'bg-slate-100 text-[#0d3950] dark:bg-slate-800 dark:text-white'
                          }`}
                        >
                          {cell.date.getDate()}
                        </span>
                        <span className="text-sm font-extrabold text-[#0d3950] dark:text-white">
                          {cell.weekdayShort}
                          {cell.isToday ? ' · Hoje' : ''}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openNewEventForDate(cell.key)
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-[#0d3950] dark:bg-slate-800 dark:text-cyan-300"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Evento
                      </button>
                    </div>

                    {dayItems.length === 0 ? (
                      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                        Nenhum evento registrado neste dia.
                      </p>
                    ) : (
                      <div className="mt-2.5 space-y-2">
                        {dayItems.map((it) => {
                          const meta = getCategoryMeta(it)
                          return (
                            <div
                              key={it.id}
                              className={`rounded-xl border p-2.5 text-xs ${meta.cardClass}`}
                            >
                              <div className="flex items-center justify-between font-extrabold">
                                <span>{meta.label}</span>
                                <span>{formatTimeRange(it)}</span>
                              </div>
                              <p className="mt-1 text-sm font-black">{it.title}</p>
                              {it.subject_name && (
                                <p className="mt-0.5 text-xs font-semibold opacity-85">
                                  Disciplina: {it.subject_name}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* PAINEL DE DETALHES E AÇÕES RÁPIDAS DO DIA SELECIONADO (Largura Total abaixo do calendário) */}
        <section className="w-full rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-[#0d3950]/5 sm:p-8 dark:border-[#005063]/30 dark:bg-[#081a26]/90">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-[#005063]/30">
            <div>
              <p className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                Detalhes e Ações Rápidas do Dia Selecionado
              </p>
              <h3 className="mt-1 text-xl font-black capitalize text-[#0d3950] dark:text-white">
                {formattedSelectedDate}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => openNewEventForDate(selectedDateKey)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0d3950] px-4 py-2 text-sm font-extrabold text-white transition hover:bg-[#005063] dark:bg-[#005063] dark:hover:bg-[#006b85]"
            >
              <Plus className="h-4 w-4" />
              Adicionar Evento neste Dia
            </button>
          </div>

          {selectedDayItems.length === 0 ? (
            <div className="py-10 text-center">
              <CalendarIcon className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-base font-bold text-slate-600 dark:text-slate-300">
                Nenhum compromisso registrado para {formattedSelectedDate}.
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Cadastre horários em Disciplinas, tarefas em Tarefas, metas/leituras em Estudo ou
                adicione um evento diretamente aqui.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {selectedDayItems.map((item) => {
                const meta = getCategoryMeta(item)
                const isBusy = actionBusyId === item.id
                const isPastClass =
                  item.source_type === 'class' &&
                  !item.cancelled &&
                  new Date(item.ends_at || item.starts_at) <= new Date()

                return (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 dark:border-[#005063]/30 dark:bg-[#041019]/80"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${meta.badgeClass}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
                          {meta.label}
                        </span>

                        <Link
                          to={meta.originLink}
                          className="text-xs font-bold text-[#005063] underline-offset-2 hover:underline dark:text-cyan-400"
                        >
                          Ir para {meta.originLabel} →
                        </Link>
                      </div>

                      <h4 className="mt-3 text-base font-black text-[#0d3950] dark:text-white">
                        {item.title}
                      </h4>

                      {item.subject_name && (
                        <p className="mt-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                          Disciplina: {item.subject_name}
                        </p>
                      )}

                      {item.description && (
                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                          {item.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTimeRange(item)}
                        </span>
                        {item.room && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {item.room}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações rápidas */}
                    {item.source_type === 'task' && (
                      <div className="mt-4 border-t border-slate-200/60 pt-3 dark:border-slate-800">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleToggleTask(item)}
                          className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-900 transition hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-200"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {item.task_status === 'completed'
                            ? 'Reabrir tarefa'
                            : 'Marcar tarefa como concluída'}
                        </button>
                      </div>
                    )}

                    {item.source_type === 'class' && !item.cancelled && (
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-3 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          Frequência:{' '}
                          {item.attendance_status === 'present'
                            ? 'Presente'
                            : item.attendance_status === 'absent'
                              ? 'Falta'
                              : 'Não registrada'}
                        </span>
                        {isPastClass && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleAttendance(item, 'present')}
                              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                                item.attendance_status === 'present'
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-emerald-500/15 text-emerald-800 hover:bg-emerald-500/25 dark:text-emerald-300'
                              }`}
                            >
                              Presente
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleAttendance(item, 'absent')}
                              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                                item.attendance_status === 'absent'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-rose-500/15 text-rose-800 hover:bg-rose-500/25 dark:text-rose-300'
                              }`}
                            >
                              Falta
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {item.source_type === 'event' && (
                      <div className="mt-4 flex justify-end border-t border-slate-200/60 pt-3 dark:border-slate-800">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => void handleDeleteEvent(item)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Excluir evento
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {/* Modal de Criação de Evento Acadêmico */}
      {showNewEventModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-new-event-title"
        >
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#005063]/40 dark:bg-[#081a26]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-[#005063]/30">
              <h2
                id="modal-new-event-title"
                className="text-lg font-black text-[#0d3950] dark:text-white"
              >
                Novo Evento no Calendário
              </h2>
              <button
                type="button"
                onClick={() => setShowNewEventModal(false)}
                aria-label="Fechar modal"
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#041019]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => void handleCreateEvent(e)} className="mt-4 space-y-4">
              <Input
                label="Título do evento"
                placeholder="Ex: Prova P1, Apresentação de Seminário..."
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Categoria"
                  value={eventKind}
                  onChange={(e) => setEventKind(e.target.value as AcademicEventKind)}
                >
                  <option value="exam">Prova / Avaliação</option>
                  <option value="assignment">Trabalho / Entrega</option>
                  <option value="other">Outro Evento</option>
                </Select>

                <Select
                  label="Disciplina vinculada (opcional)"
                  value={eventSubjectId}
                  onChange={(e) => setEventSubjectId(e.target.value)}
                >
                  <option value="">Geral / Sem disciplina</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.subject.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input
                  label="Data"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  required
                />
                {!eventAllDay && (
                  <>
                    <Input
                      label="Início"
                      type="time"
                      value={eventStartTime}
                      onChange={(e) => setEventStartTime(e.target.value)}
                      required
                    />
                    <Input
                      label="Término"
                      type="time"
                      value={eventEndTime}
                      onChange={(e) => setEventEndTime(e.target.value)}
                    />
                  </>
                )}
              </div>

              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={eventAllDay}
                  onChange={(e) => setEventAllDay(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                Evento de dia inteiro
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Sala / Local (opcional)"
                  placeholder="Ex: Sala 304 / Online"
                  value={eventRoom}
                  onChange={(e) => setEventRoom(e.target.value)}
                />
                <Input
                  label="Observações (opcional)"
                  placeholder="Conteúdo, links ou lembretes..."
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewEventModal(false)}
                  className="min-h-11 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:border-[#005063]/40 dark:text-slate-300 dark:hover:bg-[#041019]"
                >
                  Cancelar
                </button>
                <PrimaryButton type="submit" disabled={savingEvent}>
                  {savingEvent ? 'Salvando...' : 'Salvar no Calendário'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
