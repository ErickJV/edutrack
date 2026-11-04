/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { BookOpen, FileText, LogOut, Plus } from 'lucide-react'
import { useParams, useSearchParams } from 'react-router-dom'
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
  const [, setLoading] = useState(true)
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

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) || null,
    [tasks, selectedTaskId],
  )

  const activeSubject = useMemo(() => {
    if (activeTask) {
      return subjects.find((s) => s.id === activeTask.student_subject) || null
    }
    return subjects[0] || null
  }, [activeTask, subjects])

  const readingSummary = useMemo(
    () => calculateReadingSummary(readingLogs, 20),
    [readingLogs],
  )

  const handleSyncMinutes = async (minutes: number) => {
    if (!activeTask) return
    const newActual = activeTask.actual_minutes + minutes
    const updated = await updateAcademicTask(activeTask.id, { actual_minutes: newActual })
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
  }

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
- O que este autor defende sobre ...?
- Como este tema pode ser cobrado na avaliação?
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
    <main className="min-h-dvh bg-[#dce6ef] text-[#0d3950] transition-colors dark:bg-[#040f17] dark:text-slate-50">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-[#005063]/30 dark:bg-[#081a26]/90">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <Brand />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => void leave()}
                disabled={leaving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-sm font-bold text-[#0d3950] transition hover:bg-slate-50 disabled:opacity-50 dark:border-[#005063]/40 dark:bg-[#041019] dark:text-slate-100 dark:hover:bg-[#0d3950]/40"
              >
                <LogOut className="size-4" aria-hidden="true" />
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
        {/* Cabeçalho do Módulo de Anotações */}
        <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-[#0d3950]/5 sm:p-8 dark:border-[#005063]/30 dark:bg-[#081a26]/90">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#0d3950] sm:text-3xl dark:text-white">
                Anotações
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Caderno digital com folha pautada alinhada, personalização de fontes, ciclo Pomodoro e leituras.
              </p>
            </div>

            {/* Alternador de Abas & Foco em Tarefa */}
            <div className="flex flex-wrap items-center gap-3">
              <div
                role="tablist"
                aria-label="Seção de Anotações"
                className="flex rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-[#005063]/40 dark:bg-[#041019]"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'workspace'}
                  onClick={() => switchTab('workspace')}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-extrabold transition ${
                    activeTab === 'workspace'
                      ? 'bg-[#0d3950] text-white shadow-xs dark:bg-[#005063]'
                      : 'text-slate-600 hover:text-[#0d3950] dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  <FileText className="size-3.5" aria-hidden="true" />
                  Bloco de Anotações
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'readings'}
                  onClick={() => switchTab('readings')}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3.5 text-xs font-extrabold transition ${
                    activeTab === 'readings'
                      ? 'bg-[#0d3950] text-white shadow-xs dark:bg-[#005063]'
                      : 'text-slate-600 hover:text-[#0d3950] dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  <BookOpen className="size-3.5" aria-hidden="true" />
                  Leitura Acadêmica ({readings.length})
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-[#005063]/30 dark:bg-[#041019]">
                <label
                  htmlFor={taskSelectId}
                  className="text-xs font-bold text-slate-500 dark:text-slate-400"
                >
                  Foco:
                </label>
                <select
                  id={taskSelectId}
                  value={selectedTaskId}
                  onChange={(e) => handleTaskChange(e.target.value)}
                  className="max-w-[200px] truncate bg-transparent text-xs font-bold text-[#0d3950] focus:outline-hidden dark:text-slate-100"
                >
                  <option value="">(Anotação Livre)</option>
                  {tasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title} ({task.subject_name})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {error ? <Alert tone="error">{error}</Alert> : null}

        {/* ABA 1: BLOCO DE ANOTAÇÕES EM DESTAQUE NO TOPO + APOIO DE FOCO ABAIXO */}
        {activeTab === 'workspace' && (
          <div className="flex flex-col gap-6">
            {/* Bloco de Anotações Principal */}
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

            {/* Ferramentas de Apoio ao Estudo: Pomodoro & Metodologias */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <PomodoroTimer activeTask={activeTask} onSyncMinutes={handleSyncMinutes} />
              </div>
              <div className="lg:col-span-7">
                <MethodologySelector
                  selectedMethodology={selectedMethodology}
                  onSelectMethodology={setSelectedMethodology}
                  onInsertTemplate={handleInsertTemplate}
                />
              </div>
            </div>
          </div>
        )}

        {/* ABA 2: PAINEL DE LEITURA ACADÊMICA */}
        {activeTab === 'readings' && (
          <div className="space-y-6">
            <ReadingStreakTracker summary={readingSummary} />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-[#0d3950] dark:text-white">
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
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-[#0d3950] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#005063] focus-visible:outline-2 focus-visible:outline-[#005063] dark:bg-[#005063] dark:hover:bg-[#006768]"
              >
                <Plus className="size-4" aria-hidden="true" />
                Nova Leitura
              </button>
            </div>

            {readings.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center dark:border-[#005063]/30 dark:bg-[#081a26]">
                <span className="text-4xl">📚</span>
                <h4 className="mt-3 text-base font-black text-[#0d3950] dark:text-white">
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
                  className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[#0d3950] px-4 text-xs font-bold text-white hover:bg-[#005063] dark:bg-[#005063]"
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

      <LogPagesModal
        isOpen={logModalOpen}
        reading={loggingReading}
        onClose={() => {
          setLogModalOpen(false)
          setLoggingReading(null)
        }}
        onLog={handleLogCustomPages}
      />
    </main>
  )
}
