/* eslint-disable react-hooks/set-state-in-effect */

import { X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { ApiError, createAcademicTask, listCurriculum, updateAcademicTask } from '../api/client'
import type { AcademicSubject, AcademicTask, AcademicTaskStatus, StudentSubject } from '../api/types'
import { Alert } from './Feedback'
import { Input, PrimaryButton, Select } from './FormControls'

type TaskFormValues = {
  student_subject: string
  title: string
  description: string
  due_date: string
  status: AcademicTaskStatus
  estimated_minutes: string
  actual_minutes: string
}

type TaskFormModalProps = {
  open: boolean
  subjects: StudentSubject[]
  initialTask?: AcademicTask | null
  onClose: () => void
  onSaved: (task: AcademicTask) => void
}

const EMPTY_VALUES: TaskFormValues = {
  student_subject: '',
  title: '',
  description: '',
  due_date: '',
  status: 'pending',
  estimated_minutes: '30',
  actual_minutes: '0',
}

function toDateInput(value: string | null): string {
  return value ? value.slice(0, 10) : ''
}

function formatNumberInput(value: number): string {
  return Number.isFinite(value) ? String(value) : '0'
}

function buildValues(
  initialTask: AcademicTask | null | undefined,
  subjects: StudentSubject[],
  curriculum: AcademicSubject[],
): TaskFormValues {
  if (!initialTask) {
    return {
      ...EMPTY_VALUES,
      student_subject: subjects[0]?.id || curriculum[0]?.id || '',
    }
  }

  return {
    student_subject: initialTask.student_subject,
    title: initialTask.title,
    description: initialTask.description,
    due_date: toDateInput(initialTask.due_date),
    status: initialTask.status,
    estimated_minutes: formatNumberInput(initialTask.estimated_minutes),
    actual_minutes: formatNumberInput(initialTask.actual_minutes),
  }
}

export function TaskFormModal({
  open,
  subjects,
  initialTask = null,
  onClose,
  onSaved,
}: TaskFormModalProps) {
  const [curriculum, setCurriculum] = useState<AcademicSubject[]>([])
  const [values, setValues] = useState<TaskFormValues>(() =>
    buildValues(initialTask, subjects, []),
  )
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof TaskFormValues, string>>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEditing = Boolean(initialTask)
  const title = isEditing ? 'Editar tarefa' : 'Nova tarefa'

  useEffect(() => {
    if (!open) return
    let alive = true
    listCurriculum()
      .then((items) => {
        if (!alive) return
        setCurriculum(items)
        setValues((prev) => {
          if (prev.student_subject) return prev
          const fallbackId = subjects[0]?.id || items[0]?.id || ''
          return fallbackId ? { ...prev, student_subject: fallbackId } : prev
        })
      })
      .catch(() => {
        // Silencioso: usa subjects ativos já carregados
      })
    return () => {
      alive = false
    }
  }, [open, subjects])

  useEffect(() => {
    if (!open) return
    setValues(buildValues(initialTask, subjects, curriculum))
    setFieldErrors({})
    setError('')
    setSaving(false)
  }, [open, initialTask, subjects, curriculum])

  const enrolledSubjectIds = useMemo(
    () => new Set(subjects.map((s) => s.subject.id)),
    [subjects],
  )

  const extraCurriculumSubjects = useMemo(
    () => curriculum.filter((item) => !enrolledSubjectIds.has(item.id)),
    [curriculum, enrolledSubjectIds],
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: Partial<Record<keyof TaskFormValues, string>> = {}
    if (!values.student_subject) nextErrors.student_subject = 'Selecione uma disciplina.'
    if (!values.title.trim()) nextErrors.title = 'Informe um título.'

    const estimatedMinutes = Number.parseInt(values.estimated_minutes, 10)
    if (!Number.isFinite(estimatedMinutes) || estimatedMinutes < 0) {
      nextErrors.estimated_minutes = 'Informe minutos estimados válidos.'
    }

    const actualMinutes = Number.parseInt(values.actual_minutes, 10)
    if (!Number.isFinite(actualMinutes) || actualMinutes < 0) {
      nextErrors.actual_minutes = 'Informe minutos realizados válidos.'
    }

    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    setError('')
    try {
      const payload = {
        student_subject: values.student_subject,
        title: values.title.trim(),
        description: values.description.trim(),
        due_date: values.due_date || null,
        status: values.status,
        estimated_minutes: estimatedMinutes,
        actual_minutes: actualMinutes,
      }
      const savedTask =
        isEditing && initialTask
          ? await updateAcademicTask(initialTask.id, payload)
          : await createAcademicTask(payload)
      onSaved(savedTask)
    } catch (reason) {
      setError(
        reason instanceof ApiError ? reason.message : 'Não foi possível salvar a tarefa.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-xs sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-form-title"
        className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/30 sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl dark:border dark:border-[#005063]/30 dark:bg-[#081a26]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="z-10 flex shrink-0 items-start justify-between border-b border-slate-200 bg-white p-5 sm:px-6 sm:py-5 dark:border-[#005063]/30 dark:bg-[#081a26]">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-[#006768] uppercase dark:text-[#005063]">
              Gestão de tarefas
            </p>
            <h2
              id="task-form-title"
              className="mt-1 text-2xl font-black tracking-tight text-[#0d3950] dark:text-slate-50"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-11 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005063] dark:text-slate-400 dark:hover:bg-[#040f17] dark:hover:text-slate-100 dark:focus-visible:outline-[#006768]"
            aria-label="Fechar modal"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <form className="flex min-h-0 flex-1 flex-col overflow-hidden" onSubmit={handleSubmit}>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain p-5 sm:p-6">
            {error ? (
              <div className="mb-4">
                <Alert>{error}</Alert>
              </div>
            ) : null}

            <Select
              label="Disciplina vinculada"
              value={values.student_subject}
              onChange={(event) =>
                setValues((current) => ({ ...current, student_subject: event.target.value }))
              }
              error={fieldErrors.student_subject}
            >
              <option value="">Selecione uma disciplina</option>
              {subjects.length > 0 && (
                <optgroup label="Disciplinas ativas no semestre">
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subject.name} · {subject.subject.semester}º semestre
                    </option>
                  ))}
                </optgroup>
              )}
              {extraCurriculumSubjects.length > 0 && (
                <optgroup label="Outras disciplinas da matriz do curso (ativa automaticamente)">
                  {extraCurriculumSubjects.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {item.semester}º semestre
                    </option>
                  ))}
                </optgroup>
              )}
            </Select>

            <Input
              label="Título"
              name="title"
              value={values.title}
              onChange={(event) =>
                setValues((current) => ({ ...current, title: event.target.value }))
              }
              error={fieldErrors.title}
              placeholder="Ex.: Exercícios da lista 3"
            />

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-200">
                Descrição
              </span>
              <textarea
                value={values.description}
                onChange={(event) =>
                  setValues((current) => ({ ...current, description: event.target.value }))
                }
                rows={4}
                className="min-h-24 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-[#005063] focus:ring-2 focus:ring-[#005063]/20 dark:border-[#005063]/40 dark:bg-[#040f17] dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-[#006768]"
                placeholder="Detalhe o objetivo ou instruções da tarefa"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Prazo"
                name="due_date"
                type="date"
                value={values.due_date}
                onChange={(event) =>
                  setValues((current) => ({ ...current, due_date: event.target.value }))
                }
              />
              <Select
                label="Status"
                value={values.status}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    status: event.target.value as AcademicTaskStatus,
                  }))
                }
              >
                <option value="pending">Pendente</option>
                <option value="in_progress">Em andamento</option>
                <option value="completed">Concluída</option>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Minutos estimados"
                name="estimated_minutes"
                type="number"
                min={0}
                value={values.estimated_minutes}
                onChange={(event) =>
                  setValues((current) => ({ ...current, estimated_minutes: event.target.value }))
                }
                error={fieldErrors.estimated_minutes}
              />
              <Input
                label="Minutos realizados"
                name="actual_minutes"
                type="number"
                min={0}
                value={values.actual_minutes}
                onChange={(event) =>
                  setValues((current) => ({ ...current, actual_minutes: event.target.value }))
                }
                error={fieldErrors.actual_minutes}
              />
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/80 px-5 py-4 backdrop-blur-xs sm:flex-row sm:justify-end sm:px-6 dark:border-[#005063]/30 dark:bg-[#081a26]/90">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-5 text-base font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-[#040f17]"
            >
              Cancelar
            </button>
            <PrimaryButton type="submit" loading={saving} className="sm:w-auto">
              {isEditing ? 'Salvar alterações' : 'Criar tarefa'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  )
}
