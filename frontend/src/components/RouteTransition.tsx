import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

export function RouteTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    document.getElementById('root')?.classList.remove('is-exiting')
  }, [pathname])

  return <>{children}</>
}
