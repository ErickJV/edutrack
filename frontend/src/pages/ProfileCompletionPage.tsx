import { GraduationCap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError, completeProfile, listCourseOfferings } from '../api/client'
import type { CourseOffering } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { AuthShell } from '../components/AuthShell'
import { Alert } from '../components/Feedback'
import { Input, PasswordInput, PrimaryButton, Select } from '../components/FormControls'

export function ProfileCompletionPage() {
  const { user, setUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.full_name || '')
  const [offeringId, setOfferingId] = useState('')
  const [acceptLegal, setAcceptLegal] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [offerings, setOfferings] = useState<CourseOffering[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const needsPassword = !user?.has_usable_password

  useEffect(() => {
    listCourseOfferings()
      .then(setOfferings)
      .catch(() => setError('Não foi possível carregar as graduações.'))
  }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!offeringId || !acceptLegal || name.trim().length < 3) {
      setError('Preencha seu nome, escolha a graduação e aceite os documentos para continuar.')
      return
    }
    if (needsPassword) {
      if (password.length < 12) {
        setError('A senha deve ter no mínimo 12 caracteres.')
        return
      }
      if (password !== confirmation) {
        setError('As senhas não coincidem.')
        return
      }
    }
    setLoading(true)
    setError('')
    try {
      const profile = await completeProfile({
        full_name: name.trim(),
        course_offering_id: offeringId,
        accept_legal: acceptLegal,
        password: needsPassword ? password : undefined,
      })
      setUser(profile)
      navigate('/home', { replace: true })
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Não foi possível concluir seu perfil.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Concluir perfil"
      description="Selecione seu curso para carregar a matriz curricular e horários."
    >
      <form className="space-y-5" onSubmit={submit}>
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5 font-arial text-sm text-[#0d3950]">
          <GraduationCap size={22} className="shrink-0 text-[#006768]" aria-hidden="true" />
          <p>
            Conectado como <strong className="font-semibold text-[#0d3950]">{user?.email}</strong>
          </p>
        </div>
        {error ? <Alert>{error}</Alert> : null}
        <Input
          label="Nome completo"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <Select
          label="Graduação e modalidade"
          name="offering"
          value={offeringId}
          onChange={(event) => setOfferingId(event.target.value)}
          required
        >
          <option value="" className="bg-white text-[#0d3950]">
            Selecione sua graduação
          </option>
          {offerings.map((offering) => (
            <option key={offering.id} value={offering.id} className="bg-white text-[#0d3950]">
              {offering.label}
            </option>
          ))}
        </Select>
        {needsPassword ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <PasswordInput
              label="Crie uma senha de acesso"
              name="password"
              autoComplete="new-password"
              placeholder="Mínimo 12 caracteres"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              hint="Permite entrar no Impatrack sem depender de login social."
              required
            />
            <PasswordInput
              label="Confirme sua senha"
              name="confirmation"
              autoComplete="new-password"
              placeholder="Repita a senha"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
            />
          </div>
        ) : null}
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3.5 font-arial text-sm leading-6 text-[#0d3950]">
          <input
            type="checkbox"
            checked={acceptLegal}
            onChange={(event) => setAcceptLegal(event.target.checked)}
            className="mt-1 size-4 rounded border-slate-300 bg-white text-[#006768] focus:ring-1 focus:ring-[#005063]"
          />
          <span>
            Declaro que li e concordo com os{' '}
            <Link
              to="/termos"
              target="_blank"
              className="font-semibold text-[#005063] underline hover:text-[#0d3950]"
            >
              Termos de Uso
            </Link>{' '}
            e a{' '}
            <Link
              to="/privacidade"
              target="_blank"
              className="font-semibold text-[#005063] underline hover:text-[#0d3950]"
            >
              Política de Privacidade
            </Link>
            .
          </span>
        </label>
        <PrimaryButton type="submit" loading={loading}>
          Concluir perfil
        </PrimaryButton>
        <button
          type="button"
          onClick={() => void signOut()}
          className="min-h-10 w-full font-arial text-sm font-semibold text-slate-500 transition-colors hover:text-[#0d3950]"
        >
          Sair da conta
        </button>
      </form>
    </AuthShell>
  )
}
