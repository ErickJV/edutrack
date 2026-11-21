import { LoaderCircle, LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

import { useAuth } from '../../auth/AuthContext'
import { useSignOut } from '../../auth/useSignOut'
import { getInitials } from '../../utils/dashboard'
import { Brand } from '../Brand'
import { MOBILE_SIDEBAR_ID, PRIMARY_NAV, PROFILE_NAV, SIDEBAR_ID } from './nav-items'

export function Sidebar({
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  mobile = false,
  onClose,
}: {
  collapsed?: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
  mobile?: boolean
  onClose?: () => void
}) {
  const { user } = useAuth()
  const { leave, leaving } = useSignOut()
  const initials = getInitials(user?.full_name)
  const compact = collapsed && !mobile

  function navLinkClass(isActive: boolean) {
    return `press relative flex min-h-[38px] items-center rounded-xl text-[13px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
      compact ? 'justify-center gap-0 px-0' : 'gap-2.5 px-2.5'
    } ${
      isActive
        ? 'bg-accent text-accent-ink shadow-sm'
        : 'text-white/65 hover:bg-white/5 hover:text-white'
    }`
  }

  return (
    <aside
      id={mobile ? MOBILE_SIDEBAR_ID : SIDEBAR_ID}
      data-collapsed={compact}
      className={
        mobile
          ? 'flex h-full w-full flex-col bg-sidebar'
          : `sticky top-0 flex h-dvh shrink-0 flex-col overflow-hidden border-r border-white/5 bg-sidebar transition-[width] duration-300 ease-out ${
              compact ? 'w-[68px]' : 'w-[236px]'
            }`
      }
    >
      <div
        className={`flex px-2.5 pt-4 pb-3 ${
          compact ? 'flex-col items-center gap-3' : 'items-center justify-between gap-2'
        }`}
      >
        <Brand light showMark />
        {mobile ? (
          <button
            type="button"
            onClick={onClose}
            data-drawer-autofocus
            aria-label="Fechar menu"
            className="press grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <X size={16} aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            aria-controls={SIDEBAR_ID}
            aria-label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className="press grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {collapsed ? (
              <PanelLeftOpen size={16} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={16} aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-0.5 px-2 pb-2.5">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/home'}
              onClick={onNavigate}
              title={compact ? item.label : undefined}
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <Icon size={17} strokeWidth={2} aria-hidden="true" className="shrink-0" />
              <span className="sidebar-label whitespace-nowrap">{item.label}</span>
            </NavLink>
          )
        })}

        <div className="mt-auto pt-2">
          <NavLink
            to={PROFILE_NAV.to}
            onClick={onNavigate}
            title={compact ? PROFILE_NAV.label : undefined}
            className={({ isActive }) => navLinkClass(isActive)}
          >
            <PROFILE_NAV.icon size={17} strokeWidth={2} aria-hidden="true" className="shrink-0" />
            <span className="sidebar-label whitespace-nowrap">{PROFILE_NAV.label}</span>
          </NavLink>
        </div>
      </nav>

      <div className="border-t border-white/5 p-2.5">
        {compact ? (
          <div className="flex flex-col items-center gap-2">
            <Link
              to="/perfil"
              onClick={onNavigate}
              aria-label="Abrir perfil"
              title={user?.full_name || 'Perfil'}
              className="press grid size-8 place-items-center rounded-full bg-accent text-[11px] font-black text-accent-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {initials}
            </Link>
            <button
              type="button"
              onClick={() => void leave()}
              disabled={leaving}
              aria-label="Sair"
              title="Sair"
              className="press grid size-8 place-items-center rounded-lg border border-white/10 text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
            >
              {leaving ? (
                <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <LogOut size={16} aria-hidden="true" />
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-white/5 p-2">
            <Link
              to="/perfil"
              onClick={onNavigate}
              aria-label="Abrir perfil"
              className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl p-1 transition hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-[11px] font-black text-accent-ink">
                {initials}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-bold text-white">
                  {user?.full_name || 'Estudante'}
                </span>
                <span className="block truncate text-[10px] text-white/50">{user?.email ?? ''}</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => void leave()}
              disabled={leaving}
              className="press inline-flex shrink-0 items-center gap-1.5 rounded-lg px-1.5 py-1 text-[11px] font-bold text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
            >
              {leaving ? (
                <LoaderCircle size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <LogOut size={14} aria-hidden="true" />
              )}
              <span>{leaving ? 'Saindo…' : 'Sair'}</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
