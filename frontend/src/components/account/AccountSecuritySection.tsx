import { KeyRound, Mail, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

import {
  ApiError,
  addAccountEmail,
  changePassword,
  deleteAccountEmail,
  getAuthConfig,
  listAccountEmails,
  listSocialAccounts,
  resendAccountEmailVerification,
  verifyEmail,
} from '../../api/client'
import type { AccountEmail, SocialAccountProvider } from '../../api/types'
import { useAuth } from '../../auth/AuthContext'
import { Alert } from '../Feedback'
import { Input, PasswordInput, PrimaryButton } from '../FormControls'

const INSTITUTIONAL_DOMAIN = '@aluno.impacta.edu.br'
const MIN_PASSWORD_LENGTH = 12

type BusyAction = '' | 'email' | 'verify' | 'resend' | 'cancel' | 'password'

function messageFrom(reason: unknown, fallback: string, field?: string): string {
  if (reason instanceof ApiError) {
    if (field && reason.fieldErrors[field]) return reason.fieldErrors[field]
    return reason.message
  }
  return fallback
}

export function AccountSecuritySection() {
  const { user, setUser, refresh } = useAuth()
  const [emails, setEmails] = useState<AccountEmail[]>([])
  const [codeByEmail, setCodeByEmail] = useState(true)
  const [editingEmail, setEditingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [emailError, setEmailError] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [busy, setBusy] = useState<BusyAction>('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')

  const [providers, setProviders] = useState<SocialAccountProvider[]>([])

  useEffect(() => {
    let alive = true
    getAuthConfig()
      .then((config) => {
        if (!alive) return
        setCodeByEmail(config.account.email_verification_by_code_enabled)
      })
      .catch(() => undefined)
    listAccountEmails()
      .then((items) => {
        if (alive) setEmails(items)
      })
      .catch(() => undefined)
    listSocialAccounts()
      .then((items) => {
        if (alive) setProviders(items)
      })
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])

  const googleAccount = providers.find((item) => item.provider.id === 'google')
  const currentEmail =
    emails.find((item) => item.primary)?.email || user?.email || 'Não informado'

  async function submitNewEmail(event: React.FormEvent) {
    event.preventDefault()
    setEmailError('')
    setEmailMessage('')
    const candidate = newEmail.trim().toLowerCase()
    if (!candidate.endsWith(INSTITUTIONAL_DOMAIN)) {
      setEmailError(`Use um e-mail institucional terminado em ${INSTITUTIONAL_DOMAIN}.`)
      return
    }
    setBusy('email')
    try {
      const items = await addAccountEmail(candidate)
      setEmails(items)
      setPendingEmail(candidate)
      setEditingEmail(false)
      setNewEmail('')
      setEmailMessage(
        codeByEmail
          ? 'Enviamos um código de verificação para o novo e-mail. Informe o código abaixo.'
          : 'Enviamos um link de verificação para o novo e-mail. Abra o link e depois clique em “Já confirmei”.',
      )
    } catch (reason) {
      setEmailError(messageFrom(reason, 'Não foi possível solicitar a troca de e-mail.', 'email'))
    } finally {
      setBusy('')
    }
  }

  async function confirmCode(event: React.FormEvent) {
    event.preventDefault()
    setEmailError('')
    setEmailMessage('')
    if (verificationCode.length !== 6) {
      setEmailError('Digite os seis dígitos enviados para o novo e-mail.')
      return
    }
    setBusy('verify')
    try {
      const response = await verifyEmail(verificationCode)
      const updated = await refresh()
      if (!updated && !response.data?.user) {
        throw new ApiError('Não foi possível confirmar o novo e-mail.')
      }
      if (updated) setUser(updated)
      setEmails(await listAccountEmails())
      setPendingEmail('')
      setVerificationCode('')
      setEmailMessage('E-mail atualizado com sucesso.')
    } catch (reason) {
      setEmailError(messageFrom(reason, 'Código inválido ou expirado.', 'key'))
    } finally {
      setBusy('')
    }
  }

  async function confirmLink() {
    setEmailError('')
    setEmailMessage('')
    setBusy('verify')
    try {
      const items = await listAccountEmails()
      setEmails(items)
      const confirmed = pendingEmail
        ? items.find(
            (item) => item.email.toLowerCase() === pendingEmail && item.verified,
          )
        : undefined
      if (!confirmed) {
        setEmailError('Ainda não identificamos a confirmação. Abra o link e tente novamente.')
        return
      }
      await refresh()
      setPendingEmail('')
      setEmailMessage('E-mail atualizado com sucesso.')
    } catch (reason) {
      setEmailError(messageFrom(reason, 'Não foi possível confirmar o novo e-mail.'))
    } finally {
      setBusy('')
    }
  }

  async function resend() {
    setEmailError('')
    setEmailMessage('')
    setBusy('resend')
    try {
      await resendAccountEmailVerification(pendingEmail)
      setEmailMessage('Reenviamos a verificação para o novo e-mail.')
    } catch (reason) {
      setEmailError(messageFrom(reason, 'Aguarde antes de solicitar o reenvio.'))
    } finally {
      setBusy('')
    }
  }

  async function cancelChange() {
    setEmailError('')
    setEmailMessage('')
    setBusy('cancel')
    try {
      setEmails(await deleteAccountEmail(pendingEmail))
      setPendingEmail('')
      setVerificationCode('')
      setEmailMessage('Alteração de e-mail cancelada.')
    } catch (reason) {
      setEmailError(messageFrom(reason, 'Não foi possível cancelar a alteração.', 'email'))
    } finally {
      setBusy('')
    }
  }

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault()
    setPasswordError('')
    setPasswordMessage('')
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordError(`A nova senha precisa ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`)
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.')
      return
    }
    setBusy('password')
    try {
      const updated = await changePassword(
        user?.has_usable_password ? currentPassword : '',
        newPassword,
      )
      setUser(updated)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordMessage(
        user?.has_usable_password ? 'Senha alterada com sucesso.' : 'Senha definida com sucesso.',
      )
    } catch (reason) {
      setPasswordError(messageFrom(reason, 'Não foi possível atualizar a senha.', 'current_password'))
    } finally {
      setBusy('')
    }
  }

  return (
    <section
      className="rounded-[18px] border border-slate-200/80 bg-white p-4 shadow-sm sm:p-[17px] dark:border-[#005063]/30 dark:bg-[#081a26]"
      aria-labelledby="account-security-heading"
    >
      <div className="flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-2xl bg-[#005063]/10 text-[#005063] dark:bg-[#005063]/30 dark:text-[#a8d5e5]">
          <ShieldCheck size={17} aria-hidden="true" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#005063] dark:text-[#a8d5e5]">
            Segurança
          </p>
          <h2
            id="account-security-heading"
            className="mt-1 text-[17px] font-black tracking-tight text-[#0d3950] dark:text-white"
          >
            Conta e segurança
          </h2>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              E-mail de acesso
            </p>
            <p className="mt-1 flex items-center gap-2 break-all text-[13px] font-bold text-[#0d3950] dark:text-white">
              <Mail size={14} aria-hidden="true" className="shrink-0 text-[#005063]" />
              {currentEmail}
            </p>
          </div>

          {emailError ? <Alert tone="error">{emailError}</Alert> : null}
          {emailMessage ? <Alert tone="success">{emailMessage}</Alert> : null}

          {pendingEmail ? (
            <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/30 dark:bg-amber-500/10">
              <p className="text-[13px] font-semibold text-amber-900 dark:text-amber-200">
                Alteração pendente para <span className="break-all">{pendingEmail}</span>
              </p>
              {codeByEmail ? (
                <form className="space-y-4" onSubmit={confirmCode}>
                  <Input
                    label="Código de verificação"
                    name="email_code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={verificationCode}
                    onChange={(event) =>
                      setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                  />
                  <PrimaryButton type="submit" loading={busy === 'verify'} disabled={busy !== ''}>
                    Confirmar código
                  </PrimaryButton>
                </form>
              ) : (
                <PrimaryButton
                  type="button"
                  loading={busy === 'verify'}
                  disabled={busy !== ''}
                  onClick={() => void confirmLink()}
                >
                  Já confirmei
                </PrimaryButton>
              )}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void resend()}
                  disabled={busy !== ''}
                  className="min-h-9 rounded-lg px-2 text-[11px] font-bold text-[#005063] underline transition hover:text-[#0d3950] disabled:opacity-50 dark:text-[#a8d5e5]"
                >
                  Reenviar verificação
                </button>
                <button
                  type="button"
                  onClick={() => void cancelChange()}
                  disabled={busy !== ''}
                  className="min-h-9 rounded-lg px-2 text-[11px] font-bold text-rose-700 underline transition hover:text-rose-900 disabled:opacity-50 dark:text-rose-300"
                >
                  Cancelar alteração
                </button>
              </div>
            </div>
          ) : editingEmail ? (
            <form className="space-y-4" onSubmit={submitNewEmail}>
              <Input
                label="Novo e-mail institucional"
                name="new_email"
                type="email"
                autoComplete="email"
                hint={`Somente endereços ${INSTITUTIONAL_DOMAIN}`}
                value={newEmail}
                onChange={(event) => setNewEmail(event.target.value)}
                required
              />
              <div className="flex flex-wrap gap-3">
                <PrimaryButton type="submit" loading={busy === 'email'} disabled={busy !== ''}>
                  Enviar verificação
                </PrimaryButton>
                <button
                  type="button"
                  onClick={() => {
                    setEditingEmail(false)
                    setNewEmail('')
                    setEmailError('')
                    setEmailMessage('')
                  }}
                  className="min-h-9 rounded-xl px-3 text-[11px] font-bold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#041019]"
                >
                  Voltar
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setEditingEmail(true)
                setEmailError('')
                setEmailMessage('')
              }}
              className="min-h-9 rounded-xl border border-[#005063]/30 px-3 text-[11px] font-bold text-[#005063] transition hover:bg-[#005063]/10 dark:border-[#005063]/50 dark:text-[#a8d5e5]"
            >
              Alterar e-mail
            </button>
          )}

          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-[#005063]/20 dark:bg-[#041019]">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <KeyRound size={13} aria-hidden="true" />
              Conta Google
            </p>
            <p className="mt-1.5 text-[13px] font-bold text-[#0d3950] dark:text-white">
              {googleAccount ? `Conectada · ${googleAccount.display}` : 'Não vinculada'}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-[15px] font-black text-[#0d3950] dark:text-white">
            {user?.has_usable_password ? 'Alterar senha' : 'Definir senha de acesso'}
          </h3>
          <p className="mt-1 text-[13px] text-slate-500 dark:text-slate-400">
            {user?.has_usable_password
              ? 'Informe a senha atual e escolha uma nova com pelo menos 12 caracteres.'
              : 'Sua conta foi criada com o Google. Defina uma senha para entrar também por e-mail.'}
          </p>

          <form className="mt-4 space-y-4" onSubmit={submitPassword}>
            {passwordError ? <Alert tone="error">{passwordError}</Alert> : null}
            {passwordMessage ? <Alert tone="success">{passwordMessage}</Alert> : null}

            {user?.has_usable_password ? (
              <PasswordInput
                label="Senha atual"
                name="current_password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            ) : null}

            <PasswordInput
              label="Nova senha"
              name="new_password"
              autoComplete="new-password"
              hint={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
            <PasswordInput
              label="Confirmar nova senha"
              name="confirm_password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />

            <div className="sm:w-64">
              <PrimaryButton type="submit" loading={busy === 'password'} disabled={busy !== ''}>
                Salvar senha
              </PrimaryButton>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
