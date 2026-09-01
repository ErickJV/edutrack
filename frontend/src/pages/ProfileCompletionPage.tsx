import { GraduationCap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiError, completeProfile, listCourseOfferings } from '../api/client'
import type { CourseOffering } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { AuthShell } from '../components/AuthShell'
import { Alert } from '../components/Feedback'
import { Input, PrimaryButton, Select } from '../components/FormControls'

export function ProfileCompletionPage() {
  const { user, setUser, signOut } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState(user?.full_name || '')
  const [offeringId, setOfferingId] = useState('')
  const [acceptLegal, setAcceptLegal] = useState(false)
  const [offerings, setOfferings] = useState<CourseOffering[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    listCourseOfferings().then(setOfferings).catch(() => setError('Não foi possível carregar as graduações.'))
  }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!offeringId || !acceptLegal || name.trim().length < 3) {
      setError('Preencha seu nome, escolha a graduação e aceite os documentos para continuar.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const profile = await completeProfile({ full_name: name.trim(), course_offering_id: offeringId, accept_legal: acceptLegal })
      setUser(profile)
      navigate('/home', { replace: true })
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Não foi possível concluir seu perfil.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell eyebrow="Personalize seu acesso" title="Complete seu perfil" description="Precisamos dessas informações uma única vez para preparar o EduTrack para sua graduação.">
      <form className="space-y-5" onSubmit={submit}>
        <div className="flex items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
          <GraduationCap size={23} className="shrink-0 text-indigo-600" aria-hidden="true" />
          <p>Você entrou como <strong>{user?.email}</strong></p>
        </div>
        {error ? <Alert>{error}</Alert> : null}
        <Input label="Nome completo" name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required />
        <Select label="Graduação e modalidade" name="offering" value={offeringId} onChange={(event) => setOfferingId(event.target.value)} required>
          <option value="">Selecione uma opção</option>
          {offerings.map((offering) => <option key={offering.id} value={offering.id}>{offering.label}</option>)}
        </Select>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
          <input type="checkbox" checked={acceptLegal} onChange={(event) => setAcceptLegal(event.target.checked)} className="mt-1 size-4.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
          <span>Li e aceito os <Link to="/termos" target="_blank" className="font-bold text-indigo-600 hover:underline">Termos de Uso</Link> e a <Link to="/privacidade" target="_blank" className="font-bold text-indigo-600 hover:underline">Política de Privacidade</Link>.</span>
        </label>
        <PrimaryButton type="submit" loading={loading}>Concluir perfil</PrimaryButton>
        <button type="button" onClick={() => void signOut()} className="min-h-11 w-full text-sm font-bold text-slate-500 hover:text-rose-600">Sair desta conta</button>
      </form>
    </AuthShell>
  )
}
