import { Link } from 'react-router-dom'

export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 ${
        light ? 'focus-visible:outline-white' : 'focus-visible:outline-[#005063]'
      }`}
      aria-label="Impatrack Início"
    >
      <span
        className={`font-montserrat text-3xl font-extrabold tracking-tight sm:text-4xl ${
          light ? 'text-white' : 'text-[#0d3950] dark:text-white'
        }`}
      >
        Impa<span className={light ? 'text-white/90' : 'text-[#006768] dark:text-[#2dd4bf]'}>track</span>
      </span>
    </Link>
  )
}
