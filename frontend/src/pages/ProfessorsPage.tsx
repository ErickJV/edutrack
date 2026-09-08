/* eslint-disable react-hooks/set-state-in-effect */

import { Edit2, GraduationCap, LoaderCircle, Plus, Trash2, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import { createProfessor, deleteProfessor, listProfessors, updateProfessor } from '../api/client'
import type { Professor } from '../api/types'
import { AppNavigation } from '../components/AppNavigation'
import { Brand } from '../components/Brand'
import { Alert, PageLoader } from '../components/Feedback'
import { Input, PrimaryButton } from '../components/FormControls'
import { ThemeToggle } from '../components/ThemeToggle'

export function ProfessorsPage() {
  const [professors, setProfessors] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProf, setEditingProf] = useState<Professor | null>(null)
  const [nameInput, setNameInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await listProfessors()
      setProfessors(data)
    } catch {
      setError('Não foi possível carregar os professores. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function openCreate() {
    setEditingProf(null)
    setNameInput('')
    setModalError('')
    setModalOpen(true)
  }

  function openEdit(prof: Professor) {
    setEditingProf(prof)
    setNameInput(prof.name)
    setModalError('')
    setModalOpen(true)
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault()
    if (!nameInput.trim()) {
      setModalError('Informe o nome do professor.')
      return
    }

    setSaving(true)
    setModalError('')
    try {
      if (editingProf) {
        const updated = await updateProfessor(editingProf.id, { name: nameInput.trim() })
        setProfessors((current) => current.map((p) => (p.id === updated.id ? updated : p)))
      } else {
        const created = await createProfessor({ name: nameInput.trim() })
        setProfessors((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')))
      }
      setModalOpen(false)
    } catch (reason) {
      setModalError(reason instanceof Error ? reason.message : 'Não foi possível salvar o professor.')
    } finally {
      setSaving(false)
    }
  }

  async function handleArchive(prof: Professor) {
    if (!window.confirm(`Deseja arquivar o professor "${prof.name}"? Vínculos existentes serão preservados.`)) return
    try {
      await deleteProfessor(prof.id)
      setProfessors((current) => current.filter((p) => p.id !== prof.id))
    } catch {
      setError('Não foi possível arquivar o professor.')
    }
  }

  if (loading) return <PageLoader />

  return (
    <main className="min-h-dvh bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-5 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <Brand />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <Plus size={18} aria-hidden="true" />
                Novo professor
              </button>
            </div>
          </div>
          <div className="mt-4">
            <AppNavigation />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <section className="rounded-[2rem] bg-gradient-to-br from-indigo-700 via-indigo-700 to-cyan-600 px-6 py-8 text-white shadow-2xl shadow-indigo-950/15 sm:px-10 sm:py-10">
          <div className="max-w-3xl space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-indigo-50">
              <GraduationCap size={14} aria-hidden="true" /> Corpo docente
            </p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Gerencie seus professores e responsáveis de aula.</h1>
            <p className="max-w-2xl text-base leading-7 text-indigo-100">
              Cadastre professores uma única vez para associá-los facilmente a qualquer disciplina do seu curso.
            </p>
          </div>
        </section>

        {error ? (
          <div className="mt-6 flex flex-col gap-3">
            <Alert>{error}</Alert>
            <button
              type="button"
              onClick={load}
              className="self-start rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
            >
              Tentar novamente
            </button>
          </div>
        ) : null}

        <section className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Cadastros pessoais</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50">Professores ativos</h2>
            </div>
            <span className="rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-extrabold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {professors.length} {professors.length === 1 ? 'cadastrado' : 'cadastrados'}
            </span>
          </div>

          {professors.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
              <Users className="mx-auto text-slate-400 dark:text-slate-500" size={32} aria-hidden="true" />
              <p className="mt-4 text-lg font-black text-slate-950 dark:text-slate-50">Nenhum professor cadastrado ainda</p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Cadastre seus professores para vinculá-los às disciplinas e organizar o contato de cada matéria.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <Plus size={17} aria-hidden="true" />
                Cadastrar primeiro professor
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {professors.map((prof) => (
                <article
                  key={prof.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950/60"
                >
                  <div>
                    <div className="grid size-10 place-items-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400">
                      <GraduationCap size={20} aria-hidden="true" />
                    </div>
                    <h3 className="mt-3 text-lg font-black tracking-tight text-slate-950 dark:text-slate-50">{prof.name}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Cadastro ativo</p>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => openEdit(prof)}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
                      title="Editar professor"
                    >
                      <Edit2 size={14} aria-hidden="true" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleArchive(prof)}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                      title="Arquivar professor"
                    >
                      <Trash2 size={14} aria-hidden="true" /> Arquivar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs"
          role="presentation"
          onClick={() => setModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="prof-modal-title"
            className="relative flex flex-col w-full max-w-md overflow-hidden rounded-2xl sm:rounded-3xl bg-white p-6 shadow-2xl shadow-slate-950/20 dark:bg-slate-900 dark:border dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="prof-modal-title" className="text-xl font-black text-slate-950 dark:text-slate-50">
              {editingProf ? 'Editar professor' : 'Novo professor'}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              O nome ficará disponível para seleção em todas as suas disciplinas.
            </p>

            {modalError ? <div className="mt-4"><Alert>{modalError}</Alert></div> : null}

            <form onSubmit={handleSave} className="mt-5 space-y-4">
              <Input
                label="Nome completo do professor"
                name="name"
                placeholder="Ex.: Prof. Diogo Matheus"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                autoFocus
                required
              />

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <PrimaryButton loading={saving} type="submit" className="sm:w-auto">
                  {editingProf ? 'Salvar alterações' : 'Cadastrar'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  )
}
