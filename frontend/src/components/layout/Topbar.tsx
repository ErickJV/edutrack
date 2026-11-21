import { Menu } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { useAuth } from '../../auth/AuthContext'
import { formatLongDate, getInitials } from '../../utils/dashboard'
import { Brand } from '../Brand'
import { ThemeToggle } from '../ThemeToggle'
import { getPageTitle, MOBILE_SIDEBAR_ID } from './nav-items'

export function Topbar({
  onOpenMenu,
  menuOpen,
}: {
  onOpenMenu: () => void
  menuOpen: boolean
}) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const initials = getInitials(user?.full_name)

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="flex h-14 items-center gap-2.5 px-4 sm:px-6 lg:px-7">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Abrir menu"
          aria-controls={MOBILE_SIDEBAR_ID}
          aria-expanded={menuOpen}
          className="press grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-surface text-ink transition hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] lg:hidden"
        >
          <Menu size={17} aria-hidden="true" />
        </button>

        <div className="lg:hidden">
          <Brand />
        </div>

        <div className="hidden min-w-0 lg:block">
          <h1 className="truncate text-[15px] leading-tight font-black tracking-tight text-ink">
            {getPageTitle(pathname)}
          </h1>
          <p className="mt-0.5 text-[10px] font-bold tracking-[0.12em] text-muted">
            {formatLongDate(new Date())}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <ThemeToggle compact />
          <Link
            to="/perfil"
            aria-label="Abrir perfil"
            title={user?.full_name || 'Perfil'}
            className="press grid size-8 place-items-center rounded-full bg-accent text-[11px] font-black text-accent-ink ring-2 ring-transparent transition hover:ring-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)]"
          >
            {initials}
          </Link>
        </div>
      </div>
    </header>
  )
}
