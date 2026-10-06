import { BookOpen, CheckCircle2, Clock3, FilterX, ListTodo, LoaderCircle, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { listAcademicTasks, listStudentSubjects, toggleAcademicTaskComplete } from '../api/client'
import type { AcademicTask, AcademicTaskStatus, StudentSubject } from '../api/types'
import { Brand } from '../components/Brand'
import { AppNavigation } from '../components/AppNavigation'
import { Alert, PageLoader } from '../components/Feedback'
import { Select } from '../components/FormControls'
import { TaskFormModal } from '../components/TaskFormModal'
import { ThemeToggle } from '../components/ThemeToggle'

const STATUS_LABELS: Record<'all' | AcademicTaskStatus, string> = {
  all: 'Todos',
  pending: 'Pendentes',
  in_progress: 'Em andamento',
  completed: 'Concluídas',
}

const STATUS_ORDER: AcademicTaskStatus[] = ['pending', 'in_progress', 'completed']

function formatDate(value: string | null): string {
  if (!value) return 'Sem prazo'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sem prazo'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date)
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | AcademicTaskStatus>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<AcademicTask | null>(null)
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null)
  const [toggleError, setToggleError] = useState('')

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [taskResponse, subjectResponse] = await Promise.all([listAcademicTasks(), listStudentSubjects()])
        if (!alive) return
        setTasks(taskResponse)
        setSubjects(subjectResponse)
      } catch {
        if (alive) setError('Não foi possível carregar suas tarefas.')
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  const subjectOptions = useMemo(
    () =>
      subjects
        .map((subject) => [subject.subject.id, subject.subject.name] as const)
        .sort((left, right) => left[1].localeCompare(right[1], 'pt-BR')),
    [subjects],
  )

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => subjectFilter === 'all' || task.subject_id === subjectFilter)
      .filter((task) => statusFilter === 'all' || task.status === statusFilter)
      .sort(sortTasks)
  }, [tasks, subjectFilter, statusFilter])

  const groupedTasks = useMemo(() => {
    return STATUS_ORDER.reduce(
      (acc, status) => {
        acc[status] = filteredTasks.filter((task) => task.status === status)
        return acc
      },
      { pending: [] as AcademicTask[], in_progress: [] as AcademicTask[], completed: [] as AcademicTask[] },
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
      const next = current.some((item) => item.id === task.id) ? current.map((item) => (item.id === task.id ? task : item)) : [task, ...current]
      return next.sort(sortTasks)
    })
    setModalOpen(false)
    setEditingTask(null)
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
    setTasks((current) => current.map((item) => (item.id === task.id ? optimisticTask : item)).sort(sortTasks))

    try {
      const updatedTask = await toggleAcademicTaskComplete(task.id)
      setTasks((current) => current.map((item) => (item.id === task.id ? updatedTask : item)).sort(sortTasks))
    } catch {
      setToggleError('Não foi possível atualizar o status da tarefa.')
      setTasks((current) => current.map((item) => (item.id === task.id ? task : item)).sort(sortTasks))
    } finally {
      setTogglingTaskId(null)
    }
  }


  if (loading) return <PageLoader />

  return (
    <main className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <Brand />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0d3950] px-4 text-sm font-bold text-white transition hover:bg-[#005063] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005063] dark:bg-[#005063] dark:hover:bg-[#006768]"
              >
                <span className="hidden sm:inline">Nova tarefa</span>
                <span className="sm:hidden">Nova</span>
              </button>
              <span className="hidden min-h-11 items-center gap-2 rounded-xl border border-slate-200/80 bg-white/70 px-4 text-sm font-bold text-[#0d3950] sm:inline-flex dark:border-[#005063]/30 dark:bg-[#081a26]/70 dark:text-slate-200">
                <ListTodo size={18} aria-hidden="true" />
                Gestão de tarefas
              </span>
            </div>
          </div>
          <div className="mt-4">
            <AppNavigation />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <section className="rounded-[2rem] bg-[#0d3950] border border-[#005063]/40 px-6 py-8 text-white shadow-xl sm:px-10 sm:py-10 dark:bg-[#081a26] dark:border-[#005063]/50">
          <div className="max-w-3xl space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white">
              <BookOpen size={14} aria-hidden="true" /> Tarefas acadêmicas
            </p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-white">Organize entregas, revise prioridades e acompanhe o que já foi concluído.</h1>
            <p className="max-w-2xl text-base leading-7 text-[#dce6ef]/90">
              Filtre tarefas por disciplina ou status para enxergar rapidamente o que está pendente, em andamento ou finalizado.
            </p>
          </div>
        </section>

        {error ? <div className="mt-6"><Alert>{error}</Alert></div> : null}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#005063]/30 dark:bg-[#081a26]">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Tarefas filtradas</p>
            <p className="mt-2 text-3xl font-black text-[#0d3950] dark:text-white">{totalTasks}</p>
          </article>
          <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#005063]/30 dark:bg-[#081a26]">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Pendentes</p>
            <p className="mt-2 text-3xl font-black text-[#0d3950] dark:text-white">{pendingTasks}</p>
          </article>
          <article className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#005063]/30 dark:bg-[#081a26]">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Concluídas</p>
            <p className="mt-2 text-3xl font-black text-[#0d3950] dark:text-white">{completedTasks}</p>
          </article>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-[#005063]/30 dark:bg-[#081a26]">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Select label="Filtrar por disciplina" value={subjectFilter} onChange={(event) => setSubjectFilter(event.target.value)}>
              <option value="all">Todas as disciplinas</option>
              {subjectOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </Select>
            <Select
              label="Filtrar por status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'all' | AcademicTaskStatus)}
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendentes</option>
              <option value="in_progress">Em andamento</option>
              <option value="completed">Concluídas</option>
            </Select>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500 dark:text-slate-400">
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
          {toggleError ? <div className="mt-4"><Alert>{toggleError}</Alert></div> : null}
          {tasks.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center dark:border-[#005063]/30 dark:bg-[#041019]">
              <LoaderCircle className="mx-auto text-slate-400 dark:text-slate-500" size={28} aria-hidden="true" />
              <p className="mt-4 text-lg font-black text-[#0d3950] dark:text-white">Ainda não há tarefas cadastradas</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Quando você criar tarefas para suas disciplinas, elas aparecerão organizadas por status nesta tela.
              </p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center dark:border-[#005063]/30 dark:bg-[#041019]">
              <LoaderCircle className="mx-auto text-slate-400 dark:text-slate-500" size={28} aria-hidden="true" />
              <p className="mt-4 text-lg font-black text-[#0d3950] dark:text-white">Nenhuma tarefa corresponde aos filtros</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Ajuste a disciplina ou o status selecionado para visualizar outra combinação de resultados.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {STATUS_ORDER.map((status) => {
                const group = groupedTasks[status]
                if (statusFilter !== 'all' && statusFilter !== status) return null
                return (
                  <section key={status} className="rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-[#005063]/20 dark:bg-[#041019]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#005063] dark:text-[#a8d5e5]">{STATUS_LABELS[status]}</p>
                        <h2 className="mt-1 text-xl font-black tracking-tight text-[#0d3950] dark:text-white">{statusDescription(status)}</h2>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(status)}`}>{group.length}</span>
                    </div>

                    {group.length === 0 ? (
                      <p className="mt-4 text-sm text-slate-500">Nenhuma tarefa nesta categoria.</p>
                    ) : (
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        {group.map((task) => (
                          <article key={task.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#005063]/30 dark:bg-[#081a26]">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={task.status === 'completed'}
                                  disabled={togglingTaskId === task.id}
                                  onChange={() => void toggleTask(task)}
                                  aria-label={task.status === 'completed' ? 'Desmarcar tarefa concluída' : 'Marcar tarefa concluída'}
                                  className="mt-1 size-5 rounded border-slate-300 text-[#006768] focus:ring-2 focus:ring-[#006768] focus:ring-offset-2 dark:border-slate-700 dark:bg-[#041019]"
                                />
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                                    {task.subject_name} · {task.subject_semester}º semestre
                                  </p>
                                  <h3 className="mt-1 text-xl font-black tracking-tight text-[#0d3950] dark:text-white">{task.title}</h3>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(task.status)}`}>{STATUS_LABELS[task.status]}</span>
                                <button
                                  type="button"
                                  onClick={() => openEdit(task)}
                                  className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-bold text-[#005063] transition hover:bg-[#005063]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005063] dark:text-[#a8d5e5] dark:hover:bg-[#005063]/30 dark:focus-visible:outline-[#006768]"
                                >
                                  Editar
                                </button>
                              </div>
                            </div>

                            {task.description ? <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{task.description}</p> : null}

                            <dl className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                              <div>
                                <dt className="font-semibold text-slate-500 dark:text-slate-400">Prazo</dt>
                                <dd className="mt-1 font-bold text-[#0d3950] dark:text-white">{formatDate(task.due_date)}</dd>
                              </div>
                              <div>
                                <dt className="font-semibold text-slate-500 dark:text-slate-400">Estimativa</dt>
                                <dd className="mt-1 font-bold text-[#0d3950] dark:text-white">{task.estimated_minutes} min</dd>
                              </div>
                              <div>
                                <dt className="font-semibold text-slate-500 dark:text-slate-400">Tempo realizado</dt>
                                <dd className="mt-1 font-bold text-[#0d3950] dark:text-white">{task.actual_minutes} min</dd>
                              </div>
                              <div>
                                <dt className="font-semibold text-slate-500 dark:text-slate-400">Situação</dt>
                                <dd className="mt-1 font-bold text-[#0d3950] dark:text-white">{statusDescription(task.status)}</dd>
                              </div>
                            </dl>

                            <div className="mt-4 rounded-2xl border border-[#005063]/20 bg-[#005063]/5 p-4 dark:border-[#005063]/30 dark:bg-[#041019]">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#005063] dark:text-[#a8d5e5]">
                                    Sessão de Estudo Pomodoro
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                                    {task.actual_minutes > 0
                                      ? `${task.actual_minutes} min realizados`
                                      : 'Nenhuma sessão iniciada ainda'}
                                  </p>
                                </div>
                                <Link
                                  to={`/estudo?taskId=${task.id}`}
                                  className="inline-flex min-h-11 items-center rounded-xl bg-[#006768] px-4 text-xs font-bold text-white shadow-md shadow-[#006768]/20 transition hover:bg-[#005063] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006768]"
                                >
                                  Iniciar estudo →
                                </Link>
                              </div>
                            </div>
                          </article>
                        ))}
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
    </main>
  )
}
