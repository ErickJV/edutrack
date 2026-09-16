import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { TasksPage } from './TasksPage'

declare global {
  interface PromiseConstructor {
    withResolvers<T>(): {
      promise: Promise<T>
      resolve: (value: T | PromiseLike<T>) => void
      reject: (reason?: unknown) => void
    }
  }
}

const { listAcademicTasks, listStudentSubjects, toggleAcademicTaskComplete } = vi.hoisted(() => ({
  listAcademicTasks: vi.fn(),
  listStudentSubjects: vi.fn(),
  toggleAcademicTaskComplete: vi.fn(),
}))

vi.mock('../api/client', () => ({
  listAcademicTasks,
  listStudentSubjects,
  toggleAcademicTaskComplete,
}))

describe('TasksPage', () => {
  beforeEach(() => {
    listAcademicTasks.mockReset()
    listStudentSubjects.mockReset()
    toggleAcademicTaskComplete.mockReset()
  })

  it('filters tasks by discipline and status', async () => {
    const user = userEvent.setup()
    listAcademicTasks.mockResolvedValue([
      {
        id: '1',
        student_subject: 'ss-1',
        subject_id: 'subject-1',
        subject_name: 'Algoritmos I',
        subject_semester: 1,
        title: 'Lista 1',
        description: 'Exercícios de revisão',
        due_date: '2027-01-20',
        status: 'pending',
        estimated_minutes: 120,
        actual_minutes: 30,
        completed_at: null,
        created_at: '2027-01-01T00:00:00Z',
        updated_at: '2027-01-01T00:00:00Z',
      },
      {
        id: '2',
        student_subject: 'ss-1',
        subject_id: 'subject-1',
        subject_name: 'Algoritmos I',
        subject_semester: 1,
        title: 'Entrega final',
        description: '',
        due_date: '2027-01-25',
        status: 'completed',
        estimated_minutes: 180,
        actual_minutes: 180,
        completed_at: '2027-01-18T10:00:00Z',
        created_at: '2027-01-01T00:00:00Z',
        updated_at: '2027-01-18T10:00:00Z',
      },
      {
        id: '3',
        student_subject: 'ss-2',
        subject_id: 'subject-2',
        subject_name: 'Banco de Dados I',
        subject_semester: 2,
        title: 'Modelo relacional',
        description: 'Mapeamento do diagrama',
        due_date: null,
        status: 'in_progress',
        estimated_minutes: 90,
        actual_minutes: 45,
        completed_at: null,
        created_at: '2027-01-02T00:00:00Z',
        updated_at: '2027-01-03T00:00:00Z',
      },
    ])
    listStudentSubjects.mockResolvedValue([
      { id: 'ss-1', subject: { id: 'subject-1', name: 'Algoritmos I', semester: 1 } },
      { id: 'ss-2', subject: { id: 'subject-2', name: 'Banco de Dados I', semester: 2 } },
    ])

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Lista 1')).toBeInTheDocument()
    expect(screen.getByText('Entrega final')).toBeInTheDocument()
    expect(screen.getByText('Modelo relacional')).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: /filtrar por disciplina/i }), 'subject-1')
    expect(screen.getByText('Lista 1')).toBeInTheDocument()
    expect(screen.getByText('Entrega final')).toBeInTheDocument()
    expect(screen.queryByText('Modelo relacional')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: /filtrar por status/i }), 'completed')
    expect(screen.getByText('Entrega final')).toBeInTheDocument()
    expect(screen.queryByText('Lista 1')).not.toBeInTheDocument()
    expect(screen.queryByText('Modelo relacional')).not.toBeInTheDocument()
  })

  it('toggles completion optimistically', async () => {
    const user = userEvent.setup()
    const toggleDeferred = Promise.withResolvers<unknown>()

    listAcademicTasks.mockResolvedValue([
      {
        id: '1',
        student_subject: 'ss-1',
        subject_id: 'subject-1',
        subject_name: 'Algoritmos I',
        subject_semester: 1,
        title: 'Lista 1',
        description: '',
        due_date: null,
        status: 'pending',
        estimated_minutes: 60,
        actual_minutes: 0,
        completed_at: null,
        created_at: '2027-01-01T00:00:00Z',
        updated_at: '2027-01-01T00:00:00Z',
      },
    ])
    listStudentSubjects.mockResolvedValue([
      { id: 'ss-1', subject: { id: 'subject-1', name: 'Algoritmos I', semester: 1 } },
    ])
    toggleAcademicTaskComplete.mockReturnValue(toggleDeferred.promise)

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    const checkbox = await screen.findByRole('checkbox', { name: /marcar tarefa concluída/i })
    expect(checkbox).not.toBeChecked()

    await user.click(checkbox)
    expect(checkbox).toBeChecked()
    expect(toggleAcademicTaskComplete).toHaveBeenCalledWith('1')

    toggleDeferred.resolve({
      id: '1',
      student_subject: 'ss-1',
      subject_id: 'subject-1',
      subject_name: 'Algoritmos I',
      subject_semester: 1,
      title: 'Lista 1',
      description: '',
      due_date: null,
      status: 'completed',
      estimated_minutes: 60,
      actual_minutes: 0,
      completed_at: '2027-01-05T10:00:00Z',
      created_at: '2027-01-01T00:00:00Z',
      updated_at: '2027-01-05T10:00:00Z',
    })

    await waitFor(() => expect(screen.getByRole('checkbox', { name: /desmarcar tarefa concluída/i })).toBeChecked())
  })

  it('renders link to study session for a task', async () => {
    listAcademicTasks.mockResolvedValue([
      {
        id: '1',
        student_subject: 'ss-1',
        subject_id: 'subject-1',
        subject_name: 'Algoritmos I',
        subject_semester: 1,
        title: 'Lista 1',
        description: '',
        due_date: null,
        status: 'pending',
        estimated_minutes: 60,
        actual_minutes: 0,
        completed_at: null,
        created_at: '2027-01-01T00:00:00Z',
        updated_at: '2027-01-01T00:00:00Z',
      },
    ])
    listStudentSubjects.mockResolvedValue([
      { id: 'ss-1', subject: { id: 'subject-1', name: 'Algoritmos I', semester: 1 } },
    ])

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    await act(async () => {
      await Promise.resolve()
    })

    const studyLink = screen.getByRole('link', { name: /iniciar estudo/i })
    expect(studyLink).toBeInTheDocument()
    expect(studyLink).toHaveAttribute('href', '/estudo?taskId=1')
  })


  it('shows the empty state when there are no tasks', async () => {
    listAcademicTasks.mockResolvedValue([])
    listStudentSubjects.mockResolvedValue([])

    render(
      <MemoryRouter>
        <TasksPage />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Ainda não há tarefas cadastradas')).toBeInTheDocument()
    expect(screen.getByText('Quando você criar tarefas para suas disciplinas, elas aparecerão organizadas por status nesta tela.')).toBeInTheDocument()
  })
})
