import { createContext } from 'react'
import type { ResolvedTheme, ThemePreference } from './theme'

export type ThemeContextType = {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme
  setPreference: (pref: ThemePreference) => void
}

export const DEFAULT_THEME_CONTEXT: ThemeContextType = {
  preference: 'system',
  resolvedTheme: 'light',
  setPreference: () => {},
}

export const ThemeContext = createContext<ThemeContextType>(DEFAULT_THEME_CONTEXT)
