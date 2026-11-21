export const EXIT_MS = 200

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export async function runExitTransition(): Promise<void> {
  if (typeof document === 'undefined' || prefersReducedMotion()) return
  const root = document.getElementById('root')
  if (!root) return
  root.classList.add('is-exiting')
  await new Promise<void>((resolve) => window.setTimeout(resolve, EXIT_MS))
}

export function clearExitTransition(): void {
  document.getElementById('root')?.classList.remove('is-exiting')
}
