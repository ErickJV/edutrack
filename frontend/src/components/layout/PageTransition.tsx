import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

/** Anima a entrada do conteúdo a cada troca de rota protegida, sem remontar o shell. */
export function PageTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className="page-enter flex flex-1 flex-col">
      {children}
    </div>
  )
}
