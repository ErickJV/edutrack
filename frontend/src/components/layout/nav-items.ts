import {
  BookOpen,
  Brain,
  CalendarDays,
  LayoutDashboard,
  ListTodo,
  NotebookPen,
  UserRound,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

export const PRIMARY_NAV: NavItem[] = [
  { to: '/home', label: 'Início', icon: LayoutDashboard },
  { to: '/calendario', label: 'Calendário', icon: CalendarDays },
  { to: '/tarefas', label: 'Tarefas', icon: ListTodo },
  { to: '/estudo', label: 'Anotações', icon: NotebookPen },
  { to: '/flashcards', label: 'Flashcards', icon: Brain },
  { to: '/disciplinas', label: 'Disciplinas', icon: BookOpen },
]

export const PROFILE_NAV: NavItem = { to: '/perfil', label: 'Perfil', icon: UserRound }

const PAGE_TITLES: Record<string, string> = {
  '/home': 'Início',
  '/calendario': 'Calendário',
  '/tarefas': 'Tarefas',
  '/estudo': 'Anotações',
  '/flashcards': 'Flashcards',
  '/disciplinas': 'Disciplinas',
  '/perfil': 'Perfil',
}

export const SIDEBAR_ID = 'app-sidebar'
export const MOBILE_SIDEBAR_ID = 'app-sidebar-mobile'

export function getPageTitle(pathname: string): string {
  const direct = PAGE_TITLES[pathname]
  if (direct) return direct
  const base = `/${pathname.split('/').filter(Boolean)[0] ?? ''}`
  return PAGE_TITLES[base] ?? 'Impatrack'
}
