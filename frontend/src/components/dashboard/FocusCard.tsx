import { ArrowRight, Target } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { AcademicTask } from '../../api/types'
import { formatDueLabel } from '../../utils/dashboard'

export function FocusCard({
  task,
  subjectsCount,
  loading = false,
}: {
  task: AcademicTask | null
  subjectsCount: number
  loading?: boolean
}) {
  if (loading) {
    return (
      <section className="relative overflow-hidden rounded-[20px] border border-line bg-surface p-5">
        <div className="skeleton-shimmer h-2.5 w-20 rounded-full bg-line" />
        <div className="skeleton-shimmer mt-5 h-6 w-4/5 rounded-full bg-line" />
        <div className="skeleton-shimmer mt-2.5 h-2.5 w-2/5 rounded-full bg-line" />
        <div className="skeleton-shimmer mt-5 h-9 w-40 rounded-lg bg-line" />
      </section>
    )
  }

  const hasNoSubjects = subjectsCount === 0
  const due = task ? formatDueLabel(task.due_date) : null

  const content = hasNoSubjects
    ? {
        title: 'Comece pelo seu semestre',
        meta: 'Nenhuma disciplina ativa ainda.',
        cta: 'Configurar disciplinas',
        to: '/disciplinas',
      }
    : task
      ? {
          title: task.title,
          meta: `${task.subject_name}${due ? ` · ${due.label}` : ''}`,
          cta: 'Continuar estudando',
          to: `/estudo/${task.id}`,
        }
      : {
          title: 'Tudo em dia por aqui',
          meta: 'Nenhuma entrega pendente no momento.',
          cta: 'Planejar a semana',
          to: '/tarefas',
        }

  return (
    <section className="relative overflow-hidden rounded-[20px] border border-accent/40 bg-accent/12 p-5 dark:border-transparent dark:bg-sidebar dark:text-white">
      <div className="hero-grid" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="hero-blob -top-12 -right-10 size-40 bg-accent/45 dark:bg-accent/35"
      />
      <div
        aria-hidden="true"
        className="hero-blob -bottom-14 -left-12 size-44 bg-[#8b5cf6]/8 dark:bg-[#8b5cf6]/25"
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-bold tracking-[0.16em] text-ink/55 uppercase dark:text-accent">
            Foco de hoje
          </p>
          <span className="float-slow grid size-9 place-items-center rounded-xl bg-surface/70 text-ink/60 dark:bg-white/10 dark:text-accent">
            <Target size={17} aria-hidden="true" />
          </span>
        </div>

        <h2 className="mt-3 text-lg leading-snug font-black tracking-tight wrap-break-word text-ink dark:text-white">
          {content.title}
        </h2>
        <p className="mt-1.5 text-[13px] leading-5 text-muted dark:text-white/65">{content.meta}</p>

        <Link
          to={content.to}
          className="press mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-[13px] font-bold text-accent-ink transition hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
        >
          {content.cta}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
