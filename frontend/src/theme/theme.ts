export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'edutrack_theme_preference'

function isStorageAvailable(): boolean {
  try {
    const testKey = '__theme_test__'
    window.localStorage.setItem(testKey, testKey)
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export function getStoredPreference(): ThemePreference {
  if (typeof window === 'undefined' || !isStorageAvailable()) return 'system'
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    if (value === 'light' || value === 'dark' || value === 'system') {
      return value
    }
    return 'system'
  } catch {
    return 'system'
  }
}

export function setStoredPreference(pref: ThemePreference): void {
  if (typeof window === 'undefined' || !isStorageAvailable()) return
  try {
    window.localStorage.setItem(STORAGE_KEY, pref)
  } catch {
    // Silently continue if storage is restricted
  }
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') {
    return getSystemTheme()
  }
  return pref
}

export function applyTheme(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.setAttribute('data-theme', 'dark')
  } else {
    root.classList.remove('dark')
    root.setAttribute('data-theme', 'light')
  }
}

export function initializeTheme(): void {
  const pref = getStoredPreference()
  const resolved = resolveTheme(pref)
  applyTheme(resolved)
}

// Run immediately upon import to avoid theme flash (FOUC)
initializeTheme()
