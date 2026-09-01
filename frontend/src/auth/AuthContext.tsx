import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { getSession, initializeAuth, logout as logoutRequest } from '../api/client'
import type { AuthUser } from '../api/types'

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  refresh: () => Promise<AuthUser | null>
  signOut: () => Promise<void>
  setUser: (user: AuthUser | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const sessionUser = await getSession()
    setUser(sessionUser)
    return sessionUser
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        await initializeAuth()
        const sessionUser = await getSession()
        if (active) setUser(sessionUser)
      } catch {
        if (active) setUser(null)
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const signOut = useCallback(async () => {
    await logoutRequest()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, refresh, signOut, setUser }),
    [user, loading, refresh, signOut],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return context
}
