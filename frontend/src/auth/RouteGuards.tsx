import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { ClippitFloatingWidget } from '../components/clippit/ClippitFloatingWidget'
import { PageLoader } from '../components/Feedback'
import { MotionPresence } from '../components/MotionPresence'
import { useAuth } from './AuthContext'

export function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const allowed = Boolean(user?.profile_complete)
  return (
    <>
      <MotionPresence open={loading}>
        <PageLoader />
      </MotionPresence>
      {loading || !allowed ? null : (
        <>
          <Outlet />
          <ClippitFloatingWidget />
        </>
      )}
      {!loading && !user ? (
        <Navigate to="/entrar" replace state={{ from: location.pathname }} />
      ) : null}
      {!loading && user && !user.profile_complete ? <Navigate to="/completar-perfil" replace /> : null}
    </>
  )
}

export function ProfileCompletionRoute() {
  const { user, loading } = useAuth()
  const allowed = Boolean(user && !user.profile_complete)
  return (
    <>
      <MotionPresence open={loading}>
        <PageLoader />
      </MotionPresence>
      {!loading && allowed ? <Outlet /> : null}
      {!loading && !user ? <Navigate to="/entrar" replace /> : null}
      {!loading && user?.profile_complete ? <Navigate to="/home" replace /> : null}
    </>
  )
}

export function GuestRoute() {
  const { user, loading } = useAuth()
  return (
    <>
      <MotionPresence open={loading}>
        <PageLoader />
      </MotionPresence>
      {loading || user ? null : <Outlet />}
      {!loading && user ? (
        <Navigate to={user.profile_complete ? '/home' : '/completar-perfil'} replace />
      ) : null}
    </>
  )
}
