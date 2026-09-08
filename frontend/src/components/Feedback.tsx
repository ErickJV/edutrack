import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react'

export function Alert({ children, tone = 'error' }: { children: React.ReactNode; tone?: 'error' | 'success' | 'info' }) {
  const styles =
    tone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-200'
      : tone === 'success'
        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200'
        : 'border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-950/40 dark:text-indigo-200'
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-xl border px-4 py-3 text-sm font-medium leading-6 ${styles}`}>
      <Icon size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}

export function PageLoader() {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 dark:bg-slate-950" aria-label="Carregando">
      <div className="text-center">
        <LoaderCircle className="mx-auto animate-spin text-indigo-600 dark:text-indigo-400" size={34} aria-hidden="true" />
        <p className="mt-4 text-sm font-semibold text-slate-600 dark:text-slate-300">Preparando seu EduTrack…</p>
      </div>
    </main>
  )
}
