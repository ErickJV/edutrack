/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { ArrowLeft, BookOpen, FileText, LogOut, Plus } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  createAcademicReading,
  deleteAcademicReading,
  listAcademicReadings,
  listAcademicTasks,
  listReadingLogs,
  listStudentSubjects,
  logReadingPages,
  updateAcademicReading,
  updateAcademicTask,
} from '../api/client'
import type {
  AcademicReading,
  AcademicReadingPayload,
  AcademicTask,
  ReadingLog,
  ReadingLogPayload,
  StudentSubject,
  StudyMethodologyKey,
} from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { AppNavigation } from '../components/AppNavigation'
import { Brand } from '../components/Brand'
import { Alert } from '../components/Feedback'
import { LogPagesModal } from '../components/LogPagesModal'
import { MethodologySelector } from '../components/MethodologySelector'
import { PomodoroTimer } from '../components/PomodoroTimer'
import { ReadingCard } from '../components/ReadingCard'
import { ReadingModal } from '../components/ReadingModal'
import { ReadingStreakTracker } from '../components/ReadingStreakTracker'
import { StudyNotesWorkspace } from '../components/StudyNotesWorkspace'
import { ThemeToggle } from '../components/ThemeToggle'
import { calculateReadingSummary } from '../utils/readingStats'

