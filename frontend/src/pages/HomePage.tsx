import { BookOpenCheck, Clock3, GraduationCap, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getDashboardSummary, listStudentSubjects } from '../api/client'
import type { DashboardSummary, StudentSubject } from '../api/types'
import { AppNavigation } from '../components/AppNavigation'
import { Brand } from '../components/Brand'
import { Alert } from '../components/Feedback'
import { MetricValue } from '../components/MetricValue'
import { ThemeToggle } from '../components/ThemeToggle'

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
    <main className="min-h-dvh bg-[#dce6ef] dark:bg-[#040f17]">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-[#005063]/30 dark:bg-[#081a26]/90">
        <div className="mx-auto max-w-6xl px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <Brand />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                type="button"
                aria-label="Sair"
                onClick={() => void leave()}
                disabled={leaving}
                className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-[#0d3950]/80 transition hover:bg-slate-100 hover:text-[#0d3950] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005063] disabled:opacity-50 dark:text-slate-300 dark:hover:bg-[#041019] dark:hover:text-white dark:focus-visible:outline-[#006768]"
              >
                <LogOut size={18} aria-hidden="true" />
                <span className="hidden sm:inline">{leaving ? 'Saindo…' : 'Sair'}</span>
              </button>
            </div>
          </div>
          <div className="mt-4">
            <AppNavigation />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-14">
        <section className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-[#005063]/30 dark:bg-[#081a26]" aria-labelledby="upcoming-tasks">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-[#0d3950]/10 text-[#0d3950] dark:bg-[#005063]/30 dark:text-[#a8d5e5]">
                <Clock3 size={22} aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#005063] dark:text-[#a8d5e5]">Próximas entregas</p>
                <h1 id="upcoming-tasks" className="mt-1 text-2xl font-black tracking-tight text-[#0d3950] dark:text-white">Itens urgentes das próximas 48 horas</h1>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Olá, <span className="font-bold text-[#0d3950] dark:text-white">{firstName}</span>.
            </p>
          </div>

          {summaryLoading ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <article key={index} className="card-lift rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-[#005063]/20 dark:bg-[#041019]">
                  <div className="skeleton-shimmer h-4 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="skeleton-shimmer mt-4 h-6 w-48 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="skeleton-shimmer mt-3 h-3 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
                </article>
              ))}
            </div>
          ) : summary && summary.upcoming_tasks.length === 0 ? (
            <p className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-sm text-slate-600 dark:border-[#005063]/30 dark:bg-[#041019] dark:text-slate-300">
              Nenhuma entrega urgente encontrada no momento.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {(summary?.upcoming_tasks ?? []).map((task, index) => {
                const due = formatDueLabel(task.due_date)
                return (
                  <article
                    key={task.id}
                    className={`stagger-item card-lift rounded-3xl border p-5 shadow-sm ${due.urgent ? 'border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/40' : 'border-slate-200/80 bg-slate-50/80 dark:border-[#005063]/20 dark:bg-[#041019]'}`}
                    style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{task.subject_name}</p>
                        <h3 className="mt-1 text-lg font-black tracking-tight text-[#0d3950] dark:text-white">{task.title}</h3>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${due.urgent ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300' : 'bg-[#005063]/10 text-[#005063] dark:bg-[#005063]/40 dark:text-[#a8d5e5]'}`}>
                        {due.urgent ? 'Menos de 48h' : 'Próxima'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{due.label}</p>
                    <p className="mt-2 text-sm font-semibold text-slate-500 dark:text-slate-400">{task.subject_semester}º semestre · {task.estimated_minutes} min estimados</p>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        {summaryError ? <div className="mt-6"><Alert>{summaryError}</Alert></div> : null}

        <section className="mt-6 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-[#005063]/30 dark:bg-[#081a26]" aria-labelledby="dashboard-summary">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-[#005063]/10 text-[#005063] dark:bg-[#005063]/30 dark:text-[#a8d5e5]">
              <GraduationCap size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#005063] dark:text-[#a8d5e5]">Painel acadêmico</p>
              <h2 id="dashboard-summary" className="mt-1 text-2xl font-black tracking-tight text-[#0d3950] dark:text-white">Métricas ativas da sua rotina</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {summaryLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <article key={index} className="card-lift rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-[#005063]/20 dark:bg-[#041019]">
                  <div className="skeleton-shimmer h-4 w-28 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="skeleton-shimmer mt-4 h-9 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="skeleton-shimmer mt-3 h-3 w-36 rounded-full bg-slate-200 dark:bg-slate-800" />
                </article>
              ))
            ) : (
              <>
                <article
                  className="stagger-item card-lift rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 shadow-sm dark:border-[#005063]/20 dark:bg-[#041019]"
                  style={{ animationDelay: '0ms' }}
                >
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Disciplinas ativas</p>
                  <p className="mt-2 text-3xl font-black text-[#0d3950] dark:text-white"><MetricValue value={summary?.subjects_count ?? 0} /></p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Matérias acompanhadas no período atual.</p>
                </article>
                <article
                  className="stagger-item card-lift rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 shadow-sm dark:border-[#005063]/20 dark:bg-[#041019]"
                  style={{ animationDelay: '45ms' }}
                >
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Tarefas pendentes</p>
                  <p className="mt-2 text-3xl font-black text-[#0d3950] dark:text-white"><MetricValue value={summary?.pending_tasks_count ?? 0} /></p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Próximas entregas e revisões em aberto.</p>
                </article>
                <article
                  className={`stagger-item card-lift rounded-3xl border p-5 shadow-sm ${(summary?.overdue_tasks_count ?? 0) > 0 ? 'border-rose-200 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/40' : 'border-slate-200/80 bg-slate-50/80 dark:border-[#005063]/20 dark:bg-[#041019]'}`}
                  style={{ animationDelay: '90ms' }}
                >
                  <p className={`text-sm font-semibold ${(summary?.overdue_tasks_count ?? 0) > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-500 dark:text-slate-400'}`}>Tarefas vencidas</p>
                  <p className={`mt-2 text-3xl font-black ${(summary?.overdue_tasks_count ?? 0) > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-[#0d3950] dark:text-white'}`}><MetricValue value={summary?.overdue_tasks_count ?? 0} /></p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Itens com prazo expirado não concluídos.</p>
                </article>
                <article
                  className="stagger-item card-lift rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 shadow-sm dark:border-[#005063]/20 dark:bg-[#041019]"
                  style={{ animationDelay: '135ms' }}
                >
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Tarefas concluídas</p>
                  <p className="mt-2 text-3xl font-black text-[#0d3950] dark:text-white"><MetricValue value={summary?.completed_tasks_count ?? 0} /></p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Itens já finalizados na sua rotina.</p>
                </article>
                <article
                  className="stagger-item card-lift rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 shadow-sm dark:border-[#005063]/20 dark:bg-[#041019]"
                  style={{ animationDelay: '180ms' }}
                >
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Progresso ponderado</p>
                  <p className="mt-2 text-3xl font-black text-[#0d3950] dark:text-white"><MetricValue value={summary?.weighted_progress_percent ?? 0} suffix="%" /></p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Desempenho geral das disciplinas ativas.</p>
                </article>
                <article
                  className="stagger-item card-lift rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 shadow-sm dark:border-[#005063]/20 dark:bg-[#041019]"
                  style={{ animationDelay: '225ms' }}
                >
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Tempo de estudo</p>
                  <p className="mt-2 text-3xl font-black text-[#0d3950] dark:text-white"><MetricValue value={summary?.actual_minutes_total ?? 0} suffix=" min" /></p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Planejado {summary?.planned_minutes_total ?? 0} min
                  </p>
                </article>
              </>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-[#005063]/30 dark:bg-[#081a26]" aria-labelledby="progress-subjects">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-[#006768]/10 text-[#006768] dark:bg-[#006768]/30 dark:text-[#a8d5e5]">
              <BookOpenCheck size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#006768] dark:text-[#a8d5e5]">Desempenho por disciplina</p>
              <h2 id="progress-subjects" className="mt-1 text-2xl font-black tracking-tight text-[#0d3950] dark:text-white">Gráfico de progresso por disciplina</h2>
            </div>
          </div>

          {activeSubjects.length === 0 ? (
            <p className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-sm text-slate-600 dark:border-[#005063]/30 dark:bg-[#041019] dark:text-slate-300">
              Nenhuma disciplina ativa encontrada para exibir o gráfico.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 xl:grid-cols-2">
              {activeSubjects.map((subject, index) => (
                <article
                  key={subject.id}
                  className="stagger-item card-lift rounded-3xl border border-slate-200/80 bg-slate-50/80 p-5 shadow-sm dark:border-[#005063]/20 dark:bg-[#041019]"
                  style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{subject.subject.semester}º semestre</p>
                      <h3 className="mt-1 text-lg font-black tracking-tight text-[#0d3950] dark:text-white">{subject.subject.name}</h3>
                    </div>
                    <span className="rounded-full bg-[#005063]/10 px-3 py-1 text-xs font-bold text-[#005063] dark:bg-[#005063]/30 dark:text-[#a8d5e5]">{subject.progress_percent}%</span>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="bar-grow h-full rounded-full bg-[#006768] dark:bg-[#005063]"
                      style={{ width: `${subject.progress_percent}%` }}
                      role="progressbar"
                      aria-label={`${subject.subject.name}: ${subject.progress_percent}% concluído`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={subject.progress_percent}
                    />
                  </div>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                    {subject.progress_percent}% concluído · {subject.professor_name || 'Professor não definido'}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
