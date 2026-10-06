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
    <AuthShell
      title="Recuperar senha"
      description="Informe seu e-mail institucional para receber o link de redefinição."
    >
      {sent ? (
        <div className="space-y-6">
          <div className="grid size-12 place-items-center rounded-xl bg-[#006768]/10 text-[#006768]">
            <Mail size={24} aria-hidden="true" />
          </div>
          <Alert tone="success">
            Se o endereço estiver cadastrado, você receberá um link com as instruções para definir uma nova senha.
          </Alert>
          <Link
            to="/entrar"
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 font-arial font-semibold text-[#0d3950] shadow-xs transition-colors hover:bg-slate-50"
          >
            <ArrowLeft size={18} /> Voltar para o login
          </Link>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={submit}>
          <Input
            label="E-mail institucional"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="seu.nome@aluno.impacta.edu.br"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <PrimaryButton loading={loading} type="submit">
            Enviar instruções
          </PrimaryButton>
          <Link
            to="/entrar"
            className="flex min-h-11 items-center justify-center gap-2 font-arial text-sm font-semibold text-[#005063] transition-colors hover:text-[#0d3950] hover:underline"
          >
            <ArrowLeft size={16} /> Voltar para o login
          </Link>
        </form>
      )}
    </AuthShell>
  )
}
