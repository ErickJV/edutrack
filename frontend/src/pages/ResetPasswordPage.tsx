import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { ApiError, resetPassword } from '../api/client'
import { AuthShell } from '../components/AuthShell'
import { Alert } from '../components/Feedback'
import { PasswordInput, PrimaryButton } from '../components/FormControls'

export function ResetPasswordPage() {
  const { key = '' } = useParams()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (password.length < 12) {
      setError('A nova senha precisa ter pelo menos 12 caracteres.')
      return
    }
    if (password !== confirmation) {
      setError('As senhas não coincidem.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await resetPassword(key, password)
      setComplete(true)
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Este link é inválido ou expirou. Solicite um novo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell eyebrow="Proteja sua conta" title={complete ? 'Senha atualizada' : 'Crie uma nova senha'} description={complete ? 'Sua nova senha já pode ser usada para entrar no EduTrack.' : 'Escolha uma senha longa, única e diferente das que você usa em outros serviços.'}>
      {complete ? (
        <div className="space-y-6">
          <div className="grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 size={30} aria-hidden="true" /></div>
          <Alert tone="success">A senha foi redefinida e as sessões anteriores deixaram de ser válidas.</Alert>
          <Link to="/entrar" className="flex min-h-12 w-full items-center justify-center rounded-xl bg-indigo-600 px-5 font-extrabold text-white hover:bg-indigo-700">Entrar com a nova senha</Link>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={submit}>
          {error ? <Alert>{error}</Alert> : null}
          <PasswordInput label="Nova senha" name="password" autoComplete="new-password" placeholder="Mínimo 12 caracteres" value={password} onChange={(event) => setPassword(event.target.value)} hint="Uma frase longa costuma ser mais fácil de lembrar." required />
          <PasswordInput label="Confirme a nova senha" name="confirmation" autoComplete="new-password" placeholder="Repita a nova senha" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
          <PrimaryButton loading={loading} type="submit">Salvar nova senha</PrimaryButton>
        </form>
      )}
    </AuthShell>
  )
}
