import { ArrowLeft, FileWarning, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { ThemeToggle } from '../components/ThemeToggle'

const documents = {
  terms: {
    title: 'Termos de Uso',
    icon: FileWarning,
    paragraphs: [
      'O Impatrack é uma plataforma acadêmica autorizada destinada a alunos da Faculdade Impacta. Nesta versão, o serviço oferece somente autenticação e identificação da graduação.',
      'Você é responsável por manter suas credenciais seguras e por informar dados verdadeiros. O serviço não substitui os sistemas oficiais da instituição e pode ser alterado ou interrompido durante o desenvolvimento do projeto.',
    ],
  },
  privacy: {
    title: 'Política de Privacidade',
    icon: ShieldCheck,
    paragraphs: [
      'O Impatrack trata nome, e-mail institucional, graduação, modalidade e registros técnicos de autenticação para disponibilizar o acesso. Senhas são armazenadas exclusivamente como hash seguro.',
      'O MVP não registra IP ou user-agent nos aceites legais e não compartilha dados com terceiros, exceto os serviços estritamente necessários de autenticação e infraestrutura.',
    ],
  },
} as const

export function LegalPage({ kind }: { kind: keyof typeof documents }) {
  const document = documents[kind]
  const Icon = document.icon

  return (
    <main className="min-h-dvh bg-[#dce6ef] dark:bg-[#040f17]">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-xs dark:border-[#005063]/30 dark:bg-[#081a26]/90">
        <div className="mx-auto flex min-h-20 max-w-4xl items-center justify-between px-5 sm:px-8">
          <Brand />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/entrar"
              className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 font-arial text-sm font-bold text-slate-600 hover:bg-slate-100 hover:text-[#0d3950] dark:text-slate-300 dark:hover:bg-[#040f17] dark:hover:text-white"
            >
              <ArrowLeft size={18} aria-hidden="true" /> Voltar
            </Link>
          </div>
        </div>
      </header>
      <article className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm sm:p-10 dark:border-[#005063]/30 dark:bg-[#081a26]">
          <span className="grid size-14 place-items-center rounded-2xl bg-[#005063]/10 text-[#006768] dark:bg-[#005063]/25 dark:text-[#006768]">
            <Icon size={28} aria-hidden="true" />
          </span>
          <p className="mt-7 font-arial text-sm font-bold uppercase tracking-[0.14em] text-[#006768] dark:text-[#005063]">
            Versão draft-2026-09-01
          </p>
          <h1 className="mt-2 font-montserrat text-3xl font-black tracking-tight text-[#0d3950] sm:text-4xl dark:text-slate-50">
            {document.title}
          </h1>
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 font-arial text-sm font-bold leading-6 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            Documento acadêmico provisório — pendente de revisão jurídica.
          </div>
          <div className="mt-8 space-y-5 font-arial text-base leading-8 text-slate-700 dark:text-slate-200">
            {document.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <p className="mt-10 border-t border-slate-100 pt-6 font-arial text-sm text-slate-500 dark:border-[#005063]/30 dark:text-slate-400">
            Publicado para fins acadêmicos em 1º de setembro de 2026.
          </p>
        </div>
      </article>
    </main>
  )
}
