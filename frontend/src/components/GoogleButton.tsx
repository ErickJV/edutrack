import { getCsrfToken, googleLoginAction } from '../api/client'

export function GoogleButton() {
  const enabled = import.meta.env.VITE_GOOGLE_ENABLED === 'true'
  if (!enabled) return null
  return (
    <form action={googleLoginAction()} method="post">
      <input type="hidden" name="csrfmiddlewaretoken" value={getCsrfToken()} />
      <input type="hidden" name="provider" value="google" />
      <input type="hidden" name="process" value="login" />
      <input type="hidden" name="callback_url" value={`${window.location.origin}/home`} />
      <button type="submit" className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-5 text-base font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:focus-visible:outline-indigo-400">
        <span className="grid size-6 place-items-center rounded-full bg-white text-[17px] font-black text-blue-600" aria-hidden="true">G</span>
        Continuar com Google
      </button>
    </form>
  )
}

export function Divider() {
  return (
    <div className="flex items-center gap-3 py-1" aria-hidden="true">
      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">ou</span>
      <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
    </div>
  )
}
