import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { StudySessionPage } from './StudySessionPage'
import type { AcademicTask, StudentSubject, StudyFolder, StudyNote } from '../api/types'

const mockTasks: AcademicTask[] = [
  {
    id: 'task-1',
    student_subject: 'ss-1',
    subject_id: 'sub-1',
    subject_name: 'Estrutura de Dados',
    subject_semester: 2,
    title: 'Exercícios de Árvore Binária',
    description: 'Resolver lista da aula 4',
    due_date: '2027-04-10T23:59:59Z',
    status: 'in_progress',
    estimated_minutes: 60,
    actual_minutes: 25,
    completed_at: null,
    created_at: '2027-01-01T00:00:00Z',
    updated_at: '2027-01-01T00:00:00Z',
  },
]

const mockSubjects: StudentSubject[] = [
  {
    id: 'ss-1',
    subject: {
      id: 'sub-1',
      course: 'course-1',
      course_name: 'ADS',
      name: 'Estrutura de Dados',
      code: 'ED01',
      semester: 2,
      workload_hours: 80,
      description: '',
      active: true,
    },
    professor_name: 'Prof. Carlos',
    status: 'active',
    semester_period: '2026/1',
    progress_percent: 40,
    created_at: '2027-01-01T00:00:00Z',
    updated_at: '2027-01-01T00:00:00Z',
  },
]

const mockFolders: StudyFolder[] = [
  {
    id: 'folder-1',
    name: 'Algoritmos',
    color: '#6366f1',
    icon: 'folder',
    notes_count: 1,
    created_at: '2027-01-01T00:00:00Z',
    updated_at: '2027-01-01T00:00:00Z',
  },
]

const mockNotes: StudyNote[] = [
  {
    id: 'note-1',
    folder: 'folder-1',
    folder_name: 'Algoritmos',
    student_subject: 'ss-1',
    subject_name: 'Estrutura de Dados',
    task: 'task-1',
    task_title: 'Exercícios de Árvore Binária',
    title: 'Anotações sobre Árvores AVL',
    content: 'Propriedades de balanceamento e rotações.',
    methodology: 'feynman',
    created_at: '2027-01-01T00:00:00Z',
    updated_at: '2027-01-01T00:00:00Z',
  },
]

const {
  listAcademicTasks,
  listStudentSubjects,
  listStudyFolders,
  createStudyFolder,
  updateStudyFolder,
  deleteStudyFolder,
  listStudyNotes,
  createStudyNote,
  updateStudyNote,
  deleteStudyNote,
  updateAcademicTask,
} = vi.hoisted(() => ({
  listAcademicTasks: vi.fn(),
  listStudentSubjects: vi.fn(),
  listStudyFolders: vi.fn(),
  createStudyFolder: vi.fn(),
  updateStudyFolder: vi.fn(),
  deleteStudyFolder: vi.fn(),
  listStudyNotes: vi.fn(),
  createStudyNote: vi.fn(),
  updateStudyNote: vi.fn(),
  deleteStudyNote: vi.fn(),
  updateAcademicTask: vi.fn(),
}))

vi.mock('../api/client', () => ({
  listAcademicTasks,
  listStudentSubjects,
  listStudyFolders,
  createStudyFolder,
  updateStudyFolder,
  deleteStudyFolder,
  listStudyNotes,
  createStudyNote,
  updateStudyNote,
  deleteStudyNote,
  updateAcademicTask,
}))

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    user: {
      full_name: 'Maria Silva',
      email: 'maria.silva@aluno.impacta.edu.br',
    },
    signOut: vi.fn(),
  }),
}))

describe('StudySessionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listAcademicTasks.mockResolvedValue(mockTasks)
    listStudentSubjects.mockResolvedValue(mockSubjects)
    listStudyFolders.mockResolvedValue(mockFolders)
    listStudyNotes.mockResolvedValue(mockNotes)
    createStudyNote.mockImplementation(async (payload) => ({
      id: 'new-note-id',
      folder: payload.folder || null,
      folder_name: payload.folder ? 'Algoritmos' : null,
      student_subject: payload.student_subject || null,
      subject_name: null,
      task: payload.task || null,
      task_title: null,
      title: payload.title,
      content: payload.content,
      methodology: payload.methodology || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))
    updateStudyNote.mockImplementation(async (id, payload) => ({
      ...mockNotes[0],
      ...payload,
      id,
    }))
    updateAcademicTask.mockResolvedValue({ ...mockTasks[0], actual_minutes: 50 })
  })

  it('renders the study session page with pomodoro timer, methodology and notes workspace', async () => {
    render(
      <MemoryRouter initialEntries={['/estudo']}>
        <Routes>
          <Route path="/estudo" element={<StudySessionPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await act(async () => {
      await Promise.resolve()
    })

    // Header & Titles
    expect(screen.getByRole('heading', { level: 1, name: /sessão de estudo/i })).toBeInTheDocument()

    // Pomodoro Timer shows default 25:00
    expect(screen.getByText('25:00')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /foco/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /pausa curta/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /pausa longa/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^iniciar$/i })).toBeInTheDocument()

    // Methodology section exists
    expect(screen.getAllByText(/método feynman/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/revisão espaçada/i)).toBeInTheDocument()

    // Textbook / Notes Workspace exists
    expect(screen.getAllByText('Algoritmos').length).toBeGreaterThan(0)
    expect(screen.getByText('Anotações sobre Árvores AVL')).toBeInTheDocument()
  })

  it('binds the task when passed via query param and displays linked task banner', async () => {
    render(
      <MemoryRouter initialEntries={['/estudo?taskId=task-1']}>
        <Routes>
          <Route path="/estudo" element={<StudySessionPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByText(/tarefa vinculada/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /exercícios de árvore binária/i })).toBeInTheDocument()
  })

  it('switches pomodoro mode and adjusts the timer', async () => {
    render(
      <MemoryRouter initialEntries={['/estudo']}>
        <Routes>
          <Route path="/estudo" element={<StudySessionPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await act(async () => {
      await Promise.resolve()
    })

    // Switch to Short Break (default 5:00)
    const shortBreakTab = screen.getByRole('tab', { name: /pausa curta/i })
    fireEvent.click(shortBreakTab)
    expect(screen.getByText('05:00')).toBeInTheDocument()

    // Switch to Long Break (default 15:00)
    const longBreakTab = screen.getByRole('tab', { name: /pausa longa/i })
    fireEvent.click(longBreakTab)
    expect(screen.getByText('15:00')).toBeInTheDocument()
  })

  it('allows inserting methodology template into notes editor', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/estudo']}>
        <Routes>
          <Route path="/estudo" element={<StudySessionPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await act(async () => {
      await Promise.resolve()
    })

    // Click on Feynman method card
    const feynmanCard = screen.getByRole('button', { name: /método feynman/i })
    await user.click(feynmanCard)

    // Check that button to apply template is available
    const applyButton = screen.getByRole('button', { name: /inserir roteiro na anotação/i })
    expect(applyButton).toBeInTheDocument()

    await user.click(applyButton)
    // Verify template was appended to active note editor
    await waitFor(() => {
      expect(screen.getByDisplayValue(/conceito central/i)).toBeInTheDocument()
    })
  })
})
