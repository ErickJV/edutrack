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
      <section className="relative overflow-hidden rounded-[26px] bg-sidebar p-6 text-white">
        <div className="skeleton-shimmer h-3 w-24 rounded-full bg-white/10" />
        <div className="skeleton-shimmer mt-6 h-7 w-4/5 rounded-full bg-white/10" />
        <div className="skeleton-shimmer mt-3 h-3 w-2/5 rounded-full bg-white/10" />
        <div className="skeleton-shimmer mt-6 h-11 w-44 rounded-xl bg-white/10" />
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
    <section className="relative overflow-hidden rounded-[26px] bg-sidebar p-6 text-white">
      <div className="hero-grid" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="hero-blob -top-12 -right-10 size-44 bg-accent/35"
      />
      <div
        aria-hidden="true"
        className="hero-blob -bottom-14 -left-12 size-48 bg-[#8b5cf6]/25"
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[11px] font-bold tracking-[0.18em] text-accent uppercase">
            Foco de hoje
          </p>
          <span className="float-slow grid size-11 place-items-center rounded-2xl bg-white/10 text-accent">
            <Target size={20} aria-hidden="true" />
          </span>
        </div>

        <h2 className="mt-4 text-2xl leading-tight font-black tracking-tight wrap-break-word text-white">
          {content.title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/65">{content.meta}</p>

        <Link
          to={content.to}
          className="press mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-ink transition hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {content.cta}
          <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  )
}
