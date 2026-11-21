import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Layers,
  ListTodo,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  getDashboardSummary,
  listAcademicTasks,
  listCalendarItems,
  listFlashcards,
  listStudentSubjects,
  toggleAcademicTaskComplete,
} from '../api/client'
import type { AcademicTask, CalendarItem, DashboardSummary, Flashcard, StudentSubject } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Alert } from '../components/Feedback'
import { FocusCard } from '../components/dashboard/FocusCard'
import { MetricCard } from '../components/dashboard/MetricCard'
import { MiniCalendar } from '../components/dashboard/MiniCalendar'
import { SubjectProgress } from '../components/dashboard/SubjectProgress'
import { UpcomingTasks } from '../components/dashboard/UpcomingTasks'
import { WeeklyActivity } from '../components/dashboard/WeeklyActivity'
import { toLocalDateKey } from '../utils/calendar'
import {
  buildWeekLoad,
  formatLongDate,
  formatMinutes,
  getGreeting,
  getWeekDays,
} from '../utils/dashboard'

export function HomePage() {
  const { user } = useAuth()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [subjects, setSubjects] = useState<StudentSubject[]>([])
  const [tasks, setTasks] = useState<AcademicTask[]>([])
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [weekItems, setWeekItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [partialError, setPartialError] = useState('')
  const [calendarError, setCalendarError] = useState(false)
  const [busyTaskId, setBusyTaskId] = useState<string | null>(null)
  const [selectedDateKey, setSelectedDateKey] = useState(() => toLocalDateKey(new Date()))
  const [reloadKey, setReloadKey] = useState(0)

  const firstName = user?.full_name.trim().split(/\s+/)[0] || 'estudante'

  useEffect(() => {
    let alive = true
    const weekDays = getWeekDays(new Date())

    async function loadDashboard() {
      setLoading(true)
      setError('')
      setPartialError('')
      setCalendarError(false)

      const [summaryResult, subjectsResult, tasksResult, flashcardsResult, calendarResult] =
        await Promise.allSettled([
          getDashboardSummary(),
          listStudentSubjects(),
          listAcademicTasks(),
          listFlashcards(),
          listCalendarItems({
            from: new Date(
              weekDays[0].getFullYear(),
              weekDays[0].getMonth(),
              weekDays[0].getDate(),
              0,
              0,
              0,
            ).toISOString(),
            to: new Date(
              weekDays[6].getFullYear(),
              weekDays[6].getMonth(),
              weekDays[6].getDate(),
              23,
              59,
              59,
            ).toISOString(),
          }),
        ])

      if (!alive) return

      if (summaryResult.status === 'fulfilled') setSummary(summaryResult.value)
      else setError('Não foi possível carregar o resumo do seu dia.')

      if (subjectsResult.status === 'fulfilled') {
        setSubjects(subjectsResult.value.filter((item) => item.status === 'active'))
      } else {
        setPartialError('Não foi possível carregar suas disciplinas.')
      }

      if (tasksResult.status === 'fulfilled') setTasks(tasksResult.value)
      else setPartialError('Não foi possível carregar suas tarefas.')

      if (flashcardsResult.status === 'fulfilled') setFlashcards(flashcardsResult.value)

      if (calendarResult.status === 'fulfilled') setWeekItems(calendarResult.value)
      else setCalendarError(true)

      setLoading(false)
    }

    void loadDashboard()
    return () => {
      alive = false
    }
  }, [reloadKey])

  const pendingTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.status !== 'completed')
        .sort((a, b) => {
          const aTime = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY
          const bTime = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY
          return aTime - bTime
        }),
    [tasks],
  )

  const nextTask =
    summary?.upcoming_tasks.find((task) => task.status !== 'completed') ?? pendingTasks[0] ?? null
  const dueFlashcards = flashcards.filter((card) => card.is_due).length
  const weekLoads = useMemo(
    () => buildWeekLoad(getWeekDays(new Date()), weekItems, tasks),
    [weekItems, tasks],
  )

  const retry = useCallback(() => setReloadKey((value) => value + 1), [])

  async function handleToggleTask(id: string) {
    setBusyTaskId(id)
    setPartialError('')
    try {
      const updated = await toggleAcademicTaskComplete(id)
      setTasks((current) => current.map((task) => (task.id === updated.id ? updated : task)))
      try {
        setSummary(await getDashboardSummary())
      } catch {
        setPartialError('Resumo atualizado parcialmente. Recarregue para sincronizar.')
      }
    } catch {
      setPartialError('Não foi possível concluir a tarefa.')
    } finally {
      setBusyTaskId(null)
    }
  }

  const summaryValue = summary ?? null

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 pt-5 pb-12 sm:px-6 lg:px-8 lg:pt-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold tracking-[0.18em] text-muted">
            {formatLongDate(new Date())}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-ink sm:text-3xl">
            {getGreeting()}, {firstName}{' '}
            <span aria-hidden="true" className="inline-block">
              👋
            </span>
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Seu dia, suas entregas e seu ritmo em um só lugar.
          </p>
        </div>
      </header>

      {!loading && summaryValue?.subjects_count === 0 ? (
        <section className="mt-6 overflow-hidden rounded-[26px] border border-accent/40 bg-accent/15 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] text-ink/60 uppercase">
                Primeiros passos
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-ink">
                Vamos montar seu semestre
              </h2>
              <p className="mt-1 text-sm text-ink/70">
                Selecione suas disciplinas para liberar o calendário e o progresso.
              </p>
            </div>
            <Link
              to="/disciplinas"
              className="press inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-ink transition hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
            >
              <BookOpenCheck size={17} aria-hidden="true" />
              Configurar disciplinas
            </Link>
          </div>
        </section>
      ) : null}

      {error ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <Alert>{error}</Alert>
          </div>
          <button
            type="button"
            onClick={retry}
            className="press inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface px-4 text-sm font-bold text-ink transition hover:border-accent"
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {partialError ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <TriangleAlert size={15} aria-hidden="true" className="shrink-0" />
          <span className="flex-1">{partialError}</span>
          <button
            type="button"
            onClick={retry}
            className="font-bold underline decoration-2 underline-offset-2"
          >
            Recarregar
          </button>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:col-span-8 2xl:grid-cols-4">
          <MetricCard
            label="Disciplinas ativas"
            value={summaryValue?.subjects_count ?? 0}
            detail={`${subjects.length} ${subjects.length === 1 ? 'matéria ativa' : 'matérias ativas'} neste semestre`}
            icon={BookOpenCheck}
            tone="lilac"
            to="/disciplinas"
            loading={loading}
          />
          <MetricCard
            label="Tarefas pendentes"
            value={summaryValue?.pending_tasks_count ?? 0}
            detail={`${summaryValue?.completed_tasks_count ?? 0} concluídas até agora`}
            icon={ListTodo}
            tone="sky"
            to="/tarefas"
            loading={loading}
          />
          <MetricCard
            label="Tarefas vencidas"
            value={summaryValue?.overdue_tasks_count ?? 0}
            detail={
              (summaryValue?.overdue_tasks_count ?? 0) > 0
                ? 'Priorize estas entregas hoje'
                : 'Nenhuma atrasada'
            }
            icon={TriangleAlert}
            tone="rose"
            alert={(summaryValue?.overdue_tasks_count ?? 0) > 0}
            to="/tarefas"
            loading={loading}
          />
          <MetricCard
            label="Progresso ponderado"
            value={summaryValue?.weighted_progress_percent ?? 0}
            suffix="%"
            detail={`${formatMinutes(summaryValue?.actual_minutes_total ?? 0)} de ${formatMinutes(summaryValue?.planned_minutes_total ?? 0)}`}
            icon={Clock3}
            tone="mint"
            loading={loading}
          />
        </div>

        <div className="min-w-0 xl:col-span-4">
          <FocusCard
            task={nextTask}
            subjectsCount={summaryValue?.subjects_count ?? 0}
            loading={loading}
          />
        </div>

        <WeeklyActivity
          className="min-w-0 xl:col-span-7"
          loads={weekLoads}
          selectedKey={selectedDateKey}
          onSelectDay={setSelectedDateKey}
          loading={loading}
          error={calendarError}
          onRetry={retry}
        />

        <MiniCalendar
          className="min-w-0 xl:col-span-5"
          selectedDateKey={selectedDateKey}
          onSelectDate={setSelectedDateKey}
        />

        <SubjectProgress className="min-w-0 xl:col-span-7" subjects={subjects} loading={loading} />

        <div className="grid min-w-0 gap-4 xl:col-span-5">
          <UpcomingTasks
            tasks={tasks}
            loading={loading}
            busyId={busyTaskId}
            onToggle={(id) => void handleToggleTask(id)}
            onRetry={retry}
            error={partialError.length > 0}
          />

          <section className="dashboard-card p-5 sm:p-6" aria-labelledby="review-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="review-card" className="text-base font-black tracking-tight text-ink">
                  Revisões pendentes
                </h2>
                <p className="mt-0.5 text-xs text-muted">Repetição espaçada</p>
              </div>
              <span className="grid size-10 place-items-center rounded-2xl bg-pastel-mint">
                <Layers size={18} aria-hidden="true" className="text-ink/70" />
              </span>
            </div>

            <p className="mt-4 text-3xl leading-none font-black tracking-tight text-ink">
              {dueFlashcards}
            </p>
            <p className="mt-2 text-xs text-muted">
              {dueFlashcards === 0
                ? 'Nenhum card vencido'
                : `${dueFlashcards} ${dueFlashcards === 1 ? 'card para revisar' : 'cards para revisar'} hoje`}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/flashcards"
                className="press inline-flex min-h-10 items-center gap-2 rounded-xl bg-accent px-3.5 text-xs font-bold text-accent-ink transition hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
              >
                <Sparkles size={15} aria-hidden="true" />
                Revisar agora
              </Link>
              <Link
                to="/calendario"
                className="press inline-flex min-h-10 items-center gap-2 rounded-xl border border-line px-3.5 text-xs font-bold text-ink transition hover:border-accent"
              >
                <CalendarDays size={15} aria-hidden="true" />
                Calendário
              </Link>
            </div>

            {!loading ? (
              <p className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                <CheckCircle2 size={13} aria-hidden="true" className="text-emerald-500" />
                {pendingTasks.length} {pendingTasks.length === 1 ? 'entrega aberta' : 'entregas abertas'} no total
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  )
}
