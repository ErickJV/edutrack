import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'

import { SemesterSelectionModal } from './SemesterSelectionModal'

const listCurriculum = vi.fn()
const saveStudentSubjects = vi.fn()

vi.mock('../api/client', () => ({
  listCurriculum: () => listCurriculum(),
  saveStudentSubjects: (payload: { semester_period?: string; subject_ids: string[] }) => saveStudentSubjects(payload),
}))

describe('SemesterSelectionModal', () => {
  beforeEach(() => {
    listCurriculum.mockReset()
    saveStudentSubjects.mockReset()
  })

  it('carrega a matriz, permite selecionar matérias e salva a escolha', async () => {
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
    saveStudentSubjects.mockResolvedValue([])
    const onClose = vi.fn()
    const onSaved = vi.fn()

    render(<SemesterSelectionModal open onClose={onClose} onSaved={onSaved} />)

    const algoritmo = await screen.findByRole('checkbox', { name: /Algoritmos I/i })
    const banco = screen.getByRole('checkbox', { name: /Banco de Dados I/i })
    await waitFor(() => expect(algoritmo).toBeChecked())
    await waitFor(() => expect(banco).toBeChecked())
    fireEvent.click(screen.getByRole('button', { name: /salvar matérias do semestre/i }))

    await waitFor(() => expect(saveStudentSubjects).toHaveBeenCalledTimes(1))
    expect(saveStudentSubjects).toHaveBeenCalledWith({
      semester_period: `${new Date().getFullYear()}/1`,
      subject_ids: ['subject-1', 'subject-2'],
    })
    expect(onSaved).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
