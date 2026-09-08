import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { forwardRef, useState } from 'react'

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className = '', ...props },
  ref,
) {
  const inputId = id || props.name
  return (
    <label className="block" htmlFor={inputId}>
      <span className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-200">{label}</span>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={`min-h-12 w-full rounded-xl border bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-indigo-400 dark:focus:ring-indigo-950/50 ${error ? 'border-rose-400 dark:border-rose-500' : 'border-slate-300'} ${className}`}
        {...props}
      />
      {error ? <span id={`${inputId}-error`} className="mt-1.5 block text-sm font-medium text-rose-600 dark:text-rose-400">{error}</span> : null}
      {!error && hint ? <span id={`${inputId}-hint`} className="mt-1.5 block text-sm text-slate-500 dark:text-slate-400">{hint}</span> : null}
    </label>
  )
})

export function PasswordInput(props: Omit<InputProps, 'type'>) {
  const [visible, setVisible] = useState(false)
  const inputId = props.id || props.name
  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className="pr-12" />
      <button
        type="button"
        className="absolute right-1.5 top-[30px] grid size-10 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus-visible:outline-indigo-400"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-controls={inputId}
      >
        {visible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
      </button>
    </div>
  )
}

export function Select({
  label,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string }) {
  const id = props.id || props.name
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-bold text-slate-800 dark:text-slate-200">{label}</span>
      <select
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        className={`min-h-12 w-full rounded-xl border bg-white px-4 text-base text-slate-950 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:focus:border-indigo-400 dark:focus:ring-indigo-950/50 ${error ? 'border-rose-400 dark:border-rose-500' : 'border-slate-300'}`}
      >
        {children}
      </select>
      {error ? <span className="mt-1.5 block text-sm font-medium text-rose-600 dark:text-rose-400">{error}</span> : null}
    </label>
  )
}

export function PrimaryButton({ loading, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-base font-extrabold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:focus-visible:outline-indigo-400"
    >
      {loading ? <LoaderCircle size={20} className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  )
}
