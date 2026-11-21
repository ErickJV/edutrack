import { ArrowRight, BookOpen, Check, ClipboardList, GraduationCap, ListTodo, LoaderCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { AcademicTask, AcademicTaskCategory } from '../../api/types'
import { formatDueLabel } from '../../utils/dashboard'

const CATEGORY_ICON: Record<AcademicTaskCategory, typeof ListTodo> = {
  task: ListTodo,
  assignment: ClipboardList,
  exam: GraduationCap,
  other: BookOpen,
}

const CATEGORY_TONE: Record<AcademicTaskCategory, string> = {
  task: 'bg-pastel-sky',
  assignment: 'bg-pastel-lilac',
  exam: 'bg-pastel-rose',
  other: 'bg-pastel-mint',
}

export function UpcomingTasks({
  tasks,
  loading = false,
  busyId,
  onToggle,
  onRetry,
  error = false,
  className = '',
}: {
  tasks: AcademicTask[]
  loading?: boolean
  busyId: string | null
  onToggle: (id: string) => void
  onRetry?: () => void
  error?: boolean
  className?: string
}) {
  const pending = tasks
    .filter((task) => task.status !== 'completed')
    .sort((a, b) => {
      const aTime = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY
      const bTime = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY
      return aTime - bTime
    })
    .slice(0, 4)

  return (
    <section className={`dashboard-card p-5 sm:p-6 ${className}`} aria-labelledby="upcoming-tasks">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 id="upcoming-tasks" className="text-base font-black tracking-tight text-ink">
            Próximas entregas
          </h2>
          <p className="mt-0.5 text-xs text-muted">Conclua direto daqui</p>
        </div>
        <Link
          to="/tarefas"
          className="inline-flex items-center gap-1 text-xs font-bold text-ink underline decoration-accent decoration-2 underline-offset-4 hover:decoration-accent-strong"
        >
          Ver todas
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </header>

      {loading ? (
        <div className="mt-4 space-y-2" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton-shimmer h-14 rounded-2xl bg-line" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line p-6 text-center">
          <p className="text-sm font-bold text-ink">Nada pendente. Aproveite para revisar.</p>
          <Link
            to="/tarefas"
            className="mt-2 inline-flex text-xs font-bold text-ink underline decoration-accent decoration-2 underline-offset-4"
          >
            Abrir tarefas
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {pending.map((task) => {
            const category = (task.category ?? 'task') as AcademicTaskCategory
            const Icon = CATEGORY_ICON[category] ?? ListTodo
            const due = formatDueLabel(task.due_date)
            const badgeTone = due.overdue
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
              : due.urgent
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-surface-2 text-muted'
            return (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-surface-2"
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${CATEGORY_TONE[category] ?? CATEGORY_TONE.task}`}
                  aria-hidden="true"
                >
                  <Icon size={17} className="text-ink/70" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{task.title}</p>
                  <p className="truncate text-xs text-muted">{task.subject_name || 'Geral'}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold whitespace-nowrap ${badgeTone}`}
                >
                  {due.label}
                </span>
                <button
                  type="button"
                  onClick={() => onToggle(task.id)}
                  disabled={busyId === task.id}
                  aria-label={`Concluir ${task.title}`}
                  className="press grid size-9 shrink-0 place-items-center rounded-xl border border-line text-muted transition hover:border-accent hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] disabled:opacity-50"
                >
                  {busyId === task.id ? (
                    <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Check size={16} aria-hidden="true" />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {error ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          Não foi possível carregar as tarefas.
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="font-bold text-ink underline decoration-accent decoration-2 underline-offset-2"
            >
              Tentar novamente
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
