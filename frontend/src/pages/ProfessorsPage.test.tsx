import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProfessorsPage } from './ProfessorsPage'

const listProfessors = vi.fn()
const createProfessor = vi.fn()
const updateProfessor = vi.fn()
const deleteProfessor = vi.fn()

vi.mock('../api/client', () => ({
  listProfessors: () => listProfessors(),
  createProfessor: (p: { name: string }) => createProfessor(p),
  updateProfessor: (id: string, p: { name: string }) => updateProfessor(id, p),
  deleteProfessor: (id: string) => deleteProfessor(id),
}))

describe('ProfessorsPage', () => {
  beforeEach(() => {
    listProfessors.mockReset()
    createProfessor.mockReset()
    updateProfessor.mockReset()
    deleteProfessor.mockReset()
  })

  it('lista professores cadastrados e permite criar um novo', async () => {
    listProfessors.mockResolvedValue([
      { id: 'prof-1', name: 'Prof. Alan Turing', active: true, created_at: new Date().toISOString() },
    ])
    createProfessor.mockResolvedValue({
      id: 'prof-2',
      name: 'Profa. Ada Lovelace',
      active: true,
      created_at: new Date().toISOString(),
    })

    render(
      <MemoryRouter>
        <ProfessorsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Prof. Alan Turing')).toBeInTheDocument()
    expect(screen.getByText('1 cadastrado')).toBeInTheDocument()

    // Abre modal de criação
    fireEvent.click(screen.getByRole('button', { name: /novo professor/i }))
    expect(screen.getByRole('heading', { name: 'Novo professor' })).toBeInTheDocument()

    const nameInput = screen.getByLabelText(/nome completo do professor/i)
    fireEvent.change(nameInput, { target: { value: 'Profa. Ada Lovelace' } })

    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar' }))

    await waitFor(() => expect(createProfessor).toHaveBeenCalledWith({ name: 'Profa. Ada Lovelace' }))
  })

  it('exibe estado vazio amigável quando não há professores', async () => {
    listProfessors.mockResolvedValue([])

    render(
      <MemoryRouter>
        <ProfessorsPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Nenhum professor cadastrado ainda')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cadastrar primeiro professor/i })).toBeInTheDocument()
  })
})
