import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeProvider } from '../theme'
import { ThemeToggle } from './ThemeToggle'

describe('ThemeToggle', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
  })

  it('renderiza os controles de Claro, Escuro e Sistema com acessibilidade', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )

    const group = screen.getByRole('radiogroup', { name: /preferência de tema/i })
    expect(group).toBeInTheDocument()

    const claro = screen.getByRole('radio', { name: /tema claro/i })
    const escuro = screen.getByRole('radio', { name: /tema escuro/i })
    const sistema = screen.getByRole('radio', { name: /tema sistema/i })

    expect(claro).toBeInTheDocument()
    expect(escuro).toBeInTheDocument()
    expect(sistema).toBeInTheDocument()
    expect(sistema).toHaveAttribute('aria-checked', 'true')
  })

  it('permite alternar para o tema escuro e persiste a escolha', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )

    const escuro = screen.getByRole('radio', { name: /tema escuro/i })
    fireEvent.click(escuro)

    expect(escuro).toHaveAttribute('aria-checked', 'true')
    expect(window.localStorage.getItem('edutrack_theme_preference')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('permite alternar para o tema claro e persiste a escolha', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>,
    )

    const escuro = screen.getByRole('radio', { name: /tema escuro/i })
    fireEvent.click(escuro)
    expect(document.documentElement.classList.contains('dark')).toBe(true)

    const claro = screen.getByRole('radio', { name: /tema claro/i })
    fireEvent.click(claro)

    expect(claro).toHaveAttribute('aria-checked', 'true')
    expect(window.localStorage.getItem('edutrack_theme_preference')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})
