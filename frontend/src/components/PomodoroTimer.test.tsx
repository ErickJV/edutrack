import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PomodoroTimer } from './PomodoroTimer'

describe('PomodoroTimer', () => {
  it('renders default time and segmented control modes', () => {
    render(<PomodoroTimer />)

    expect(screen.getByText('25:00')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^foco$/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^curta$/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /^longa$/i })).toBeInTheDocument()
  })

  it('switches modes when clicking tabs', () => {
    render(<PomodoroTimer />)

    const shortBreakTab = screen.getByRole('tab', { name: /^curta$/i })
    fireEvent.click(shortBreakTab)
    expect(screen.getByText('05:00')).toBeInTheDocument()

    const longBreakTab = screen.getByRole('tab', { name: /^longa$/i })
    fireEvent.click(longBreakTab)
    expect(screen.getByText('15:00')).toBeInTheDocument()
  })

  it('toggles start and pause button', () => {
    render(<PomodoroTimer />)

    const startBtn = screen.getByRole('button', { name: /^iniciar$/i })
    fireEvent.click(startBtn)

    expect(screen.getByRole('button', { name: /^pausar$/i })).toBeInTheDocument()

    const pauseBtn = screen.getByRole('button', { name: /^pausar$/i })
    fireEvent.click(pauseBtn)

    expect(screen.getByRole('button', { name: /^iniciar$/i })).toBeInTheDocument()
  })

  it('opens and saves settings modal', () => {
    render(<PomodoroTimer />)

    const settingsBtn = screen.getByRole('button', { name: /configurar tempos do pomodoro/i })
    fireEvent.click(settingsBtn)

    expect(screen.getByRole('heading', { name: /configurar pomodoro/i })).toBeInTheDocument()

    const saveBtn = screen.getByRole('button', { name: /^salvar$/i })
    fireEvent.click(saveBtn)

    expect(screen.queryByRole('heading', { name: /configurar pomodoro/i })).not.toBeInTheDocument()
  })
})
