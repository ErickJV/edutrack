import { BookOpen, ClipboardList, LoaderCircle, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { listStudentSubjects } from '../api/client'
import type { StudentSubject } from '../api/types'
import { Brand } from '../components/Brand'
import { AppNavigation } from '../components/AppNavigation'
import { SemesterSelectionModal } from '../components/SemesterSelectionModal'
import { SubjectEditModal } from '../components/SubjectEditModal'
import { ThemeToggle } from '../components/ThemeToggle'
import { Alert, PageLoader } from '../components/Feedback'
function toSemesterLabel(semester: number): string {
  return `${semester}º semestre`
}

export function SubjectsPage() {
  const [activeSubjects, setActiveSubjects] = useState<StudentSubject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<StudentSubject | null>(null)
  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const activeResponse = await listStudentSubjects()
        if (!alive) return
        setActiveSubjects(activeResponse)
      } catch {
        if (alive) setError('Não foi possível carregar suas disciplinas.')
      } finally {
        if (alive) setLoading(false)
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [])

  const progressAverage = useMemo(() => {
    if (activeSubjects.length === 0) return 0
    return Math.round(activeSubjects.reduce((sum, item) => sum + item.progress_percent, 0) / activeSubjects.length)
  }, [activeSubjects])
  const totalHours = useMemo(
    () => activeSubjects.reduce((sum, item) => sum + (item.custom_workload_hours ?? item.subject.workload_hours), 0),
    [activeSubjects],
  )
  if (loading) return <PageLoader />

  return (
    <main className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <Brand />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <Plus size={18} aria-hidden="true" />
                Configurar semestre
              </button>
            </div>
          </div>
          <div className="mt-4">
            <AppNavigation />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <section className="rounded-[2rem] bg-gradient-to-br from-indigo-700 via-indigo-700 to-cyan-600 px-6 py-8 text-white shadow-2xl shadow-indigo-950/15 sm:px-10 sm:py-10">
          <div className="max-w-3xl space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-50">
              <BookOpen size={14} aria-hidden="true" /> Minhas disciplinas
            </p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Acompanhe sua matriz curricular e o progresso de cada disciplina.</h1>
            <p className="max-w-2xl text-base leading-7 text-indigo-100">
              Selecione as matérias que está cursando neste semestre e acompanhe o avanço individual de cada disciplina.
            </p>
          </div>
        </section>

        {error ? <div className="mt-6"><Alert>{error}</Alert></div> : null}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Disciplinas ativas</p>
            <p className="mt-2 text-3xl font-black text-slate-950 dark:text-slate-50">{activeSubjects.length}</p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Média de progresso</p>
            <p className="mt-2 text-3xl font-black text-slate-950 dark:text-slate-50">{progressAverage}%</p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Carga horária ativa</p>
            <p className="mt-2 text-3xl font-black text-slate-950 dark:text-slate-50">{totalHours}h</p>
          </article>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Disciplinas ativas</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50">Progresso por matéria</h2>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-indigo-200 px-4 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
            >
              <ClipboardList size={17} aria-hidden="true" />
              Ajustar seleção
            </button>
          </div>

          {activeSubjects.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
              <LoaderCircle className="mx-auto text-slate-400 dark:text-slate-500" size={28} aria-hidden="true" />
              <p className="mt-4 text-lg font-black text-slate-950 dark:text-slate-50">Nenhuma disciplina ativa ainda</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Configure seu semestre para visualizar o progresso e começar a acompanhar sua rotina.
              </p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <Plus size={17} aria-hidden="true" />
                Selecionar matérias
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {activeSubjects.map((item) => (
                <article key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{toSemesterLabel(item.subject.semester)}</p>
                      <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">{item.subject.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {item.progress_percent}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingSubject(item)}
                        className="inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        title="Editar professor e carga horária"
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true">
                    <div className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500" style={{ width: `${item.progress_percent}%` }} />
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-slate-500 dark:text-slate-400">Carga horária</dt>
                      <dd className="mt-1 font-bold text-slate-950 dark:text-slate-50">{item.custom_workload_hours != null ? `${item.custom_workload_hours}h (declarada)` : `${item.subject.workload_hours}h`}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500 dark:text-slate-400">Professor</dt>
                      <dd className="mt-1 font-bold text-slate-950 dark:text-slate-50">{item.professor_name || 'Não definido'}</dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          )}
        </section>

      </div>

      <SemesterSelectionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={(subjects) => {
          setActiveSubjects(subjects)
          setModalOpen(false)
        }}
      />
      <SubjectEditModal
        open={Boolean(editingSubject)}
        enrollment={editingSubject}
        onClose={() => setEditingSubject(null)}
        onSaved={(updated) => {
          setActiveSubjects((current) => current.map((i) => (i.id === updated.id ? updated : i)))
        }}
      />
    </main>
  )
}
