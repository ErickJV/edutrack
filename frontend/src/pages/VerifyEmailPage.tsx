import { MailCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError, resendVerification, verifyEmail } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { AuthShell } from '../components/AuthShell'
import { Alert } from '../components/Feedback'
import { Input, PrimaryButton } from '../components/FormControls'

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const email = sessionStorage.getItem('edutrack_pending_email') || 'seu e-mail institucional'
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [seconds, setSeconds] = useState(60)

  useEffect(() => {
    if (seconds <= 0) return
    const timer = window.setInterval(() => setSeconds((value) => value - 1), 1000)
    return () => window.clearInterval(timer)
  }, [seconds])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (code.length !== 6) {
      setError('Digite os seis dígitos enviados por e-mail.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const response = await verifyEmail(code)
      if (response.data?.user) {
        sessionStorage.removeItem('edutrack_pending_email')
        setUser(response.data.user)
        navigate(response.data.user.profile_complete ? '/home' : '/completar-perfil', { replace: true })
      }
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Código inválido ou expirado.')
      setCode('')
      inputRef.current?.focus()
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    setError('')
    setMessage('')
    try {
      await resendVerification()
      setMessage('Enviamos um novo código. Confira sua caixa de entrada.')
      setSeconds(60)
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Aguarde antes de solicitar outro código.')
    }
  }

  return (
    <AuthShell eyebrow="Última etapa" title="Confirme seu e-mail" description="Digite o código de seis dígitos que enviamos para seu endereço institucional.">
      <div className="space-y-6">
        <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-indigo-900">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm"><MailCheck size={22} aria-hidden="true" /></span>
          <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-indigo-500">Código enviado para</p><p className="truncate font-bold">{email}</p></div>
        </div>
        {error ? <Alert>{error}</Alert> : null}
        {message ? <Alert tone="success">{message}</Alert> : null}
        <form className="space-y-5" onSubmit={submit}>
          <Input ref={inputRef} label="Código de verificação" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6} placeholder="000000" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} className="text-center text-2xl font-black tracking-[0.45em]" autoFocus required />
          <PrimaryButton loading={loading} type="submit">Confirmar e continuar</PrimaryButton>
        </form>
        <div className="text-center text-sm text-slate-600">
          Não recebeu?{' '}
          <button type="button" disabled={seconds > 0} onClick={() => void resend()} className="min-h-11 px-1 font-extrabold text-indigo-600 hover:underline disabled:text-slate-400">
            {seconds > 0 ? `Reenviar em ${seconds}s` : 'Reenviar código'}
          </button>
        </div>
        <p className="text-center text-sm"><Link to="/cadastro" className="font-bold text-slate-600 hover:text-indigo-600">Usar outro e-mail</Link></p>
      </div>
    </AuthShell>
  )
}
