import { ArrowRight, BookOpenCheck, Clock3, GraduationCap, LogOut, Sparkles } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '../auth/AuthContext'
import { Brand } from '../components/Brand'

export function HomePage() {
  const { user, signOut } = useAuth()
  const [leaving, setLeaving] = useState(false)
  const firstName = user?.full_name.trim().split(/\s+/)[0] || 'estudante'

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
        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Brand />
          <button
            type="button"
            aria-label="Sair"
            onClick={() => void leave()}
            disabled={leaving}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
          >
            <LogOut size={18} aria-hidden="true" />
            <span className="hidden sm:inline">{leaving ? 'Saindo…' : 'Sair'}</span>
          </button>
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
              Sua conta está segura e vinculada à sua graduação. Em breve, este será o ponto de partida para organizar seus estudos.
            </p>
          </div>
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
