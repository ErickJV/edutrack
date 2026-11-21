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
      <div className={`dashboard-card p-4 ${className}`} aria-hidden="true">
        <div className="skeleton-shimmer size-9 rounded-xl bg-line" />
        <div className="skeleton-shimmer mt-3 h-2.5 w-20 rounded-full bg-line" />
        <div className="skeleton-shimmer mt-2.5 h-6 w-14 rounded-full bg-line" />
        <div className="skeleton-shimmer mt-2.5 h-2.5 w-28 rounded-full bg-line" />
      </div>
    )
  }

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className={`grid size-8 place-items-center rounded-xl ${TONE_CLASS[tone]}`}>
          <Icon size={15} aria-hidden="true" className="text-ink/70" />
        </span>
        {to ? (
          <ArrowUpRight
            size={14}
            aria-hidden="true"
            className="text-muted transition group-hover:text-ink"
          />
        ) : null}
      </div>
      <p className="mt-3 text-[10px] font-bold tracking-[0.12em] text-muted uppercase">{label}</p>
      <p
        className={`mt-1 text-2xl leading-none font-black tracking-tight ${
          alert ? 'text-rose-600 dark:text-rose-300' : 'text-ink'
        }`}
      >
        <MetricValue value={value} suffix={suffix} />
      </p>
      <p className="mt-2 text-[11px] leading-4 text-muted">{detail}</p>
    </>
  )

  const shellClass = `dashboard-card group block p-4 ${
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
