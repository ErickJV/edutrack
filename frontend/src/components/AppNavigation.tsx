import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/home', label: 'Início' },
  { to: '/calendario', label: 'Calendário' },
  { to: '/tarefas', label: 'Tarefas' },
  { to: '/estudo', label: 'Anotações' },
  { to: '/flashcards', label: 'Flashcards' },
  { to: '/disciplinas', label: 'Disciplinas' },
  { to: '/perfil', label: 'Perfil', alignRight: true },
] as const

export function AppNavigation() {
  return (
    <nav aria-label="Navegação principal" className="w-full">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 p-2 dark:border-[#005063]/30 dark:bg-[#081a26]/70 backdrop-blur-md">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-4 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005063] ${
                'alignRight' in item && item.alignRight ? 'ml-auto' : ''
              } ${
                isActive
                  ? 'bg-[#0d3950] text-white shadow-md shadow-[#0d3950]/20 dark:bg-[#005063]'
                  : 'text-[#0d3950]/80 hover:bg-slate-100 hover:text-[#0d3950] dark:text-slate-300 dark:hover:bg-[#041019] dark:hover:text-white'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
