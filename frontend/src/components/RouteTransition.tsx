import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

export function RouteTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  // /entrar e /cadastro compartilham a chave para a troca de modo animar
  // dentro do card, em vez de remontar a página inteira.
  const transitionKey = pathname === '/entrar' || pathname === '/cadastro' ? 'auth' : pathname

  useEffect(() => {
    window.scrollTo(0, 0)
    document.getElementById('root')?.classList.remove('is-exiting')
  }, [pathname])

  return (
    <>
      <div key={`veil-${transitionKey}`} aria-hidden="true" className="route-veil" />
      <div key={transitionKey} className="page-enter">
        {children}
      </div>
    </>
  )
}
