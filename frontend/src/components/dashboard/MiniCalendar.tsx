import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { listCalendarItems } from '../../api/client'
import type { CalendarItem } from '../../api/types'
import {
  buildMonthCells,
  formatTimeRange,
  getCategoryMeta,
  itemToDateKey,
  MONTH_NAMES,
  type MonthCell,
  parseDateKey,
  toLocalDateKey,
  WEEKDAYS_SHORT,
} from '../../utils/calendar'

export function MiniCalendar({
  selectedDateKey,
  onSelectDate,
  className = '',
}: {
  selectedDateKey: string
  onSelectDate: (key: string) => void
  className?: string
}) {
  const [viewMonth, setViewMonth] = useState(() => {
    const base = parseDateKey(selectedDateKey)
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const [items, setItems] = useState<CalendarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const cells = useMemo(() => buildMonthCells(viewMonth), [viewMonth])

  const loadMonth = useCallback(async (monthCells: MonthCell[]) => {
    const first = monthCells[0]?.date ?? new Date()
    const last = monthCells[monthCells.length - 1]?.date ?? new Date()
    return listCalendarItems({
      from: new Date(
        first.getFullYear(),
        first.getMonth(),
        first.getDate(),
        0,
        0,
        0,
      ).toISOString(),
      to: new Date(last.getFullYear(), last.getMonth(), last.getDate(), 23, 59, 59).toISOString(),
    })
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(false)
    loadMonth(cells)
      .then((response) => {
        if (alive) setItems(response)
      })
      .catch(() => {
        if (alive) setError(true)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [cells, loadMonth, reloadKey])

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const item of items) {
      if (item.cancelled) continue
      const key = itemToDateKey(item)
      const bucket = map.get(key)
      if (bucket) bucket.push(item)
      else map.set(key, [item])
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    }
    return map
  }, [items])

  const agenda = byDay.get(selectedDateKey) ?? []
  const todayKey = toLocalDateKey(new Date())

  function shiftMonth(delta: number) {
    const next = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1)
    setViewMonth(next)
    const now = new Date()
    onSelectDate(
      next.getFullYear() === now.getFullYear() && next.getMonth() === now.getMonth()
        ? toLocalDateKey(now)
        : toLocalDateKey(next),
    )
  }

  return (
    <section className={`dashboard-card flex flex-col p-5 sm:p-6 ${className}`} aria-labelledby="mini-calendar">
      <header className="flex items-center justify-between gap-2">
        <div>
          <h2 id="mini-calendar" className="text-base font-black tracking-tight text-ink">
            Calendário
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {MONTH_NAMES[viewMonth.getMonth()]} de {viewMonth.getFullYear()}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            aria-label="Mês anterior"
            className="press grid size-8 place-items-center rounded-lg border border-line text-muted transition hover:border-accent hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
          >
            <ChevronLeft size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            aria-label="Próximo mês"
            className="press grid size-8 place-items-center rounded-lg border border-line text-muted transition hover:border-accent hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
          >
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-7 gap-1" aria-hidden="true">
        {WEEKDAYS_SHORT.map((label) => (
          <span
            key={label}
            className="text-center text-[10px] font-bold tracking-wide text-muted uppercase"
          >
            {label.slice(0, 1)}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const dayItems = byDay.get(cell.key) ?? []
          const selected = cell.key === selectedDateKey
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelectDate(cell.key)}
              aria-pressed={selected}
              aria-label={`${cell.weekdayFull}, ${cell.date.getDate()} de ${MONTH_NAMES[cell.date.getMonth()]}, ${dayItems.length} ${dayItems.length === 1 ? 'compromisso' : 'compromissos'}`}
              className={`relative flex min-h-9 flex-col items-center justify-center rounded-lg text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ink)] ${
                selected
                  ? 'bg-accent text-accent-ink'
                  : cell.isCurrentMonth
                    ? 'text-ink hover:bg-surface-2'
                    : 'text-muted/50 hover:bg-surface-2'
              } ${cell.isToday && !selected ? 'ring-1 ring-accent ring-inset' : ''}`}
            >
              <span>{cell.date.getDate()}</span>
              {dayItems.length > 0 ? (
                <span className="mt-0.5 flex items-center gap-0.5">
                  {dayItems.slice(0, 3).map((item, index) => (
                    <span
                      key={`${item.id}-${index}`}
                      className={`size-1 rounded-full ${selected ? 'bg-accent-ink/70' : getCategoryMeta(item).dotClass}`}
                    />
                  ))}
                  {dayItems.length > 3 ? (
                    <span className="text-[8px] leading-none">+{dayItems.length - 3}</span>
                  ) : null}
                </span>
              ) : (
                <span className="mt-0.5 h-1" />
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-4 border-t border-line pt-3">
        <p className="text-[11px] font-bold tracking-[0.14em] text-muted uppercase">
          {parseDateKey(selectedDateKey).toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'short',
          })}
        </p>

        {loading ? (
          <div className="mt-2 space-y-2" aria-hidden="true">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="skeleton-shimmer h-9 rounded-lg bg-line" />
            ))}
          </div>
        ) : agenda.length === 0 ? (
          <p className="mt-2 text-xs text-muted">Nenhum compromisso neste dia.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {agenda.slice(0, 4).map((item) => {
              const meta = getCategoryMeta(item)
              const done = item.task_status === 'completed'
              return (
                <li
                  key={item.id}
                  className={`flex items-start gap-2 rounded-lg px-2 py-1.5 ${done ? 'opacity-60' : 'bg-surface-2'}`}
                >
                  <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${meta.dotClass}`} />
                  <div className="min-w-0">
                    <p
                      className={`truncate text-xs font-bold text-ink ${done ? 'line-through' : ''}`}
                    >
                      {item.title}
                    </p>
                    <p className="truncate text-[11px] text-muted">
                      {formatTimeRange(item)}
                      {item.subject_name ? ` · ${item.subject_name}` : ''}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {error ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
            Não foi possível carregar o calendário.
            <button
              type="button"
              onClick={() => setReloadKey((value) => value + 1)}
              className="font-bold text-ink underline decoration-accent decoration-2 underline-offset-2"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <Link
            to="/calendario"
            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-ink underline decoration-accent decoration-2 underline-offset-4 hover:decoration-accent-strong"
          >
            Abrir calendário
          </Link>
        )}
      </div>
      {todayKey === selectedDateKey ? <span className="sr-only">Dia atual selecionado</span> : null}
    </section>
  )
}
