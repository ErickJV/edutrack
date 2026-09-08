import { Link } from 'react-router-dom'

import { Brand } from '../components/Brand'

export function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-5 dark:bg-slate-950">
      <div className="max-w-lg text-center">
        <Brand />
        <p className="mt-10 text-sm font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Erro 404</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-slate-50">Página não encontrada</h1>
        <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">O endereço acessado não existe ou foi movido.</p>
        <Link to="/" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-indigo-600 px-6 font-extrabold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600">Voltar ao EduTrack</Link>
      </div>
    </main>
  )
}
