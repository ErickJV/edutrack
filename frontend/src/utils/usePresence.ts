/* eslint-disable react-hooks/set-state-in-effect, react-hooks/refs --
   hooks de presença guardam o último valor recebido para manter o conteúdo
   visível durante os ~180ms de animação de saída do overlay. */

import { useEffect, useRef, useState } from 'react'

const EXIT_MS = 180

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function usePresence(open: boolean, exitMs = EXIT_MS) {
  const [mounted, setMounted] = useState(open)

  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    if (!mounted) return
    const timer = window.setTimeout(() => setMounted(false), prefersReducedMotion() ? 0 : exitMs)
    return () => window.clearTimeout(timer)
  }, [open, mounted, exitMs])

  return { mounted, closing: !open }
}

export function useLastDefined<T>(value: T | null | undefined): T | null {
  const last = useRef<T | null>(value ?? null)

  useEffect(() => {
    if (value != null) last.current = value
  }, [value])

  return value ?? last.current
}
