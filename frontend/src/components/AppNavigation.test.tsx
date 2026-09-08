import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AppNavigation } from './AppNavigation'

describe('AppNavigation', () => {
  it('marks the active route and supports keyboard focus order', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/disciplinas']}>
        <AppNavigation />
      </MemoryRouter>,
    )

    const homeLink = screen.getByRole('link', { name: 'Home' })
    const subjectsLink = screen.getByRole('link', { name: 'Disciplinas' })
    const professorsLink = screen.getByRole('link', { name: 'Professores' })
    const tasksLink = screen.getByRole('link', { name: 'Tarefas' })
    expect(subjectsLink).toHaveAttribute('aria-current', 'page')

    await user.tab()
    expect(homeLink).toHaveFocus()

    await user.tab()
    expect(subjectsLink).toHaveFocus()

    await user.tab()
    expect(professorsLink).toHaveFocus()

    await user.tab()
    expect(tasksLink).toHaveFocus()
  })
})
