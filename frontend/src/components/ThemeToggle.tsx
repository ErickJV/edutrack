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
      className={`inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white/90 p-1 shadow-md shadow-slate-400/20 backdrop-blur-md dark:border-[#005063]/60 dark:bg-[#091e2b]/90 dark:shadow-black/60 ${className}`}
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
            className={`press grid size-8 place-items-center rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#006768] ${
              isSelected
                ? 'bg-[#006768] text-white shadow-xs'
                : 'text-slate-500 hover:text-[#0d3950] dark:text-white/60 dark:hover:text-white'
            }`}
            title={`Tema ${option.label} (atualmente ${resolvedTheme === 'dark' ? 'escuro' : 'claro'})`}
            aria-label={`Tema ${option.label}`}
          >
            <Icon size={15} strokeWidth={2.2} aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
