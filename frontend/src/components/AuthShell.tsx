import { CheckCircle2, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react'

import { Brand } from './Brand'
import { ThemeToggle } from './ThemeToggle'

export function AuthShell({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string
  eyebrow: string
  description: string
  children: React.ReactNode
}) {
  return (
    <main className="min-h-dvh bg-slate-50 dark:bg-slate-950 lg:grid lg:grid-cols-[minmax(380px,0.92fr)_minmax(560px,1.08fr)]">
      <aside className="relative hidden overflow-hidden bg-indigo-700 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="absolute -right-28 top-20 size-96 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 size-80 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative z-10"><Brand light /></div>
        <section className="relative z-10 max-w-xl py-14">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-indigo-50">
            <Sparkles size={16} aria-hidden="true" /> Feito para alunos Impacta
          </span>
          <h2 className="text-4xl font-black leading-[1.08] tracking-tight xl:text-5xl">
            Sua vida acadêmica, <span className="text-cyan-300">mais organizada.</span>
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-8 text-indigo-100">
            Um espaço simples e seguro para acompanhar sua jornada na faculdade — começando pelo acesso.
          </p>
          <ul className="mt-10 space-y-4 text-sm font-medium text-indigo-50">
            <li className="flex items-center gap-3"><CheckCircle2 className="text-cyan-300" size={20} /> Acesso exclusivo com e-mail institucional</li>
            <li className="flex items-center gap-3"><ShieldCheck className="text-cyan-300" size={20} /> Autenticação protegida e dados seguros</li>
            <li className="flex items-center gap-3"><GraduationCap className="text-cyan-300" size={20} /> Experiência personalizada para sua graduação</li>
          </ul>
        </section>
        <p className="relative z-10 text-xs leading-5 text-indigo-200">
          Projeto acadêmico autorizado. Não substitui os sistemas oficiais da Faculdade Impacta.
        </p>
      </aside>

      <section className="flex min-h-dvh flex-col px-5 pb-8 pt-6 sm:px-8 lg:px-14 lg:py-12 xl:px-24">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="lg:hidden"><Brand /></div>
          <div className="ml-auto"><ThemeToggle /></div>
        </div>
        <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center py-4">
          <header className="mb-8">
            <p className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">{eyebrow}</p>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-slate-50 sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300">{description}</p>
          </header>
          {children}
        </div>
      </section>
    </main>
  )
}
