import { useId } from 'react'
import { Link } from 'react-router-dom'

export function Brand({ light = false }: { light?: boolean }) {
  const gradientId = `impatrack-tile-${useId().replace(/:/g, '')}`
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2.5 rounded-xl sm:gap-3 focus-visible:outline-2 focus-visible:outline-offset-4 ${
        light ? 'focus-visible:outline-white' : 'focus-visible:outline-[#005063]'
      }`}
      aria-label="Impatrack Início"
    >
      <svg
        viewBox="0 0 64 64"
        className="h-12 w-12 shrink-0 sm:h-14 sm:w-14"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0d3950" />
            <stop offset="100%" stopColor="#006768" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill={`url(#${gradientId})`} />
        <circle
          cx="32"
          cy="32"
          r="19"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.5"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="78 41"
          transform="rotate(-40 32 32)"
        />
        <polygon points="36,12 20,36 30,36 26,52 44,28 32,28" fill="#ffffff" />
        <circle cx="13.6" cy="27.1" r="3.2" fill="#2dd4bf" />
      </svg>
      <span
        className={`font-montserrat text-xl font-extrabold tracking-tight sm:text-2xl ${
          light ? 'text-white' : 'text-[#0d3950] dark:text-white'
        }`}
      >
        Impatrack
      </span>
    </Link>
  )
}
