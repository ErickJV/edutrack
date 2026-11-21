import type { ReactNode } from 'react'

import { usePresence } from '../utils/usePresence'

export function MotionPresence({ open, children }: { open: boolean; children: ReactNode }) {
  const { mounted, closing } = usePresence(open)
  if (!mounted) return null
  return (
    <div data-presence={closing ? 'closed' : 'open'} className="contents">
      {children}
    </div>
  )
}
