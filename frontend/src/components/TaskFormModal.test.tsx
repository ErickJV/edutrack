import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { StudentSubject } from '../api/types'
import { TaskFormModal } from './TaskFormModal'

const { createAcademicTask, updateAcademicTask } = vi.hoisted(() => ({
  createAcademicTask: vi.fn(),
  updateAcademicTask: vi.fn(),
}))

vi.mock('../api/client', () => ({
  createAcademicTask,
  updateAcademicTask,
}))

const subjectOne: StudentSubject = {
  id: 'subject-link-1',
  subject: {
    id: 'subject-1',
    course: 'ads',
    course_name: 'Análise e Desenvolvimento de Sistemas',
    name: 'Algoritmos I',
    code: 'ADS101',
    semester: 1,
    workload_hours: 60,
    description: 'Base de programação',
    active: true,
  },
  professor_name: 'Profa. Ana',
  status: 'active',
  semester_period: '2027/1',
  progress_percent: 25,
  created_at: '2027-01-01T00:00:00Z',
  updated_at: '2027-01-01T00:00:00Z',
}

const subjectTwo: StudentSubject = {
  id: 'subject-link-2',
  subject: {
    id: 'subject-2',
    course: 'ads',
    course_name: 'Análise e Desenvolvimento de Sistemas',
    name: 'Banco de Dados I',
    code: 'ADS202',
    semester: 2,
    workload_hours: 80,
    description: 'Modelagem e persistência',
    active: true,
  },
  professor_name: 'Prof. Bruno',
  status: 'active',
  semester_period: '2027/2',
  progress_percent: 10,
  created_at: '2027-01-02T00:00:00Z',
  updated_at: '2027-01-02T00:00:00Z',
}

describe('TaskFormModal', () => {
  it('validates required fields and creates a task', async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn()
    const onClose = vi.fn()

    createAcademicTask.mockResolvedValue({
      id: 'task-1',
      student_subject: 'subject-link-1',
      subject_id: 'subject-1',
      subject_name: 'Algoritmos I',
      subject_semester: 1,
      title: 'Lista 3',
      description: 'Entrega da semana',
      due_date: '2027-02-10',
      status: 'pending',
      estimated_minutes: 90,
      actual_minutes: 0,
      completed_at: null,
      created_at: '2027-01-01T00:00:00Z',
      updated_at: '2027-01-01T00:00:00Z',
    })

    render(<TaskFormModal open subjects={[subjectOne]} onClose={onClose} onSaved={onSaved} />)

    await user.click(screen.getByRole('button', { name: /criar tarefa/i }))
    expect(screen.getByText('Informe um título.')).toBeInTheDocument()

    await user.selectOptions(screen.getByRole('combobox', { name: /disciplina/i }), 'subject-link-1')
    await user.type(screen.getByRole('textbox', { name: /título/i }), 'Lista 3')
    await user.type(screen.getByRole('textbox', { name: /descrição/i }), 'Entrega da semana')
    await user.type(screen.getByLabelText(/prazo/i), '2027-02-10')
    await user.selectOptions(screen.getByRole('combobox', { name: /status/i }), 'pending')
    await user.clear(screen.getByLabelText(/minutos estimados/i))
    await user.type(screen.getByLabelText(/minutos estimados/i), '90')
    await user.clear(screen.getByLabelText(/minutos realizados/i))
    await user.type(screen.getByLabelText(/minutos realizados/i), '0')

    await user.click(screen.getByRole('button', { name: /criar tarefa/i }))

    expect(createAcademicTask).toHaveBeenCalledWith({
      student_subject: 'subject-link-1',
      title: 'Lista 3',
      description: 'Entrega da semana',
      due_date: '2027-02-10',
      status: 'pending',
      estimated_minutes: 90,
      actual_minutes: 0,
    })
    expect(onSaved).toHaveBeenCalled()
  })

  it('loads existing data and updates a task', async () => {
    const user = userEvent.setup()
    const onSaved = vi.fn()

    updateAcademicTask.mockResolvedValue({
      id: 'task-2',
      student_subject: 'subject-link-2',
      subject_id: 'subject-2',
      subject_name: 'Banco de Dados I',
      subject_semester: 2,
      title: 'Projeto atualizado',
      description: 'Escopo revisado',
      due_date: null,
      status: 'in_progress',
      estimated_minutes: 60,
      actual_minutes: 20,
      completed_at: null,
      created_at: '2027-01-02T00:00:00Z',
      updated_at: '2027-01-03T00:00:00Z',
    })

    render(
      <TaskFormModal
        open
        initialTask={{
          id: 'task-2',
          student_subject: 'subject-link-2',
          subject_id: 'subject-2',
          subject_name: 'Banco de Dados I',
          subject_semester: 2,
          title: 'Projeto',
          description: 'Escopo inicial',
          due_date: null,
          status: 'pending',
          estimated_minutes: 45,
          actual_minutes: 10,
          completed_at: null,
          created_at: '2027-01-02T00:00:00Z',
          updated_at: '2027-01-02T00:00:00Z',
        }}
        subjects={[subjectTwo]}
        onClose={vi.fn()}
        onSaved={onSaved}
      />,
    )

    expect(screen.getByLabelText(/título/i)).toHaveValue('Projeto')
    expect(screen.getByLabelText(/minutos estimados/i)).toHaveValue(45)

    await user.clear(screen.getByLabelText(/título/i))
    await user.type(screen.getByLabelText(/título/i), 'Projeto atualizado')
    await user.selectOptions(screen.getByRole('combobox', { name: /status/i }), 'in_progress')
    await user.click(screen.getByRole('button', { name: /salvar alterações/i }))

    expect(updateAcademicTask).toHaveBeenCalledWith('task-2', {
      student_subject: 'subject-link-2',
      title: 'Projeto atualizado',
      description: 'Escopo inicial',
      due_date: null,
      status: 'in_progress',
      estimated_minutes: 45,
      actual_minutes: 10,
    })
    expect(onSaved).toHaveBeenCalled()
  })
})
