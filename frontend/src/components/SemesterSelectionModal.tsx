/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, X } from 'lucide-react'

import {
  createCurriculumSubject,
  listCurriculum,
  listStudentSubjects,
  saveStudentSubjects,
} from '../api/client'
import type { AcademicSubject, StudentSubject } from '../api/types'
import { Alert } from './Feedback'
import { PrimaryButton, Select } from './FormControls'

type SemesterSelectionModalProps = {
  open: boolean
  onClose: () => void
  onSaved: (subjects: StudentSubject[]) => void
}
function academicPeriodForSemester(semester: number): string {
  return `${new Date().getFullYear()}/${semester}`
}

export function SemesterSelectionModal({ open, onClose, onSaved }: SemesterSelectionModalProps) {
  const [curriculum, setCurriculum] = useState<AcademicSubject[]>([])
  const [enrolledSubjectIds, setEnrolledSubjectIds] = useState<string[]>([])
  const [selectedSemester, setSelectedSemester] = useState(2)
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Criação rápida de disciplina ministrada no semestre
  const [newSubjName, setNewSubjName] = useState('')
  const [newSubjHours, setNewSubjHours] = useState('80')
  const [creatingSubj, setCreatingSubj] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError('')
    Promise.all([listCurriculum(), listStudentSubjects().catch(() => [] as StudentSubject[])])
      .then(([subjects, activeEnrollments]) => {
        setCurriculum(subjects)
        const activeIds = activeEnrollments.map((item) => item.subject.id)
        setEnrolledSubjectIds(activeIds)
        const currentSem =
          activeEnrollments[0]?.subject.semester ||
          subjects.find((s) => s.semester === 2)?.semester ||
          subjects[0]?.semester ||
          1
        setSelectedSemester(currentSem)
      })
      .catch(() => setError('Não foi possível carregar a matriz curricular.'))
      .finally(() => setLoading(false))
  }, [open])

  const semesterSubjects = useMemo(
    () =>
      curriculum.filter(
        (subject) =>
          subject.semester === selectedSemester &&
          subject.active &&
          !(selectedSemester === 2 && subject.name.toLowerCase().includes('application data persistence')),
      ),
    [curriculum, selectedSemester],
  )
  useEffect(() => {
    const enrolledInThisSemester = semesterSubjects
      .filter((s) => enrolledSubjectIds.includes(s.id))
      .map((s) => s.id)
    if (enrolledInThisSemester.length > 0) {
      setSelectedSubjectIds(enrolledInThisSemester)
    } else {
      setSelectedSubjectIds(semesterSubjects.map((subject) => subject.id))
    }
  }, [semesterSubjects, enrolledSubjectIds])

  async function handleAddCustomSubject() {
    const trimmed = newSubjName.trim()
    if (!trimmed) return
    setCreatingSubj(true)
    setError('')
    try {
      const hours = Number.parseInt(newSubjHours, 10) || 80
      const created = await createCurriculumSubject({
        name: trimmed,
        semester: selectedSemester,
        workload_hours: hours,
      })
      setCurriculum((prev) => {
        const filtered = prev.filter((item) => item.id !== created.id)
        return [...filtered, created]
      })
      setSelectedSubjectIds((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]))
      setNewSubjName('')
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível adicionar a disciplina ao semestre.',
      )
    } finally {
      setCreatingSubj(false)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (selectedSubjectIds.length === 0) {
      setError('Selecione ao menos uma disciplina do semestre.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const saved = await saveStudentSubjects({
        semester_period: academicPeriodForSemester(selectedSemester),
        subject_ids: selectedSubjectIds,
      })
      onSaved?.(saved)
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar suas matérias.')
    } finally {
      setSaving(false)
    }
  }
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="semester-selection-title"
        className="relative flex flex-col w-full max-w-3xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl shadow-slate-950/20 dark:bg-slate-900 dark:border dark:border-slate-800"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="shrink-0 flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6 bg-white z-10 dark:border-[#005063]/30 dark:bg-[#081a26]">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#006768] dark:text-[#005063]">Minhas disciplinas</p>
            <h2 id="semester-selection-title" className="mt-1 text-xl font-black tracking-tight text-[#0d3950] dark:text-slate-50">
              Selecionar matérias do semestre
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
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5">
            {error ? <Alert>{error}</Alert> : null}

            <div className="grid gap-4 md:grid-cols-[180px_1fr] md:items-end">
              <Select
                label="Semestre"
                name="semester"
                value={String(selectedSemester)}
                onChange={(event) => setSelectedSemester(Number(event.target.value))}
              >
                {Array.from({ length: 8 }, (_, index) => index + 1).map((semester) => (
                  <option key={semester} value={semester}>
                    {semester}º semestre
                  </option>
                ))}
              </Select>
              <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                Escolha o semestre atual e confirme as matérias que você está cursando agora.
              </p>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 dark:border-[#005063]/30 dark:bg-[#040f17]">
              {loading ? (
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Carregando matriz curricular…</p>
              ) : semesterSubjects.length === 0 ? (
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Não há disciplinas cadastradas para este semestre.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {semesterSubjects.map((subject) => {
                    const checked = selectedSubjectIds.includes(subject.id)
                    return (
                      <label
                        key={subject.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-left transition ${
                          checked
                            ? 'border-[#006768] bg-white shadow-sm dark:border-[#006768] dark:bg-[#081a26]'
                            : 'border-slate-200 bg-white/70 hover:border-slate-300 dark:border-slate-800 dark:bg-[#081a26]/60 dark:hover:border-[#005063]/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            setSelectedSubjectIds((current) => {
                              if (event.target.checked) return [...current, subject.id]
                              return current.filter((id) => id !== subject.id)
                            })
                          }}
                          className="mt-1 size-4 rounded border-slate-300 text-[#006768] focus:ring-[#006768] dark:border-slate-700 dark:bg-[#040f17]"
                        />
                        <span className="space-y-1">
                          <span className="block text-sm font-extrabold text-[#0d3950] dark:text-slate-50">{subject.name}</span>
                          <span className="block text-xs font-semibold uppercase tracking-wide text-[#005063] dark:text-slate-400">
                            {subject.code || 'Sem código'} · {subject.workload_hours}h
                          </span>
                          <span className="block text-sm leading-6 text-slate-600 dark:text-slate-300">{subject.description}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              )}

              <div className="mt-4 border-t border-slate-200 pt-4 dark:border-[#005063]/30">
                <p className="text-xs font-extrabold uppercase tracking-wider text-[#0d3950] dark:text-slate-200">
                  Adicionar disciplina realmente ministrada no {selectedSemester}º semestre
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={newSubjName}
                    onChange={(e) => setNewSubjName(e.target.value)}
                    placeholder="Nome da disciplina ministrada..."
                    className="min-h-10 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-[#0d3950] focus:border-[#005063] focus:outline-hidden dark:border-slate-700 dark:bg-[#081a26] dark:text-slate-100"
                  />
                  <input
                    type="number"
                    min={10}
                    max={400}
                    value={newSubjHours}
                    onChange={(e) => setNewSubjHours(e.target.value)}
                    placeholder="80h"
                    aria-label="Carga horária"
                    className="min-h-10 w-24 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium text-[#0d3950] focus:border-[#005063] focus:outline-hidden dark:border-slate-700 dark:bg-[#081a26] dark:text-slate-100"
                  />
                  <button
                    type="button"
                    disabled={creatingSubj || !newSubjName.trim()}
                    onClick={() => void handleAddCustomSubject()}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#005063] px-3.5 text-xs font-extrabold text-white transition hover:bg-[#006768] disabled:opacity-50"
                  >
                    <Plus size={15} />
                    <span>{creatingSubj ? 'Adicionando...' : 'Incluir'}</span>
                  </button>
                </div>
              </div>
            </section>
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
              Salvar matérias do semestre
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  )
}
