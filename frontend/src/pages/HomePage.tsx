import { ArrowRight, BookOpenCheck, Clock3, GraduationCap, LogOut, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

import { getDashboardSummary, listStudentSubjects } from '../api/client'
import type { DashboardSummary, StudentSubject } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Brand } from '../components/Brand'
import { AppNavigation } from '../components/AppNavigation'
import { Alert } from '../components/Feedback'
function formatDueLabel(value: string | null): { label: string; urgent: boolean } {
  if (!value) return { label: 'Sem prazo definido', urgent: false }
  const due = new Date(value)
  if (Number.isNaN(due.getTime())) return { label: 'Sem prazo definido', urgent: false }

  const hoursRemaining = Math.ceil((due.getTime() - Date.now()) / 3_600_000)
  if (hoursRemaining <= 0) return { label: 'Vence hoje', urgent: true }
  if (hoursRemaining < 24) return { label: `Em ${hoursRemaining} hora${hoursRemaining === 1 ? '' : 's'}`, urgent: hoursRemaining < 48 }

  const daysRemaining = Math.ceil(hoursRemaining / 24)
  return { label: `Em ${daysRemaining} dia${daysRemaining === 1 ? '' : 's'}`, urgent: hoursRemaining < 48 }
}


export function HomePage() {
  const { user, signOut } = useAuth()
  const [leaving, setLeaving] = useState(false)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [activeSubjects, setActiveSubjects] = useState<StudentSubject[]>([])
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryError, setSummaryError] = useState('')
  const firstName = user?.full_name.trim().split(/\s+/)[0] || 'estudante'
  useEffect(() => {
    let alive = true
    async function loadDashboard() {
      setSummaryLoading(true)
      setSummaryError('')
      try {
        const [summaryResponse, subjectsResponse] = await Promise.all([getDashboardSummary(), listStudentSubjects()])
        if (!alive) return
        setSummary(summaryResponse)
        setActiveSubjects(subjectsResponse)
      } catch {
        if (alive) setSummaryError('Não foi possível carregar suas métricas agora.')
      } finally {
        if (alive) setSummaryLoading(false)
      }
    }
    loadDashboard()
    return () => {
      alive = false
    }
  }, [])

  async function leave() {
    setLeaving(true)
    try {
      await signOut()
    } finally {
      setLeaving(false)
    }
  }

  return (
    <main className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <Brand />
            <button
              type="button"
              aria-label="Sair"
              onClick={() => void leave()}
              disabled={leaving}
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
            >
              <LogOut size={18} aria-hidden="true" />
              <span className="hidden sm:inline">{leaving ? 'Saindo…' : 'Sair'}</span>
            </button>
          </div>
          <div className="mt-4">
            <AppNavigation />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-14">
        <section className="relative overflow-hidden rounded-[2rem] bg-indigo-700 px-6 py-9 text-white shadow-2xl shadow-indigo-950/15 sm:px-10 sm:py-12 lg:px-14">
          <div className="absolute -right-24 -top-28 size-80 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="absolute -bottom-32 left-1/3 size-72 rounded-full bg-violet-400/20 blur-3xl" />
          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-sm font-bold text-indigo-50">
              <Sparkles size={16} className="text-cyan-300" aria-hidden="true" /> Seu espaço acadêmico
            </span>
            <h1 className="mt-6 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              Olá, {firstName}. <span className="text-cyan-300">Tudo pronto por aqui.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-indigo-100 sm:text-lg">
              Sua conta está segura e vinculada à sua graduação. Aqui você acompanha as métricas principais, o progresso da turma e a rotina de estudos.
            </p>
          </div>
        </section>

        {summaryError ? <div className="mt-6"><Alert>{summaryError}</Alert></div> : null}

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="dashboard-summary">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
              <GraduationCap size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Painel acadêmico</p>
              <h2 id="dashboard-summary" className="mt-1 text-2xl font-black tracking-tight text-slate-950">Métricas ativas da sua rotina</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {summaryLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <article key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="h-4 w-28 animate-pulse rounded-full bg-slate-200" />
                  <div className="mt-4 h-9 w-20 animate-pulse rounded-full bg-slate-200" />
                  <div className="mt-3 h-3 w-36 animate-pulse rounded-full bg-slate-200" />
                </article>
              ))
            ) : (
              <>
                <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-500">Disciplinas ativas</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{summary?.subjects_count ?? 0}</p>
                  <p className="mt-2 text-sm text-slate-600">Matérias acompanhadas no período atual.</p>
                </article>
                <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-500">Tarefas pendentes</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{summary?.pending_tasks_count ?? 0}</p>
                  <p className="mt-2 text-sm text-slate-600">Próximas entregas e revisões em aberto.</p>
                </article>
                <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-500">Tarefas concluídas</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{summary?.completed_tasks_count ?? 0}</p>
                  <p className="mt-2 text-sm text-slate-600">Itens já finalizados na sua rotina.</p>
                </article>
                <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-500">Progresso ponderado</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{summary?.weighted_progress_percent ?? 0}%</p>
                  <p className="mt-2 text-sm text-slate-600">Desempenho geral das disciplinas ativas.</p>
                </article>
                <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-500">Tempo de estudo</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{summary?.actual_minutes_total ?? 0} min</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Planejado {summary?.planned_minutes_total ?? 0} min
                  </p>
                </article>
              </>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="progress-subjects">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-cyan-50 text-cyan-700">
              <BookOpenCheck size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-700">Desempenho por disciplina</p>
              <h2 id="progress-subjects" className="mt-1 text-2xl font-black tracking-tight text-slate-950">Gráfico de progresso por disciplina</h2>
            </div>
          </div>

          {activeSubjects.length === 0 ? (
            <p className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              Nenhuma disciplina ativa encontrada para exibir o gráfico.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {activeSubjects.map((subject) => (
                <article key={subject.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{subject.subject.semester}º semestre</p>
                      <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950">{subject.subject.name}</h3>
                    </div>
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">{subject.progress_percent}%</span>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500"
                      style={{ width: `${subject.progress_percent}%` }}
                      role="progressbar"
                      aria-label={`${subject.subject.name}: ${subject.progress_percent}% concluído`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={subject.progress_percent}
                    />
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {subject.progress_percent}% concluído · {subject.professor_name || 'Professor não definido'}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="upcoming-tasks">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-amber-50 text-amber-700">
              <Clock3 size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">Próximas entregas</p>
              <h2 id="upcoming-tasks" className="mt-1 text-2xl font-black tracking-tight text-slate-950">Itens urgentes das próximas 48 horas</h2>
            </div>
          </div>

          {summaryLoading ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <article key={index} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="h-4 w-24 animate-pulse rounded-full bg-slate-200" />
                  <div className="mt-4 h-6 w-48 animate-pulse rounded-full bg-slate-200" />
                  <div className="mt-3 h-3 w-32 animate-pulse rounded-full bg-slate-200" />
                </article>
              ))}
            </div>
          ) : summary && summary.upcoming_tasks.length === 0 ? (
            <p className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              Nenhuma entrega urgente encontrada no momento.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {(summary?.upcoming_tasks ?? []).map((task) => {
                const due = formatDueLabel(task.due_date)
                return (
                  <article key={task.id} className={`rounded-3xl border p-5 shadow-sm ${due.urgent ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{task.subject_name}</p>
                        <h3 className="mt-1 text-lg font-black tracking-tight text-slate-950">{task.title}</h3>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${due.urgent ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {due.urgent ? 'Menos de 48h' : 'Próxima'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{due.label}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-500">{task.subject_semester}º semestre · {task.estimated_minutes} min estimados</p>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.78fr_1.22fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="academic-profile">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-indigo-600">Seu perfil</p>
                <h2 id="academic-profile" className="mt-2 text-xl font-black text-slate-950">Informações acadêmicas</h2>
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                <GraduationCap size={24} aria-hidden="true" />
              </span>
            </div>
            <dl className="mt-7 space-y-5">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Graduação</dt>
                <dd className="mt-1 font-bold leading-6 text-slate-900">{user?.course_offering?.course_name}</dd>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-5">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Modalidade</dt>
                  <dd className="mt-1 font-bold text-slate-900">{user?.course_offering?.modality_label}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">Vínculo</dt>
                  <dd className="mt-1 font-bold text-emerald-700">Verificado</dd>
                </div>
              </div>
            </dl>
          </section>

          <section className="flex min-h-72 flex-col justify-between rounded-3xl border border-cyan-100 bg-gradient-to-br from-white to-cyan-50 p-6 shadow-sm sm:p-8" aria-labelledby="coming-soon">
            <div>
              <span className="grid size-12 place-items-center rounded-2xl bg-cyan-100 text-cyan-800">
                <Clock3 size={24} aria-hidden="true" />
              </span>
              <p className="mt-7 text-sm font-bold uppercase tracking-[0.14em] text-cyan-700">Próximos passos</p>
              <h2 id="coming-soon" className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">Recursos de organização em breve</h2>
              <p className="mt-3 max-w-xl leading-7 text-slate-600">
                Planejamento de tarefas, calendário acadêmico e acompanhamento de disciplinas chegarão nas próximas versões do EduTrack.
              </p>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm font-bold text-slate-500">
              <BookOpenCheck size={19} className="text-indigo-600" aria-hidden="true" />
              MVP de acesso concluído
              <ArrowRight size={17} className="ml-auto text-slate-400" aria-hidden="true" />
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
