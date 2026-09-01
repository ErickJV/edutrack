import { BookOpenCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="inline-flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300">
      <span className={`grid size-11 place-items-center rounded-2xl shadow-lg ${light ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white'}`}>
        <BookOpenCheck aria-hidden="true" size={24} strokeWidth={2.2} />
      </span>
      <span className={`text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-950'}`}>
        Edu<span className={light ? 'text-cyan-300' : 'text-indigo-600'}>Track</span>
      </span>
    </Link>
  )
}
