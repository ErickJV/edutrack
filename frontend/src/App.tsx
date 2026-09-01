import { Navigate, Route, Routes } from 'react-router-dom'

import { GuestRoute, ProfileCompletionRoute, ProtectedRoute } from './auth/RouteGuards'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { HomePage } from './pages/HomePage'
import { LegalPage } from './pages/LegalPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfileCompletionPage } from './pages/ProfileCompletionPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { SignupPage } from './pages/SignupPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'

export function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/entrar" element={<LoginPage />} />
        <Route path="/cadastro" element={<SignupPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha/:key" element={<ResetPasswordPage />} />
      </Route>
      <Route path="/verificar-email" element={<VerifyEmailPage />} />
      <Route path="/verificar-email/:key" element={<VerifyEmailPage />} />
      <Route element={<ProfileCompletionRoute />}>
        <Route path="/completar-perfil" element={<ProfileCompletionPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/home" element={<HomePage />} />
      </Route>
      <Route path="/termos" element={<LegalPage kind="terms" />} />
      <Route path="/privacidade" element={<LegalPage kind="privacy" />} />
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
