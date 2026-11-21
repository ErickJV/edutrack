import { Link } from 'react-router-dom'

export function Brand({ light = false, showMark = false }: { light?: boolean; showMark?: boolean }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 ${
        light ? 'focus-visible:outline-white' : 'focus-visible:outline-[#005063]'
      }`}
      aria-label="Impatrack Início"
    >
      {showMark ? (
        <img src="/favicon.svg" alt="" className="size-9 rounded-xl ring-1 ring-white/10" />
      ) : null}
      <span
        className={`brand-word -mr-[0.06em] font-montserrat text-base leading-none font-extrabold tracking-[0.06em] uppercase sm:-mr-[0.08em] sm:text-2xl sm:tracking-[0.08em] ${
          showMark ? 'ml-2.5' : ''
        } ${light ? 'text-white' : 'text-[#0d3950] dark:text-white'}`}
      >
        impatrack
      </span>
    </Link>
  )
}
