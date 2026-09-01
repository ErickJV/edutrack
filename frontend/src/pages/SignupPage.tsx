import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError, listCourseOfferings, signUp } from '../api/client'
import type { CourseOffering } from '../api/types'
import { AuthShell } from '../components/AuthShell'
import { Alert } from '../components/Feedback'
import { Input, PasswordInput, PrimaryButton, Select } from '../components/FormControls'

type FormState = {
  fullName: string
  email: string
  offering: string
  password: string
  confirmation: string
  acceptLegal: boolean
}

const initialForm: FormState = { fullName: '', email: '', offering: '', password: '', confirmation: '', acceptLegal: false }

export function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [offerings, setOfferings] = useState<CourseOffering[]>([])
  const [loadingOfferings, setLoadingOfferings] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    listCourseOfferings()
      .then(setOfferings)
      .catch(() => setError('Não foi possível carregar as graduações. Atualize a página.'))
      .finally(() => setLoadingOfferings(false))
  }, [])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => ({ ...current, [key]: '' }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    const localErrors: Record<string, string> = {}
    if (form.fullName.trim().length < 3) localErrors.fullName = 'Informe seu nome completo.'
    if (!form.email.toLowerCase().endsWith('@aluno.impacta.edu.br')) localErrors.email = 'Use seu e-mail institucional da Impacta.'
    if (!form.offering) localErrors.offering = 'Selecione sua graduação e modalidade.'
    if (form.password.length < 12) localErrors.password = 'Use pelo menos 12 caracteres.'
    if (form.password !== form.confirmation) localErrors.confirmation = 'As senhas não coincidem.'
    if (!form.acceptLegal) localErrors.acceptLegal = 'Você precisa aceitar os documentos para continuar.'
    if (Object.keys(localErrors).length) {
      setFieldErrors(localErrors)
      return
    }
    setLoading(true)
    setError('')
    try {
      await signUp({
        full_name: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        course_offering_id: form.offering,
        password: form.password,
        accept_legal: form.acceptLegal,
      })
      sessionStorage.setItem('edutrack_pending_email', form.email.trim().toLowerCase())
      navigate('/verificar-email')
    } catch (reason) {
      if (reason instanceof ApiError) {
        setError(reason.message)
        setFieldErrors({
          fullName: reason.fieldErrors.full_name || '',
          email: reason.fieldErrors.email || '',
          offering: reason.fieldErrors.course_offering_id || '',
          password: reason.fieldErrors.password || '',
          acceptLegal: reason.fieldErrors.accept_legal || '',
        })
      } else setError('Não foi possível criar sua conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell eyebrow="Comece por aqui" title="Crie sua conta" description="Leva menos de dois minutos. Você precisará confirmar seu e-mail institucional.">
      <form className="space-y-5" onSubmit={submit} noValidate>
        {error ? <Alert>{error}</Alert> : null}
        <Input label="Nome completo" name="fullName" autoComplete="name" placeholder="Como você quer ser chamado" value={form.fullName} onChange={(event) => update('fullName', event.target.value)} error={fieldErrors.fullName} required />
        <Input label="E-mail institucional" name="email" type="email" autoComplete="email" placeholder="seu.nome@aluno.impacta.edu.br" value={form.email} onChange={(event) => update('email', event.target.value)} error={fieldErrors.email} required />
        <Select label="Graduação e modalidade" name="offering" value={form.offering} onChange={(event) => update('offering', event.target.value)} error={fieldErrors.offering} disabled={loadingOfferings} required>
          <option value="">{loadingOfferings ? 'Carregando graduações…' : 'Selecione uma opção'}</option>
          {offerings.map((offering) => <option key={offering.id} value={offering.id}>{offering.label}</option>)}
        </Select>
        <div className="grid gap-5 sm:grid-cols-2">
          <PasswordInput label="Senha" name="password" autoComplete="new-password" placeholder="Mínimo 12 caracteres" value={form.password} onChange={(event) => update('password', event.target.value)} error={fieldErrors.password} hint="Use uma frase longa e única." required />
          <PasswordInput label="Confirme a senha" name="confirmation" autoComplete="new-password" placeholder="Repita a senha" value={form.confirmation} onChange={(event) => update('confirmation', event.target.value)} error={fieldErrors.confirmation} required />
        </div>
        <div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
            <input type="checkbox" checked={form.acceptLegal} onChange={(event) => update('acceptLegal', event.target.checked)} className="mt-1 size-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <span>Li e aceito os <Link to="/termos" target="_blank" className="font-bold text-indigo-600 hover:underline">Termos de Uso</Link> e a <Link to="/privacidade" target="_blank" className="font-bold text-indigo-600 hover:underline">Política de Privacidade</Link>.</span>
          </label>
          {fieldErrors.acceptLegal ? <p className="mt-1.5 text-sm font-medium text-rose-600">{fieldErrors.acceptLegal}</p> : null}
        </div>
        <PrimaryButton type="submit" loading={loading}>Criar minha conta</PrimaryButton>
        <p className="text-center text-sm text-slate-600">Já tem uma conta? <Link to="/entrar" className="font-extrabold text-indigo-600 hover:underline">Entrar</Link></p>
      </form>
    </AuthShell>
  )
}
