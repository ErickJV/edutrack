/* eslint-disable react-hooks/set-state-in-effect */

import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { updateStudentSubject } from '../api/client'
import type { StudentSubject } from '../api/types'
import { Alert } from './Feedback'
import { Input, PrimaryButton } from './FormControls'

type SubjectEditModalProps = {
  open: boolean
  enrollment: StudentSubject | null
  onClose: () => void
  onSaved: (updated: StudentSubject) => void
}

export function SubjectEditModal({ open, enrollment, onClose, onSaved }: SubjectEditModalProps) {
  const [professorName, setProfessorName] = useState('')
  const [workloadHours, setWorkloadHours] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!enrollment) return
    setProfessorName(enrollment.professor_name || '')
    setWorkloadHours(
      enrollment.custom_workload_hours != null
        ? String(enrollment.custom_workload_hours)
        : String(enrollment.subject.workload_hours),
    )
    setError('')
  }, [enrollment, open])

  if (!open || !enrollment) return null

  async function submit(event: FormEvent) {
    event.preventDefault()
    const hours = Number.parseInt(workloadHours, 10)
    if (Number.isNaN(hours) || hours < 1 || hours > 2000) {
      setError('Informe uma carga horária válida entre 1 e 2000 horas.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const updated = await updateStudentSubject(enrollment!.id, {
        professor_name: professorName.trim(),
        custom_workload_hours: hours,
      })
      onSaved(updated)
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível atualizar a disciplina.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="subject-edit-title"
        className="relative flex flex-col w-full max-w-lg max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl shadow-slate-950/20 dark:bg-slate-900 dark:border dark:border-slate-800"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shrink-0 flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6 bg-white z-10 dark:border-slate-800 dark:bg-slate-900">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">Personalização</p>
            <h2 id="subject-edit-title" className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">
              Editar disciplina
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus-visible:outline-indigo-400"
            aria-label="Fechar modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <form className="flex flex-col flex-1 min-h-0 overflow-hidden" onSubmit={submit}>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4">
            {error ? <Alert>{error}</Alert> : null}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Disciplina da matriz</p>
              <p className="mt-1 text-base font-extrabold text-slate-950 dark:text-slate-50">{enrollment.subject.name}</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {enrollment.subject.code || 'Sem código'} · Matriz oficial: {enrollment.subject.workload_hours}h
              </p>
            </div>

            <Input
              label="Nome do professor"
              name="professor"
              placeholder="Ex.: Prof. Carlos Santos"
              value={professorName}
              onChange={(e) => setProfessorName(e.target.value)}
              hint="Opcional. Ajuda a identificar o responsável pelas aulas."
            />

            <Input
              label="Carga horária declarada (horas)"
              name="workload"
              type="number"
              min={1}
              max={2000}
              value={workloadHours}
              onChange={(e) => setWorkloadHours(e.target.value)}
              hint="Permite ajustar a carga da sua turma caso difira da matriz oficial."
              required
            />
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-slate-50/80 backdrop-blur-xs px-5 py-4 sm:px-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end dark:border-slate-800 dark:bg-slate-900/90">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <PrimaryButton loading={saving} type="submit" className="sm:w-auto">
              Salvar alterações
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  )
}
