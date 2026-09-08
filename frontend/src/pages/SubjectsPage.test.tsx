import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'

import { SubjectsPage } from './SubjectsPage'

const listCurriculum = vi.fn()
const listStudentSubjects = vi.fn()

vi.mock('../api/client', () => ({
  listCurriculum: () => listCurriculum(),
  listStudentSubjects: () => listStudentSubjects(),
}))

describe('SubjectsPage', () => {
  beforeEach(() => {
    listCurriculum.mockReset()
    listStudentSubjects.mockReset()
  })

  it('exibe a grade e o progresso das disciplinas ativas', async () => {
    listCurriculum.mockResolvedValue([
      {
        id: 'subject-1',
        course: 'course-1',
        course_name: 'Análise e Desenvolvimento de Sistemas',
        name: 'Algoritmos I',
        code: 'ADS101',
        semester: 1,
        workload_hours: 80,
        description: 'Base de programação',
        active: true,
      },
      {
        id: 'subject-2',
        course: 'course-1',
        course_name: 'Análise e Desenvolvimento de Sistemas',
        name: 'Banco de Dados I',
        code: 'ADS102',
        semester: 1,
        workload_hours: 80,
        description: 'Modelagem relacional',
        active: true,
      },
    ])
    listStudentSubjects.mockResolvedValue([
      {
        id: 'enrollment-1',
        subject: {
          id: 'subject-1',
          course: 'course-1',
          course_name: 'Análise e Desenvolvimento de Sistemas',
          name: 'Algoritmos I',
          code: 'ADS101',
          semester: 1,
          workload_hours: 80,
          description: 'Base de programação',
          active: true,
        },
        professor_name: 'Profa. Ana',
        status: 'active',
        semester_period: '2026/1',
        progress_percent: 50,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])

    render(<MemoryRouter><SubjectsPage /></MemoryRouter>)

    expect((await screen.findAllByText('Algoritmos I')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('50%').length).toBeGreaterThan(0)
    expect(screen.getAllByText('1º semestre').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /configurar semestre/i })).toBeInTheDocument()
    expect(screen.getByText('Carga horária ativa')).toBeInTheDocument()
    expect(screen.getAllByText('80h').length).toBeGreaterThan(0)
  })

  it('mostra estado vazio quando ainda não existem disciplinas ativas', async () => {
    listCurriculum.mockResolvedValue([
      {
        id: 'subject-1',
        course: 'course-1',
        course_name: 'Análise e Desenvolvimento de Sistemas',
        name: 'Algoritmos I',
        code: 'ADS101',
        semester: 1,
        workload_hours: 80,
        description: 'Base de programação',
        active: true,
      },
    ])
    listStudentSubjects.mockResolvedValue([])

    render(<MemoryRouter><SubjectsPage /></MemoryRouter>)

    expect(await screen.findByText('Nenhuma disciplina ativa ainda')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /selecionar matérias/i })).toBeInTheDocument()
  })
})
