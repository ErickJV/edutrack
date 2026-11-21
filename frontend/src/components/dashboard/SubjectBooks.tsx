import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import type { StudentSubject } from '../../api/types'
import { BOOK_COVER_STYLES, getProfessorDisplay, toSemesterLabel } from '../../utils/subjects'
import { PerspectiveBook } from '../perspective-book'
import { MetricValue } from '../MetricValue'

const RADIUS = 15
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function ProgressRing({ percent, ready }: { percent: number; ready: boolean }) {
  const offset = ready ? CIRCUMFERENCE * (1 - percent / 100) : CIRCUMFERENCE
  return (
    <span className="relative grid size-9 shrink-0 place-items-center">
      <svg viewBox="0 0 40 40" className="size-9 -rotate-90" aria-hidden="true">
        <circle cx="20" cy="20" r={RADIUS} fill="none" stroke="var(--line)" strokeWidth="4" />
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
    </span>
  )
}

export function SubjectBooks({
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
    <section className={`dashboard-card p-4 sm:p-5 ${className}`} aria-labelledby="subject-books">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 id="subject-books" className="text-[15px] font-black tracking-tight text-ink">
            Disciplinas em andamento
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">Progresso por matéria</p>
        </div>
        <Link
          to="/disciplinas"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-ink underline decoration-accent decoration-2 underline-offset-4 hover:decoration-accent-strong"
        >
          Ver disciplinas
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </header>

      {loading ? (
        <div className="mt-4 flex gap-5" aria-hidden="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex w-[150px] shrink-0 flex-col items-center">
              <div className="skeleton-shimmer aspect-[49/60] w-[150px] rounded-md bg-line" />
              <div className="skeleton-shimmer mt-3 h-3 w-16 rounded-full bg-line" />
            </div>
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line p-6 text-center">
          <p className="text-sm font-bold text-ink">Nenhuma disciplina ativa</p>
          <p className="mt-1 text-[11px] text-muted">
            Configure seu semestre para acompanhar o progresso.
          </p>
          <Link
            to="/disciplinas"
            className="press mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-accent px-3 text-[11px] font-bold text-accent-ink transition hover:bg-accent-strong"
          >
            Configurar semestre
          </Link>
        </div>
      ) : (
        <div className="mt-4 -mx-1 flex gap-4 overflow-x-auto px-1 pt-1 pb-2 [scrollbar-width:thin] sm:gap-6">
          {subjects.map((subject, index) => {
            const percent = Math.max(0, Math.min(100, subject.progress_percent))
            const workload = subject.custom_workload_hours ?? subject.subject.workload_hours
            return (
              <div
                key={subject.id}
                className="flex w-[150px] shrink-0 flex-col items-center"
                title={`${subject.subject.name} — ${percent}% concluído`}
              >
                <PerspectiveBook
                  size="sm"
                  textured
                  className={BOOK_COVER_STYLES[index % BOOK_COVER_STYLES.length]}
                >
                  <div className="flex h-full flex-col justify-between gap-2 select-none">
                    <p className="text-[10px] leading-3 font-bold tracking-wide text-white/70 uppercase">
                      {toSemesterLabel(subject.subject.semester)}
                    </p>
                    <h3 className="text-[12px] leading-[15px] font-extrabold tracking-tight wrap-break-word text-white">
                      {subject.subject.name}
                    </h3>
                    <p className="mt-auto border-t border-white/15 pt-1.5 text-[9px] leading-3 wrap-break-word text-white/85">
                      {getProfessorDisplay(subject)}
                    </p>
                  </div>
                </PerspectiveBook>

                <div className="mt-3 flex w-full items-center justify-center gap-2">
                  <ProgressRing percent={percent} ready={ready} />
                  <div className="min-w-0 text-left">
                    <p className="text-[13px] leading-none font-black text-ink">
                      <MetricValue value={percent} suffix="%" />
                    </p>
                    <p className="mt-1 text-[10px] text-muted">{workload ? `${workload}h` : '—'}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
