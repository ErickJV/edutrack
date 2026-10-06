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
      <button
        type="submit"
        className="flex min-h-11 w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-5 font-arial text-base font-semibold text-[#0d3950] shadow-xs transition hover:bg-slate-50 hover:border-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005063]"
      >
        <span className="grid size-6 place-items-center rounded-full bg-[#0d3950] text-[13px] font-black text-white shadow-xs" aria-hidden="true">
          G
        </span>
        Continuar com Google
      </button>
    </form>
  )
}

export function Divider() {
  return (
    <div className="flex items-center gap-3 py-1" aria-hidden="true">
      <span className="h-px flex-1 bg-slate-200" />
      <span className="font-arial text-xs font-semibold uppercase tracking-wider text-slate-500">
        ou
      </span>
      <span className="h-px flex-1 bg-slate-200" />
    </div>
  )
}
