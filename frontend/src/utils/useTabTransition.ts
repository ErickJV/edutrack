import { useLayoutEffect, useRef } from 'react'

import { prefersReducedMotion } from './motion'

/**
 * Anima a entrada do painel quando a chave (= aba ativa) muda.
 * useLayoutEffect dispara antes do paint, então não há flash do estado final.
 */
export function useTabTransition<T extends HTMLElement>(key: string) {
  const ref = useRef<T | null>(null)
  const previousKey = useRef(key)

  useLayoutEffect(() => {
    if (previousKey.current === key) return
    previousKey.current = key
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    const animation = el.animate(
      [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 280, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
    )
    return () => animation.cancel()
  }, [key])

  return ref
}
