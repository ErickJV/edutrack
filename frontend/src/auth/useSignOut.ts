import { useCallback, useState } from 'react'

import { useAuth } from './AuthContext'
import { clearExitTransition, runExitTransition } from '../utils/motion'

/** Encerra a sessão com a transição de saída, limpando o estado em caso de erro. */
export function useSignOut() {
  const { signOut } = useAuth()
  const [leaving, setLeaving] = useState(false)

  const leave = useCallback(async () => {
    setLeaving(true)
    await runExitTransition()
    try {
      await signOut()
    } catch {
      clearExitTransition()
    } finally {
      setLeaving(false)
    }
  }, [signOut])

  return { leave, leaving }
}
