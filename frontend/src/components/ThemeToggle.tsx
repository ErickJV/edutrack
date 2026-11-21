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

export function ThemeToggle({
  className = '',
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const { preference, resolvedTheme, setPreference } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Preferência de tema de aparência"
      className={`inline-flex items-center rounded-full border border-line bg-surface/90 shadow-xs backdrop-blur-md ${
        compact ? 'gap-0.5 p-0.5' : 'gap-1 p-1'
      } ${className}`}
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
            className={`press grid place-items-center rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ink)] ${
              compact ? 'size-7' : 'size-8'
            } ${
              isSelected
                ? 'bg-accent text-accent-ink shadow-xs'
                : 'text-muted hover:text-ink'
            }`}
            title={`Tema ${option.label} (atualmente ${resolvedTheme === 'dark' ? 'escuro' : 'claro'})`}
            aria-label={`Tema ${option.label}`}
          >
            <Icon size={compact ? 13 : 15} strokeWidth={2.2} aria-hidden="true" />
          </button>
        )
      })}
    </div>
  )
}