export function StudySessionPage() {
  const { signOut } = useAuth()
  const params = useParams<{ taskId?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const taskIdFromQuery = params.taskId || searchParams.get('taskId') || ''
  const tabFromQuery = (searchParams.get('tab') as 'workspace' | 'readings') || 'workspace'

  const [activeTab, setActiveTab] = useState<'workspace' | 'readings'>(tabFromQuery)
  const [tasks, setTasks] = useState<AcademicTask[]>([])
  const [subjects, setSubjects] = useState<StudentSubject[]>([])
  const [readings, setReadings] = useState<AcademicReading[]>([])
  const [readingLogs, setReadingLogs] = useState<ReadingLog[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string>(taskIdFromQuery)
  const [selectedMethodology, setSelectedMethodology] = useState<StudyMethodologyKey | ''>(
    'feynman',
  )
  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [leaving, setLeaving] = useState(false)

  // Modals for readings
  const [readingModalOpen, setReadingModalOpen] = useState(false)
  const [editingReading, setEditingReading] = useState<AcademicReading | null>(null)
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [loggingReading, setLoggingReading] = useState<AcademicReading | null>(null)

  const taskSelectId = useId()

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [loadedTasks, loadedSubjects, loadedReadings, loadedLogs] = await Promise.all([
        listAcademicTasks(),
        listStudentSubjects(),
        listAcademicReadings(),
        listReadingLogs(),
      ])
      setTasks(loadedTasks)
      setSubjects(loadedSubjects)
      setReadings(loadedReadings)
      setReadingLogs(loadedLogs)

      if (taskIdFromQuery && loadedTasks.some((t) => t.id === taskIdFromQuery)) {
        setSelectedTaskId(taskIdFromQuery)
      }
    } catch {
      setError('Não foi possível carregar as tarefas, disciplinas e leituras.')
    } finally {
      setLoading(false)
    }
  }, [taskIdFromQuery])

  useEffect(() => {
    void loadData()
  }, [loadData])

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

  // Calculated reading summary stats
  const readingSummary = useMemo(
    () => calculateReadingSummary(readingLogs, 20),
    [readingLogs],
  )

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
    setActiveTab('workspace')
  }

  const handleTaskChange = (taskId: string) => {
    setSelectedTaskId(taskId)
    if (taskId) {
      setSearchParams({ taskId, tab: activeTab })
    } else {
      setSearchParams({ tab: activeTab })
    }
  }

  const switchTab = (tab: 'workspace' | 'readings') => {
    setActiveTab(tab)
    if (selectedTaskId) {
      setSearchParams({ taskId: selectedTaskId, tab })
    } else {
      setSearchParams({ tab })
    }
  }

  // Reading CRUD actions
  const handleSaveReading = async (payload: AcademicReadingPayload, readingId?: string) => {
    if (readingId) {
      const updated = await updateAcademicReading(readingId, payload)
      setReadings((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
    } else {
      const created = await createAcademicReading(payload)
      setReadings((prev) => [created, ...prev])
    }
    const freshLogs = await listReadingLogs()
    setReadingLogs(freshLogs)
  }

  const handleDeleteReading = async (reading: AcademicReading) => {
    const confirmed = window.confirm(`Deseja realmente excluir "${reading.title}"?`)
    if (!confirmed) return
    try {
      await deleteAcademicReading(reading.id)
      setReadings((prev) => prev.filter((r) => r.id !== reading.id))
      const freshLogs = await listReadingLogs()
      setReadingLogs(freshLogs)
    } catch {
      setError('Erro ao excluir leitura.')
    }
  }

  const handleQuickLog10 = async (reading: AcademicReading) => {
    try {
      setError('')
      const updated = await logReadingPages(reading.id, { pages: 10 })
      setReadings((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      const freshLogs = await listReadingLogs()
      setReadingLogs(freshLogs)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar páginas na leitura.'
      setError(message)
    }
  }

  const handleLogCustomPages = async (readingId: string, payload: ReadingLogPayload) => {
    try {
      setError('')
      const updated = await logReadingPages(readingId, payload)
      setReadings((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
      const freshLogs = await listReadingLogs()
      setReadingLogs(freshLogs)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao registrar páginas na leitura.'
      setError(message)
      throw err
    }
  }

  const handleCreateNoteFromReading = (reading: AcademicReading) => {
    const template = `# [Leitura] ${reading.title}${reading.author ? ` - ${reading.author}` : ''}
${reading.exam_name ? `> **Vínculo**: ${reading.exam_name} (${reading.exam_questions_count} questões)` : ''}

## 📖 Síntese dos Capítulos / Páginas
> Principais pontos abordados na leitura até a página ${reading.current_page}.

## 💡 Conceitos Fundamentais
- **Conceito 1**: ...
- **Conceito 2**: ...

## ❓ Questões Potenciais de Prova
1. O que este autor defende sobre ...?
2. Como este tema pode ser cobrado na avaliação?
`
    setPendingTemplate(template)
    setActiveTab('workspace')
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
    <div className="min-h-screen bg-slate-50/50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-50">
      <div className="flex w-full flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
        {/* Navigation & Header */}
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Brand />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => void leave()}
                disabled={leaving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
              >
                <LogOut className="size-4" aria-hidden="true" />
                {leaving ? 'Saindo...' : 'Sair'}
              </button>
            </div>
          </div>
          <AppNavigation />
        </header>

        {/* Page Topbar with Title, Tab Switcher and Task Focus */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/tarefas"
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-xs transition hover:bg-slate-50 hover:text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Voltar para Tarefas"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 sm:text-3xl">
                Sessão de Estudo
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Caderno de anotações, ciclos de foco e acompanhamento de leitura acadêmica
              </p>
            </div>
          </div>

          {/* Tab Selector & Task Context */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Tab switch buttons */}
            <div
              role="tablist"
              aria-label="Seção de Estudo"
              className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'workspace'}
                onClick={() => switchTab('workspace')}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                  activeTab === 'workspace'
                    ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
                    : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-50'
                }`}
              >
                <FileText className="size-3.5" aria-hidden="true" />
                Caderno & Foco
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'readings'}
                onClick={() => switchTab('readings')}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                  activeTab === 'readings'
                    ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
                    : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-50'
                }`}
              >
                <BookOpen className="size-3.5" aria-hidden="true" />
                Leitura Acadêmica ({readings.length})
              </button>
            </div>

            {/* Task Focus Select */}
            <div className="flex items-center gap-1.5">
              <label
                htmlFor={taskSelectId}
                className="hidden text-xs font-bold text-slate-500 dark:text-slate-400 sm:inline-block"
              >
                Foco:
              </label>
              <select
                id={taskSelectId}
                value={selectedTaskId}
                onChange={(e) => handleTaskChange(e.target.value)}
                className="min-h-9 max-w-[200px] truncate rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-xs focus:border-indigo-600 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
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
        </div>

        {error ? <Alert tone="error">{error}</Alert> : null}

        {/* Selected Task Details Banner */}
        {activeTask ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-3.5 dark:border-indigo-900/40 dark:bg-indigo-950/20">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Tarefa Vinculada
              </span>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">
                {activeTask.title} · {activeTask.subject_name}
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <span>
                Estimado:{' '}
                <strong className="text-slate-900 dark:text-slate-100">
                  {activeTask.estimated_minutes} min
                </strong>
              </span>
              <span>
                Realizado:{' '}
                <strong className="text-indigo-600 dark:text-indigo-400">
                  {activeTask.actual_minutes} min
                </strong>
              </span>
            </div>
          </div>
        ) : null}

        {/* TAB 1: WORKSPACE (Top row: Pomodoro & Methodology side-by-side | Bottom row: Full Width Textbook) */}
        {activeTab === 'workspace' && (
          <div className="flex flex-col gap-6">
            {/* Top Row: Focus Utilities side-by-side */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Pomodoro Timer (~5 cols on desktop) */}
              <div className="lg:col-span-5">
                <PomodoroTimer activeTask={activeTask} onSyncMinutes={handleSyncMinutes} />
              </div>

              {/* Methodology Guide (~7 cols on desktop) */}
              <div className="lg:col-span-7">
                <MethodologySelector
                  selectedMethodology={selectedMethodology}
                  onSelectMethodology={setSelectedMethodology}
                  onInsertTemplate={handleInsertTemplate}
                />
              </div>
            </div>

            {/* Bottom Row: Full-width Textbook Workspace */}
            <div className="w-full">
              <StudyNotesWorkspace
                activeSubject={activeSubject}
                activeTask={activeTask}
                subjects={subjects}
                tasks={tasks}
                readings={readings}
                externalTemplate={pendingTemplate}
                onClearExternalTemplate={() => setPendingTemplate(null)}
              />
            </div>
          </div>
        )}

        {/* TAB 2: ACADEMIC READING DASHBOARD */}
        {activeTab === 'readings' && (
          <div className="space-y-6">
            {/* Streak & 14-Day SVG Chart */}
            <ReadingStreakTracker summary={readingSummary} />

            {/* Reading List Actions Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-950 dark:text-slate-50">
                  Leituras e Livros Vinculados a Provas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Acompanhe seu ritmo de páginas por dia para cobrir as leituras até as avaliações
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingReading(null)
                  setReadingModalOpen(true)
                }}
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <Plus className="size-4" aria-hidden="true" />
                Nova Leitura
              </button>
            </div>

            {/* Grid of Reading Cards */}
            {readings.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center dark:border-slate-800 dark:bg-slate-900">
                <span className="text-4xl">📚</span>
                <h4 className="mt-3 text-base font-black text-slate-900 dark:text-slate-100">
                  Nenhuma leitura cadastrada
                </h4>
                <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                  Cadastre seus livros, artigos e apostilas para calcular o ritmo diário até as
                  provas P1/P2/P3.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingReading(null)
                    setReadingModalOpen(true)
                  }}
                  className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-700 dark:bg-indigo-500"
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  Cadastrar primeira leitura
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {readings.map((reading) => (
                  <ReadingCard
                    key={reading.id}
                    reading={reading}
                    onQuickLog10={handleQuickLog10}
                    onLogCustomPages={(r) => {
                      setLoggingReading(r)
                      setLogModalOpen(true)
                    }}
                    onEdit={(r) => {
                      setEditingReading(r)
                      setReadingModalOpen(true)
                    }}
                    onDelete={handleDeleteReading}
                    onCreateNote={handleCreateNoteFromReading}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reading Modal */}
      <ReadingModal
        isOpen={readingModalOpen}
        reading={editingReading}
        subjects={subjects}
        onClose={() => {
          setReadingModalOpen(false)
          setEditingReading(null)
        }}
        onSave={handleSaveReading}
      />

      {/* Log Pages Modal */}
      <LogPagesModal
        isOpen={logModalOpen}
        reading={loggingReading}
        onClose={() => {
          setLogModalOpen(false)
          setLoggingReading(null)
        }}
        onLog={handleLogCustomPages}
      />
    </div>
  )
}
