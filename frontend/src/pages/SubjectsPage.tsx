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
import { MetricValue } from '../components/MetricValue'
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
    <main className="min-h-dvh bg-[#dce6ef] dark:bg-[#040f17]">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-[#005063]/30 dark:bg-[#081a26]/90">
        <div className="mx-auto max-w-7xl px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <Brand />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="press group inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0d3950] px-4 text-sm font-bold text-white transition hover:bg-[#005063] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005063] dark:bg-[#005063] dark:hover:bg-[#006768]"
              >
                <Plus size={18} aria-hidden="true" className="transition-transform duration-300 group-hover:rotate-90" />
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
        <section className="rounded-[2rem] bg-[#0d3950] border border-[#005063]/40 px-6 py-8 text-white shadow-xl sm:px-10 sm:py-10 dark:bg-[#081a26] dark:border-[#005063]/50">
          <div className="max-w-3xl space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white">
              <BookOpen size={14} aria-hidden="true" /> Minhas disciplinas
            </p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-white">Acompanhe sua matriz curricular e o progresso de cada disciplina.</h1>
            <p className="max-w-2xl text-base leading-7 text-[#dce6ef]/90">
              Selecione as matérias que está cursando neste semestre e acompanhe o avanço individual de cada disciplina.
            </p>
          </div>
        </section>

        {error ? <div className="mt-6"><Alert>{error}</Alert></div> : null}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <article
            className="stagger-item card-lift rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#005063]/30 dark:bg-[#081a26]"
            style={{ animationDelay: '0ms' }}
          >
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Disciplinas ativas</p>
            <p className="mt-2 text-3xl font-black text-[#0d3950] dark:text-white"><MetricValue value={activeSubjects.length} /></p>
          </article>
          <article
            className="stagger-item card-lift rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#005063]/30 dark:bg-[#081a26]"
            style={{ animationDelay: '45ms' }}
          >
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Média de progresso</p>
            <p className="mt-2 text-3xl font-black text-[#0d3950] dark:text-white"><MetricValue value={progressAverage} suffix="%" /></p>
          </article>
          <article
            className="stagger-item card-lift rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-[#005063]/30 dark:bg-[#081a26]"
            style={{ animationDelay: '90ms' }}
          >
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Carga horária ativa</p>
            <p className="mt-2 text-3xl font-black text-[#0d3950] dark:text-white"><MetricValue value={totalHours} suffix="h" /></p>
          </article>
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-[#005063]/30 dark:bg-[#081a26]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#005063] dark:text-[#a8d5e5]">Disciplinas ativas</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-[#0d3950] dark:text-white">Progresso por matéria</h2>
            </div>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#005063]/30 px-4 text-sm font-bold text-[#005063] transition hover:bg-[#005063]/10 dark:border-[#005063]/50 dark:text-[#a8d5e5] dark:hover:bg-[#005063]/30"
            >
              <ClipboardList size={17} aria-hidden="true" />
              Ajustar seleção
            </button>
          </div>

          {activeSubjects.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center dark:border-[#005063]/30 dark:bg-[#041019]">
              <LoaderCircle className="mx-auto text-slate-400 dark:text-slate-500" size={28} aria-hidden="true" />
              <p className="mt-4 text-lg font-black text-[#0d3950] dark:text-white">Nenhuma disciplina ativa ainda</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Configure seu semestre para visualizar o progresso e começar a acompanhar sua rotina.
              </p>
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="press mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0d3950] px-4 text-sm font-bold text-white transition hover:bg-[#005063] dark:bg-[#005063] dark:hover:bg-[#006768]"
              >
                <Plus size={17} aria-hidden="true" />
                Selecionar matérias
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {activeSubjects.map((item, index) => (
                <article
                  key={item.id}
                  className="stagger-item card-lift rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-[#005063]/20 dark:bg-[#041019]"
                  style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{toSemesterLabel(item.subject.semester)}</p>
                      <h3 className="mt-1 text-xl font-black tracking-tight text-[#0d3950] dark:text-white">{item.subject.name}</h3>
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
                    <div className="bar-grow h-full rounded-full bg-[#006768] dark:bg-[#005063]" style={{ width: `${item.progress_percent}%` }} />
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300 sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-slate-500 dark:text-slate-400">Carga horária</dt>
                      <dd className="mt-1 font-bold text-[#0d3950] dark:text-white">{item.custom_workload_hours != null ? `${item.custom_workload_hours}h (declarada)` : `${item.subject.workload_hours}h`}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-slate-500 dark:text-slate-400">Professor</dt>
                      <dd className="mt-1 font-bold text-[#0d3950] dark:text-white">{item.professor_name || 'Não definido'}</dd>
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
