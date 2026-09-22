/* eslint-disable react-hooks/set-state-in-effect */
import { Calendar, LoaderCircle, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import {
  createAcademicTerm,
  createClassSchedule,
  deleteClassSchedule,
  listAcademicTerms,
  listClassOccurrences,
  listClassSchedules,
  updateClassOccurrence,
  updateStudentSubject,
} from '../api/client'
import type { AcademicTerm, ClassOccurrence, ClassSchedule } from '../api/types'
import { Alert } from './Feedback'
import { Input, PrimaryButton, Select } from './FormControls'

const WEEKDAY_LABELS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']

function formatLocalDatetime(iso: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: timezone,
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

type ScheduleConfigProps = {
  enrollmentId: string
  termId: string | null
  onTermLinked: (termId: string) => void
}

export function ScheduleConfig({ enrollmentId, termId, onTermLinked }: ScheduleConfigProps) {
  const [terms, setTerms] = useState<AcademicTerm[]>([])
  const [selectedTermId, setSelectedTermId] = useState(termId ?? '')
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [occurrences, setOccurrences] = useState<ClassOccurrence[]>([])
  const [loadingTerms, setLoadingTerms] = useState(true)
  const [loadingSchedules, setLoadingSchedules] = useState(false)
  const [loadingOccs, setLoadingOccs] = useState(false)
  const [error, setError] = useState('')

  // Term creation state
  const [creatingTerm, setCreatingTerm] = useState(false)
  const [newTermName, setNewTermName] = useState('')
  const [newTermStart, setNewTermStart] = useState('')
  const [newTermEnd, setNewTermEnd] = useState('')
  const [savingTerm, setSavingTerm] = useState(false)
  const [termError, setTermError] = useState('')

  // Schedule creation state
  const [creatingSchedule, setCreatingSchedule] = useState(false)
  const [schedWeekday, setSchedWeekday] = useState('0')
  const [schedStart, setSchedStart] = useState('')
  const [schedEnd, setSchedEnd] = useState('')
  const [schedRoom, setSchedRoom] = useState('')
  const [savingSched, setSavingSched] = useState(false)
  const [schedError, setSchedError] = useState('')

  // Occurrence editing
  const [editingOccId, setEditingOccId] = useState<string | null>(null)
  const [occRoom, setOccRoom] = useState('')
  const [savingOcc, setSavingOcc] = useState(false)

  // Load terms
  useEffect(() => {
    let alive = true
    setLoadingTerms(true)
    listAcademicTerms()
      .then((ts) => { if (alive) setTerms(ts) })
      .catch(() => { if (alive) setError('Erro ao carregar semestres.') })
      .finally(() => { if (alive) setLoadingTerms(false) })
    return () => { alive = false }
  }, [])

  // Load schedules and occurrences when term is linked
  useEffect(() => {
    if (!termId) return
    let alive = true
    setLoadingSchedules(true)
    listClassSchedules({ student_subject_id: enrollmentId })
      .then((ss) => { if (alive) setSchedules(ss) })
      .catch(() => { if (alive) setError('Erro ao carregar horários.') })
      .finally(() => { if (alive) setLoadingSchedules(false) })
    return () => { alive = false }
  }, [enrollmentId, termId])

  useEffect(() => {
    if (!termId || schedules.length === 0) return
    let alive = true
    setLoadingOccs(true)
    listClassOccurrences({ student_subject_id: enrollmentId })
      .then((occs) => { if (alive) setOccurrences(occs) })
      .catch(() => {})
      .finally(() => { if (alive) setLoadingOccs(false) })
    return () => { alive = false }
  }, [enrollmentId, termId, schedules])

  async function linkTerm() {
    if (!selectedTermId) return
    try {
      await updateStudentSubject(enrollmentId, { term_id: selectedTermId })
      onTermLinked(selectedTermId)
    } catch {
      setError('Não foi possível vincular o semestre.')
    }
  }

  async function createTerm(event: FormEvent) {
    event.preventDefault()
    setSavingTerm(true)
    setTermError('')
    try {
      const created = await createAcademicTerm({
        name: newTermName.trim(),
        start_date: newTermStart,
        end_date: newTermEnd,
      })
      setTerms((prev) => [...prev, created])
      setSelectedTermId(created.id)
      setCreatingTerm(false)
      setNewTermName('')
      setNewTermStart('')
      setNewTermEnd('')
      // Auto-link
      await updateStudentSubject(enrollmentId, { term_id: created.id })
      onTermLinked(created.id)
    } catch (reason) {
      setTermError(reason instanceof Error ? reason.message : 'Não foi possível criar o semestre.')
    } finally {
      setSavingTerm(false)
    }
  }

  async function createSchedule(event: FormEvent) {
    event.preventDefault()
    setSavingSched(true)
    setSchedError('')
    try {
      const created = await createClassSchedule({
        student_subject_id: enrollmentId,
        weekday: Number(schedWeekday),
        start_time: schedStart,
        end_time: schedEnd,
        room: schedRoom.trim() || undefined,
      })
      setSchedules((prev) => [...prev, created])
      setCreatingSchedule(false)
      setSchedStart('')
      setSchedEnd('')
      setSchedRoom('')
      // Refresh occurrences
      const occs = await listClassOccurrences({ student_subject_id: enrollmentId })
      setOccurrences(occs)
    } catch (reason) {
      setSchedError(reason instanceof Error ? reason.message : 'Não foi possível criar o horário.')
    } finally {
      setSavingSched(false)
    }
  }

  async function removeSchedule(id: string) {
    try {
      await deleteClassSchedule(id)
      setSchedules((prev) => prev.filter((s) => s.id !== id))
      const occs = await listClassOccurrences({ student_subject_id: enrollmentId })
      setOccurrences(occs)
    } catch {
      setError('Não foi possível remover o horário.')
    }
  }

  async function cancelOccurrence(occ: ClassOccurrence) {
    try {
      const updated = await updateClassOccurrence(occ.id, { cancelled: !occ.cancelled })
      setOccurrences((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    } catch {
      setError('Não foi possível alterar a aula.')
    }
  }

  async function saveOccurrenceRoom(id: string) {
    setSavingOcc(true)
    try {
      const updated = await updateClassOccurrence(id, { room: occRoom.trim() })
      setOccurrences((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
      setEditingOccId(null)
    } catch {
      setError('Não foi possível salvar a sala.')
    } finally {
      setSavingOcc(false)
    }
  }

  const activeTerm = terms.find((t) => t.id === termId)
  const now = new Date()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar size={16} className="text-indigo-500" aria-hidden="true" />
        <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Semestre e aulas
        </h3>
      </div>

      {error ? <Alert>{error}</Alert> : null}

      {/* Term section */}
      {!termId ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60 space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Vincule um semestre para configurar horários e calcular progresso de aulas.
          </p>

          {loadingTerms ? (
            <div className="flex justify-center py-2" aria-label="Carregando semestres">
              <LoaderCircle size={20} className="animate-spin text-indigo-400" aria-hidden="true" />
            </div>
          ) : (
            <>
              {!creatingTerm ? (
                <div className="flex gap-2">
                  <Select
                    label="Semestre"
                    name="term_select"
                    value={selectedTermId}
                    onChange={(e) => setSelectedTermId(e.target.value)}
                    className="flex-1"
                  >
                    <option value="">— Selecione —</option>
                    {terms.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.start_date} — {t.end_date})
                      </option>
                    ))}
                  </Select>
                  <button
                    type="button"
                    onClick={linkTerm}
                    disabled={!selectedTermId}
                    className="mt-7 min-h-12 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                  >
                    Vincular
                  </button>
                </div>
              ) : null}

              {!creatingTerm ? (
                <button
                  type="button"
                  onClick={() => setCreatingTerm(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  <Plus size={14} aria-hidden="true" /> Criar novo semestre
                </button>
              ) : (
                <form onSubmit={createTerm} className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5 dark:border-indigo-900/50 dark:bg-indigo-950/30">
                  {termError ? <Alert>{termError}</Alert> : null}
                  <Input
                    label="Nome do semestre"
                    name="term_name"
                    placeholder="Ex.: 2026/1"
                    value={newTermName}
                    onChange={(e) => setNewTermName(e.target.value)}
                    required
                    autoFocus
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Início"
                      name="term_start"
                      type="date"
                      value={newTermStart}
                      onChange={(e) => setNewTermStart(e.target.value)}
                      required
                    />
                    <Input
                      label="Fim"
                      name="term_end"
                      type="date"
                      value={newTermEnd}
                      onChange={(e) => setNewTermEnd(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <PrimaryButton loading={savingTerm} type="submit">
                      Criar semestre
                    </PrimaryButton>
                    <button
                      type="button"
                      onClick={() => setCreatingTerm(false)}
                      className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      ) : (
        /* Term is linked — show schedule config */
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60 space-y-4">
          {/* Term info */}
          {activeTerm ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Semestre vinculado
              </p>
              <p className="text-sm font-extrabold text-slate-950 dark:text-slate-50">
                {activeTerm.name}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeTerm.start_date} — {activeTerm.end_date} · {activeTerm.timezone}
              </p>
            </div>
          ) : null}

          {/* Schedules */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Horários semanais
              </p>
              <button
                type="button"
                onClick={() => setCreatingSchedule((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline dark:text-indigo-400"
                aria-expanded={creatingSchedule}
              >
                <Plus size={14} aria-hidden="true" /> Adicionar horário
              </button>
            </div>

            {loadingSchedules ? (
              <div className="flex justify-center py-2" aria-label="Carregando horários">
                <LoaderCircle size={18} className="animate-spin text-indigo-400" aria-hidden="true" />
              </div>
            ) : schedules.length === 0 && !creatingSchedule ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nenhum horário configurado. Adicione um horário para gerar as aulas.
              </p>
            ) : (
              <ul className="space-y-2" aria-label="Horários semanais">
                {schedules.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {WEEKDAY_LABELS[s.weekday]} {s.start_time}–{s.end_time}
                      {s.room ? ` · ${s.room}` : ''}
                      <span className="ml-1 text-xs font-normal text-slate-500">
                        ({s.occurrences_count} aulas)
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSchedule(s.id)}
                      className="grid size-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-rose-500 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                      aria-label={`Remover horário ${WEEKDAY_LABELS[s.weekday]} ${s.start_time}`}
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {creatingSchedule ? (
              <form
                onSubmit={createSchedule}
                className="mt-3 space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3.5 dark:border-indigo-900/50 dark:bg-indigo-950/30"
              >
                {schedError ? <Alert>{schedError}</Alert> : null}
                <Select
                  label="Dia da semana"
                  name="weekday"
                  value={schedWeekday}
                  onChange={(e) => setSchedWeekday(e.target.value)}
                >
                  {WEEKDAY_LABELS.map((label, i) => (
                    <option key={i} value={i}>
                      {label}
                    </option>
                  ))}
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Início"
                    name="sched_start"
                    type="time"
                    value={schedStart}
                    onChange={(e) => setSchedStart(e.target.value)}
                    required
                  />
                  <Input
                    label="Fim"
                    name="sched_end"
                    type="time"
                    value={schedEnd}
                    onChange={(e) => setSchedEnd(e.target.value)}
                    required
                  />
                </div>
                <Input
                  label="Sala (opcional)"
                  name="sched_room"
                  placeholder="Ex.: A-21"
                  value={schedRoom}
                  onChange={(e) => setSchedRoom(e.target.value)}
                />
                <div className="flex gap-2">
                  <PrimaryButton loading={savingSched} type="submit">
                    Gerar aulas
                  </PrimaryButton>
                  <button
                    type="button"
                    onClick={() => setCreatingSchedule(false)}
                    className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : null}
          </div>

          {/* Occurrences list */}
          {schedules.length > 0 ? (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Aulas geradas
              </p>
              {loadingOccs ? (
                <div className="flex justify-center py-2" aria-label="Carregando aulas">
                  <LoaderCircle size={18} className="animate-spin text-indigo-400" aria-hidden="true" />
                </div>
              ) : occurrences.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">Nenhuma aula gerada ainda.</p>
              ) : (
                <ul
                  className="max-h-56 overflow-y-auto space-y-1.5 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900"
                  aria-label="Lista de aulas"
                >
                  {occurrences.map((occ) => {
                    const isPast = new Date(occ.ends_at) <= now
                    return (
                      <li
                        key={occ.id}
                        className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                          occ.cancelled
                            ? 'bg-slate-100 text-slate-400 line-through dark:bg-slate-800 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {editingOccId === occ.id ? (
                          <div className="flex flex-1 items-center gap-2">
                            <input
                              type="text"
                              aria-label="Sala da aula"
                              value={occRoom}
                              onChange={(e) => setOccRoom(e.target.value)}
                              className="min-h-9 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveOccurrenceRoom(occ.id)
                                if (e.key === 'Escape') setEditingOccId(null)
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => saveOccurrenceRoom(occ.id)}
                              disabled={savingOcc}
                              className="min-h-9 rounded-lg bg-indigo-600 px-3 text-xs font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                            >
                              {savingOcc ? '...' : 'OK'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingOccId(null)}
                              className="grid size-8 place-items-center rounded-lg text-slate-400 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-slate-500 dark:hover:text-slate-200"
                              aria-label="Cancelar edição de sala"
                            >
                              <X size={14} aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingOccId(occ.id)
                                setOccRoom(occ.room)
                              }}
                              className="flex flex-1 items-start flex-col gap-0.5 text-left hover:text-indigo-600 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:hover:text-indigo-400"
                              aria-label={`Editar sala: ${formatLocalDatetime(occ.starts_at, activeTerm?.timezone ?? 'America/Sao_Paulo')}${occ.room ? `, sala ${occ.room}` : ''}`}
                            >
                              <span className="text-xs font-semibold">
                                {formatLocalDatetime(occ.starts_at, activeTerm?.timezone ?? 'America/Sao_Paulo')}
                                {occ.room ? ` · ${occ.room}` : ''}
                              </span>
                              {isPast ? (
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  {occ.attendance_status === 'present'
                                    ? '✓ Presente'
                                    : occ.attendance_status === 'absent'
                                      ? '✗ Falta'
                                      : 'Pendente'}
                                </span>
                              ) : null}
                            </button>
                            <button
                              type="button"
                              onClick={() => cancelOccurrence(occ)}
                              className={`min-w-[4.5rem] rounded-lg px-2 py-1 text-xs font-bold transition focus-visible:outline-2 ${
                                occ.cancelled
                                  ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 focus-visible:outline-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 dark:hover:bg-indigo-900/60'
                                  : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-rose-500 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400'
                              }`}
                              aria-label={occ.cancelled ? 'Reativar aula' : 'Cancelar aula'}
                            >
                              {occ.cancelled ? 'Reativar' : 'Cancelar'}
                            </button>
                          </>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
