import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { HomePage } from './HomePage'

const { getDashboardSummary, listStudentSubjects, signOut } = vi.hoisted(() => ({
  getDashboardSummary: vi.fn(),
  listStudentSubjects: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('../api/client', () => ({
  getDashboardSummary,
  listStudentSubjects,
}))

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      full_name: 'Maria Silva',
      course_offering: {
        course_name: 'Análise e Desenvolvimento de Sistemas',
        modality_label: 'EAD',
      },
    },
    signOut,
  }),
}))

describe('HomePage', () => {
  it('shows the active dashboard metrics, progress graph, and urgent feed', async () => {
    getDashboardSummary.mockResolvedValue({
      subjects_count: 5,
      pending_tasks_count: 7,
      completed_tasks_count: 12,
      planned_minutes_total: 480,
      actual_minutes_total: 315,
      weighted_progress_percent: 68,
      upcoming_tasks: [
        {
          id: 'task-1',
          student_subject: 'ss-1',
          subject_id: 'subject-1',
          subject_name: 'Algoritmos I',
          subject_semester: 1,
          title: 'Entrega de revisões',
          description: '',
          due_date: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          estimated_minutes: 60,
          actual_minutes: 0,
          completed_at: null,
          created_at: '2027-01-01T00:00:00Z',
          updated_at: '2027-01-01T00:00:00Z',
        },
      ],
    })
    listStudentSubjects.mockResolvedValue([
      {
        id: 'ss-1',
        subject: { id: 'subject-1', name: 'Algoritmos I', semester: 1 },
        professor_name: 'Profa. Ana',
        progress_percent: 40,
      },
      {
        id: 'ss-2',
        subject: { id: 'subject-2', name: 'Banco de Dados I', semester: 2 },
        professor_name: 'Prof. Bruno',
        progress_percent: 75,
      },
    ])

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Métricas ativas da sua rotina')).toBeInTheDocument()
    expect(screen.getByText('Disciplinas ativas')).toBeInTheDocument()
    expect(screen.getByText('Tarefas pendentes')).toBeInTheDocument()
    expect(screen.getByText('Tarefas concluídas')).toBeInTheDocument()
    expect(screen.getByText('68%')).toBeInTheDocument()
    expect(screen.getByText('315 min')).toBeInTheDocument()
    expect(screen.getByText('Planejado 480 min')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: /algoritmos i: 40% concluído/i })).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: /banco de dados i: 75% concluído/i })).toBeInTheDocument()
    expect(screen.getByText('Entrega de revisões')).toBeInTheDocument()
    expect(screen.getByText('Menos de 48h')).toBeInTheDocument()
    expect(screen.getByText('Informações acadêmicas')).toBeInTheDocument()
    expect(screen.getByText('Análise e Desenvolvimento de Sistemas')).toBeInTheDocument()
    expect(screen.queryByText('Próximos passos')).not.toBeInTheDocument()
  })
})
