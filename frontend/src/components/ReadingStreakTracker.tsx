import { useId } from 'react'
import { Flame, Trophy } from 'lucide-react'
import type { ReadingSummary } from '../api/types'

export type ReadingStreakTrackerProps = {
  summary: ReadingSummary
  onSetDailyGoal?: (goal: number) => void
}

export function ReadingStreakTracker({ summary }: ReadingStreakTrackerProps) {
  const goalInputId = useId()
  const todayProgressPercent = Math.min(
    100,
    Math.round((summary.today_pages_read / Math.max(1, summary.daily_goal)) * 100)
  )

  // Maximum value for chart Y-scaling (at least 1.5x daily goal or highest day)
  const maxPagesInHistory = Math.max(
    summary.daily_goal * 1.4,
    ...summary.last_14_days.map((d) => d.pages),
    10
  )

  const chartHeight = 84
  const chartWidth = 320
  const barWidth = 14
  const spacing = (chartWidth - summary.last_14_days.length * barWidth) / (summary.last_14_days.length - 1)
  const goalY = chartHeight - (summary.daily_goal / maxPagesInHistory) * chartHeight

  return (
    <section
      aria-label="Acompanhamento de Sequência e Meta de Leitura"
      className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-[#005063]/30 dark:bg-[#081a26] sm:p-5"
    >
      {/* Top Banner: Streak & Today Goal */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <Flame className="size-6" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-[#0d3950] dark:text-white sm:text-2xl">
                {summary.active_streak} {summary.active_streak === 1 ? 'dia' : 'dias'}
              </span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                Sequência
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {summary.active_streak > 0
                ? 'Mantenha o ritmo lendo diariamente!'
                : 'Leia sua meta hoje para iniciar uma nova sequência!'}
            </p>
          </div>
        </div>

        {/* Daily Goal Card */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Trophy className="size-3.5 text-[#006768] dark:text-[#a8d5e5]" aria-hidden="true" />
            <span>Meta de hoje:</span>
            <strong className="text-[#0d3950] dark:text-white">
              {summary.today_pages_read} / {summary.daily_goal} págs
            </strong>
          </div>
          <div className="mt-1.5 h-2 w-36 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`bar-grow h-full transition-all duration-300 ${
                todayProgressPercent >= 100
                  ? 'bg-emerald-500'
                  : 'bg-[#006768] dark:bg-[#005063]'
              }`}
              style={{ width: `${todayProgressPercent}%` }}
            />
          </div>
          {todayProgressPercent >= 100 ? (
            <span className="mt-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              Meta do dia batida! 🎉
            </span>
          ) : null}
        </div>
      </div>

      {/* 14-Day History Bar Chart */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#0d3950] dark:text-slate-300">
            Histórico dos Últimos 14 Dias
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Linha pontilhada: Meta ({summary.daily_goal} págs)
          </span>
        </div>

        <div className="mt-3 flex flex-col items-center">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight + 24}`}
            className="w-full max-w-lg overflow-visible"
            role="img"
            aria-label="Gráfico de páginas lidas nos últimos 14 dias"
          >
            {/* Goal threshold dashed line */}
            <line
              x1="0"
              y1={goalY}
              x2={chartWidth}
              y2={goalY}
              stroke="currentColor"
              strokeDasharray="3 3"
              className="text-[#005063]/40 dark:text-[#005063]/60"
              strokeWidth="1.5"
            />

            {/* Bars */}
            {summary.last_14_days.map((item, index) => {
              const barHeight = Math.max(2, (item.pages / maxPagesInHistory) * chartHeight)
              const x = index * (barWidth + spacing)
              const y = chartHeight - barHeight
              const isToday = index === summary.last_14_days.length - 1

              return (
                <g key={item.date} className="group">
                  <title>{`${item.dayLabel}: ${item.pages} páginas ${item.goalMet ? '(Meta atingida)' : ''}`}</title>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    rx="3"
                    className={`transition-colors ${
                      item.goalMet
                        ? isToday
                          ? 'fill-[#006768] dark:fill-[#005063]'
                          : 'fill-emerald-500 dark:fill-emerald-400'
                        : item.pages > 0
                          ? 'fill-[#005063]/60 dark:fill-[#005063]/80'
                          : 'fill-slate-200 dark:fill-slate-800'
                    }`}
                  />
                  {/* Day label underneath */}
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight + 14}
                    textAnchor="middle"
                    className={`text-[8px] font-semibold ${
                      isToday
                        ? 'fill-[#006768] font-bold dark:fill-[#a8d5e5]'
                        : 'fill-slate-400 dark:fill-slate-500'
                    }`}
                  >
                    {item.dayLabel.split('/')[0]}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </section>
  )
}
