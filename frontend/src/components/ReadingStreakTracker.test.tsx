import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ReadingStreakTracker } from './ReadingStreakTracker'
import type { ReadingSummary } from '../api/types'

const mockSummary: ReadingSummary = {
  daily_goal: 20,
  today_pages_read: 25,
  active_streak: 4,
  last_14_days: [
    { date: '2026-09-08', dayLabel: '08/09', pages: 20, goalMet: true },
    { date: '2026-09-09', dayLabel: '09/09', pages: 22, goalMet: true },
    { date: '2026-09-10', dayLabel: '10/09', pages: 20, goalMet: true },
    { date: '2026-09-11', dayLabel: '11/09', pages: 25, goalMet: true },
    { date: '2026-09-12', dayLabel: '12/09', pages: 15, goalMet: false },
    { date: '2026-09-13', dayLabel: '13/09', pages: 0, goalMet: false },
    { date: '2026-09-14', dayLabel: '14/09', pages: 0, goalMet: false },
    { date: '2026-09-15', dayLabel: '15/09', pages: 0, goalMet: false },
    { date: '2026-09-16', dayLabel: '16/09', pages: 0, goalMet: false },
    { date: '2026-09-17', dayLabel: '17/09', pages: 0, goalMet: false },
    { date: '2026-09-18', dayLabel: '18/09', pages: 20, goalMet: true },
    { date: '2026-09-19', dayLabel: '19/09', pages: 25, goalMet: true },
    { date: '2026-09-20', dayLabel: '20/09', pages: 20, goalMet: true },
    { date: '2026-09-21', dayLabel: '21/09', pages: 25, goalMet: true },
  ],
}

describe('ReadingStreakTracker', () => {
  it('renders streak days, daily goal progress, and goal completion feedback', () => {
    render(<ReadingStreakTracker summary={mockSummary} />)

    expect(screen.getByText('4 dias')).toBeInTheDocument()
    expect(screen.getByText('Sequência')).toBeInTheDocument()
    expect(screen.getByText('25 / 20 págs')).toBeInTheDocument()
    expect(screen.getByText('Meta do dia batida! 🎉')).toBeInTheDocument()
  })

  it('renders 14-day history svg chart with goal line', () => {
    render(<ReadingStreakTracker summary={mockSummary} />)

    expect(screen.getByRole('img', { name: /gráfico de páginas lidas nos últimos 14 dias/i })).toBeInTheDocument()
    expect(screen.getByText(/linha pontilhada: meta \(20 págs\)/i)).toBeInTheDocument()
  })
})
