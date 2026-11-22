import { BookOpen, Calendar as CalendarIcon, Clock3, FilterX, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  ApiError,
  createAcademicTask,
  deleteAcademicTask,
  listAcademicTasks,
  listCurriculum,
  listStudentSubjects,
  toggleAcademicTaskComplete,
} from '../api/client'
import type {
  AcademicSubject,
  AcademicTask,
  AcademicTaskCategory,
  AcademicTaskStatus,
  StudentSubject,
} from '../api/types'
import { Alert, PageLoader } from '../components/Feedback'
import { MotionPresence } from '../components/MotionPresence'
import { Input, Select } from '../components/FormControls'
import { MetricValue } from '../components/MetricValue'
import { TaskFormModal } from '../components/TaskFormModal'

const STATUS_LABELS: Record<'all' | AcademicTaskStatus, string> = {
  all: 'Todos',
  pending: 'Pendentes',
  in_progress: 'Em andamento',
  completed: 'Concluídas',
}

const CATEGORY_LABELS: Record<AcademicTaskCategory, { label: string; badgeClass: string }> = {
  task: {
    label: 'Tarefa | Entrega',
    badgeClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
  },
  assignment: {
    label: 'Trabalho | Projeto',
    badgeClass: 'bg-violet-500/15 text-violet-800 dark:text-violet-300 border-violet-500/30',
  },
  exam: {
    label: 'Prova | Avaliação',
    badgeClass: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30',
  },
  other: {
    label: 'Estudo | Afins',
    badgeClass: 'bg-sky-500/15 text-sky-800 dark:text-sky-300 border-sky-500/30',
  },
}

const STATUS_ORDER: AcademicTaskStatus[] = ['pending', 'in_progress', 'completed']

function getTodayDateInput(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDate(value: string | null): string {
  if (!value) return 'Sem prazo'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sem prazo'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function statusBadgeClass(status: AcademicTaskStatus): string {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
    case 'in_progress':
      return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/70 dark:text-cyan-300'
    default:
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
  }
}

function statusDescription(status: AcademicTaskStatus): string {
  switch (status) {
    case 'completed':
      return 'Tarefa concluída'
    case 'in_progress':
      return 'Em execução'
    default:
      return 'Aguardando início'
  }
}

function sortTasks(left: AcademicTask, right: AcademicTask): number {
  const leftDue = left.due_date ? new Date(left.due_date).getTime() : Number.POSITIVE_INFINITY
  const rightDue = right.due_date ? new Date(right.due_date).getTime() : Number.POSITIVE_INFINITY
  if (leftDue !== rightDue) return leftDue - rightDue
  return left.title.localeCompare(right.title, 'pt-BR')
}

