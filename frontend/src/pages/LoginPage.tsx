import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError, login, setSessionPreference } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { AuthShell } from '../components/AuthShell'
import { Alert } from '../components/Feedback'
import { Input, PasswordInput, PrimaryButton } from '../components/FormControls'
import { Divider, GoogleButton } from '../components/GoogleButton'

export function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await login(email.trim().toLowerCase(), password)
      if (response.data?.user) {
        await setSessionPreference(remember)
        setUser(response.data.user)
        navigate(response.data.user.profile_complete ? '/home' : '/completar-perfil', { replace: true })
        return
      }
      if (response.data?.flows?.some((flow) => flow.id === 'verify_email' && flow.is_pending)) {
        sessionStorage.setItem('edutrack_pending_email', email)
        navigate('/verificar-email')
        return
      }
      setError('E-mail ou senha inválidos.')
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell eyebrow="Bem-vindo de volta" title="Entre na sua conta" description="Use seu e-mail institucional para continuar sua jornada no EduTrack.">
      <div className="space-y-5">
        <GoogleButton />
        {import.meta.env.VITE_GOOGLE_ENABLED === 'true' ? <Divider /> : null}
        {error ? <Alert>{error}</Alert> : null}
        <form className="space-y-5" onSubmit={submit} noValidate>
          <Input label="E-mail institucional" name="email" type="email" autoComplete="email" placeholder="seu.nome@aluno.impacta.edu.br" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <PasswordInput label="Senha" name="password" autoComplete="current-password" placeholder="Digite sua senha" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="size-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              Lembrar por 14 dias
            </label>
            <Link to="/esqueci-senha" className="min-h-11 py-3 text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline">Esqueci minha senha</Link>
          </div>
          <PrimaryButton loading={loading} type="submit">Entrar</PrimaryButton>
        </form>
        <p className="pt-2 text-center text-sm text-slate-600">
          Ainda não tem conta? <Link to="/cadastro" className="font-extrabold text-indigo-600 hover:underline">Cadastre-se</Link>
        </p>
      </div>
    </AuthShell>
  )
}
