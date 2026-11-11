import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit3,
  FileUp,
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
  confirmExtractedCalendarEvents,
  createAcademicTask,
  deleteAcademicEvent,
  deleteAcademicTask,
  extractCalendarPdf,
  listCalendarItems,
  listCurriculum,
  listStudentSubjects,
  recordAttendance,
  toggleAcademicTaskComplete,
  updateAcademicEvent,
  updateAcademicTask,
} from '../api/client'
import type {
  AcademicEventKind,
  AcademicSubject,
  AcademicTaskCategory,
  CalendarItem,
  CalendarItemKind,
  CalendarPdfExtractResponse,
  ExtractedCalendarAssessment,
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

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  if (!y || !m || !d) return new Date()
  return new Date(y, m - 1, d)
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
      shortLabel: 'Aula',
      originLabel: 'Disciplinas',
      originLink: '/disciplinas',
      cardClass: item.cancelled
        ? 'border-l-4 border-l-slate-400 border-slate-200 bg-slate-100/80 text-slate-500 line-through dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400'
        : 'border-l-4 border-l-emerald-500 border-emerald-500/25 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100',
      dotClass: 'bg-emerald-500',
      badgeClass: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
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

export function CalendarPage() {
  const { signOut } = useAuth()
  const [leaving, setLeaving] = useState(false)

  const today = useMemo(() => new Date(), [])
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  )
  const [selectedDateKey, setSelectedDateKey] = useState(() => toLocalDateKey(today))

  const [subjects, setSubjects] = useState<StudentSubject[]>([])
  const [curriculum, setCurriculum] = useState<AcademicSubject[]>([])
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [selectedKind, setSelectedKind] = useState<string>('')

  const [items, setItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)

  // Modal de nova ou edição de tarefa / evento sincronizado
  const [showNewEventModal, setShowNewEventModal] = useState(false)
  const [editingItem, setEditingItem] = useState<CalendarItem | null>(null)
  const [eventTitle, setEventTitle] = useState('')
  const [eventKind, setEventKind] = useState<AcademicTaskCategory>('task')
  const [eventDate, setEventDate] = useState(() => toLocalDateKey(today))
  const [eventStartTime, setEventStartTime] = useState('19:00')
  const [eventEndTime, setEventEndTime] = useState('21:00')
  const [eventAllDay, setEventAllDay] = useState(false)
  const [eventRoom, setEventRoom] = useState('')
  const [eventSubjectId, setEventSubjectId] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [savingEvent, setSavingEvent] = useState(false)

  // Modal de Upload e Leitura Automática de Calendário Acadêmico (PDF)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [pdfSubjectId, setPdfSubjectId] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [extractingPdf, setExtractingPdf] = useState(false)
  const [confirmingPdf, setConfirmingPdf] = useState(false)
  const [pdfResult, setPdfResult] = useState<CalendarPdfExtractResponse | null>(null)
  const [editableExtractedItems, setEditableExtractedItems] = useState<
    ExtractedCalendarAssessment[]
  >([])
  const [pdfError, setPdfError] = useState('')

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
      weekdayFull: string
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
        weekdayFull: WEEKDAYS_FULL[wdIdx],
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
      .then((list) => {
        const active = list.filter((s) => s.status === 'active')
        setSubjects(active)
        if (active.length > 0) {
          setEventSubjectId((prev) => prev || active[0].id)
        }
      })
      .catch(() => {})
    listCurriculum()
      .then(setCurriculum)
      .catch(() => {})
  }, [])

  useEffect(() => {
    void loadCalendarData()
  }, [loadCalendarData])

  const enrolledSubjectIds = useMemo(
    () => new Set(subjects.map((s) => s.subject.id)),
    [subjects],
  )

  const currentSemesterNumber = useMemo(() => {
    if (subjects.length === 0) return null
    return Math.max(...subjects.map((s) => s.subject.semester))
  }, [subjects])

  const extraCurriculumSubjects = useMemo(
    () =>
      curriculum.filter(
        (item) =>
          !enrolledSubjectIds.has(item.id) &&
          (currentSemesterNumber === null || item.semester === currentSemesterNumber),
      ),
    [curriculum, enrolledSubjectIds, currentSemesterNumber],
  )

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

  // Calcula os 7 dias (Segunda a Domingo) da semana correspondente ao dia selecionado
  const selectedWeekDays = useMemo(() => {
    const baseDate = parseDateKey(selectedDateKey)
    const dayOffset = (baseDate.getDay() + 6) % 7 // Seg=0 .. Dom=6
    const monday = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() - dayOffset,
    )
    const todayKey = toLocalDateKey(new Date())

    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
      const key = toLocalDateKey(dt)
      return {
        date: dt,
        key,
        isToday: key === todayKey,
        isSelected: key === selectedDateKey,
        weekdayShort: WEEKDAYS_SHORT[i],
        weekdayFull: WEEKDAYS_FULL[i],
        items: itemsByDate.get(key) || [],
      }
    })
  }, [selectedDateKey, itemsByDate])

  const selectedWeekTotalItems = useMemo(
    () => selectedWeekDays.reduce((acc, d) => acc + d.items.length, 0),
    [selectedWeekDays],
  )

  const selectedWeekRangeLabel = useMemo(() => {
    const start = selectedWeekDays[0].date
    const end = selectedWeekDays[6].date
    const fmt = (d: Date) =>
      d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    return `${fmt(start)} a ${fmt(end)}`
  }, [selectedWeekDays])

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
      else if (item.source_type === 'reading') readings++
      else if (item.kind === 'exam') events++
      else if (item.source_type === 'task' || item.source_type === 'event') tasks++
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
    setCurrentMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
      setSelectedDateKey(toLocalDateKey(next))
      return next
    })
  }

  function handleNextMonth() {
    setCurrentMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
      setSelectedDateKey(toLocalDateKey(next))
      return next
    })
  }

  function handleShiftWeek(deltaDays: number) {
    const dt = parseDateKey(selectedDateKey)
    const shifted = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + deltaDays)
    setSelectedDateKey(toLocalDateKey(shifted))
    if (
      shifted.getMonth() !== currentMonth.getMonth() ||
      shifted.getFullYear() !== currentMonth.getFullYear()
    ) {
      setCurrentMonth(new Date(shifted.getFullYear(), shifted.getMonth(), 1))
    }
  }

  function handleJumpToToday() {
    const now = new Date()
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDateKey(toLocalDateKey(now))
  }

  function openNewEventForDate(dateKey: string) {
    setEditingItem(null)
    setSelectedDateKey(dateKey)
    setEventDate(dateKey)
    setEventTitle('')
    setEventKind('task')
    setEventAllDay(false)
    setEventStartTime('19:00')
    setEventEndTime('21:00')
    setEventRoom('')
    setEventDescription('')
    setShowNewEventModal(true)
  }

  function openEditItemModal(item: CalendarItem) {
    setEditingItem(item)
    const dtKey = itemToDateKey(item)
    setSelectedDateKey(dtKey)
    setEventDate(dtKey)
    setEventTitle(item.title)
    const kindVal: AcademicTaskCategory =
      item.kind === 'exam' || item.kind === 'assignment' || item.kind === 'other'
        ? item.kind
        : 'task'
    setEventKind(kindVal)
    setEventAllDay(Boolean(item.all_day))
    const startDt = new Date(item.starts_at)
    if (!Number.isNaN(startDt.getTime()) && !item.all_day) {
      setEventStartTime(
        `${String(startDt.getHours()).padStart(2, '0')}:${String(startDt.getMinutes()).padStart(2, '0')}`,
      )
    } else {
      setEventStartTime('19:00')
    }
    const endDt = item.ends_at ? new Date(item.ends_at) : null
    if (endDt && !Number.isNaN(endDt.getTime()) && !item.all_day) {
      setEventEndTime(
        `${String(endDt.getHours()).padStart(2, '0')}:${String(endDt.getMinutes()).padStart(2, '0')}`,
      )
    } else {
      setEventEndTime('21:00')
    }
    setEventRoom(item.room || '')
    setEventSubjectId(item.student_subject_id || '')
    setEventDescription(item.description || '')
    setShowNewEventModal(true)
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!eventTitle.trim()) {
      setError('Informe um título para a tarefa ou evento acadêmico.')
      return
    }
    setSavingEvent(true)
    setError('')
    try {
      const startsAtIso = eventAllDay
        ? new Date(`${eventDate}T12:00:00`).toISOString()
        : new Date(`${eventDate}T${eventStartTime || '19:00'}:00`).toISOString()
      const endsAtIso = eventAllDay
        ? new Date(`${eventDate}T13:00:00`).toISOString()
        : eventEndTime
          ? new Date(`${eventDate}T${eventEndTime}:00`).toISOString()
          : null

      if (editingItem) {
        if (editingItem.source_type === 'event') {
          const evKind: AcademicEventKind =
            eventKind === 'exam' || eventKind === 'assignment' ? eventKind : 'other'
          await updateAcademicEvent(editingItem.source_id, {
            title: eventTitle.trim(),
            kind: evKind,
            starts_at: startsAtIso,
            ends_at: endsAtIso,
            all_day: eventAllDay,
            room: eventRoom.trim(),
            description: eventDescription.trim(),
            student_subject_id: eventSubjectId || null,
          })
        } else {
          await updateAcademicTask(editingItem.source_id, {
            student_subject: eventSubjectId || null,
            category: eventKind,
            title: eventTitle.trim(),
            description: eventDescription.trim(),
            due_date: startsAtIso,
            end_date: endsAtIso,
            all_day: eventAllDay,
            room: eventRoom.trim(),
          })
        }
        setSuccessMessage('Compromisso atualizado no calendário com sucesso!')
      } else {
        await createAcademicTask({
          student_subject: eventSubjectId || null,
          category: eventKind,
          title: eventTitle.trim(),
          description: eventDescription.trim(),
          due_date: startsAtIso,
          end_date: endsAtIso,
          all_day: eventAllDay,
          room: eventRoom.trim(),
          status: 'pending',
          estimated_minutes: 60,
        })
        setSuccessMessage('Compromisso cadastrado no calendário com sucesso!')
      }

      if (eventSubjectId && !subjects.some((s) => s.id === eventSubjectId)) {
        void listStudentSubjects()
          .then((list) => setSubjects(list.filter((s) => s.status === 'active')))
          .catch(() => {})
      }

      setShowNewEventModal(false)
      setEditingItem(null)
      setSelectedDateKey(eventDate)
      await loadCalendarData()
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : 'Não foi possível salvar a tarefa | evento no calendário.',
      )
    } finally {
      setSavingEvent(false)
    }
  }

  function openPdfUploadModal() {
    const defaultSubject = selectedSubjectId || subjects[0]?.id || ''
    setPdfSubjectId(defaultSubject)
    setPdfFile(null)
    setPdfResult(null)
    setEditableExtractedItems([])
    setPdfError('')
    setShowPdfModal(true)
  }

  async function runPdfExtraction(fileToExtract: File, targetSubjectId: string) {
    if (!targetSubjectId) {
      setPdfError('Selecione a disciplina antes de enviar o calendário PDF.')
      return
    }
    setExtractingPdf(true)
    setPdfError('')
    try {
      const response = await extractCalendarPdf(fileToExtract, targetSubjectId)
      setPdfResult(response)
      setEditableExtractedItems(response.items)
    } catch (reason) {
      setPdfError(
        reason instanceof ApiError
          ? reason.message
          : 'Não foi possível ler o arquivo PDF enviado.',
      )
    } finally {
      setExtractingPdf(false)
    }
  }

  function handlePdfFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null
    if (!file) return

    const lowerName = file.name.toLowerCase()
    const isPdf = lowerName.endsWith('.pdf')
    const isDocx = lowerName.endsWith('.docx')

    if (!isPdf && !isDocx) {
      setPdfError(
        'Formato de arquivo inválido. Selecione exclusivamente arquivos em formato PDF (.pdf) ou Word (.docx).',
      )
      setPdfFile(null)
      e.target.value = ''
      return
    }

    setPdfFile(file)
    setPdfError('')
    const targetSubj = pdfSubjectId || subjects[0]?.id || ''
    if (targetSubj && !pdfSubjectId) {
      setPdfSubjectId(targetSubj)
    }
    void runPdfExtraction(file, targetSubj)
  }

  function handlePdfSubjectChange(nextSubjectId: string) {
    setPdfSubjectId(nextSubjectId)
    const subjObj = subjects.find((s) => s.id === nextSubjectId)
    if (pdfFile && nextSubjectId) {
      void runPdfExtraction(pdfFile, nextSubjectId)
    } else if (subjObj) {
      setEditableExtractedItems((prev) =>
        prev.map((item) => ({
          ...item,
          student_subject_id: subjObj.id,
          subject_name: subjObj.subject.name,
        })),
      )
    }
  }

  function handleUpdateExtractedRow(
    index: number,
    patch: Partial<ExtractedCalendarAssessment>,
  ) {
    setEditableExtractedItems((prev) =>
      prev.map((row, idx) => {
        if (idx !== index) return row
        const updated = { ...row, ...patch }
        if (patch.assessment_type) {
          const isNowPai = patch.assessment_type.includes('PAI')
          if (isNowPai) {
            updated.student_subject_id = null
            updated.subject_name = ''
            if (!updated.title || updated.title.includes('—')) {
              updated.title = `Prova ${patch.assessment_type}`
            }
          } else {
            const subjObj = subjects.find((s) => s.id === pdfSubjectId)
            const fallbackSubj = subjObj?.subject.name || pdfResult?.subject_name || 'Disciplina'
            updated.student_subject_id = pdfSubjectId
            updated.subject_name = fallbackSubj
            if (updated.title.startsWith('Prova PAI')) {
              updated.title = `${patch.assessment_type} — ${fallbackSubj}`
            }
          }
        }
        return updated
      }),
    )
  }

  function handleRemoveExtractedRow(index: number) {
    setEditableExtractedItems((prev) => prev.filter((_, idx) => idx !== index))
  }

  function handleAddManualExtractedRow(preset?: Partial<ExtractedCalendarAssessment>) {
    const isPai = Boolean(preset?.assessment_type?.includes('PAI'))
    const subjObj = subjects.find((s) => s.id === pdfSubjectId)
    const subjName = isPai
      ? ''
      : (subjObj?.subject.name || pdfResult?.subject_name || 'Disciplina')
    const aType = preset?.assessment_type || 'PAI 1'
    setEditableExtractedItems((prev) => [
      ...prev,
      {
        assessment_type: aType,
        title: preset?.title || (isPai ? `Prova ${aType}` : `${aType} — ${subjName}`),
        date: preset?.date || selectedDateKey,
        student_subject_id: isPai ? null : (preset?.student_subject_id || pdfSubjectId),
        subject_name: subjName,
        source_snippet: preset?.source_snippet || 'Adicionado na conferência pelo usuário',
      },
    ])

    // Requisito 3: Se veio de uma sugestão de outra data identificada, remove-a imediatamente da lista
    if (preset && pdfResult) {
      setPdfResult((prev) =>
        prev
          ? {
              ...prev,
              other_detected_items: prev.other_detected_items.filter(
                (item) => !(item.date === preset.date && item.title === preset.title),
              ),
            }
          : null,
      )
    }
  }

  async function handleConfirmExtractedPdf() {
    if (!pdfSubjectId) {
      setPdfError('Selecione a disciplina correspondente.')
      return
    }
    if (editableExtractedItems.length === 0) {
      setPdfError('Adicione ou mantenha ao menos uma data de avaliação para confirmar.')
      return
    }
    setConfirmingPdf(true)
    setPdfError('')
    try {
      const res = await confirmExtractedCalendarEvents({
        student_subject_id: pdfSubjectId,
        items: editableExtractedItems.map((it) => ({
          title: it.title.trim(),
          date: it.date,
          assessment_type: it.assessment_type,
          source_snippet: it.source_snippet,
        })),
      })

      setShowPdfModal(false)
      const firstDateStr = editableExtractedItems[0]?.date
      if (firstDateStr) {
        const parsedFirst = parseDateKey(firstDateStr)
        setCurrentMonth(new Date(parsedFirst.getFullYear(), parsedFirst.getMonth(), 1))
        setSelectedDateKey(firstDateStr)
      }
      await loadCalendarData()
      setSuccessMessage(
        `Calendário acadêmico processado: ${res.created_count} avaliação(ões) cadastrada(s) e ${res.updated_count} atualizada(s) em ${pdfResult?.subject_name || 'sua disciplina'}.`,
      )
    } catch (reason) {
      setPdfError(
        reason instanceof ApiError
          ? reason.message
          : 'Erro ao confirmar e salvar as datas no calendário.',
      )
    } finally {
      setConfirmingPdf(false)
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

  async function handleDeleteItem(item: CalendarItem) {
    const confirmed = window.confirm(
      `Deseja realmente excluir "${item.title}" do calendário?`,
    )
    if (!confirmed) return
    setActionBusyId(item.id)
    setError('')
    try {
      if (item.source_type === 'task') {
        await deleteAcademicTask(item.source_id)
      } else {
        await deleteAcademicEvent(item.source_id)
      }
      await loadCalendarData()
      setSuccessMessage('Item excluído do calendário.')
    } catch (reason) {
      setError(
        reason instanceof ApiError ? reason.message : 'Não foi possível remover o item.',
      )
    } finally {
      setActionBusyId(null)
    }
  }

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
        {/* 1. BLOCO PRINCIPAL: CALENDÁRIO ACADÊMICO */}
        <section className="w-full rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xl shadow-[#0d3950]/5 sm:p-8 dark:border-[#005063]/30 dark:bg-[#081a26]/90">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <h1 className="text-2xl font-black tracking-tight text-[#0d3950] sm:text-3xl dark:text-white">
                Calendário Acadêmico
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Todos os dias do mês e compromissos sincronizados em tempo real com{' '}
                <strong>Disciplinas</strong> (aulas), <strong>Tarefas</strong> (trabalhos e entregas) e{' '}
                <strong>Anotações</strong> (metas e leituras).
              </p>
            </div>

            {/* Grupo de Ações: Nova Tarefa | Evento + (Importar Calendário e Atualizar posicionados lado a lado) */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => openNewEventForDate(selectedDateKey)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0d3950] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0d3950]/20 transition hover:bg-[#005063] focus:outline-none focus:ring-2 focus:ring-[#0d3950]/40 dark:bg-[#005063] dark:hover:bg-[#006b85]"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Nova Tarefa | Evento</span>
              </button>

              {/* Botões Importar Calendário e Atualizar posicionados estritamente lado a lado de forma discreta */}
              <div className="inline-flex items-center gap-2">
                <button
                  type="button"
                  onClick={openPdfUploadModal}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs transition hover:border-slate-400 hover:bg-slate-50 hover:text-[#0d3950] focus:outline-none focus:ring-2 focus:ring-[#006768]/30 dark:border-[#005063]/50 dark:bg-[#041019] dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-[#081a26] dark:hover:text-cyan-300"
                  title="Importar calendário acadêmico (.pdf, .docx)"
                  aria-label="Importar Calendário Acadêmico em PDF ou Word"
                >
                  <FileUp className="h-4 w-4 shrink-0 text-[#006768] dark:text-cyan-400" aria-hidden="true" />
                  <span>Importar Calendário</span>
                </button>

                <button
                  type="button"
                  onClick={() => void loadCalendarData()}
                  disabled={loading}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 shadow-2xs transition hover:border-slate-400 hover:bg-slate-50 hover:text-[#0d3950] focus:outline-none focus:ring-2 focus:ring-[#006768]/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#005063]/50 dark:bg-[#041019] dark:text-slate-200 dark:hover:border-cyan-400 dark:hover:bg-[#081a26] dark:hover:text-cyan-300"
                  title="Atualizar dados do calendário"
                  aria-label="Atualizar dados do calendário"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? 'animate-spin text-[#006768] dark:text-cyan-400' : ''}`}
                    aria-hidden="true"
                  />
                  <span className="sr-only">Atualizar dados do calendário</span>
                </button>
              </div>
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
                Tarefas & Trabalhos
              </div>
              <p className="mt-1 text-2xl font-black text-amber-950 dark:text-white">
                {monthSummary.tasks}
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-800 dark:text-cyan-300">
                <BookOpen className="h-4 w-4 shrink-0" />
                Leituras & Metas (Anotações)
              </div>
              <p className="mt-1 text-2xl font-black text-cyan-950 dark:text-white">
                {monthSummary.readings}
              </p>
            </div>
            <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
                <Sparkles className="h-4 w-4 shrink-0" />
                Provas & Avaliações
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
                label="Filtrar por origem | tipo"
                value={selectedKind}
                onChange={(e) => setSelectedKind(e.target.value)}
              >
                <option value="">Todos os itens</option>
                <option value="class">Aulas (Disciplinas)</option>
                <option value="task">Tarefas | Entregas</option>
                <option value="reading">Leituras & Metas (Anotações)</option>
                <option value="exam">Provas | Avaliações</option>
                <option value="assignment">Trabalhos | Projetos</option>
                <option value="other">Outras Atividades</option>
              </Select>
            </div>
          </div>
        </section>

        {error ? <Alert tone="error">{error}</Alert> : null}

        {successMessage ? (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-xs font-bold text-emerald-900 dark:text-emerald-200">
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="text-emerald-700 hover:underline dark:text-emerald-300"
            >
              Fechar
            </button>
          </div>
        ) : null}

        {/* 2. SEÇÃO SUPERIOR: DETALHES E AÇÕES RÁPIDAS DA SEMANA (Logo abaixo do bloco Calendário Acadêmico) */}
        <section className="w-full rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xl shadow-[#0d3950]/5 sm:p-8 dark:border-[#005063]/30 dark:bg-[#081a26]/90">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4 dark:border-[#005063]/30">
            <div>
              <p className="text-xs font-extrabold tracking-wider text-[#005063] uppercase dark:text-cyan-300">
                Programação Semanal ({selectedWeekRangeLabel})
              </p>
              <h3 className="mt-1 text-xl font-black text-[#0d3950] dark:text-white">
                Detalhes e Ações Rápidas da Semana ({selectedWeekTotalItems}{' '}
                {selectedWeekTotalItems === 1 ? 'compromisso' : 'compromissos'})
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleShiftWeek(-7)}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-[#0d3950] transition hover:bg-slate-100 dark:border-[#005063]/40 dark:bg-[#041019] dark:text-slate-200"
              >
                <ChevronLeft className="h-4 w-4" />
                Semana anterior
              </button>
              <button
                type="button"
                onClick={() => handleShiftWeek(7)}
                className="inline-flex min-h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-[#0d3950] transition hover:bg-slate-100 dark:border-[#005063]/40 dark:bg-[#041019] dark:text-slate-200"
              >
                Próxima semana
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => openNewEventForDate(selectedDateKey)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#0d3950] px-3.5 text-xs font-extrabold text-white transition hover:bg-[#005063] dark:bg-[#005063] dark:hover:bg-[#006b85]"
              >
                <Plus className="h-4 w-4" />
                Adicionar na Semana
              </button>
            </div>
          </div>

          {/* Visão dos 7 dias da semana com todos os compromissos alinhados dentro do esqueleto */}
          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {selectedWeekDays.map((day) => (
              <div
                key={day.key}
                onClick={() => setSelectedDateKey(day.key)}
                className={`flex min-w-0 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border p-3 transition ${
                  day.isSelected
                    ? 'border-[#0d3950] bg-[#0d3950]/5 ring-2 ring-[#0d3950]/20 dark:border-cyan-400 dark:bg-cyan-400/10'
                    : day.isToday
                      ? 'border-emerald-500/40 bg-emerald-500/5 dark:border-emerald-400/40 dark:bg-emerald-950/20'
                      : 'border-slate-200/80 bg-slate-50/70 hover:border-[#0d3950]/40 dark:border-[#005063]/30 dark:bg-[#041019]/80'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-1.5 border-b border-slate-200/60 pb-2 dark:border-slate-800">
                    <div className="min-w-0">
                      <span className="block truncate text-[10px] font-extrabold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        {day.weekdayFull}
                      </span>
                      <span className="block truncate text-sm font-black text-[#0d3950] dark:text-white">
                        {day.date.toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                        {day.isToday ? ' · Hoje' : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openNewEventForDate(day.key)
                      }}
                      title={`Adicionar tarefa ou evento em ${day.weekdayFull}`}
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#0d3950] shadow-2xs hover:bg-slate-100 dark:bg-[#081a26] dark:text-cyan-300"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {day.items.length === 0 ? (
                    <p className="py-5 text-center text-xs text-slate-400 dark:text-slate-500">
                      Livre
                    </p>
                  ) : (
                    <div className="mt-2.5 space-y-2">
                      {day.items.map((item) => {
                        const meta = getCategoryMeta(item)
                        const isBusy = actionBusyId === item.id
                        const isPastClass =
                          item.source_type === 'class' &&
                          !item.cancelled &&
                          new Date(item.ends_at || item.starts_at) <= new Date()

                        return (
                          <div
                            key={item.id}
                            onClick={(e) => e.stopPropagation()}
                            className="min-w-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-[#005063]/30 dark:bg-[#081a26]"
                          >
                            {/* Linha 1: Badge compacto sem quebrar linha */}
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`inline-flex max-w-full items-center gap-1 truncate rounded-full border px-2 py-0.5 text-[10px] font-extrabold whitespace-nowrap ${meta.badgeClass}`}
                              >
                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dotClass}`} />
                                <span className="truncate">{meta.shortLabel}</span>
                              </span>
                            </div>

                            {/* Linha 2: Título */}
                            <h4 className="mt-1.5 break-words text-xs leading-snug font-black text-[#0d3950] dark:text-white">
                              {item.title}
                            </h4>

                            {/* Linha 3: Disciplina */}
                            {item.student_subject_id && item.subject_name && !item.subject_name.includes('Interdisciplinar') ? (
                              <p className="mt-0.5 line-clamp-2 break-words text-[11px] leading-tight font-semibold text-slate-600 dark:text-slate-300">
                                {item.subject_name}
                              </p>
                            ) : null}

                            {/* Linha 4: Horário e Sala */}
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                              <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
                                <Clock className="h-3 w-3 shrink-0" />
                                {formatTimeRange(item)}
                              </span>
                              {item.room && (
                                <span className="inline-flex items-center gap-0.5 truncate">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{item.room}</span>
                                </span>
                              )}
                            </div>

                            {/* Linha 5: Rodapé de Ações Rápidas por ícones compactos */}
                            <div className="mt-2 flex items-center justify-between gap-1 border-t border-slate-200/60 pt-1.5 dark:border-slate-700/50">
                              <Link
                                to={meta.originLink}
                                className="truncate text-[10px] font-bold text-[#005063] hover:underline dark:text-cyan-400"
                              >
                                {meta.originLabel} →
                              </Link>

                              <div className="flex shrink-0 items-center gap-1">
                                {item.source_type === 'task' && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => void handleToggleTask(item)}
                                      title={item.task_status === 'completed' ? 'Reabrir tarefa' : 'Concluir tarefa'}
                                      className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition ${
                                        item.task_status === 'completed'
                                          ? 'border-emerald-500 bg-emerald-500 text-white'
                                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300'
                                      } disabled:opacity-50`}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => openEditItemModal(item)}
                                      title="Editar data ou avaliação"
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[#005063] hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-[#041019] dark:text-cyan-400"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => void handleDeleteItem(item)}
                                      title="Descartar | Excluir tarefa"
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 disabled:opacity-50 dark:text-rose-300"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </>
                                )}

                                {item.source_type === 'event' && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => openEditItemModal(item)}
                                      title="Editar data ou avaliação"
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-[#005063] hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-[#041019] dark:text-cyan-400"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => void handleDeleteItem(item)}
                                      title="Descartar | Excluir evento"
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 disabled:opacity-50 dark:text-rose-300"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </>
                                )}

                                {item.source_type === 'class' && !item.cancelled && isPastClass && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => void handleAttendance(item, 'present')}
                                      title="Registrar Presença"
                                      className={`inline-flex h-7 px-1.5 items-center justify-center rounded-md text-[10px] font-bold ${
                                        item.attendance_status === 'present'
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                                      }`}
                                    >
                                      P
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => void handleAttendance(item, 'absent')}
                                      title="Registrar Falta"
                                      className={`inline-flex h-7 px-1.5 items-center justify-center rounded-md text-[10px] font-bold ${
                                        item.attendance_status === 'absent'
                                          ? 'bg-rose-600 text-white'
                                          : 'bg-rose-500/15 text-rose-800 dark:text-rose-300'
                                      }`}
                                    >
                                      F
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. GRADE MENSAL EM LARGURA TOTAL */}
        <section className="w-full rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-xl shadow-[#0d3950]/5 sm:p-6 lg:p-8 dark:border-[#005063]/30 dark:bg-[#081a26]/90">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 pb-4 text-xs font-bold text-slate-600 dark:border-[#005063]/30 dark:text-slate-300">
            <div className="flex flex-wrap items-center gap-4">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                Aulas (Disciplinas)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-amber-500" />
                Tarefas & Entregas
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-cyan-500" />
                Leituras & Páginas (Anotações)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-rose-500" />
                Provas & Avaliações
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-violet-500" />
                Trabalhos & Projetos
              </span>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Clique em um dia para atualizar a semana exibida acima ou no + para criar tarefa
            </span>
          </div>

          {/* GRADE MENSAL COMPLETA DE 7 COLUNAS (Tablet & Desktop >= 640px) */}
          <div className="hidden sm:block">
            <div className="grid grid-cols-7 gap-2 pb-2 text-center text-xs font-black tracking-wider text-[#0d3950] uppercase dark:text-cyan-300">
              {WEEKDAYS_FULL.map((day, idx) => (
                <div
                  key={day}
                  className="truncate rounded-xl bg-slate-100/80 py-2.5 dark:bg-[#041019]/80"
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
                    className={`group flex min-h-36 min-w-0 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border p-2.5 text-left transition lg:min-h-44 lg:p-3 ${
                      isSelected
                        ? 'border-[#0d3950] bg-[#0d3950]/5 ring-2 ring-[#0d3950]/30 dark:border-cyan-400 dark:bg-cyan-400/10 dark:ring-cyan-400/30'
                        : cell.isCurrentMonth
                          ? 'border-slate-200/90 bg-white hover:border-[#0d3950]/50 hover:shadow-md dark:border-[#005063]/35 dark:bg-[#041019]/80 dark:hover:border-cyan-500/40'
                          : 'border-slate-100 bg-slate-50/50 opacity-50 dark:border-slate-800/50 dark:bg-[#041019]/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span
                          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                            cell.isToday
                              ? 'bg-[#0d3950] text-white shadow-xs dark:bg-cyan-400 dark:text-slate-950'
                              : 'text-[#0d3950] dark:text-slate-100'
                          }`}
                        >
                          {cell.date.getDate()}
                        </span>
                        {cell.isToday && (
                          <span className="truncate rounded-md bg-[#0d3950]/10 px-1.5 py-0.5 text-[10px] font-extrabold text-[#0d3950] dark:bg-cyan-400/20 dark:text-cyan-300">
                            Hoje
                          </span>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
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
                          title={`Adicionar tarefa ou evento em ${cell.date.getDate()}/${cell.date.getMonth() + 1}`}
                          className="hidden h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-[#0d3950] group-hover:inline-flex dark:hover:bg-slate-800 dark:hover:text-cyan-300"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 min-w-0 flex-1 space-y-1.5">
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
                              className={`min-w-0 overflow-hidden rounded-xl border px-2 py-1.5 text-xs transition ${meta.cardClass}`}
                            >
                              <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold opacity-85">
                                <span className="truncate">{meta.shortLabel}</span>
                                {timeLabel && <span className="shrink-0">{timeLabel}</span>}
                              </div>
                              <p className="mt-0.5 line-clamp-2 break-words text-xs leading-snug font-extrabold">
                                {it.title}
                              </p>
                              {it.student_subject_id && it.subject_name && !it.subject_name.includes('Interdisciplinar') ? (
                                <p className="mt-0.5 truncate text-[10px] font-semibold opacity-80">
                                  {it.subject_name}
                                </p>
                              ) : null}
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

          {/* VISÃO RESPONSIVA MOBILE (< 640px) */}
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
                        Tarefa | Evento
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
                              {it.student_subject_id && it.subject_name && !it.subject_name.includes('Interdisciplinar') ? (
                                <p className="mt-0.5 text-xs font-semibold opacity-85">
                                  Disciplina: {it.subject_name}
                                </p>
                              ) : null}
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
      </div>

      {/* Modal de Criação | Edição de Tarefa ou Evento Sincronizado */}
      {showNewEventModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-new-event-title"
        >
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#005063]/40 dark:bg-[#081a26]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-[#005063]/30">
              <div>
                <p className="text-[11px] font-extrabold tracking-wider text-[#006768] uppercase dark:text-cyan-400">
                  Sincronizado com a aba Tarefas
                </p>
                <h2
                  id="modal-new-event-title"
                  className="text-lg font-black text-[#0d3950] dark:text-white"
                >
                  {editingItem
                    ? 'Editar Data | Avaliação no Calendário'
                    : 'Nova Tarefa ou Evento no Calendário'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNewEventModal(false)
                  setEditingItem(null)
                }}
                aria-label="Fechar modal"
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#041019]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => void handleCreateEvent(e)} className="mt-4 space-y-4">
              <Input
                label="Título da tarefa ou compromisso"
                placeholder="Ex: Entrega de Trabalho, Lista de Exercícios, Prova P1..."
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label="Categoria"
                  value={eventKind}
                  onChange={(e) => setEventKind(e.target.value as AcademicTaskCategory)}
                >
                  <option value="task">Tarefa | Entrega</option>
                  <option value="assignment">Trabalho | Projeto</option>
                  <option value="exam">Prova | Avaliação</option>
                  <option value="other">Estudo | Outra Atividade</option>
                </Select>

                <Select
                  label="Disciplina vinculada"
                  value={eventSubjectId}
                  onChange={(e) => setEventSubjectId(e.target.value)}
                >
                  <option value="">Geral | Outras Atividades</option>
                  {subjects.length > 0 && (
                    <optgroup label="Disciplinas ativas">
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.subject.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {extraCurriculumSubjects.length > 0 && (
                    <optgroup label="Outras disciplinas da matriz">
                      {extraCurriculumSubjects.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.semester}º sem
                        </option>
                      ))}
                    </optgroup>
                  )}
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
                Dia inteiro
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Sala | Local (opcional)"
                  placeholder="Ex: Sala 304 | Online"
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
                  {savingEvent
                    ? 'Salvando...'
                    : editingItem
                      ? 'Salvar Alterações'
                      : 'Salvar em Tarefas e Calendário'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Upload e Leitura Automática de Calendários Acadêmicos (PDF) */}
      {showPdfModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-pdf-calendar-title"
        >
          <div className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-[#005063]/40 dark:bg-[#081a26]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-[#005063]/30">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#006768]/15 text-[#006768] dark:bg-cyan-400/15 dark:text-cyan-300">
                  <FileUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-extrabold tracking-wider text-[#006768] uppercase dark:text-cyan-400">
                    Leitura Automática de Avaliações (AP1, AP2, PAI, Oficial e Substitutiva)
                  </p>
                  <h2
                    id="modal-pdf-calendar-title"
                    className="text-lg font-black text-[#0d3950] dark:text-white"
                  >
                    Importar Calendário Acadêmico (PDF ou Word)
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                aria-label="Fechar modal de importação de calendário"
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#041019]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {pdfError ? <Alert tone="error">{pdfError}</Alert> : null}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold tracking-wider text-[#0d3950] uppercase dark:text-slate-200">
                    1. Disciplina correspondente *
                  </span>
                  <select
                    value={pdfSubjectId}
                    onChange={(e) => handlePdfSubjectChange(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-sm font-semibold text-[#0d3950] focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/40 dark:bg-[#040f17] dark:text-white"
                  >
                    <option value="">Selecione a disciplina...</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.subject.name} · {sub.subject.semester}º sem
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold tracking-wider text-[#0d3950] uppercase dark:text-slate-200">
                    2. Arquivo do Calendário (PDF ou Word .docx) *
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handlePdfFileChange}
                    className="block min-h-11 w-full cursor-pointer rounded-xl border border-dashed border-[#005063]/40 bg-slate-50 px-3 py-2 text-xs font-bold text-[#0d3950] file:mr-3 file:rounded-lg file:border-0 file:bg-[#0d3950] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:bg-slate-100 dark:border-cyan-400/40 dark:bg-[#040f17] dark:text-slate-200 dark:file:bg-[#005063]"
                  />
                </label>
              </div>

              {extractingPdf ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-[#041019]">
                  <RefreshCw className="mx-auto h-7 w-7 animate-spin text-[#006768] dark:text-cyan-400" />
                  <p className="mt-2 text-sm font-bold text-[#0d3950] dark:text-white">
                    Lendo o arquivo e identificando datas de avaliações...
                  </p>
                </div>
              ) : null}

              {pdfResult && !extractingPdf ? (
                <div className="space-y-4">
                  {/* Avisos e tratamento de inconsistências */}
                  {pdfResult.warnings.length > 0 && (
                    <div className="space-y-2 rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 text-xs text-amber-950 dark:text-amber-200">
                      <div className="flex items-center gap-2 font-black">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>Observações da leitura automática para conferência:</span>
                      </div>
                      <ul className="list-disc space-y-1 pl-5 font-semibold">
                        {pdfResult.warnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Cabeçalho das avaliações extraídas */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black text-[#0d3950] dark:text-white">
                        Avaliações Identificadas ({editableExtractedItems.length})
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Confira, edite ou exclua qualquer data antes de confirmar o cadastro em{' '}
                        <strong>{pdfResult.subject_name}</strong>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddManualExtractedRow()}
                      className="inline-flex min-h-8 items-center gap-1 rounded-xl border border-[#005063]/30 bg-[#005063]/10 px-3 py-1.5 text-xs font-extrabold text-[#0d3950] hover:bg-[#005063]/20 dark:border-cyan-400/30 dark:bg-cyan-400/15 dark:text-cyan-300"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar Avaliação Manualmente
                    </button>
                  </div>

                  {editableExtractedItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                      Nenhuma avaliação selecionada no momento. Clique em "Adicionar Avaliação Manualmente" se desejar cadastrar uma data.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {editableExtractedItems.map((row, idx) => (
                        <div
                          key={`${row.assessment_type}-${idx}`}
                          className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 dark:border-[#005063]/30 dark:bg-[#041019]/80"
                        >
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-extrabold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                Tipo
                              </label>
                              <select
                                value={row.assessment_type}
                                onChange={(e) =>
                                  handleUpdateExtractedRow(idx, {
                                    assessment_type: e.target.value,
                                  })
                                }
                                className="mt-1 min-h-9 w-full rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-bold text-[#0d3950] dark:border-slate-700 dark:bg-[#081a26] dark:text-white"
                              >
                                <option value="AP1">AP1</option>
                                <option value="AP2">AP2</option>
                                <option value="PAI 1">PAI 1</option>
                                <option value="PAI 2">PAI 2</option>
                                <option value="PAI 3">PAI 3</option>
                                <option value="Avaliação Oficial">Avaliação Oficial</option>
                                <option value="Prova Substitutiva">Prova Substitutiva</option>
                                <option value="OUTRA">Outra Avaliação</option>
                              </select>
                            </div>

                            <div className="sm:col-span-5">
                              <label className="block text-[10px] font-extrabold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                Nome da Avaliação
                              </label>
                              <input
                                type="text"
                                value={row.title}
                                onChange={(e) =>
                                  handleUpdateExtractedRow(idx, { title: e.target.value })
                                }
                                className="mt-1 min-h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-[#0d3950] dark:border-slate-700 dark:bg-[#081a26] dark:text-white"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <label className="block text-[10px] font-extrabold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                Data
                              </label>
                              <input
                                type="date"
                                value={row.date}
                                onChange={(e) =>
                                  handleUpdateExtractedRow(idx, { date: e.target.value })
                                }
                                className="mt-1 min-h-9 w-full rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-bold text-[#0d3950] dark:border-slate-700 dark:bg-[#081a26] dark:text-white"
                              />
                            </div>

                            <div className="flex justify-end sm:col-span-1">
                              <button
                                type="button"
                                onClick={() => handleRemoveExtractedRow(idx)}
                                title="Remover esta data da importação"
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>
                              Disciplina vinculada:{' '}
                              {row.student_subject_id && row.subject_name && !row.subject_name.includes('Interdisciplinar') ? (
                                <strong>{row.subject_name}</strong>
                              ) : (
                                <span className="text-slate-500 dark:text-slate-400">Geral</span>
                              )}
                            </span>
                            {row.already_exists ? (
                              <span className="rounded-md bg-amber-500/15 px-2 py-0.5 font-bold text-amber-800 dark:text-amber-300">
                                Já cadastrada (será atualizada sem duplicar)
                              </span>
                            ) : null}
                          </div>
                          {row.source_snippet ? (
                            <p className="mt-1 truncate text-[11px] text-slate-400 dark:text-slate-500">
                              Trecho lido: "{row.source_snippet}"
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Outras avaliações detectadas no PDF com nomenclatura diversa (ex.: Avaliações Oficiais, Prova Substitutiva) */}
                  {pdfResult.other_detected_items.length > 0 && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-[#041019]/50">
                      <p className="text-xs font-bold text-[#0d3950] dark:text-slate-200">
                        Outras datas de provas identificadas no documento (clique para incluir se desejar):
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {pdfResult.other_detected_items.map((other, idx) => (
                          <button
                            key={`${other.title}-${other.date}-${idx}`}
                            type="button"
                            onClick={() => handleAddManualExtractedRow(other)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-[#0d3950] hover:bg-slate-100 dark:border-slate-700 dark:bg-[#081a26] dark:text-cyan-300"
                          >
                            <Plus className="h-3 w-3" />
                            <span>
                              {other.title.split(' — ')[0]} ({other.date.split('-').reverse().join('/')})
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4 dark:border-[#005063]/30">
              <button
                type="button"
                onClick={() => setShowPdfModal(false)}
                className="min-h-11 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:border-[#005063]/40 dark:text-slate-300 dark:hover:bg-[#041019]"
              >
                Cancelar
              </button>
              <PrimaryButton
                type="button"
                disabled={confirmingPdf || !pdfResult || editableExtractedItems.length === 0}
                onClick={() => void handleConfirmExtractedPdf()}
              >
                {confirmingPdf
                  ? 'Cadastrando no Calendário...'
                  : `Confirmar e Cadastrar (${editableExtractedItems.length})`}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
