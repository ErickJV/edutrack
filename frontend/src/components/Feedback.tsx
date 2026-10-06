import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react'

export function Alert({
  children,
  tone = 'error',
}: {
  children: React.ReactNode
  tone?: 'error' | 'success' | 'info'
}) {
  const styles =
    tone === 'error'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : tone === 'success'
        ? 'border-[#006768]/30 bg-[#006768]/10 text-[#005063]'
        : 'border-[#005063]/30 bg-[#005063]/10 text-[#0d3950]'
  const Icon = tone === 'success' ? CheckCircle2 : AlertCircle
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-lg border px-4 py-3 font-arial text-sm font-medium leading-6 shadow-xs ${styles}`}
    >
      <Icon size={19} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  )
}

export function PageLoader() {
  return (
    <main
      className="grid min-h-dvh place-items-center bg-[#0d3950] text-white"
      aria-label="Carregando"
    >
      <div className="text-center">
        <LoaderCircle
          className="mx-auto animate-spin text-white"
          size={36}
          aria-hidden="true"
        />
        <p className="mt-4 font-arial text-sm font-medium text-white/80">
          Carregando…
        </p>
      </div>
    </main>
  )
}
