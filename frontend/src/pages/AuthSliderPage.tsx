import { Eye, EyeOff, GraduationCap, LoaderCircle, Lock, Mail, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { ApiError, getCsrfToken, googleLoginAction, listCourseOfferings, login, setSessionPreference, signUp } from '../api/client'
import type { CourseOffering } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { Brand } from '../components/Brand'
import { Alert } from '../components/Feedback'
import { ThemeToggle } from '../components/ThemeToggle'

export function AuthSliderPage({ initialMode }: { initialMode?: 'login' | 'signup' }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { setUser } = useAuth()

  // Derive mode directly from location
  const isSignUp = initialMode ? initialMode === 'signup' : location.pathname === '/cadastro'

  function toggleMode(targetSignUp: boolean) {
    navigate(targetSignUp ? '/cadastro' : '/entrar')
  }

  // --- LOGIN STATE ---
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginShowPassword, setLoginShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  async function handleLoginSubmit(event: React.FormEvent) {
    event.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const response = await login(loginEmail.trim().toLowerCase(), loginPassword)
      if (response.data?.user) {
        await setSessionPreference(remember)
        setUser(response.data.user)
        navigate(response.data.user.profile_complete ? '/home' : '/completar-perfil', { replace: true })
        return
      }
      if (response.data?.flows?.some((flow) => flow.id === 'verify_email' && flow.is_pending)) {
        sessionStorage.setItem('edutrack_pending_email', loginEmail)
        navigate('/verificar-email')
        return
      }
      setLoginError('E-mail ou senha inválidos.')
    } catch (reason) {
      setLoginError(reason instanceof ApiError ? reason.message : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setLoginLoading(false)
    }
  }

  // --- SIGNUP STATE ---
  const [fullName, setFullName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [offering, setOffering] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [signupShowPassword, setSignupShowPassword] = useState(false)
  const [acceptLegal, setAcceptLegal] = useState(false)
  const [offerings, setOfferings] = useState<CourseOffering[]>([])
  const [loadingOfferings, setLoadingOfferings] = useState(true)
  const [signupLoading, setSignupLoading] = useState(false)
  const [signupError, setSignupError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    listCourseOfferings()
      .then(setOfferings)
      .catch(() => setSignupError('Não foi possível carregar as graduações.'))
      .finally(() => setLoadingOfferings(false))
  }, [])

  async function handleSignupSubmit(event: React.FormEvent) {
    event.preventDefault()
    const localErrors: Record<string, string> = {}
    if (fullName.trim().length < 3) localErrors.fullName = 'Informe seu nome completo.'
    if (!signupEmail.toLowerCase().endsWith('@aluno.impacta.edu.br'))
      localErrors.email = 'Use seu e-mail institucional da Impacta.'
    if (!offering) localErrors.offering = 'Selecione sua graduação.'
    if (signupPassword.length < 12) localErrors.password = 'Mínimo de 12 caracteres.'
    if (signupPassword !== confirmation) localErrors.confirmation = 'As senhas não coincidem.'
    if (!acceptLegal) localErrors.acceptLegal = 'Aceite os termos para continuar.'

    if (Object.keys(localErrors).length) {
      setFieldErrors(localErrors)
      return
    }

    setSignupLoading(true)
    setSignupError('')
    try {
      await signUp({
        full_name: fullName.trim(),
        email: signupEmail.trim().toLowerCase(),
        course_offering_id: offering,
        password: signupPassword,
        accept_legal: acceptLegal,
      })
      sessionStorage.setItem('edutrack_pending_email', signupEmail.trim().toLowerCase())
      navigate('/verificar-email')
    } catch (reason) {
      if (reason instanceof ApiError) {
        setSignupError(reason.message)
        setFieldErrors({
          fullName: reason.fieldErrors.full_name || '',
          email: reason.fieldErrors.email || '',
          offering: reason.fieldErrors.course_offering_id || '',
          password: reason.fieldErrors.password || '',
          acceptLegal: reason.fieldErrors.accept_legal || '',
        })
      } else {
        setSignupError('Não foi possível criar sua conta. Tente novamente.')
      }
    } finally {
      setSignupLoading(false)
    }
  }

  const googleEnabled = import.meta.env.VITE_GOOGLE_ENABLED === 'true'

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center bg-[#dce6ef] dark:bg-[#030d14] p-4 sm:p-6 lg:p-8 transition-colors duration-500">
      {/* Top-right Minimalist Theme Toggle */}
      <div className="fixed right-4 top-4 z-50 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      {/* Main Sliding Card Container */}
      <div className="w-full max-w-4xl">
        <div className="relative min-h-[620px] w-full overflow-hidden rounded-3xl bg-white dark:bg-[#081a26] border border-slate-200/80 dark:border-white/10 shadow-2xl dark:shadow-black/90 transition-colors duration-500">
          
          {/* Mobile Tab Header (< sm screens) */}
          <div className="flex border-b border-slate-100 dark:border-white/10 sm:hidden">
            <button
              type="button"
              onClick={() => toggleMode(false)}
              className={`flex-1 py-4 text-center font-montserrat text-sm font-bold transition-colors ${
                !isSignUp
                  ? 'border-b-2 border-[#006768] text-[#0d3950] dark:text-white'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => toggleMode(true)}
              className={`flex-1 py-4 text-center font-montserrat text-sm font-bold transition-colors ${
                isSignUp
                  ? 'border-b-2 border-[#006768] text-[#0d3950] dark:text-white'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              Cadastre-se
            </button>
          </div>

          {/* ============================================================ */}
          {/* FORM CONTAINER 1: SIGN IN (LOGIN)                            */}
          {/* ============================================================ */}
          <div
            className={`absolute top-0 left-0 flex h-full w-full flex-col justify-center px-6 py-8 sm:w-1/2 sm:px-10 lg:px-12 transition-all duration-700 ease-in-out ${
              isSignUp
                ? 'pointer-events-none opacity-0 sm:opacity-0 sm:translate-x-full z-10'
                : 'pointer-events-auto opacity-100 sm:translate-x-0 z-20'
            }`}
          >
            <div className="w-full max-w-sm mx-auto">
              <div className="mb-6 text-center">
                <div className="mb-3 flex justify-center">
                  <Brand />
                </div>
                <h1 className="font-montserrat text-3xl font-extrabold tracking-tight text-[#0d3950] dark:text-white">
                  Entrar
                </h1>
              </div>

              {googleEnabled ? (
                <div className="mb-4">
                  <form action={googleLoginAction()} method="post">
                    <input type="hidden" name="csrfmiddlewaretoken" value={getCsrfToken()} />
                    <input type="hidden" name="provider" value="google" />
                    <input type="hidden" name="process" value="login" />
                    <input type="hidden" name="callback_url" value={`${window.location.origin}/home`} />
                    <button
                      type="submit"
                      className="flex min-h-11 w-full items-center justify-center gap-3 rounded-full border border-slate-300 bg-white px-5 font-arial text-sm font-semibold text-[#0d3950] shadow-xs transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-[#005063] dark:border-white/15 dark:bg-[#041019] dark:text-white dark:hover:bg-[#061622]"
                    >
                      <span className="grid size-5 place-items-center rounded-full bg-[#0d3950] dark:bg-white text-[11px] font-black text-white dark:text-[#0d3950] shadow-xs" aria-hidden="true">
                        G
                      </span>
                      Entrar com Google
                    </button>
                  </form>
                  <div className="my-4 flex items-center gap-3" aria-hidden="true">
                    <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                    <span className="font-arial text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      ou use seu e-mail
                    </span>
                    <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                  </div>
                </div>
              ) : null}

              {loginError ? (
                <div className="mb-4">
                  <Alert>{loginError}</Alert>
                </div>
              ) : null}

              <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
                <div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      name="loginEmail"
                      autoComplete="email"
                      placeholder="E-mail institucional"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      className="min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-4 font-arial text-sm text-[#0d3950] outline-none transition placeholder:text-slate-400 focus:border-[#005063] focus:bg-white focus:ring-2 focus:ring-[#005063]/20 dark:border-[#005063]/50 dark:bg-[#041019] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#006768] dark:focus:bg-[#061622]"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500">
                      <Lock size={18} />
                    </span>
                    <input
                      type={loginShowPassword ? 'text' : 'password'}
                      name="loginPassword"
                      autoComplete="current-password"
                      placeholder="Senha"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      className="min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-11 font-arial text-sm text-[#0d3950] outline-none transition placeholder:text-slate-400 focus:border-[#005063] focus:bg-white focus:ring-2 focus:ring-[#005063]/20 dark:border-[#005063]/50 dark:bg-[#041019] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#006768] dark:focus:bg-[#061622]"
                    />
                    <button
                      type="button"
                      onClick={() => setLoginShowPassword((v) => !v)}
                      className="absolute right-2 top-2 grid size-7 place-items-center rounded-md text-slate-400 hover:text-[#0d3950] dark:text-slate-400 dark:hover:text-white"
                      aria-label={loginShowPassword ? 'Ocultar senha' : 'Exibir senha'}
                    >
                      {loginShowPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <label className="flex cursor-pointer items-center gap-2 font-arial text-xs font-medium text-[#0d3950] dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="size-3.5 rounded border-slate-300 bg-white text-[#006768] focus:ring-1 focus:ring-[#005063] dark:border-slate-600 dark:bg-[#041019]"
                    />
                    Lembrar por 14 dias
                  </label>
                  <Link
                    to="/esqueci-senha"
                    className="font-arial text-xs font-semibold text-[#005063] hover:text-[#0d3950] hover:underline dark:text-[#2dd4bf] dark:hover:text-white"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#006768] px-6 font-montserrat text-sm font-bold tracking-wider text-white uppercase shadow-md transition-all hover:bg-[#005063] dark:hover:bg-[#007f80] focus-visible:outline-2 focus-visible:outline-[#006768] disabled:opacity-50"
                >
                  {loginLoading ? <LoaderCircle size={16} className="animate-spin" /> : null}
                  Entrar
                </button>
              </form>

              {/* Mobile toggle helper (< sm screens) */}
              <p className="mt-6 text-center font-arial text-xs text-slate-500 dark:text-slate-400 sm:hidden">
                Não tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => toggleMode(true)}
                  className="font-bold text-[#005063] dark:text-[#2dd4bf] underline"
                >
                  Cadastre-se
                </button>
              </p>
            </div>
          </div>

          {/* ============================================================ */}
          {/* FORM CONTAINER 2: SIGN UP (CADASTRO)                         */}
          {/* ============================================================ */}
          <div
            className={`absolute top-0 right-0 flex h-full w-full flex-col justify-center px-6 py-8 sm:w-1/2 sm:px-10 lg:px-12 transition-all duration-700 ease-in-out ${
              isSignUp
                ? 'pointer-events-auto opacity-100 sm:translate-x-0 z-20'
                : 'pointer-events-none opacity-0 sm:opacity-0 sm:-translate-x-full z-10'
            }`}
          >
            <div className="w-full max-w-sm mx-auto">
              <div className="mb-4 text-center">
                <div className="mb-2 flex justify-center">
                  <Brand />
                </div>
                <h1 className="font-montserrat text-2xl font-extrabold tracking-tight text-[#0d3950] dark:text-white sm:text-3xl">
                  Criar Conta
                </h1>
              </div>

              {signupError ? (
                <div className="mb-3">
                  <Alert>{signupError}</Alert>
                </div>
              ) : null}

              <form onSubmit={handleSignupSubmit} className="space-y-3" noValidate>
                <div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-3 text-slate-400 dark:text-slate-500">
                      <User size={16} />
                    </span>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Nome completo"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value)
                        setFieldErrors((f) => ({ ...f, fullName: '' }))
                      }}
                      className="min-h-10 w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 font-arial text-xs text-[#0d3950] outline-none transition placeholder:text-slate-400 focus:border-[#005063] focus:bg-white focus:ring-1 focus:ring-[#005063] dark:border-[#005063]/50 dark:bg-[#041019] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#006768] dark:focus:bg-[#061622]"
                    />
                  </div>
                  {fieldErrors.fullName ? (
                    <span className="mt-1 block font-arial text-[11px] text-rose-600 dark:text-rose-400">
                      {fieldErrors.fullName}
                    </span>
                  ) : null}
                </div>

                <div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-3 text-slate-400 dark:text-slate-500">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      name="signupEmail"
                      placeholder="seu.nome@aluno.impacta.edu.br"
                      value={signupEmail}
                      onChange={(e) => {
                        setSignupEmail(e.target.value)
                        setFieldErrors((f) => ({ ...f, email: '' }))
                      }}
                      className="min-h-10 w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 font-arial text-xs text-[#0d3950] outline-none transition placeholder:text-slate-400 focus:border-[#005063] focus:bg-white focus:ring-1 focus:ring-[#005063] dark:border-[#005063]/50 dark:bg-[#041019] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#006768] dark:focus:bg-[#061622]"
                    />
                  </div>
                  {fieldErrors.email ? (
                    <span className="mt-1 block font-arial text-[11px] text-rose-600 dark:text-rose-400">
                      {fieldErrors.email}
                    </span>
                  ) : null}
                </div>

                <div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-3 text-slate-400 dark:text-slate-500">
                      <GraduationCap size={16} />
                    </span>
                    <select
                      value={offering}
                      onChange={(e) => {
                        setOffering(e.target.value)
                        setFieldErrors((f) => ({ ...f, offering: '' }))
                      }}
                      disabled={loadingOfferings}
                      className="min-h-10 w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 font-arial text-xs text-[#0d3950] outline-none transition focus:border-[#005063] focus:bg-white focus:ring-1 focus:ring-[#005063] dark:border-[#005063]/50 dark:bg-[#041019] dark:text-white dark:focus:border-[#006768] dark:focus:bg-[#061622]"
                    >
                      <option value="" className="bg-white dark:bg-[#081a26]">
                        {loadingOfferings ? 'Carregando cursos…' : 'Selecione seu curso'}
                      </option>
                      {offerings.map((item) => (
                        <option key={item.id} value={item.id} className="bg-white dark:bg-[#081a26]">
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {fieldErrors.offering ? (
                    <span className="mt-1 block font-arial text-[11px] text-rose-600 dark:text-rose-400">
                      {fieldErrors.offering}
                    </span>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-3 text-slate-400 dark:text-slate-500">
                        <Lock size={16} />
                      </span>
                      <input
                        type={signupShowPassword ? 'text' : 'password'}
                        placeholder="Senha (mín. 12)"
                        value={signupPassword}
                        onChange={(e) => {
                          setSignupPassword(e.target.value)
                          setFieldErrors((f) => ({ ...f, password: '' }))
                        }}
                        className="min-h-10 w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-2 font-arial text-xs text-[#0d3950] outline-none transition placeholder:text-slate-400 focus:border-[#005063] focus:bg-white focus:ring-1 focus:ring-[#005063] dark:border-[#005063]/50 dark:bg-[#041019] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#006768] dark:focus:bg-[#061622]"
                      />
                    </div>
                    {fieldErrors.password ? (
                      <span className="mt-1 block font-arial text-[11px] text-rose-600 dark:text-rose-400">
                        {fieldErrors.password}
                      </span>
                    ) : null}
                  </div>

                  <div>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3.5 top-3 text-slate-400 dark:text-slate-500">
                        <Lock size={16} />
                      </span>
                      <input
                        type={signupShowPassword ? 'text' : 'password'}
                        placeholder="Confirme a senha"
                        value={confirmation}
                        onChange={(e) => {
                          setConfirmation(e.target.value)
                          setFieldErrors((f) => ({ ...f, confirmation: '' }))
                        }}
                        className="min-h-10 w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-2 font-arial text-xs text-[#0d3950] outline-none transition placeholder:text-slate-400 focus:border-[#005063] focus:bg-white focus:ring-1 focus:ring-[#005063] dark:border-[#005063]/50 dark:bg-[#041019] dark:text-white dark:placeholder:text-slate-500 dark:focus:border-[#006768] dark:focus:bg-[#061622]"
                      />
                    </div>
                    {fieldErrors.confirmation ? (
                      <span className="mt-1 block font-arial text-[11px] text-rose-600 dark:text-rose-400">
                        {fieldErrors.confirmation}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label className="flex cursor-pointer items-start gap-2 pt-1 font-arial text-[11px] leading-4 text-slate-600 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={acceptLegal}
                      onChange={(e) => {
                        setAcceptLegal(e.target.checked)
                        setFieldErrors((f) => ({ ...f, acceptLegal: '' }))
                      }}
                      className="mt-0.5 size-3.5 rounded border-slate-300 bg-white text-[#006768] focus:ring-1 focus:ring-[#005063] dark:border-slate-600 dark:bg-[#041019]"
                    />
                    <span>
                      Concordo com os{' '}
                      <Link to="/termos" target="_blank" className="font-semibold text-[#005063] dark:text-[#2dd4bf] underline">
                        Termos
                      </Link>{' '}
                      e{' '}
                      <Link to="/privacidade" target="_blank" className="font-semibold text-[#005063] dark:text-[#2dd4bf] underline">
                        Privacidade
                      </Link>
                      .
                    </span>
                  </label>
                  {fieldErrors.acceptLegal ? (
                    <span className="mt-0.5 block font-arial text-[11px] text-rose-600 dark:text-rose-400">
                      {fieldErrors.acceptLegal}
                    </span>
                  ) : null}
                </div>

                <button
                  type="submit"
                  disabled={signupLoading}
                  className="mt-1 flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-[#006768] px-6 font-montserrat text-xs font-bold tracking-wider text-white uppercase shadow-md transition-all hover:bg-[#005063] dark:hover:bg-[#007f80] focus-visible:outline-2 focus-visible:outline-[#006768] disabled:opacity-50"
                >
                  {signupLoading ? <LoaderCircle size={15} className="animate-spin" /> : null}
                  Criar Conta
                </button>
              </form>

              {/* Mobile toggle helper (< sm screens) */}
              <p className="mt-4 text-center font-arial text-xs text-slate-500 dark:text-slate-400 sm:hidden">
                Já possui uma conta?{' '}
                <button
                  type="button"
                  onClick={() => toggleMode(false)}
                  className="font-bold text-[#005063] dark:text-[#2dd4bf] underline"
                >
                  Entrar
                </button>
              </p>
            </div>
          </div>

          {/* ============================================================ */}
          {/* SLIDING OVERLAY CONTAINER (DESKTOP >= sm)                     */}
          {/* ============================================================ */}
          <div
            className={`pointer-events-none absolute top-0 left-1/2 z-30 hidden h-full w-1/2 overflow-hidden transition-transform duration-700 ease-in-out sm:block ${
              isSignUp ? '-translate-x-full' : 'translate-x-0'
            }`}
          >
            {/* Inner Slider Content (200% width) */}
            <div
              className={`relative -left-full flex h-full w-[200%] bg-[#0d3950] dark:bg-[#004859] text-white transition-transform duration-700 ease-in-out ${
                isSignUp ? 'translate-x-1/2' : 'translate-x-0'
              }`}
            >
              {/* Overlay Left Panel (Shown when on SignUp mode) */}
              <div
                className={`flex h-full w-1/2 flex-col items-center justify-center px-8 text-center sm:px-12 transition-transform duration-700 ease-in-out ${
                  isSignUp ? 'translate-x-0' : '-translate-x-[20%]'
                }`}
              >
                <h2 className="font-montserrat text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Bem-vindo de volta!
                </h2>
                <p className="mt-4 max-w-xs font-arial text-sm leading-relaxed text-white/80">
                  Para continuar acompanhando suas matérias e horários, acesse sua conta.
                </p>
                <button
                  type="button"
                  onClick={() => toggleMode(false)}
                  className="pointer-events-auto mt-8 inline-flex items-center justify-center rounded-full border-2 border-white px-8 py-2.5 font-montserrat text-xs font-extrabold tracking-widest text-white uppercase transition-all hover:bg-white hover:text-[#0d3950] focus-visible:outline-2 focus-visible:outline-white"
                >
                  Entrar
                </button>
              </div>

              {/* Overlay Right Panel (Shown when on SignIn mode) */}
              <div
                className={`flex h-full w-1/2 flex-col items-center justify-center px-8 text-center sm:px-12 transition-transform duration-700 ease-in-out ${
                  isSignUp ? 'translate-x-[20%]' : 'translate-x-0'
                }`}
              >
                <h2 className="font-montserrat text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Olá, Estudante!
                </h2>
                <p className="mt-4 max-w-xs font-arial text-sm leading-relaxed text-white/80">
                  Cadastre-se com seu e-mail institucional para acessar o EduTrack.
                </p>
                <button
                  type="button"
                  onClick={() => toggleMode(true)}
                  className="pointer-events-auto mt-8 inline-flex items-center justify-center rounded-full border-2 border-white px-8 py-2.5 font-montserrat text-xs font-extrabold tracking-widest text-white uppercase transition-all hover:bg-white hover:text-[#0d3950] focus-visible:outline-2 focus-visible:outline-white"
                >
                  Cadastre-se
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Minimal Footer */}
        <footer className="mt-6 text-center">
          <p className="font-arial text-xs text-slate-500 dark:text-white/40">
            EduTrack • Gestão Acadêmica
          </p>
        </footer>
      </div>
    </main>
  )
}
