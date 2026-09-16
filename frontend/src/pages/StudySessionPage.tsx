import { ArrowLeft, LogOut } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { listAcademicTasks, listStudentSubjects, updateAcademicTask } from '../api/client'
import type { AcademicTask, StudentSubject, StudyMethodologyKey } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { AppNavigation } from '../components/AppNavigation'
import { Brand } from '../components/Brand'
import { Alert } from '../components/Feedback'
import { MethodologySelector } from '../components/MethodologySelector'
import { PomodoroTimer } from '../components/PomodoroTimer'
import { StudyNotesWorkspace } from '../components/StudyNotesWorkspace'
import { ThemeToggle } from '../components/ThemeToggle'

export function StudySessionPage() {
  const { signOut } = useAuth()
  const params = useParams<{ taskId?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const taskIdFromQuery = params.taskId || searchParams.get('taskId') || ''

  const [tasks, setTasks] = useState<AcademicTask[]>([])
  const [subjects, setSubjects] = useState<StudentSubject[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string>(taskIdFromQuery)
  const [selectedMethodology, setSelectedMethodology] = useState<StudyMethodologyKey | ''>('feynman')
  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [leaving, setLeaving] = useState(false)

  const taskSelectId = useId()

  useEffect(() => {
    let alive = true
    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const [loadedTasks, loadedSubjects] = await Promise.all([
          listAcademicTasks(),
          listStudentSubjects(),
        ])
        if (!alive) return
        setTasks(loadedTasks)
        setSubjects(loadedSubjects)

        // Set initial selected task if query param matches
        if (taskIdFromQuery && loadedTasks.some((t) => t.id === taskIdFromQuery)) {
          setSelectedTaskId(taskIdFromQuery)
        }
      } catch {
        if (alive) setError('Não foi possível carregar as tarefas e disciplinas.')
      } finally {
        if (alive) setLoading(false)
      }
    }
    void loadData()
    return () => {
      alive = false
    }
  }, [taskIdFromQuery])

  // Current active task
  const activeTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) || null,
    [tasks, selectedTaskId],
  )

  // Current active subject (derived from task or first active)
  const activeSubject = useMemo(() => {
    if (activeTask) {
      return subjects.find((s) => s.id === activeTask.student_subject) || null
    }
    return subjects[0] || null
  }, [activeTask, subjects])

  // Sync focus minutes with backend
  const handleSyncMinutes = async (minutes: number) => {
    if (!activeTask) return
    const newActual = activeTask.actual_minutes + minutes
    const updated = await updateAcademicTask(activeTask.id, { actual_minutes: newActual })
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
  }

  // Handle template injection from methodology
  const handleInsertTemplate = (templateText: string) => {
    setPendingTemplate(templateText)
  }

  const handleTaskChange = (taskId: string) => {
    setSelectedTaskId(taskId)
    if (taskId) {
      setSearchParams({ taskId })
    } else {
      setSearchParams({})
    }
  }

  async function leave() {
    setLeaving(true)
    try {
      await signOut()
    } finally {
      setLeaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        {/* Navigation & Header */}
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Brand />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => void leave()}
                disabled={leaving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              >
                <LogOut className="size-4" aria-hidden="true" />
                {leaving ? 'Saindo...' : 'Sair'}
              </button>
            </div>
          </div>
          <AppNavigation />
        </header>

        {/* Breadcrumb back to tasks & page banner */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/tarefas"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-2 text-slate-600 transition hover:bg-white hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Voltar para Tarefas"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Link>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">
                Ambiente de Alta Performance
              </p>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 sm:text-3xl">
                Sessão de Estudo
              </h1>
            </div>
          </div>

          {/* Task Context Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor={taskSelectId}
              className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
              Tarefa em Foco:
            </label>
            <select
              id={taskSelectId}
              value={selectedTaskId}
              onChange={(e) => handleTaskChange(e.target.value)}
              className="min-h-11 max-w-[260px] truncate rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">(Estudo Livre sem Tarefa)</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title} ({task.subject_name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? <Alert tone="error">{error}</Alert> : null}

        {/* Selected Task Info Banner */}
        {activeTask ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Tarefa Vinculada
              </span>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                {activeTask.title} · {activeTask.subject_name}
              </h2>
              {activeTask.description ? (
                <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                  {activeTask.description}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div>
                <span>Estimado: </span>
                <strong className="text-slate-900 dark:text-slate-100">
                  {activeTask.estimated_minutes} min
                </strong>
              </div>
              <div>
                <span>Realizado: </span>
                <strong className="text-indigo-600 dark:text-indigo-400">
                  {activeTask.actual_minutes} min
                </strong>
              </div>
            </div>
          </div>
        ) : null}

        {/* Main Content Grid: Left (Timer & Methodology) | Right (Textbook Notes Workspace) */}
        <div className="grid gap-6 xl:grid-cols-12">
          {/* Left Column: Pomodoro & Methodologies (5 cols on xl) */}
          <div className="flex flex-col gap-6 xl:col-span-5">
            <PomodoroTimer activeTask={activeTask} onSyncMinutes={handleSyncMinutes} />

            <MethodologySelector
              selectedMethodology={selectedMethodology}
              onSelectMethodology={setSelectedMethodology}
              onInsertTemplate={handleInsertTemplate}
            />
          </div>

          {/* Right Column: Study Notes Workspace (7 cols on xl) */}
          <div className="xl:col-span-7">
            <StudyNotesWorkspace
              activeSubject={activeSubject}
              activeTask={activeTask}
              subjects={subjects}
              tasks={tasks}
              externalTemplate={pendingTemplate}
              onClearExternalTemplate={() => setPendingTemplate(null)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
