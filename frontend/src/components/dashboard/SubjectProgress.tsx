import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import type { StudentSubject } from '../../api/types'
import { MetricValue } from '../MetricValue'

const TONES = ['bg-pastel-lilac', 'bg-pastel-peach', 'bg-pastel-mint', 'bg-pastel-sky']
const RADIUS = 16
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function SubjectProgress({
  subjects,
  loading = false,
  className = '',
}: {
  subjects: StudentSubject[]
  loading?: boolean
  className?: string
}) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <section className={`dashboard-card p-5 sm:p-6 ${className}`} aria-labelledby="subject-progress">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 id="subject-progress" className="text-base font-black tracking-tight text-ink">
            Disciplinas em andamento
          </h2>
          <p className="mt-0.5 text-xs text-muted">Progresso por matéria</p>
        </div>
        <Link
          to="/disciplinas"
          className="inline-flex items-center gap-1 text-xs font-bold text-ink underline decoration-accent decoration-2 underline-offset-4 hover:decoration-accent-strong"
        >
          Ver disciplinas
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </header>

      {loading ? (
        <div className="mt-4 space-y-2" aria-hidden="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="skeleton-shimmer h-16 rounded-2xl bg-line" />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line p-6 text-center">
          <p className="text-sm font-bold text-ink">Nenhuma disciplina ativa</p>
          <p className="mt-1 text-xs text-muted">
            Configure seu semestre para acompanhar o progresso.
          </p>
          <Link
            to="/disciplinas"
            className="press mt-3 inline-flex min-h-9 items-center gap-2 rounded-xl bg-accent px-3 text-xs font-bold text-accent-ink transition hover:bg-accent-strong"
          >
            Configurar semestre
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {subjects.slice(0, 4).map((subject, index) => {
            const pct = Math.max(0, Math.min(100, subject.progress_percent))
            const offset = ready ? CIRCUMFERENCE * (1 - pct / 100) : CIRCUMFERENCE
            const workload = subject.custom_workload_hours ?? subject.subject.workload_hours
            return (
              <li key={subject.id}>
                <Link
                  to="/disciplinas"
                  className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
                >
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl ${TONES[index % TONES.length]}`}
                    aria-hidden="true"
                  >
                    <span className="text-xs font-black text-ink/70">
                      {subject.subject.semester}º
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-ink">
                      {subject.subject.name}
                    </span>
                    <span className="block truncate text-xs text-muted">
                      {subject.display_professor_name || subject.professor_name || 'Professor não definido'}
                      {workload ? ` · ${workload}h` : ''}
                    </span>
                  </span>
                  <span className="relative grid size-11 shrink-0 place-items-center">
                    <svg viewBox="0 0 40 40" className="size-11 -rotate-90" aria-hidden="true">
                      <circle
                        cx="20"
                        cy="20"
                        r={RADIUS}
                        fill="none"
                        stroke="var(--line)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r={RADIUS}
                        fill="none"
                        stroke="var(--accent)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={offset}
                        className="ring-progress"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-black text-ink">
                      <MetricValue value={pct} suffix="%" />
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
