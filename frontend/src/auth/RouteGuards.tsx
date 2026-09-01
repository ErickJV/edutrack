import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { PageLoader } from '../components/Feedback'
import { useAuth } from './AuthContext'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  if (!user.profile_complete) return <Navigate to="/completar-perfil" replace />
  return <Outlet />
}

export function ProfileCompletionRoute() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/entrar" replace />
  if (user.profile_complete) return <Navigate to="/home" replace />
  return <Outlet />
}

export function GuestRoute() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user) return <Navigate to={user.profile_complete ? '/home' : '/completar-perfil'} replace />
  return <Outlet />
}
