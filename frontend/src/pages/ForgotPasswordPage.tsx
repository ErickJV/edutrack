import { ArrowLeft, Mail } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { requestPasswordReset } from '../api/client'
import { AuthShell } from '../components/AuthShell'
import { Alert } from '../components/Feedback'
import { Input, PrimaryButton } from '../components/FormControls'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)
    try {
      await requestPasswordReset(email.trim().toLowerCase())
    } finally {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <AuthShell eyebrow="Recupere o acesso" title="Esqueceu sua senha?" description="Informe seu e-mail institucional. Se houver uma conta, enviaremos um link válido por uma hora.">
      {sent ? (
        <div className="space-y-6">
          <div className="grid size-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Mail size={28} aria-hidden="true" /></div>
          <Alert tone="success">Confira sua caixa de entrada e também a pasta de spam. Por segurança, mostramos esta mensagem mesmo quando o endereço não está cadastrado.</Alert>
          <Link to="/entrar" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 font-extrabold text-slate-800 hover:bg-slate-50"><ArrowLeft size={19} /> Voltar para o login</Link>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={submit}>
          <Input label="E-mail institucional" name="email" type="email" autoComplete="email" placeholder="seu.nome@aluno.impacta.edu.br" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <PrimaryButton loading={loading} type="submit">Enviar link de recuperação</PrimaryButton>
          <Link to="/entrar" className="flex min-h-11 items-center justify-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600"><ArrowLeft size={17} /> Voltar para o login</Link>
        </form>
      )}
    </AuthShell>
  )
}
