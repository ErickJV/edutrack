import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type ThemePreference } from '../theme'

const THEME_OPTIONS: Array<{
  value: ThemePreference
  label: string
  icon: typeof Sun
}> = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
]

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { preference, resolvedTheme, setPreference } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Preferência de tema de aparência"
      className={`inline-flex items-center rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {THEME_OPTIONS.map((option) => {
        const Icon = option.icon
        const isSelected = preference === option.value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setPreference(option.value)}
            className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-400 ${
              isSelected
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-800 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-950 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
            title={`Tema ${option.label} (atualmente ${resolvedTheme === 'dark' ? 'escuro' : 'claro'})`}
          >
            <Icon size={16} aria-hidden="true" />
            <span className="hidden sm:inline">{option.label}</span>
            <span className="sr-only">Tema {option.label}</span>
          </button>
        )
      })}
    </div>
  )
}
