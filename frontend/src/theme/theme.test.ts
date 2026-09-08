import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  applyTheme,
  getStoredPreference,
  getSystemTheme,
  resolveTheme,
  setStoredPreference,
} from './theme'

describe('Theme utilities', () => {
  beforeEach(() => {
    window.localStorage.clear()
    document.documentElement.className = ''
    document.documentElement.removeAttribute('data-theme')
  })

  it('retorna system como padrão quando não há valor salvo', () => {
    expect(getStoredPreference()).toBe('system')
  })

  it('persiste e recupera preferências válidas', () => {
    setStoredPreference('dark')
    expect(getStoredPreference()).toBe('dark')

    setStoredPreference('light')
    expect(getStoredPreference()).toBe('light')

    setStoredPreference('system')
    expect(getStoredPreference()).toBe('system')
  })

  it('retorna system se o valor salvo for inválido', () => {
    window.localStorage.setItem('edutrack_theme_preference', 'invalid_value')
    expect(getStoredPreference()).toBe('system')
  })

  it('gerencia armazenamento indisponível ou com erro sem quebrar', () => {
    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded')
    })
    const getSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(() => setStoredPreference('dark')).not.toThrow()
    expect(getStoredPreference()).toBe('system')

    setSpy.mockRestore()
    getSpy.mockRestore()
  })

  it('aplica tema dark e light corretamente no documento', () => {
    applyTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')

    applyTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('resolve tema do sistema baseado em matchMedia', () => {
    const originalMatchMedia = window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('dark'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))

    expect(getSystemTheme()).toBe('dark')
    expect(resolveTheme('system')).toBe('dark')
    expect(resolveTheme('light')).toBe('light')
    expect(resolveTheme('dark')).toBe('dark')

    window.matchMedia = originalMatchMedia
  })
})
