import { ArrowUpRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { MetricValue } from '../MetricValue'

export type MetricTone = 'lilac' | 'peach' | 'mint' | 'sky' | 'rose'

const TONE_CLASS: Record<MetricTone, string> = {
  lilac: 'bg-pastel-lilac',
  peach: 'bg-pastel-peach',
  mint: 'bg-pastel-mint',
  sky: 'bg-pastel-sky',
  rose: 'bg-pastel-rose',
}

export function MetricCard({
  label,
  value,
  suffix,
  detail,
  icon: Icon,
  tone,
  to,
  alert = false,
  loading = false,
  className = '',
}: {
  label: string
  value: number
  suffix?: string
  detail: ReactNode
  icon: LucideIcon
  tone: MetricTone
  to?: string
  alert?: boolean
  loading?: boolean
  className?: string
}) {
  if (loading) {
    return (
      <div className={`dashboard-card p-5 ${className}`} aria-hidden="true">
        <div className="skeleton-shimmer size-10 rounded-2xl bg-line" />
        <div className="skeleton-shimmer mt-4 h-3 w-24 rounded-full bg-line" />
        <div className="skeleton-shimmer mt-3 h-8 w-16 rounded-full bg-line" />
        <div className="skeleton-shimmer mt-3 h-3 w-32 rounded-full bg-line" />
      </div>
    )
  }

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-10 place-items-center rounded-2xl ${TONE_CLASS[tone]}`}>
          <Icon size={18} aria-hidden="true" className="text-ink/70" />
        </span>
        {to ? (
          <ArrowUpRight
            size={16}
            aria-hidden="true"
            className="text-muted transition group-hover:text-ink"
          />
        ) : null}
      </div>
      <p className="mt-4 text-[11px] font-bold tracking-[0.14em] text-muted uppercase">{label}</p>
      <p
        className={`mt-1 text-3xl leading-none font-black tracking-tight ${
          alert ? 'text-rose-600 dark:text-rose-300' : 'text-ink'
        }`}
      >
        <MetricValue value={value} suffix={suffix} />
      </p>
      <p className="mt-2.5 text-xs leading-5 text-muted">{detail}</p>
    </>
  )

  const shellClass = `dashboard-card group block p-5 ${
    alert ? 'border-rose-200 dark:border-rose-900/60' : ''
  } ${className}`

  if (to) {
    return (
      <Link
        to={to}
        className={`${shellClass} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]`}
      >
        {body}
      </Link>
    )
  }

  return <article className={shellClass}>{body}</article>
}
