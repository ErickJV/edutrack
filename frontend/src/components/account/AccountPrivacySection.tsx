import { Download, Laptop, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  ApiError,
  deleteAccount,
  downloadProfileExport,
  endAccountSessions,
  listAccountSessions,
} from '../../api/client'
import type { AccountSession } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { clearExitTransition, runExitTransition } from '../../utils/motion'
import { Alert } from '../Feedback'
import { Input, PasswordInput, PrimaryButton } from '../FormControls'

function formatSessionDate(timestamp: number): string {
  if (!timestamp) return '—'
  return new Date(timestamp * 1000).toLocaleString('pt-BR')
}

export function AccountPrivacySection() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<AccountSession[]>([])
  const [sessionsError, setSessionsError] = useState('')
  const [sessionsMessage, setSessionsMessage] = useState('')
  const [busy, setBusy] = useState<'' | 'sessions' | 'export' | 'delete'>('')
  const [exportError, setExportError] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [password, setPassword] = useState('')
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    let alive = true
    listAccountSessions()
      .then((items) => {
        if (alive) setSessions(items)
      })
      .catch(() => {
        if (alive) setSessionsError('Não foi possível carregar suas sessões ativas.')
      })
    return () => {
      alive = false
    }
  }, [])

  async function endOtherSessions() {
    setSessionsError('')
    setSessionsMessage('')
    const ids = sessions.filter((item) => !item.is_current).map((item) => item.id)
    if (ids.length === 0) {
      setSessionsMessage('Nenhuma outra sessão para encerrar.')
      return
    }
    setBusy('sessions')
    try {
      setSessions(await endAccountSessions(ids))
      setSessionsMessage('Outras sessões encerradas.')
    } catch (reason) {
      setSessionsError(
        reason instanceof ApiError
          ? reason.message
          : 'Não foi possível encerrar as outras sessões.',
      )
    } finally {
      setBusy('')
    }
  }

  async function downloadExport() {
    setExportError('')
    setBusy('export')
    try {
      const blob = await downloadProfileExport()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'impatrack-dados.json'
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch (reason) {
      setExportError(
        reason instanceof ApiError
          ? reason.message
          : 'Não foi possível gerar a exportação dos seus dados.',
      )
    } finally {
      setBusy('')
    }
  }

  async function submitDelete(event: React.FormEvent) {
    event.preventDefault()
    setDeleteError('')
    if (confirmation.trim().toUpperCase() !== 'EXCLUIR') {
      setDeleteError('Digite EXCLUIR para confirmar a exclusão.')
      return
    }
    const confirmed = window.confirm(
      'Excluir sua conta apaga permanentemente seus dados acadêmicos, anotações e documentos. Deseja continuar?',
    )
    if (!confirmed) return
    setBusy('delete')
    try {
      await deleteAccount({
        confirmation: confirmation.trim().toUpperCase(),
        password: user?.has_usable_password ? password : undefined,
      })
      await runExitTransition()
      setUser(null)
      navigate('/entrar', { replace: true })
    } catch (reason) {
      clearExitTransition()
      setDeleteError(
        reason instanceof ApiError ? reason.message : 'Não foi possível excluir a conta.',
      )
    } finally {
      setBusy('')
    }
  }

  return (
    <section
      className="rounded-[2rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8 dark:border-[#005063]/30 dark:bg-[#081a26]"
      aria-labelledby="account-privacy-heading"
    >
      <div className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-[#006768]/10 text-[#006768] dark:bg-[#006768]/30 dark:text-[#a8d5e5]">
          <Laptop size={20} aria-hidden="true" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#006768] dark:text-[#a8d5e5]">
            Privacidade
          </p>
          <h2
            id="account-privacy-heading"
            className="mt-1 text-xl font-black tracking-tight text-[#0d3950] dark:text-white"
          >
            Privacidade e sessões
          </h2>
        </div>
      </div>

      <div className="mt-7 space-y-8">
        <div>
          <h3 className="text-base font-black text-[#0d3950] dark:text-white">Sessões ativas</h3>
          {sessionsError ? (
            <div className="mt-3">
              <Alert tone="error">{sessionsError}</Alert>
            </div>
          ) : null}
          {sessionsMessage ? (
            <div className="mt-3">
              <Alert tone="success">{sessionsMessage}</Alert>
            </div>
          ) : null}
          <ul className="mt-4 space-y-3">
            {sessions.length === 0 ? (
              <li className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 text-sm font-semibold text-slate-500 dark:border-[#005063]/20 dark:bg-[#041019] dark:text-slate-400">
                Nenhuma sessão registrada.
              </li>
            ) : (
              sessions.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-[#005063]/20 dark:bg-[#041019]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-[#0d3950] dark:text-white">
                      {item.is_current ? 'Este dispositivo' : 'Outro dispositivo'}
                    </p>
                    {item.is_current ? (
                      <span className="rounded-full bg-[#006768]/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-[#005063] dark:bg-[#006768]/30 dark:text-[#a8d5e5]">
                        Sessão atual
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 break-all text-xs font-medium text-slate-500 dark:text-slate-400">
                    {item.user_agent || 'Navegador desconhecido'}
                  </p>
                  <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    IP {item.ip || '—'} · desde {formatSessionDate(item.created_at)}
                  </p>
                </li>
              ))
            )}
          </ul>
          <div className="mt-4 sm:w-72">
            <PrimaryButton
              type="button"
              loading={busy === 'sessions'}
              disabled={busy !== ''}
              onClick={() => void endOtherSessions()}
            >
              Encerrar outras sessões
            </PrimaryButton>
          </div>
        </div>

        <div className="border-t border-slate-200/80 pt-6 dark:border-[#005063]/20">
          <h3 className="text-base font-black text-[#0d3950] dark:text-white">
            Exportar meus dados
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Baixe um arquivo JSON com sua conta, disciplinas, tarefas, anotações, flashcards e
            metadados dos documentos.
          </p>
          {exportError ? (
            <div className="mt-3">
              <Alert tone="error">{exportError}</Alert>
            </div>
          ) : null}
          <div className="mt-4 sm:w-72">
            <PrimaryButton
              type="button"
              loading={busy === 'export'}
              disabled={busy !== ''}
              onClick={() => void downloadExport()}
            >
              <Download size={18} aria-hidden="true" />
              Baixar meus dados (JSON)
            </PrimaryButton>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5 dark:border-rose-500/30 dark:bg-rose-500/10">
          <div className="flex items-center gap-2">
            <Trash2 size={18} aria-hidden="true" className="text-rose-700 dark:text-rose-300" />
            <h3 className="text-base font-black text-rose-800 dark:text-rose-200">
              Zona de perigo
            </h3>
          </div>
          <p className="mt-2 text-sm font-medium text-rose-800/80 dark:text-rose-200/80">
            A exclusão é permanente: apaga seu perfil, disciplinas, tarefas, anotações,
            flashcards e documentos. Não há como desfazer.
          </p>
          <form className="mt-4 space-y-4" onSubmit={submitDelete}>
            {deleteError ? <Alert tone="error">{deleteError}</Alert> : null}
            <Input
              label="Digite EXCLUIR para confirmar"
              name="delete_confirmation"
              autoComplete="off"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              required
            />
            {user?.has_usable_password ? (
              <PasswordInput
                label="Senha atual"
                name="delete_password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            ) : null}
            <div className="sm:w-64">
              <PrimaryButton type="submit" loading={busy === 'delete'} disabled={busy !== ''}>
                Excluir minha conta
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
