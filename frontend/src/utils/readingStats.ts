import type { ReadingDayData, ReadingLog, ReadingSummary } from '../api/types'

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDayLabel(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}`
}

export function calculateReadingSummary(
  logs: ReadingLog[],
  dailyGoal = 20,
  referenceDate: Date = new Date()
): ReadingSummary {
  // Aggregate pages read by date (YYYY-MM-DD)
  const pagesByDate = new Map<string, number>()
  for (const log of logs) {
    const d = log.read_date
    pagesByDate.set(d, (pagesByDate.get(d) ?? 0) + log.pages_read)
  }

  const todayStr = formatLocalDate(referenceDate)
  const todayPages = pagesByDate.get(todayStr) ?? 0

  // Build last 14 days
  const last14Days: ReadingDayData[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(referenceDate)
    d.setDate(referenceDate.getDate() - i)
    const dateStr = formatLocalDate(d)
    const pages = pagesByDate.get(dateStr) ?? 0
    last14Days.push({
      date: dateStr,
      dayLabel: formatDayLabel(d),
      pages,
      goalMet: pages >= dailyGoal,
    })
  }

  // Calculate active streak
  // If today's goal is met, start checking from today backwards.
  // If today's goal is not yet met, check if yesterday was met: if so, streak is alive up to yesterday.
  let streak = 0
  let checkOffset = 0

  const todayMet = todayPages >= dailyGoal
  if (todayMet) {
    checkOffset = 0
  } else {
    // Check yesterday
    const yesterday = new Date(referenceDate)
    yesterday.setDate(referenceDate.getDate() - 1)
    const yesterdayStr = formatLocalDate(yesterday)
    const yesterdayMet = (pagesByDate.get(yesterdayStr) ?? 0) >= dailyGoal
    if (yesterdayMet) {
      checkOffset = 1
    } else {
      checkOffset = -1 // streak broken
    }
  }

  if (checkOffset >= 0) {
    for (let i = checkOffset; i < 365; i++) {
      const d = new Date(referenceDate)
      d.setDate(referenceDate.getDate() - i)
      const dateStr = formatLocalDate(d)
      const pages = pagesByDate.get(dateStr) ?? 0
      if (pages >= dailyGoal) {
        streak += 1
      } else {
        break
      }
    }
  }

  return {
    daily_goal: dailyGoal,
    today_pages_read: todayPages,
    active_streak: streak,
    last_14_days: last14Days,
  }
}

export function formatDaysRemaining(targetDateStr: string | null): string | null {
  if (!targetDateStr) return null
  const target = new Date(targetDateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diffTime = target.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'Atrasado'
  if (diffDays === 0) return 'Hoje'
  if (diffDays === 1) return 'Amanhã'
  return `${diffDays} dias restantes`
}
