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
      <span className="mb-2 block font-arial text-xs font-semibold uppercase tracking-wider text-[#0d3950] dark:text-white">
        {label}
      </span>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
        className={`min-h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 font-arial text-base text-[#0d3950] outline-none transition placeholder:text-slate-400 focus:border-[#005063] focus:bg-white focus:ring-2 focus:ring-[#005063]/20 dark:border-[#005063]/50 dark:bg-[#041019] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#006768] dark:focus:bg-[#061622] ${
          error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : ''
        } ${className}`}
        {...props}
      />
      {error ? (
        <span id={`${inputId}-error`} className="mt-1.5 block font-arial text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </span>
      ) : null}
      {!error && hint ? (
        <span id={`${inputId}-hint`} className="mt-1.5 block font-arial text-xs text-slate-500 dark:text-slate-400">
          {hint}
        </span>
      ) : null}
    </label>
  )
})

export function PasswordInput(props: Omit<InputProps, 'type'>) {
  const [visible, setVisible] = useState(false)
  const inputId = props.id || props.name
  return (
    <div className="relative">
      <Input {...props} type={visible ? 'text' : 'password'} className={`pr-12 ${props.className || ''}`} />
      <button
        type="button"
        className="absolute right-1.5 top-[27px] grid size-9 place-items-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-[#0d3950] focus-visible:outline-2 focus-visible:outline-[#005063] dark:hover:bg-[#081c28] dark:hover:text-white"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-controls={inputId}
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </div>
  )
}

export function Select({
  label,
  error,
  children,
  className = '',
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string }) {
  const id = props.id || props.name
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block font-arial text-xs font-semibold uppercase tracking-wider text-[#0d3950] dark:text-white">
        {label}
      </span>
      <select
        {...props}
        id={id}
        aria-invalid={Boolean(error)}
        className={`min-h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3.5 font-arial text-base text-[#0d3950] outline-none transition focus:border-[#005063] focus:bg-white focus:ring-2 focus:ring-[#005063]/20 dark:border-[#005063]/50 dark:bg-[#041019] dark:text-white dark:focus:border-[#006768] dark:focus:bg-[#061622] ${
          error ? 'border-rose-400 focus:border-rose-500' : ''
        } ${className}`}
      >
        {children}
      </select>
      {error ? (
        <span className="mt-1.5 block font-arial text-xs font-medium text-rose-600 dark:text-rose-400">
          {error}
        </span>
      ) : null}
    </label>
  )
}

export function PrimaryButton({
  loading,
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 font-montserrat text-base font-bold text-accent-ink shadow-md transition-all hover:bg-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  )
}
