/* eslint-disable react-hooks/set-state-in-effect */

import { Edit2, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import {
  createProfessor,
  deleteProfessor,
  listProfessors,
  updateProfessor,
  updateStudentSubject,
} from '../api/client'
import type { Professor, StudentSubject } from '../api/types'
import { Alert } from './Feedback'
import { Input, PrimaryButton, Select } from './FormControls'
import { ScheduleConfig } from './ScheduleConfig'

type SubjectEditModalProps = {
  open: boolean
  enrollment: StudentSubject | null
  onClose: () => void
  onSaved: (updated: StudentSubject) => void
}

export function SubjectEditModal({ open, enrollment, onClose, onSaved }: SubjectEditModalProps) {
  const [professors, setProfessors] = useState<Professor[]>([])
  const [subjectName, setSubjectName] = useState('')
  const [selectedProfId, setSelectedProfId] = useState<string>('')
  const [customProfName, setCustomProfName] = useState('')
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newProfName, setNewProfName] = useState('')
  const [workloadHours, setWorkloadHours] = useState('')
  const [termId, setTermId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Estado do popup de edição/remoção de professor
  const [profPopupOpen, setProfPopupOpen] = useState(false)
  const [editingProfId, setEditingProfId] = useState<string>('')
  const [editingProfName, setEditingProfName] = useState('')
  const [profActionSaving, setProfActionSaving] = useState(false)
  const [profPopupError, setProfPopupError] = useState('')

  useEffect(() => {
    if (!enrollment || !open) return
    listProfessors()
      .then((profs) => {
        setProfessors(profs)
        if (enrollment.professor?.id) {
          setSelectedProfId(enrollment.professor.id)
        } else if (enrollment.professor_name) {
          const match = profs.find((p) => p.name.toLowerCase() === enrollment.professor_name.toLowerCase())
          if (match) {
            setSelectedProfId(match.id)
          } else {
            setSelectedProfId('__custom__')
            setCustomProfName(enrollment.professor_name)
          }
        } else {
          setSelectedProfId('')
        }
      })
      .catch(() => {})

    setSubjectName(enrollment.subject.name)
    setWorkloadHours(
      enrollment.custom_workload_hours != null
        ? String(enrollment.custom_workload_hours)
        : String(enrollment.subject.workload_hours),
    )
    setIsCreatingNew(false)
    setNewProfName('')
    setProfPopupOpen(false)
    setProfPopupError('')
    setTermId(enrollment.term?.id ?? null)
    setError('')
  }, [enrollment, open])

  if (!open || !enrollment) return null

  function openEditProfessorPopup() {
    if (professors.length === 0) return
    const initialProf =
      professors.find((p) => p.id === selectedProfId) ?? professors[0]
    setEditingProfId(initialProf.id)
    setEditingProfName(initialProf.name)
    setProfPopupError('')
    setProfPopupOpen(true)
  }

  function handleSelectProfToEdit(id: string) {
    setEditingProfId(id)
    const found = professors.find((p) => p.id === id)
    setEditingProfName(found ? found.name : '')
    setProfPopupError('')
  }

  async function handleUpdateProfessor() {
    if (!editingProfId || !editingProfName.trim()) {
      setProfPopupError('Informe o nome do professor.')
      return
    }
    setProfActionSaving(true)
    setProfPopupError('')
    try {
      const updated = await updateProfessor(editingProfId, { name: editingProfName.trim() })
      setProfessors((current) =>
        current
          .map((p) => (p.id === updated.id ? updated : p))
          .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
      )
      setProfPopupOpen(false)
    } catch (reason) {
      setProfPopupError(
        reason instanceof Error ? reason.message : 'Não foi possível atualizar o professor.',
      )
    } finally {
      setProfActionSaving(false)
    }
  }

  async function handleDeleteProfessor() {
    if (!editingProfId) return
    setProfActionSaving(true)
    setProfPopupError('')
    try {
      await deleteProfessor(editingProfId)
      const remaining = professors.filter((p) => p.id !== editingProfId)
      setProfessors(remaining)
      if (selectedProfId === editingProfId) {
        setSelectedProfId('')
      }
      if (remaining.length === 0) {
        setProfPopupOpen(false)
      } else {
        setEditingProfId(remaining[0].id)
        setEditingProfName(remaining[0].name)
        setProfPopupOpen(false)
      }
    } catch (reason) {
      setProfPopupError(
        reason instanceof Error ? reason.message : 'Não foi possível remover o professor.',
      )
    } finally {
      setProfActionSaving(false)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const trimmedSubjectName = subjectName.trim()
    if (trimmedSubjectName.length < 2) {
      setError('Informe um nome válido para a disciplina (mínimo de 2 caracteres).')
      return
    }
    const hours = Number.parseInt(workloadHours, 10)
    if (Number.isNaN(hours) || hours < 1 || hours > 2000) {
      setError('Informe uma carga horária válida entre 1 e 2000 horas.')
      return
    }

    setSaving(true)
    setError('')
    try {
      let finalProfId: string | null = null
      let finalProfName = ''

      if (isCreatingNew && newProfName.trim()) {
        const created = await createProfessor({ name: newProfName.trim() })
        finalProfId = created.id
        finalProfName = created.name
      } else if (selectedProfId === '__custom__') {
        finalProfId = null
        finalProfName = customProfName.trim()
      } else if (selectedProfId) {
        finalProfId = selectedProfId
        const match = professors.find((p) => p.id === selectedProfId)
        finalProfName = match ? match.name : ''
      }

      const updated = await updateStudentSubject(enrollment!.id, {
        subject_name: trimmedSubjectName,
        professor_id: finalProfId,
        professor_name: finalProfName,
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
        <header className="shrink-0 flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6 bg-white z-10 dark:border-[#005063]/30 dark:bg-[#081a26]">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#006768] dark:text-[#005063]">Personalização</p>
            <h2 id="subject-edit-title" className="mt-1 text-xl font-black tracking-tight text-[#0d3950] dark:text-slate-50">
              Editar disciplina
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

        <form className="flex flex-col flex-1 min-h-0 overflow-hidden" onSubmit={submit}>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4">
            {error ? <Alert>{error}</Alert> : null}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#005063]/30 dark:bg-[#040f17] space-y-2">
              <Input
                label="Nome da disciplina"
                name="subject_name"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                required
              />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {enrollment.subject.code || 'Sem código'} · Matriz oficial: {enrollment.subject.workload_hours}h
              </p>
            </div>

            {!isCreatingNew ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Professor responsável</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(true)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#006768] hover:underline dark:text-[#a8d5e5]"
                    >
                      <Plus size={14} aria-hidden="true" /> Cadastrar novo
                    </button>
                    {professors.length > 0 ? (
                      <button
                        type="button"
                        onClick={openEditProfessorPopup}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0d3950] hover:underline dark:text-slate-300"
                      >
                        <Edit2 size={13} aria-hidden="true" /> Editar
                      </button>
                    ) : null}
                  </div>
                </div>
                <Select
                  label=""
                  name="professor_select"
                  value={selectedProfId}
                  onChange={(e) => setSelectedProfId(e.target.value)}
                >
                  <option value="">Não definido</option>
                  {professors.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  <option value="__custom__">Outro (digitar nome)</option>
                </Select>
                {selectedProfId === '__custom__' ? (
                  <Input
                    label="Nome do professor"
                    name="custom_professor"
                    placeholder="Ex.: Prof. Carlos Santos"
                    value={customProfName}
                    onChange={(e) => setCustomProfName(e.target.value)}
                  />
                ) : null}
              </div>
            ) : (
              <div className="rounded-xl border border-[#005063]/20 bg-[#dce6ef]/40 p-3.5 dark:border-[#005063]/40 dark:bg-[#040f17] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold uppercase tracking-wide text-[#0d3950] dark:text-slate-200">
                    Novo professor
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  >
                    Cancelar cadastro inline
                  </button>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      label="Nome do novo professor"
                      name="new_professor_name"
                      placeholder="Ex.: Prof. Alan Turing"
                      value={newProfName}
                      onChange={(e) => setNewProfName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    disabled={!newProfName.trim() || profActionSaving}
                    onClick={async () => {
                      if (!newProfName.trim()) return
                      setProfActionSaving(true)
                      setError('')
                      try {
                        const created = await createProfessor({ name: newProfName.trim() })
                        setProfessors((current) =>
                          [...current, created].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
                        )
                        setSelectedProfId(created.id)
                        setNewProfName('')
                        setIsCreatingNew(false)
                      } catch (reason) {
                        setError(
                          reason instanceof Error
                            ? reason.message
                            : 'Não foi possível cadastrar o professor.',
                        )
                      } finally {
                        setProfActionSaving(false)
                      }
                    }}
                    className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-[#006768] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#005063] disabled:opacity-50"
                  >
                    {profActionSaving ? 'Salvando…' : 'Cadastrar'}
                  </button>
                </div>
              </div>
            )}

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

            <ScheduleConfig
              enrollmentId={enrollment.id}
              termId={termId}
              onTermLinked={(id) => setTermId(id)}
            />
          </div>

          <div className="shrink-0 border-t border-slate-200 bg-slate-50/80 backdrop-blur-xs px-5 py-4 sm:px-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end dark:border-[#005063]/30 dark:bg-[#081a26]/90">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-xl border border-slate-300 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-[#040f17]"
            >
              Cancelar
            </button>
            <PrimaryButton loading={saving} type="submit" className="sm:w-auto">
              Salvar alterações
            </PrimaryButton>
          </div>
        </form>

        {profPopupOpen ? (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
            role="presentation"
            onClick={() => setProfPopupOpen(false)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="prof-popup-title"
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6 dark:border-[#005063]/40 dark:bg-[#081a26]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#006768] dark:text-[#a8d5e5]">
                    Gerenciar professor
                  </p>
                  <h3 id="prof-popup-title" className="mt-1 text-lg font-black text-[#0d3950] dark:text-white">
                    Editar ou remover professor
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setProfPopupOpen(false)}
                  className="grid size-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-[#041019] dark:hover:text-white"
                  aria-label="Fechar popup de professor"
                >
                  <X size={17} aria-hidden="true" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {profPopupError ? <Alert>{profPopupError}</Alert> : null}

                <Select
                  label="Professor cadastrado"
                  name="popup_professor_select"
                  value={editingProfId}
                  onChange={(e) => handleSelectProfToEdit(e.target.value)}
                >
                  {professors.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.name}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Novo nome do professor"
                  name="popup_professor_name"
                  placeholder="Ex.: Prof. Carlos Santos"
                  value={editingProfName}
                  onChange={(e) => setEditingProfName(e.target.value)}
                  autoFocus
                />

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    disabled={profActionSaving || !editingProfId}
                    onClick={() => void handleDeleteProfessor()}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-950/70"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Remover
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setProfPopupOpen(false)}
                      className="min-h-10 rounded-xl border border-slate-300 px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-[#041019]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={profActionSaving || !editingProfName.trim()}
                      onClick={() => void handleUpdateProfessor()}
                      className="inline-flex min-h-10 items-center justify-center rounded-xl bg-[#006768] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#005063] disabled:opacity-50"
                    >
                      {profActionSaving ? 'Salvando…' : 'Salvar nome'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
