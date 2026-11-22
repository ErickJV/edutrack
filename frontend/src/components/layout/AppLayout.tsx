import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { MotionPresence } from '../MotionPresence'
import { PageTransition } from './PageTransition'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const COLLAPSE_KEY = 'edutrack_sidebar_collapsed'
const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

/** Shell autenticado: sidebar fixa/colapsável no desktop, drawer no mobile, topbar e transição. */
export function AppLayout() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(COLLAPSE_KEY) === 'true'
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    window.localStorage.setItem(COLLAPSE_KEY, String(collapsed))
  }, [collapsed])

  const close = useCallback(() => setMobileOpen(false), [])

  // Fecha o drawer quando a rota muda, ajustando o estado durante o render.
  const [syncedPath, setSyncedPath] = useState(pathname)
  if (syncedPath !== pathname) {
    setSyncedPath(pathname)
    setMobileOpen(false)
  }

  useEffect(() => {
    if (!mobileOpen) return
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const content = contentRef.current
    content?.setAttribute('inert', '')

    // O drawer só entra no DOM depois que usePresence marca como montado, então
    // o painel não existe no commit deste efeito: consultamos o diálogo vivo.
    const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')
    const focusables = () =>
      Array.from(dialog()?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      )
    const focusInitial = () => {
      const target = dialog()
      const autofocus = target?.querySelector<HTMLElement>('[data-drawer-autofocus]')
      ;(autofocus ?? focusables()[0] ?? target)?.focus()
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setMobileOpen(false)
        return
      }
      if (event.key !== 'Tab') return
      const elements = focusables()
      if (elements.length === 0) return
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    const firstFrame = requestAnimationFrame(focusInitial)
    const secondFrame = requestAnimationFrame(() => {
      requestAnimationFrame(focusInitial)
    })

    return () => {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      content?.removeAttribute('inert')
      openerRef.current?.focus()
    }
  }, [mobileOpen])

  return (
    <div className="min-h-dvh w-full bg-surface text-ink">
      <div className="flex min-h-dvh w-full flex-col lg:flex-row lg:gap-[18px] xl:gap-[22px]">
        <div className="hidden shrink-0 lg:flex lg:py-3 lg:pl-3">
          <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} />
        </div>

        <div ref={contentRef} className="flex min-w-0 flex-1 flex-col">
          <Topbar onOpenMenu={() => setMobileOpen(true)} menuOpen={mobileOpen} />
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </div>

      <MotionPresence open={mobileOpen}>
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="drawer-backdrop absolute inset-0 bg-sidebar/70 backdrop-blur-sm"
            onClick={close}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegação"
            className="drawer-panel absolute inset-y-3 left-3 w-[min(280px,84vw)] overflow-hidden rounded-[20px] bg-sidebar shadow-2xl"
          >
            <Sidebar mobile onNavigate={close} onClose={close} />
          </div>
        </div>
      </MotionPresence>
    </div>
  )
}
