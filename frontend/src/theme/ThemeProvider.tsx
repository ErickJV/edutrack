import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  applyTheme,
  getStoredPreference,
  getSystemTheme,
  resolveTheme,
  setStoredPreference,
  startThemeTransition,
  type ResolvedTheme,
  type ThemePreference,
} from './theme'
import { ThemeContext } from './ThemeContext'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPrefState] = useState<ThemePreference>(() => getStoredPreference())
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme())

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [])

  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (preference === 'system') return systemTheme
    return preference
  }, [preference, systemTheme])

  useEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  const setPreference = useCallback(
    (newPref: ThemePreference) => {
      const nextResolved = newPref === 'system' ? getSystemTheme() : newPref
      if (nextResolved !== resolvedTheme) startThemeTransition()
      setPrefState(newPref)
      setStoredPreference(newPref)
    },
    [resolvedTheme],
  )

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme,
      setPreference,
    }),
    [preference, resolvedTheme, setPreference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
