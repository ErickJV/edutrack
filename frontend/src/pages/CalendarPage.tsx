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

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
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
      pillClass: item.cancelled
        ? 'border-slate-300 bg-slate-100 text-slate-500 line-through dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400'
        : 'border-emerald-500/30 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200',
      dotClass: 'bg-emerald-500',
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    }
  }
  if (item.source_type === 'task') {
    const isDone = item.task_status === 'completed'
    return {
      label: isDone ? 'Tarefa concluída' : 'Entrega de Tarefa',
      originLabel: 'Tarefas',
      originLink: '/tarefas',
      pillClass: isDone
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 line-through dark:text-emerald-300/80'
        : 'border-amber-500/30 bg-amber-500/15 text-amber-900 dark:text-amber-200',
      dotClass: isDone ? 'bg-emerald-500' : 'bg-amber-500',
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    }
  }
  if (item.source_type === 'reading') {
    return {
      label: 'Estudo & Leitura',
      originLabel: 'Estudo',
      originLink: '/estudo',
      pillClass: 'border-cyan-500/30 bg-cyan-500/15 text-cyan-900 dark:text-cyan-200',
      dotClass: 'bg-cyan-500',
      badgeClass: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    }
  }
  if (item.kind === 'exam') {
    return {
      label: 'Prova / Avaliação',
      originLabel: 'Calendário',
      originLink: '/calendario',
      pillClass: 'border-rose-500/30 bg-rose-500/15 text-rose-900 dark:text-rose-200',
      dotClass: 'bg-rose-500',
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
    }
  }
  if (item.kind === 'assignment') {
    return {
      label: 'Trabalho / Projeto',
      originLabel: 'Calendário',
      originLink: '/calendario',
      pillClass: 'border-violet-500/30 bg-violet-500/15 text-violet-900 dark:text-violet-200',
      dotClass: 'bg-violet-500',
      badgeClass: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
    }
  }
  return {
    label: 'Evento Acadêmico',
    originLabel: 'Calendário',
    originLink: '/calendario',
    pillClass: 'border-sky-500/30 bg-sky-500/15 text-sky-900 dark:text-sky-200',
    dotClass: 'bg-sky-500',
    badgeClass: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
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

  // Calcula as 42 células da grade mensal (Segunda a Domingo)
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDayOfMonth = new Date(year, month, 1)
    // Converte getDay() (0=Dom..6=Sab) para índice Segunda=0..Domingo=6
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7
    const gridStart = new Date(year, month, 1 - startOffset)

    const cells: Array<{ date: Date; key: string; isCurrentMonth: boolean; isToday: boolean }> = []
    const todayKey = toLocalDateKey(new Date())
    for (let i = 0; i < 42; i++) {
      const cellDate = new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + i,
      )
      const key = toLocalDateKey(cellDate)
      cells.push({
        date: cellDate,
        key,
        isCurrentMonth: cellDate.getMonth() === month,
        isToday: key === todayKey,
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
      .catch(() => {
        // Silencioso: filtro de disciplinas opcional
      })
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

  function openNewEventForSelectedDate() {
    setEventDate(selectedDateKey)
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
      await loadCalendarData()
    } catch (reason) {
      setError(
        reason instanceof ApiError ? reason.message : 'Não foi possível criar o evento no calendário.',
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
        <div className="mx-auto max-w-6xl px-5 py-4 sm:px-8">
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

      <div className="mx-auto max-w-6xl space-y-6 px-5 py-8 sm:px-8">
        {/* Cabeçalho do Calendário */}
        <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-[#0d3950]/5 dark:border-[#005063]/30 dark:bg-[#081a26]/90 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#005063]/20 bg-[#0d3950]/5 px-3 py-1 text-xs font-extrabold tracking-wide text-[#0d3950] uppercase dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300">
                <CalendarIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Visão Consolidada Multi-Tela
              </span>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-[#0d3950] dark:text-white sm:text-3xl">
                Calendário Acadêmico Integrado
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Alterações e incrementos feitos em <strong>Disciplinas</strong> (horários e aulas),{' '}
                <strong>Tarefas</strong> (entregas) e <strong>Estudo</strong> (metas e páginas lidas)
                aparecem automaticamente aqui.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openNewEventForSelectedDate}
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
                <span className="hidden sm:inline">Atualizar</span>
              </button>
            </div>
          </div>

          {/* Indicadores do Mês */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <GraduationCap className="h-4 w-4" />
                Aulas (Disciplinas)
              </div>
              <p className="mt-1 text-2xl font-black text-emerald-950 dark:text-white">
                {monthSummary.classes}
              </p>
            </div>
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                <ListTodo className="h-4 w-4" />
                Prazos (Tarefas)
              </div>
              <p className="mt-1 text-2xl font-black text-amber-950 dark:text-white">
                {monthSummary.tasks}
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-800 dark:text-cyan-300">
                <BookOpen className="h-4 w-4" />
                Metas & Leituras (Estudo)
              </div>
              <p className="mt-1 text-2xl font-black text-cyan-950 dark:text-white">
                {monthSummary.readings}
              </p>
            </div>
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
                <Sparkles className="h-4 w-4" />
                Provas & Eventos
              </div>
              <p className="mt-1 text-2xl font-black text-rose-950 dark:text-white">
                {monthSummary.events}
              </p>
            </div>
          </div>

          {/* Barra de Navegação do Mês e Filtros */}
          <div className="mt-6 flex flex-col gap-4 border-t border-slate-200/70 pt-5 dark:border-[#005063]/30 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Mês anterior"
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-[#0d3950] transition hover:bg-slate-100 dark:border-[#005063]/40 dark:bg-[#041019] dark:text-slate-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="min-w-48 text-center">
                <h2 className="text-lg font-black text-[#0d3950] dark:text-white">
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
                className="ml-1 inline-flex min-h-11 items-center rounded-xl border border-slate-200/80 bg-slate-100/80 px-3.5 text-xs font-extrabold text-[#0d3950] transition hover:bg-slate-200/70 dark:border-[#005063]/40 dark:bg-[#041019] dark:text-cyan-300"
              >
                Hoje
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:min-w-[420px]">
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

        {/* Grade Mensal + Painel Lateral do Dia */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Grade Mensal (8 colunas no desktop) */}
          <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-xl shadow-[#0d3950]/5 dark:border-[#005063]/30 dark:bg-[#081a26]/90 sm:p-6 lg:col-span-8">
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-extrabold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              {WEEKDAYS.map((day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="mt-1 grid grid-cols-7 gap-1.5">
              {calendarDays.map((cell) => {
                const dayItems = itemsByDate.get(cell.key) || []
                const isSelected = cell.key === selectedDateKey
                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => setSelectedDateKey(cell.key)}
                    className={`group flex min-h-24 flex-col items-stretch justify-between rounded-2xl border p-2 text-left transition sm:min-h-28 ${
                      isSelected
                        ? 'border-[#0d3950] bg-[#0d3950]/5 ring-2 ring-[#0d3950]/30 dark:border-cyan-400 dark:bg-cyan-400/10 dark:ring-cyan-400/30'
                        : cell.isCurrentMonth
                          ? 'border-slate-200/80 bg-white hover:border-[#0d3950]/40 dark:border-[#005063]/30 dark:bg-[#041019]/70 dark:hover:border-cyan-500/40'
                          : 'border-slate-100 bg-slate-50/60 opacity-55 dark:border-slate-800/60 dark:bg-[#041019]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold ${
                          cell.isToday
                            ? 'bg-[#0d3950] text-white dark:bg-cyan-400 dark:text-slate-950'
                            : 'text-[#0d3950] dark:text-slate-200'
                        }`}
                      >
                        {cell.date.getDate()}
                      </span>
                      {dayItems.length > 0 && (
                        <span className="rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {dayItems.length}
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 space-y-1 overflow-hidden">
                      {dayItems.slice(0, 3).map((it) => {
                        const meta = getCategoryMeta(it)
                        return (
                          <div
                            key={it.id}
                            className={`truncate rounded-lg border px-1.5 py-0.5 text-[10px] font-bold ${meta.pillClass}`}
                            title={`${meta.label}: ${it.title}${it.subject_name ? ` (${it.subject_name})` : ''}`}
                          >
                            {it.title}
                          </div>
                        )
                      })}
                      {dayItems.length > 3 && (
                        <div className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
                          + {dayItems.length - 3} mais
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Legenda de Cores */}
            <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-200/70 pt-4 text-xs font-semibold text-slate-600 dark:border-[#005063]/30 dark:text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Aulas (Disciplinas)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                Prazos (Tarefas)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />
                Leituras & Páginas (Estudo)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                Provas & Avaliações
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                Trabalhos & Eventos
              </span>
            </div>
          </section>

          {/* Painel Lateral de Detalhes do Dia Selecionado (4 colunas) */}
          <aside className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-[#0d3950]/5 dark:border-[#005063]/30 dark:bg-[#081a26]/90 lg:col-span-4">
            <div className="flex items-start justify-between gap-2 border-b border-slate-200/80 pb-4 dark:border-[#005063]/30">
              <div>
                <p className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                  Agenda do Dia
                </p>
                <h3 className="mt-0.5 text-lg font-black capitalize text-[#0d3950] dark:text-white">
                  {formattedSelectedDate}
                </h3>
              </div>
              <button
                type="button"
                onClick={openNewEventForSelectedDate}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#0d3950]/10 px-3 py-1.5 text-xs font-extrabold text-[#0d3950] transition hover:bg-[#0d3950]/20 dark:bg-cyan-400/15 dark:text-cyan-300 dark:hover:bg-cyan-400/25"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </button>
            </div>

            {selectedDayItems.length === 0 ? (
              <div className="py-10 text-center">
                <CalendarIcon className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                  Nenhum compromisso registrado neste dia.
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Cadastre aulas em Disciplinas, entregas em Tarefas, leituras em Estudo ou crie um
                  evento avulso abaixo.
                </p>
                <button
                  type="button"
                  onClick={openNewEventForSelectedDate}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0d3950] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#005063] dark:bg-[#005063]"
                >
                  <Plus className="h-4 w-4" />
                  Criar evento neste dia
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
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
                      className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-[#005063]/30 dark:bg-[#041019]/80"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${meta.badgeClass}`}
                        >
                          <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
                          {meta.label}
                        </span>

                        <Link
                          to={meta.originLink}
                          className="text-[11px] font-bold text-[#005063] underline-offset-2 hover:underline dark:text-cyan-400"
                        >
                          Tela: {meta.originLabel} →
                        </Link>
                      </div>

                      <h4 className="mt-2 text-sm font-black text-[#0d3950] dark:text-white">
                        {item.title}
                      </h4>

                      {item.subject_name && (
                        <p className="mt-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">
                          Disciplina: {item.subject_name}
                        </p>
                      )}

                      {item.description && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {item.description}
                        </p>
                      )}

                      <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
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

                      {/* Ações rápidas conforme origem */}
                      {item.source_type === 'task' && (
                        <div className="mt-3 border-t border-slate-200/60 pt-2.5 dark:border-slate-800">
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleToggleTask(item)}
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-900 transition hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-200"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {item.task_status === 'completed'
                              ? 'Reabrir tarefa'
                              : 'Marcar como concluída'}
                          </button>
                        </div>
                      )}

                      {item.source_type === 'class' && !item.cancelled && (
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/60 pt-2.5 dark:border-slate-800">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
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
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
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
                                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
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
                        <div className="mt-3 flex justify-end border-t border-slate-200/60 pt-2.5 dark:border-slate-800">
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
          </aside>
        </div>
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
