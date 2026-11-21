import { formatMinutes, type WeekLoad } from '../../utils/dashboard'

export function WeeklyActivity({
  loads,
  selectedKey,
  onSelectDay,
  loading = false,
  error = false,
  onRetry,
  className = '',
}: {
  loads: WeekLoad[]
  selectedKey: string
  onSelectDay: (key: string) => void
  loading?: boolean
  error?: boolean
  onRetry?: () => void
  className?: string
}) {
  const total = loads.reduce((sum, day) => sum + day.minutes, 0)
  const peak = Math.max(...loads.map((day) => day.minutes), 120)

  return (
    <section className={`dashboard-card p-4 sm:p-5 ${className}`} aria-labelledby="weekly-load">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 id="weekly-load" className="text-[15px] font-black tracking-tight text-ink">
            Carga da semana
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">Aulas e entregas planejadas</p>
        </div>
        <span className="rounded-full bg-pastel-sky px-2.5 py-1 text-[11px] font-bold text-ink">
          {formatMinutes(total)}
        </span>
      </header>

      {loading ? (
        <div className="mt-4 flex h-24 items-end gap-2" aria-hidden="true">
          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="skeleton-shimmer flex-1 rounded-t-xl bg-line"
              style={{ height: `${35 + ((index * 17) % 55)}%` }}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 flex h-24 items-end gap-1.5 sm:gap-2">
          {loads.map((day, index) => {
            const pct = day.minutes === 0 ? 0 : Math.max(4, Math.round((day.minutes / peak) * 100))
            const selected = day.key === selectedKey
            const barTone =
              day.minutes === 0
                ? 'bg-line'
                : day.isToday
                  ? 'bg-accent'
                  : 'bg-ink/18 hover:bg-ink/28 dark:bg-ink/65'
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => onSelectDay(day.key)}
                aria-pressed={selected}
                aria-label={`${day.weekdayFull}: ${formatMinutes(day.minutes)} planejados, ${day.items} ${day.items === 1 ? 'compromisso' : 'compromissos'}`}
                className="group relative flex h-full flex-1 flex-col justify-end rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
              >
                <span
                  className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 translate-y-1 rounded-lg bg-sidebar px-2 py-1 text-[9px] font-bold whitespace-nowrap text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
                  role="presentation"
                >
                  {formatMinutes(day.minutes)}
                </span>
                <span
                  className={`bar-rise mx-auto w-[62%] rounded-t-md transition-[filter] group-hover:brightness-105 ${barTone} ${
                    selected ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface' : ''
                  }`}
                  style={{
                    height: `${Math.max(pct, 2)}%`,
                    animationDelay: `${index * 60}ms`,
                  }}
                />
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-2 flex gap-1.5 sm:gap-2" aria-hidden="true">
        {loads.map((day) => (
          <span
            key={day.key}
            className={`flex-1 text-center text-[9px] font-bold uppercase ${
              day.key === selectedKey ? 'text-ink' : 'text-muted'
            }`}
          >
            {day.weekdayShort}
          </span>
        ))}
      </div>

      {error ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          Não foi possível carregar a agenda da semana.
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
      ) : total === 0 && !loading ? (
        <p className="mt-3 text-xs text-muted">Sem carga planejada nesta semana.</p>
      ) : null}
    </section>
  )
}
