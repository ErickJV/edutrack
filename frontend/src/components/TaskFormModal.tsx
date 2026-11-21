/* eslint-disable react-hooks/set-state-in-effect */

import { X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { ApiError, createAcademicTask, listCurriculum, updateAcademicTask } from '../api/client'
import type {
  AcademicSubject,
  AcademicTask,
  AcademicTaskCategory,
  AcademicTaskStatus,
  StudentSubject,
} from '../api/types'
import { Alert } from './Feedback'
import { Input, PrimaryButton, Select } from './FormControls'
import { usePresence } from '../utils/usePresence'

type TaskFormValues = {
  student_subject: string
  category: AcademicTaskCategory
  title: string
  description: string
  due_date: string
  due_time: string
  room: string
  status: AcademicTaskStatus
  estimated_minutes: string
  actual_minutes: string
}

type TaskFormModalProps = {
  open: boolean
  subjects: StudentSubject[]
  initialTask?: AcademicTask | null
  defaultDateKey?: string
  onClose: () => void
  onSaved: (task: AcademicTask) => void
}

function getTodayDateInput(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toDateInput(value: string | null): string {
  if (!value) return getTodayDateInput()
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 10)
  const y = parsed.getFullYear()
  const m = String(parsed.getMonth() + 1).padStart(2, '0')
  const d = String(parsed.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function toTimeInput(value: string | null): string {
  if (!value) return '19:00'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '19:00'
  const hh = String(parsed.getHours()).padStart(2, '0')
  const mm = String(parsed.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function formatNumberInput(value: number): string {
  return Number.isFinite(value) ? String(value) : '0'
}

function buildValues(
  initialTask: AcademicTask | null | undefined,
  subjects: StudentSubject[],
  curriculum: AcademicSubject[],
  defaultDateKey?: string,
): TaskFormValues {
  if (!initialTask) {
    return {
      student_subject: subjects[0]?.id || curriculum[0]?.id || '',
      category: 'task',
      title: '',
      description: '',
      due_date: defaultDateKey || getTodayDateInput(),
      due_time: '19:00',
      room: '',
      status: 'pending',
      estimated_minutes: '60',
      actual_minutes: '0',
    }
  }

  return {
    student_subject: initialTask.student_subject || '',
    category: initialTask.category || 'task',
    title: initialTask.title,
    description: initialTask.description,
    due_date: toDateInput(initialTask.due_date),
    due_time: toTimeInput(initialTask.due_date),
    room: initialTask.room || '',
    status: initialTask.status,
    estimated_minutes: formatNumberInput(initialTask.estimated_minutes),
    actual_minutes: formatNumberInput(initialTask.actual_minutes),
  }
}

export function TaskFormModal({
  open,
  subjects,
  initialTask = null,
  defaultDateKey,
  onClose,
  onSaved,
}: TaskFormModalProps) {
  const presence = usePresence(open)
  const [curriculum, setCurriculum] = useState<AcademicSubject[]>([])
  const [values, setValues] = useState<TaskFormValues>(() =>
    buildValues(initialTask, subjects, [], defaultDateKey),
  )
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof TaskFormValues, string>>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isEditing = Boolean(initialTask)
  const title = isEditing ? 'Editar tarefa | entrega' : 'Cadastrar nova tarefa | atividade'

  useEffect(() => {
    if (!open) return
    let alive = true
    listCurriculum()
      .then((items) => {
        if (!alive) return
        setCurriculum(items)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [open, subjects])

  useEffect(() => {
    if (!open) return
    setValues(buildValues(initialTask, subjects, curriculum, defaultDateKey))
    setFieldErrors({})
    setError('')
    setSaving(false)
  }, [open, initialTask, subjects, curriculum, defaultDateKey])

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
    if (!values.title.trim()) nextErrors.title = 'Informe um título para a tarefa.'

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
      const dateStr = values.due_date || getTodayDateInput()
      const timeStr = values.due_time || '19:00'
      const dueIso = new Date(`${dateStr}T${timeStr}:00`).toISOString()

      const payload = {
        student_subject: values.student_subject || null,
        category: values.category,
        title: values.title.trim(),
        description: values.description.trim(),
        due_date: dueIso,
        room: values.room.trim(),
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

  if (!presence.mounted) return null

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-xs sm:p-4"
      data-presence={presence.closing ? 'closed' : 'open'}
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-form-title"
        className="modal-dialog relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/30 sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl dark:border dark:border-[#005063]/30 dark:bg-[#081a26]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="z-10 flex shrink-0 items-start justify-between border-b border-slate-200 bg-white p-5 sm:px-6 sm:py-5 dark:border-[#005063]/30 dark:bg-[#081a26]">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-[#006768] uppercase dark:text-cyan-400">
              Sincronizado com o Calendário Acadêmico
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

            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Disciplina ou área"
                value={values.student_subject}
                onChange={(event) =>
                  setValues((current) => ({ ...current, student_subject: event.target.value }))
                }
                error={fieldErrors.student_subject}
              >
                <option value="">Geral | Outras Atividades (Sem disciplina específica)</option>
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

              <Select
                label="Tipo de atividade"
                value={values.category}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    category: event.target.value as AcademicTaskCategory,
                  }))
                }
              >
                <option value="task">Tarefa | Lista | Exercício</option>
                <option value="assignment">Trabalho | Projeto</option>
                <option value="exam">Prova | Avaliação</option>
                <option value="other">Estudo | Outra Atividade</option>
              </Select>
            </div>

            <Input
              label="Título da tarefa ou atividade"
              name="title"
              value={values.title}
              onChange={(event) =>
                setValues((current) => ({ ...current, title: event.target.value }))
              }
              error={fieldErrors.title}
              placeholder="Ex.: Entrega do Trabalho P1, Lista de Exercícios 3, Estudar para prova..."
            />

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-200">
                Descrição | Observações (opcional)
              </span>
              <textarea
                value={values.description}
                onChange={(event) =>
                  setValues((current) => ({ ...current, description: event.target.value }))
                }
                rows={3}
                className="min-h-20 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-950 outline-none transition focus:border-[#005063] focus:ring-2 focus:ring-[#005063]/20 dark:border-[#005063]/40 dark:bg-[#040f17] dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-[#006768]"
                placeholder="Detalhe o objetivo, links ou instruções da tarefa"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Data no Calendário | Prazo"
                name="due_date"
                type="date"
                value={values.due_date}
                onChange={(event) =>
                  setValues((current) => ({ ...current, due_date: event.target.value }))
                }
              />
              <Input
                label="Horário"
                name="due_time"
                type="time"
                value={values.due_time}
                onChange={(event) =>
                  setValues((current) => ({ ...current, due_time: event.target.value }))
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

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Sala | Local (opcional)"
                name="room"
                value={values.room}
                onChange={(event) =>
                  setValues((current) => ({ ...current, room: event.target.value }))
                }
                placeholder="Ex.: Sala 304 | Online"
              />
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
              {isEditing ? 'Salvar alterações' : 'Salvar Tarefa e Alocar no Calendário'}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  )
}
