import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/home', label: 'Home' },
  { to: '/disciplinas', label: 'Disciplinas' },
  { to: '/professores', label: 'Professores' },
  { to: '/tarefas', label: 'Tarefas' },
  { to: '/estudo', label: 'Estudo' },
] as const

export function AppNavigation() {
  return (
    <nav aria-label="Navegação principal" className="w-full">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl px-4 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:focus-visible:outline-indigo-400 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 dark:bg-indigo-500'
                  : 'text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50'
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
