import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { StudentSubject } from '../api/types'
import { SubjectEditModal } from './SubjectEditModal'

const updateStudentSubject = vi.fn()

vi.mock('../api/client', () => ({
  updateStudentSubject: (id: string, payload: { professor_name?: string; custom_workload_hours?: number | null }) =>
    updateStudentSubject(id, payload),
}))

const mockEnrollment: StudentSubject = {
  id: 'enrollment-1',
  subject: {
    id: 'subject-1',
    course: 'course-1',
    course_name: 'Análise e Desenvolvimento de Sistemas',
    name: 'Database Design',
    code: 'ADS201',
    semester: 2,
    workload_hours: 80,
    description: 'Modelagem relacional',
    active: true,
  },
  professor_name: 'Prof. Inicial',
  custom_workload_hours: null,
  effective_workload_hours: 80,
  status: 'active',
  semester_period: '2026/1',
  progress_percent: 40,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

describe('SubjectEditModal', () => {
  beforeEach(() => {
    updateStudentSubject.mockReset()
  })

  it('permite atualizar o professor e a carga horária declarada', async () => {
    updateStudentSubject.mockResolvedValue({
      ...mockEnrollment,
      professor_name: 'Prof. Alan Turing',
      custom_workload_hours: 100,
      effective_workload_hours: 100,
    })
    const onClose = vi.fn()
    const onSaved = vi.fn()

    render(
      <SubjectEditModal
        open
        enrollment={mockEnrollment}
        onClose={onClose}
        onSaved={onSaved}
      />,
    )

    expect(screen.getByText('Database Design')).toBeInTheDocument()

    const profInput = screen.getByLabelText(/nome do professor/i)
    fireEvent.change(profInput, { target: { value: 'Prof. Alan Turing' } })

    const hoursInput = screen.getByLabelText(/carga horária declarada/i)
    fireEvent.change(hoursInput, { target: { value: '100' } })

    fireEvent.click(screen.getByRole('button', { name: /salvar alterações/i }))

    await waitFor(() => expect(updateStudentSubject).toHaveBeenCalledTimes(1))
    expect(updateStudentSubject).toHaveBeenCalledWith('enrollment-1', {
      professor_name: 'Prof. Alan Turing',
      custom_workload_hours: 100,
    })
    expect(onSaved).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('valida carga horária fora do intervalo 1 a 2000', async () => {
    const onClose = vi.fn()
    const onSaved = vi.fn()

    render(
      <SubjectEditModal
        open
        enrollment={mockEnrollment}
        onClose={onClose}
        onSaved={onSaved}
      />,
    )

    const hoursInput = screen.getByLabelText(/carga horária declarada/i)
    fireEvent.change(hoursInput, { target: { value: '0' } })

    const form = screen.getByRole('button', { name: /salvar alterações/i }).closest('form')!
    fireEvent.submit(form)
    expect(await screen.findByText(/informe uma carga horária válida entre 1 e 2000 horas/i)).toBeInTheDocument()
    expect(updateStudentSubject).not.toHaveBeenCalled()
  })
})