export function TasksPage() {
  const [tasks, setTasks] = useState<AcademicTask[]>([])
  const [subjects, setSubjects] = useState<StudentSubject[]>([])
  const [curriculum, setCurriculum] = useState<AcademicSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | AcademicTaskStatus>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<AcademicTask | null>(null)
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null)
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null)
  const [toggleError, setToggleError] = useState('')

  // Estado do formulário de cadastro rápido inline
  const [quickTitle, setQuickTitle] = useState('')
  const [quickSubjectId, setQuickSubjectId] = useState('')
  const [quickCategory, setQuickCategory] = useState<AcademicTaskCategory>('task')
  const [quickDate, setQuickDate] = useState(() => getTodayDateInput())
  const [quickTime, setQuickTime] = useState('19:00')
  const [quickSaving, setQuickSaving] = useState(false)

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [taskResponse, subjectResponse, curriculumResponse] = await Promise.all([
          listAcademicTasks(),
          listStudentSubjects(),
          listCurriculum().catch(() => [] as AcademicSubject[]),
        ])
        if (!alive) return
        setTasks(taskResponse)
        setSubjects(subjectResponse)
        setCurriculum(curriculumResponse)
        if (subjectResponse.length > 0) {
          setQuickSubjectId(subjectResponse[0].id)
        }
      } catch {
        if (alive) setError('Não foi possível carregar suas tarefas.')
      } finally {
        if (alive) setLoading(false)
      }
    }
    void load()
    return () => {
      alive = false
    }
  }, [])

  const enrolledSubjectIds = useMemo(
    () => new Set(subjects.map((s) => s.subject.id)),
    [subjects],
  )

  const extraCurriculumSubjects = useMemo(
    () => curriculum.filter((item) => !enrolledSubjectIds.has(item.id)),
    [curriculum, enrolledSubjectIds],
  )

  const subjectOptions = useMemo(
    () =>
      subjects
        .map((subject) => [subject.subject.id, subject.subject.name] as const)
        .sort((left, right) => left[1].localeCompare(right[1], 'pt-BR')),
    [subjects],
  )

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        if (subjectFilter === 'all') return true
        if (subjectFilter === 'general') return !task.subject_id
        return task.subject_id === subjectFilter || task.student_subject === subjectFilter
      })
      .filter((task) => statusFilter === 'all' || task.status === statusFilter)
      .sort(sortTasks)
  }, [tasks, subjectFilter, statusFilter])

  const groupedTasks = useMemo(() => {
    return STATUS_ORDER.reduce(
      (acc, status) => {
        acc[status] = filteredTasks.filter((task) => task.status === status)
        return acc
      },
      {
        pending: [] as AcademicTask[],
        in_progress: [] as AcademicTask[],
        completed: [] as AcademicTask[],
      },
    )
  }, [filteredTasks])

  const totalTasks = filteredTasks.length
  const pendingTasks = filteredTasks.filter((task) => task.status !== 'completed').length
  const completedTasks = filteredTasks.filter((task) => task.status === 'completed').length

  function openCreate() {
    setEditingTask(null)
    setModalOpen(true)
  }

  function openEdit(task: AcademicTask) {
    setEditingTask(task)
    setModalOpen(true)
  }

  function handleSaved(task: AcademicTask) {
    setTasks((current) => {
      const next = current.some((item) => item.id === task.id)
        ? current.map((item) => (item.id === task.id ? task : item))
        : [task, ...current]
      return next.sort(sortTasks)
    })
    if (task.student_subject && !subjects.some((s) => s.id === task.student_subject)) {
      void listStudentSubjects()
        .then(setSubjects)
        .catch(() => {})
    }
    setModalOpen(false)
    setEditingTask(null)
  }

  async function handleQuickCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!quickTitle.trim()) {
      setToggleError('Informe um título para cadastrar a tarefa.')
      return
    }
    setQuickSaving(true)
    setToggleError('')
    try {
      const dateStr = quickDate || getTodayDateInput()
      const timeStr = quickTime || '19:00'
      const dueIso = new Date(`${dateStr}T${timeStr}:00`).toISOString()

      const created = await createAcademicTask({
        student_subject: quickSubjectId || null,
        category: quickCategory,
        title: quickTitle.trim(),
        due_date: dueIso,
        status: 'pending',
        estimated_minutes: 60,
      })
      setTasks((prev) => [created, ...prev].sort(sortTasks))
      setQuickTitle('')
      if (created.student_subject && !subjects.some((s) => s.id === created.student_subject)) {
        void listStudentSubjects()
          .then(setSubjects)
          .catch(() => {})
      }
    } catch (reason) {
      setToggleError(
        reason instanceof ApiError ? reason.message : 'Não foi possível criar a tarefa.',
      )
    } finally {
      setQuickSaving(false)
    }
  }

  async function toggleTask(task: AcademicTask) {
    const nextStatus: AcademicTaskStatus = task.status === 'completed' ? 'pending' : 'completed'
    const optimisticTask: AcademicTask = {
      ...task,
      status: nextStatus,
      completed_at: nextStatus === 'completed' ? new Date().toISOString() : null,
    }

    setToggleError('')
    setTogglingTaskId(task.id)
    setTasks((current) =>
      current.map((item) => (item.id === task.id ? optimisticTask : item)).sort(sortTasks),
    )

    try {
      const updatedTask = await toggleAcademicTaskComplete(task.id)
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? updatedTask : item)).sort(sortTasks),
      )
    } catch {
      setToggleError('Não foi possível atualizar o status da tarefa.')
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? task : item)).sort(sortTasks),
      )
    } finally {
      setTogglingTaskId(null)
    }
  }

  async function handleDeleteTask(task: AcademicTask) {
    setDeletingTaskId(task.id)
    setToggleError('')
    try {
      await deleteAcademicTask(task.id)
      setTasks((current) => current.filter((item) => item.id !== task.id))
    } catch {
      setToggleError('Não foi possível remover a tarefa.')
    } finally {
      setDeletingTaskId(null)
    }
  }

  return (
    <div>
      <MotionPresence open={loading}>
        <PageLoader />
      </MotionPresence>

      <div className="mx-auto max-w-7xl px-4 pt-1 pb-6 sm:px-5 lg:px-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[20px] leading-tight font-black tracking-tight text-[#0d3950] sm:text-[22px] dark:text-white">
              Tarefas e entregas
            </h1>
            <p className="mt-1 text-[12px] leading-5 text-slate-600 dark:text-slate-300">
              Cadastre, acompanhe e conclua suas entregas acadêmicas.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="press inline-flex min-h-9 shrink-0 items-center gap-2 rounded-xl bg-accent px-3 text-[12px] font-bold text-accent-ink transition hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
          >
            <Plus size={16} aria-hidden="true" />
            Nova tarefa
          </button>
        </div>

        {error ? (
          <div className="mb-4">
            <Alert>{error}</Alert>
          </div>
        ) : null}

        {/* BLOCO DE CADASTRO RÁPIDO DE TAREFA (DISCIPLINAS E AFINS) */}
        <section className="rounded-[18px] border border-slate-200/80 bg-white p-4 shadow-md sm:p-[17px] dark:border-[#005063]/30 dark:bg-[#081a26]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-3 dark:border-[#005063]/30">
            <div>
              <h2 className="text-[17px] leading-[1.2] font-black text-[#0d3950] dark:text-white">
                Cadastro de Tarefas e Entregas
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Cadastre por disciplina ou geral — alocado automaticamente no seu Calendário Acadêmico.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="text-xs font-extrabold text-[#006768] hover:underline dark:text-cyan-400"
            >
              Abrir formulário detalhado →
            </button>
          </div>

          <form
            onSubmit={(e) => void handleQuickCreate(e)}
            className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-[1.4fr_1.1fr_0.85fr_0.75fr_0.6fr_auto]"
          >
            <Input
              label="Título da tarefa | entrega"
              placeholder="Ex.: Entrega P1, Lista de Exercícios, Estudar..."
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              required
            />

            <Select
              label="Disciplina ou área"
              value={quickSubjectId}
              onChange={(e) => setQuickSubjectId(e.target.value)}
            >
              <option value="">Geral | Outras Atividades</option>
              {subjects.length > 0 && (
                <optgroup label="Disciplinas ativas">
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subject.name}
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

            <Select
              label="Categoria"
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value as AcademicTaskCategory)}
            >
              <option value="task">Tarefa | Entrega</option>
              <option value="assignment">Trabalho | Projeto</option>
              <option value="exam">Prova | Avaliação</option>
              <option value="other">Estudo | Afins</option>
            </Select>

            <Input
              label="Data no Calendário"
              type="date"
              value={quickDate}
              onChange={(e) => setQuickDate(e.target.value)}
              required
            />

            <Input
              label="Horário"
              type="time"
              value={quickTime}
              onChange={(e) => setQuickTime(e.target.value)}
              required
            />

            <div className="flex items-end">
              <button
                type="submit"
                disabled={quickSaving}
                className="press group inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#0d3950] px-3 text-[12px] font-black text-white shadow-md transition hover:bg-[#005063] disabled:opacity-50 dark:bg-[#006768] dark:hover:bg-[#005063]"
              >
                <Plus size={16} className="transition-transform duration-300 group-hover:rotate-90" />
                <span>{quickSaving ? 'Salvando...' : 'Adicionar'}</span>
              </button>
            </div>
          </form>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          <article
            className="stagger-item card-lift rounded-[18px] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-[#005063]/30 dark:bg-[#081a26]"
            style={{ animationDelay: '0ms' }}
          >
            <p className="text-[10px] font-semibold tracking-[0.03em] text-slate-500 uppercase dark:text-slate-400">Tarefas filtradas</p>
            <p className="mt-2 text-[25px] leading-[1.1] font-black text-[#0d3950] dark:text-white"><MetricValue value={totalTasks} /></p>
          </article>
          <article
            className="stagger-item card-lift rounded-[18px] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-[#005063]/30 dark:bg-[#081a26]"
            style={{ animationDelay: '45ms' }}
          >
            <p className="text-[10px] font-semibold tracking-[0.03em] text-slate-500 uppercase dark:text-slate-400">Pendentes</p>
            <p className="mt-2 text-[25px] leading-[1.1] font-black text-[#0d3950] dark:text-white"><MetricValue value={pendingTasks} /></p>
          </article>
          <article
            className="stagger-item card-lift rounded-[18px] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-[#005063]/30 dark:bg-[#081a26]"
            style={{ animationDelay: '90ms' }}
          >
            <p className="text-[10px] font-semibold tracking-[0.03em] text-slate-500 uppercase dark:text-slate-400">Concluídas</p>
            <p className="mt-2 text-[25px] leading-[1.1] font-black text-[#0d3950] dark:text-white"><MetricValue value={completedTasks} /></p>
          </article>
        </section>

        <section className="mt-4 rounded-[18px] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-[17px] dark:border-[#005063]/30 dark:bg-[#081a26]">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Select
              label="Filtrar por disciplina ou área"
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
            >
              <option value="all">Todas as disciplinas e atividades</option>
              <option value="general">Geral | Outras Atividades (Sem disciplina)</option>
              {subjectOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
            <Select
              label="Filtrar por status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as 'all' | AcademicTaskStatus)
              }
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="in_progress">Em andamento</option>
              <option value="completed">Concluídas</option>
            </Select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Clock3 size={14} aria-hidden="true" /> Ordem por prazo e título
              </span>
              {subjectFilter !== 'all' || statusFilter !== 'all' ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-[#005063]/10 px-3 py-1.5 text-[#005063] transition hover:bg-[#005063]/20 dark:bg-[#005063]/30 dark:text-[#a8d5e5] dark:hover:bg-[#005063]/50"
                  onClick={() => {
                    setSubjectFilter('all')
                    setStatusFilter('all')
                  }}
                >
                  <FilterX size={14} aria-hidden="true" />
                  Limpar filtros
                </button>
              ) : null}
            </div>

            <button
              type="button"
              onClick={openCreate}
              className="press group inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[#0d3950] px-3 text-[11px] font-bold text-white transition hover:bg-[#005063] dark:bg-[#005063] dark:hover:bg-[#006768]"
            >
              <Plus size={14} className="transition-transform duration-300 group-hover:rotate-90" />
              Nova Tarefa Detalhada
            </button>
          </div>

          {toggleError ? (
            <div className="mt-4">
              <Alert>{toggleError}</Alert>
            </div>
          ) : null}

          {tasks.length === 0 ? (
            <div className="mt-4 rounded-[18px] border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center dark:border-[#005063]/30 dark:bg-[#041019]">
              <LoaderCircle className="mx-auto text-slate-400 dark:text-slate-500" size={24} aria-hidden="true" />
              <p className="mt-3 text-[15px] font-black text-[#0d3950] dark:text-white">
                Ainda não há tarefas cadastradas
              </p>
              <p className="mt-2 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                Use a barra de cadastro rápido acima ou clique no botão abaixo para criar tarefas de disciplinas ou atividades gerais.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-xl bg-[#006768] px-3 text-[12px] font-bold text-white shadow-md transition hover:bg-[#005063]"
              >
                <Plus size={16} />
                Cadastrar Primeira Tarefa
              </button>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="mt-4 rounded-[18px] border border-dashed border-slate-300 bg-slate-50/80 p-6 text-center dark:border-[#005063]/30 dark:bg-[#041019]">
              <LoaderCircle className="mx-auto text-slate-400 dark:text-slate-500" size={24} aria-hidden="true" />
              <p className="mt-3 text-[15px] font-black text-[#0d3950] dark:text-white">
                Nenhuma tarefa corresponde aos filtros
              </p>
              <p className="mt-2 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                Ajuste a disciplina ou o status selecionado para visualizar outra combinação de resultados.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {STATUS_ORDER.map((status) => {
                const group = groupedTasks[status]
                if (statusFilter !== 'all' && statusFilter !== status) return null
                return (
                  <section
                    key={status}
                    className="rounded-[18px] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-[#005063]/20 dark:bg-[#041019]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold tracking-[0.16em] text-[#005063] uppercase dark:text-[#a8d5e5]">
                          {STATUS_LABELS[status]}
                        </p>
                        <h2 className="mt-1 text-[17px] leading-[1.2] font-black tracking-tight text-[#0d3950] dark:text-white">
                          {statusDescription(status)}
                        </h2>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold ${statusBadgeClass(status)}`}
                      >
                        {group.length}
                      </span>
                    </div>

                    {group.length === 0 ? (
                      <p className="mt-3 text-[13px] text-slate-500">Nenhuma tarefa nesta categoria.</p>
                    ) : (
                      <div className="mt-3 grid gap-3 lg:grid-cols-2">
                        {group.map((task, index) => {
                          const catMeta =
                            CATEGORY_LABELS[task.category || 'task'] || CATEGORY_LABELS.task
                          return (
                            <article
                              key={task.id}
                              className="stagger-item card-lift rounded-[14px] border border-slate-200/80 bg-white p-4 shadow-sm dark:border-[#005063]/30 dark:bg-[#081a26]"
                              style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={task.status === 'completed'}
                                    disabled={togglingTaskId === task.id}
                                    onChange={() => void toggleTask(task)}
                                    aria-label={
                                      task.status === 'completed'
                                        ? 'Desmarcar tarefa concluída'
                                        : 'Marcar tarefa concluída'
                                    }
                                    className="mt-1 size-5 rounded border-slate-300 text-[#006768] focus:ring-2 focus:ring-[#006768] focus:ring-offset-2 dark:border-slate-700 dark:bg-[#041019]"
                                  />
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span
                                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${catMeta.badgeClass}`}
                                      >
                                        {catMeta.label}
                                      </span>
                                      <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                                        {task.subject_name}
                                        {task.subject_semester
                                          ? ` · ${task.subject_semester}º sem`
                                          : ''}
                                      </span>
                                    </div>
                                    <h3 className="mt-1.5 text-[13px] leading-[1.25] font-black tracking-tight text-[#0d3950] dark:text-white">
                                      {task.title}
                                    </h3>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <span
                                    className={`rounded-full px-3 py-1 text-[10px] font-bold ${statusBadgeClass(task.status)}`}
                                  >
                                    {STATUS_LABELS[task.status]}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => openEdit(task)}
                                      className="inline-flex min-h-9 items-center rounded-lg px-2.5 text-xs font-bold text-[#005063] transition hover:bg-[#005063]/10 dark:text-[#a8d5e5] dark:hover:bg-[#005063]/30"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      type="button"
                                      disabled={deletingTaskId === task.id}
                                      onClick={() => void handleDeleteTask(task)}
                                      className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-500/10 disabled:opacity-50 dark:text-rose-400"
                                    >
                                      <Trash2 size={13} />
                                      Excluir
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {task.description ? (
                                <p className="mt-2.5 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
                                  {task.description}
                                </p>
                              ) : null}

                              <dl className="mt-3 grid gap-2.5 text-[13px] text-slate-600 sm:grid-cols-2 dark:text-slate-300">
                                <div>
                                  <dt className="font-semibold text-slate-500 dark:text-slate-400">
                                    Data no Calendário | Prazo
                                  </dt>
                                  <dd className="mt-1 font-bold text-[#0d3950] dark:text-white">
                                    {formatDate(task.due_date)}
                                  </dd>
                                </div>
                                <div>
                                  <dt className="font-semibold text-slate-500 dark:text-slate-400">
                                    Estimativa
                                  </dt>
                                  <dd className="mt-1 font-bold text-[#0d3950] dark:text-white">
                                    {task.estimated_minutes} min
                                  </dd>
                                </div>
                                <div>
                                  <dt className="font-semibold text-slate-500 dark:text-slate-400">
                                    Tempo realizado
                                  </dt>
                                  <dd className="mt-1 font-bold text-[#0d3950] dark:text-white">
                                    {task.actual_minutes} min
                                  </dd>
                                </div>
                                <div>
                                  <dt className="font-semibold text-slate-500 dark:text-slate-400">
                                    Sincronização
                                  </dt>
                                  <dd className="mt-1">
                                    <Link
                                      to="/calendario"
                                      className="inline-flex items-center gap-1 text-xs font-extrabold text-[#006768] hover:underline dark:text-cyan-400"
                                    >
                                      <CalendarIcon size={13} />
                                      Alocada no Calendário →
                                    </Link>
                                  </dd>
                                </div>
                              </dl>

                              <div className="mt-3 rounded-[14px] border border-[#005063]/20 bg-[#005063]/5 p-3.5 dark:border-[#005063]/30 dark:bg-[#041019]">
                                <div className="flex items-center justify-between gap-3">
                                  <div>
                                    <p className="text-[10px] font-bold tracking-[0.16em] text-[#005063] uppercase dark:text-[#a8d5e5]">
                                      Sessão de Estudo & Anotações
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                                      {task.actual_minutes > 0
                                        ? `${task.actual_minutes} min realizados`
                                        : 'Nenhuma sessão iniciada ainda'}
                                    </p>
                                  </div>
                                  <Link
                                    to={`/estudo?taskId=${task.id}`}
                                    className="press inline-flex min-h-9 items-center rounded-xl bg-[#006768] px-3 text-[11px] font-bold text-white shadow-md shadow-[#006768]/20 transition hover:bg-[#005063]"
                                  >
                                    Iniciar estudo →
                                  </Link>
                                </div>
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          )}
        </section>
      </div>
      <TaskFormModal
        open={modalOpen}
        subjects={subjects}
        initialTask={editingTask}
        onClose={() => {
          setModalOpen(false)
          setEditingTask(null)
        }}
        onSaved={handleSaved}
      />
    </div>
  )
}
