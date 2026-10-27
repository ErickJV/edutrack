import { GraduationCap, LogOut, Mail, RefreshCw, ShieldCheck, User as UserIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { ApiError, listCourseOfferings, updateProfile } from '../api/client'
import type { CourseOffering } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { AppNavigation } from '../components/AppNavigation'
import { Brand } from '../components/Brand'
import { Alert } from '../components/Feedback'
import { PrimaryButton, Select } from '../components/FormControls'
import { ThemeToggle } from '../components/ThemeToggle'

export function ProfilePage() {
  const { user, setUser, signOut } = useAuth()
  const [leaving, setLeaving] = useState(false)
  const [offerings, setOfferings] = useState<CourseOffering[]>([])
  const [selectedOfferingId, setSelectedOfferingId] = useState(user?.course_offering?.id || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (user?.course_offering?.id) {
      setSelectedOfferingId(user.course_offering.id)
    }
  }, [user?.course_offering?.id])

  useEffect(() => {
    let alive = true
    listCourseOfferings()
      .then((items) => {
        if (alive) setOfferings(items)
      })
      .catch(() => {
        if (alive) setError('Não foi possível carregar a lista de cursos disponíveis.')
      })
    return () => {
      alive = false
    }
  }, [])

  async function leave() {
    setLeaving(true)
    try {
      await signOut()
    } finally {
      setLeaving(false)
    }
  }

  async function handleCourseChange(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedOfferingId) {
      setError('Selecione uma graduação para atualizar o curso.')
      return
    }
    setSaving(true)
    setError('')
    setSuccessMessage('')
    try {
      const updatedUser = await updateProfile({
        course_offering_id: selectedOfferingId,
      })
      setUser(updatedUser)
      setSuccessMessage('Curso atualizado com sucesso!')
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Não foi possível alterar o curso.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-dvh bg-[#dce6ef] dark:bg-[#040f17]">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-[#005063]/30 dark:bg-[#081a26]/90">
        <div className="mx-auto max-w-6xl px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <Brand />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                type="button"
                aria-label="Sair"
                onClick={() => void leave()}
                disabled={leaving}
                className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold text-[#0d3950]/80 transition hover:bg-slate-100 hover:text-[#0d3950] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005063] disabled:opacity-50 dark:text-slate-300 dark:hover:bg-[#041019] dark:hover:text-white dark:focus-visible:outline-[#006768]"
              >
                <LogOut size={18} aria-hidden="true" />
                <span className="hidden sm:inline">{leaving ? 'Saindo…' : 'Sair'}</span>
              </button>
            </div>
          </div>
          <div className="mt-4">
            <AppNavigation />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-5 py-9 sm:px-8 sm:py-14">
        <section
          className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-[#005063]/30 dark:bg-[#081a26]"
          aria-labelledby="academic-profile"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#005063] dark:text-[#a8d5e5]">
                Perfil
              </p>
              <h1 id="academic-profile" className="mt-2 text-2xl font-black text-[#0d3950] dark:text-white">
                Informações pessoais e acadêmicas
              </h1>
            </div>
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#005063]/10 text-[#005063] dark:bg-[#005063]/30 dark:text-[#a8d5e5]">
              <GraduationCap size={24} aria-hidden="true" />
            </span>
          </div>

          <dl className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 sm:gap-8">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-[#005063]/20 dark:bg-[#041019]">
              <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <UserIcon size={15} aria-hidden="true" />
                Nome do aluno
              </dt>
              <dd className="mt-2 text-lg font-bold text-[#0d3950] dark:text-white">
                {user?.full_name || 'Não informado'}
              </dd>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-[#005063]/20 dark:bg-[#041019]">
              <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <Mail size={15} aria-hidden="true" />
                E-mail cadastrado
              </dt>
              <dd className="mt-2 break-all text-base font-bold text-[#0d3950] dark:text-white">
                {user?.email || 'Não informado'}
              </dd>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-[#005063]/20 dark:bg-[#041019]">
              <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <GraduationCap size={15} aria-hidden="true" />
                Nome do curso
              </dt>
              <dd className="mt-2 text-lg font-bold leading-6 text-[#0d3950] dark:text-white">
                {user?.course_offering?.course_name || 'Não selecionado'}
              </dd>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-[#005063]/20 dark:bg-[#041019]">
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Modalidade
              </dt>
              <dd className="mt-2 font-bold text-[#0d3950] dark:text-white">
                {user?.course_offering?.modality_label || '—'}
              </dd>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-[#005063]/20 dark:bg-[#041019]">
              <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <ShieldCheck size={15} aria-hidden="true" />
                Vínculo
              </dt>
              <dd className="mt-2 font-bold text-emerald-700 dark:text-emerald-400">
                Verificado
              </dd>
            </div>
          </dl>
        </section>

        <section
          className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-[#005063]/30 dark:bg-[#081a26]"
          aria-labelledby="change-course-heading"
        >
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-[#006768]/10 text-[#006768] dark:bg-[#006768]/30 dark:text-[#a8d5e5]">
              <RefreshCw size={20} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#006768] dark:text-[#a8d5e5]">
                Configuração acadêmica
              </p>
              <h2 id="change-course-heading" className="mt-1 text-xl font-black tracking-tight text-[#0d3950] dark:text-white">
                Alterar curso
              </h2>
            </div>
          </div>

          <form className="mt-6 max-w-xl space-y-5" onSubmit={handleCourseChange}>
            {error ? <Alert tone="error">{error}</Alert> : null}
            {successMessage ? <Alert tone="success">{successMessage}</Alert> : null}

            <Select
              label="Selecione a graduação e modalidade"
              name="course_offering"
              value={selectedOfferingId}
              onChange={(event) => {
                setSelectedOfferingId(event.target.value)
                setSuccessMessage('')
                setError('')
              }}
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

            <div className="sm:w-64">
              <PrimaryButton
                type="submit"
                loading={saving}
                disabled={!selectedOfferingId || selectedOfferingId === user?.course_offering?.id}
              >
                Salvar alteração de curso
              </PrimaryButton>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
