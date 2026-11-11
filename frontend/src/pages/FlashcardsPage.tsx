import {
  Brain,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Layers,
  Lightbulb,
  LogOut,
  Play,
  Plus,
  RotateCw,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  ApiError,
  createFlashcard,
  deleteFlashcard,
  generateFlashcardsWithAI,
  listFlashcards,
  listStudentSubjects,
  listStudyNotes,
  reviewFlashcard,
  updateFlashcard,
} from '../api/client'
import type { Flashcard, FlashcardRating, StudentSubject, StudyNote } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { AppNavigation } from '../components/AppNavigation'
import { Brand } from '../components/Brand'
import { Alert } from '../components/Feedback'
import { ThemeToggle } from '../components/ThemeToggle'

type DeckSummary = {
  deckName: string
  totalCount: number
  newCount: number
  learningCount: number
  reviewCount: number
  dueCount: number
}

function predictNextIntervalLabel(card: Flashcard, rating: FlashcardRating): string {
  const ease = card.ease_factor || 2.5
  const interval = card.interval_days || 0
  const reps = card.repetitions || 0

  if (rating === 'again') return '< 10 min'
  if (rating === 'hard') {
    const days = interval === 0 ? 1 : Math.max(1, Math.round(interval * 1.2))
    return `${days}d`
  }
  if (rating === 'good') {
    const nextReps = reps + 1
    const days =
      nextReps === 1 ? 1 : nextReps === 2 ? 3 : Math.max(1, Math.round(interval * ease))
    return `${days}d`
  }
  const nextReps = reps + 1
  const nextEase = ease + 0.15
  const days =
    nextReps === 1 ? 4 : Math.max(4, Math.round(Math.max(1, interval) * nextEase * 1.3))
  return `${days}d`
}

export function FlashcardsPage() {
  const { signOut } = useAuth()
  const [leaving, setLeaving] = useState(false)

  const [cards, setCards] = useState<Flashcard[]>([])
  const [subjects, setSubjects] = useState<StudentSubject[]>([])
  const [notes, setNotes] = useState<StudyNote[]>([])
  const [selectedDeck, setSelectedDeck] = useState<string>('ALL')
  const [studyAllMode, setStudyAllMode] = useState(false)
  const [showManageList, setShowManageList] = useState(true)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [reviewing, setReviewing] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Modal de Criar / Editar Flashcard Manual
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [formSubjectId, setFormSubjectId] = useState('')
  const [formDeckName, setFormDeckName] = useState('')
  const [formFront, setFormFront] = useState('')
  const [formBack, setFormBack] = useState('')
  const [formHint, setFormHint] = useState('')
  const [formTags, setFormTags] = useState('')
  const [savingCard, setSavingCard] = useState(false)

  // Modal de Gerar Flashcards Inteligentes pela IA
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiSubjectId, setAiSubjectId] = useState('')
  const [aiNoteId, setAiNoteId] = useState('')
  const [aiTopic, setAiTopic] = useState('')
  const [aiSourceText, setAiSourceText] = useState('')
  const [aiCount, setAiCount] = useState<number>(5)
  const [generatingAi, setGeneratingAi] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [loadedCards, loadedSubjects, loadedNotes] = await Promise.all([
        listFlashcards(),
        listStudentSubjects(),
        listStudyNotes().catch(() => [] as StudyNote[]),
      ])
      setCards(loadedCards)
      setSubjects(loadedSubjects)
      setNotes(loadedNotes)
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : 'Não foi possível carregar seus flashcards.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // Agrupamento de Baralhos (Decks)
  const decks = useMemo((): DeckSummary[] => {
    const map = new Map<string, DeckSummary>()
    for (const c of cards) {
      const name = c.subject_name || c.deck_name || 'Geral'
      const existing = map.get(name) || {
        deckName: name,
        totalCount: 0,
        newCount: 0,
        learningCount: 0,
        reviewCount: 0,
        dueCount: 0,
      }
      existing.totalCount += 1
      if (c.state === 'new') existing.newCount += 1
      else if (c.state === 'learning') existing.learningCount += 1
      else existing.reviewCount += 1
      if (c.is_due) existing.dueCount += 1
      map.set(name, existing)
    }
    return Array.from(map.values()).sort((a, b) => a.deckName.localeCompare(b.deckName, 'pt-BR'))
  }, [cards])

  // Cartões filtrados pelo baralho ativo
  const deckCards = useMemo(() => {
    if (selectedDeck === 'ALL') return cards
    return cards.filter((c) => (c.subject_name || c.deck_name || 'Geral') === selectedDeck)
  }, [cards, selectedDeck])

  // Fila de estudo
  const studyQueue = useMemo(() => {
    const due = deckCards.filter((c) => c.is_due)
    if (due.length > 0 || !studyAllMode) return due
    return deckCards
  }, [deckCards, studyAllMode])

  const safeIndex = studyQueue.length > 0 ? Math.min(currentIndex, studyQueue.length - 1) : 0
  const activeCard = studyQueue[safeIndex] || null

  // Totais do baralho selecionado
  const deckStats = useMemo(() => {
    let newCount = 0
    let learningCount = 0
    let reviewDueCount = 0
    for (const c of deckCards) {
      if (c.state === 'new' && c.is_due) newCount++
      else if (c.state === 'learning' && c.is_due) learningCount++
      else if (c.state === 'review' && c.is_due) reviewDueCount++
    }
    return { newCount, learningCount, reviewDueCount, total: deckCards.length }
  }, [deckCards])

  const handleRating = useCallback(
    async (rating: FlashcardRating) => {
      if (!activeCard || reviewing) return
      setReviewing(true)
      setError('')
      try {
        const updated = await reviewFlashcard(activeCard.id, rating)
        setIsFlipped(false)
        setShowHint(false)
        setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        if (studyAllMode && studyQueue.length > 1) {
          setCurrentIndex((prev) => (prev + 1) % studyQueue.length)
        } else {
          setCurrentIndex(0)
        }
      } catch (reason) {
        setError(
          reason instanceof ApiError
            ? reason.message
            : 'Erro ao registrar revisão do flashcard.',
        )
      } finally {
        setReviewing(false)
      }
    },
    [activeCard, reviewing, studyAllMode, studyQueue.length],
  )

  // Atalhos de teclado (Espaço para flipar, 1-4 para responder)
  useEffect(() => {
    if (modalOpen || aiModalOpen || !activeCard) return
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.code === 'Space') {
        e.preventDefault()
        setIsFlipped((prev) => !prev)
      } else if (isFlipped) {
        if (e.key === '1') void handleRating('again')
        else if (e.key === '2') void handleRating('hard')
        else if (e.key === '3') void handleRating('good')
        else if (e.key === '4') void handleRating('easy')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [modalOpen, aiModalOpen, activeCard, isFlipped, handleRating])

  async function leave() {
    setLeaving(true)
    try {
      await signOut()
    } finally {
      setLeaving(false)
    }
  }

  function openCreateModal() {
    setEditingCard(null)
    const defaultSubj = subjects[0]
    setFormSubjectId(defaultSubj?.id || '')
    setFormDeckName(
      selectedDeck !== 'ALL' ? selectedDeck : defaultSubj?.subject.name || 'Geral',
    )
    setFormFront('')
    setFormBack('')
    setFormHint('')
    setFormTags('')
    setModalOpen(true)
  }

  function openAiModal() {
    const defaultSubj = subjects[0]
    setAiSubjectId(defaultSubj?.id || '')
    setAiNoteId(notes[0]?.id || '')
    setAiTopic('')
    setAiSourceText('')
    setAiCount(5)
    setError('')
    setAiModalOpen(true)
  }

  function openEditModal(card: Flashcard) {
    setEditingCard(card)
    setFormSubjectId(card.student_subject || '')
    setFormDeckName(card.deck_name || 'Geral')
    setFormFront(card.front)
    setFormBack(card.back)
    setFormHint(card.hint || '')
    setFormTags(card.tags || '')
    setModalOpen(true)
  }

  async function handleSaveCard(e: React.FormEvent) {
    e.preventDefault()
    if (!formFront.trim() || !formBack.trim()) {
      setError('Preencha a Frente (Pergunta) e o Verso (Resposta) do flashcard.')
      return
    }
    setSavingCard(true)
    setError('')
    try {
      const selectedSubj = subjects.find((s) => s.id === formSubjectId)
      const resolvedDeck =
        formDeckName.trim() || selectedSubj?.subject.name || 'Geral'
      const payload = {
        student_subject: formSubjectId || null,
        deck_name: resolvedDeck,
        front: formFront.trim(),
        back: formBack.trim(),
        hint: formHint.trim(),
        tags: formTags.trim(),
      }
      if (editingCard) {
        const updated = await updateFlashcard(editingCard.id, payload)
        setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        setSuccessMessage('Card atualizado com sucesso!')
      } else {
        const created = await createFlashcard(payload)
        setCards((prev) => [created, ...prev])
        setSuccessMessage('Novo card criado com sucesso!')
      }
      setModalOpen(false)
      setEditingCard(null)
    } catch (reason) {
      setError(
        reason instanceof ApiError ? reason.message : 'Não foi possível salvar o card.',
      )
    } finally {
      setSavingCard(false)
    }
  }

  async function handleGenerateAiSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGeneratingAi(true)
    setError('')
    setSuccessMessage('')
    try {
      const selectedSubj = subjects.find((s) => s.id === aiSubjectId)
      const selectedNote = notes.find((n) => n.id === aiNoteId)
      const resolvedDeck =
        selectedSubj?.subject.name ||
        aiTopic.trim() ||
        selectedNote?.title ||
        (selectedDeck !== 'ALL' ? selectedDeck : 'Geral')

      const res = await generateFlashcardsWithAI({
        student_subject: aiSubjectId || null,
        note_id: aiNoteId || null,
        topic: aiTopic.trim() || selectedNote?.title || selectedSubj?.subject.name || 'Revisão Geral',
        source_text: aiSourceText.trim() || selectedNote?.content || '',
        deck_name: resolvedDeck,
        count: aiCount,
      })

      setCards((prev) => [...res.items, ...prev])
      setSelectedDeck('ALL')
      setCurrentIndex(0)
      setIsFlipped(false)
      setAiModalOpen(false)
      setSuccessMessage(
        `✨ ${res.created_count} flashcards foram gerados inteligentemente pela IA e adicionados à sua fila!`,
      )
    } catch (reason) {
      setError(
        reason instanceof ApiError
          ? reason.message
          : 'Não foi possível gerar os flashcards com IA.',
      )
    } finally {
      setGeneratingAi(false)
    }
  }

  async function handleDeleteCard(card: Flashcard) {
    const preview = card.front.length > 70 ? `${card.front.slice(0, 70)}...` : card.front
    const confirmed = window.confirm(
      `Deseja realmente excluir este card?\n\n"${preview}"`,
    )
    if (!confirmed) return
    setError('')
    try {
      await deleteFlashcard(card.id)
      setCards((prev) => prev.filter((c) => c.id !== card.id))
      setIsFlipped(false)
      setSuccessMessage('Card excluído com sucesso.')
    } catch {
      setError('Não foi possível excluir o card.')
    }
  }

  return (
    <main className="min-h-dvh bg-[#dce6ef] dark:bg-[#040f17]">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-[#005063]/30 dark:bg-[#081a26]/90">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <Brand />
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                type="button"
                aria-label="Sair"
                onClick={() => void leave()}
                disabled={leaving}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-sm font-bold text-[#0d3950] transition hover:bg-slate-50 disabled:opacity-50 dark:border-[#005063]/40 dark:bg-[#041019] dark:text-slate-100 dark:hover:bg-[#0d3950]/40"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{leaving ? 'Saindo...' : 'Sair'}</span>
              </button>
            </div>
          </div>
          <div className="mt-4">
            <AppNavigation />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-8 sm:py-10">
        {/* Cabeçalho Principal Alinhado */}
        <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-[#0d3950]/5 sm:p-8 dark:border-[#005063]/30 dark:bg-[#081a26]/90">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#005063]/20 bg-[#0d3950]/5 px-3 py-1 text-xs font-extrabold tracking-wide text-[#0d3950] uppercase dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300">
                <Brain className="h-3.5 w-3.5" />
                Repetição Espaçada
              </span>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-[#0d3950] sm:text-3xl dark:text-white">
                Flashcards
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Selecione um filtro em Cards à esquerda, clique no card para girá-lo em 3D (Flip), gerencie seus cards ou gere novos automaticamente com IA.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={openAiModal}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#006768]/40 bg-[#006768]/15 px-4 py-2.5 text-sm font-extrabold text-[#0d3950] shadow-xs transition hover:bg-[#006768]/25 dark:border-cyan-400/40 dark:bg-cyan-400/15 dark:text-cyan-300 dark:hover:bg-cyan-400/25"
              >
                <Sparkles className="h-4 w-4 text-[#006768] dark:text-cyan-300" />
                Gerar com IA
              </button>

              <button
                type="button"
                onClick={() => setShowManageList((prev) => !prev)}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-extrabold text-[#0d3950] transition hover:bg-slate-100 dark:border-[#005063]/40 dark:bg-[#041019] dark:text-slate-200"
              >
                <Layers className="h-4 w-4 text-[#005063] dark:text-cyan-400" />
                {showManageList ? 'Ocultar Lista de Cards' : `Todos os Cards (${cards.length})`}
              </button>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0d3950] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0d3950]/20 transition hover:bg-[#005063] dark:bg-[#005063] dark:hover:bg-[#006b85]"
              >
                <Plus className="h-4 w-4" />
                Novo Card
              </button>
            </div>
          </div>
        </section>

        {error ? <Alert tone="error">{error}</Alert> : null}

        {successMessage ? (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-xs font-bold text-emerald-900 dark:text-emerald-200">
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              className="text-emerald-700 hover:underline dark:text-emerald-300"
            >
              Fechar
            </button>
          </div>
        ) : null}

        {/* LAYOUT EM 2 COLUNAS ALINHADAS: CARDS (ESQUERDA) + CARTÃO 3D FLIP (DIREITA) */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* COLUNA ESQUERDA: CARDS E RESUMO */}
          <aside className="space-y-4 rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xl shadow-[#0d3950]/5 lg:col-span-4 sm:p-6 dark:border-[#005063]/30 dark:bg-[#081a26]/90">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-[#0d3950] dark:text-white">
                  Cards
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Clique em uma disciplina ou grupo para filtrar os cards
                </p>
              </div>
              <span className="rounded-full bg-[#0d3950]/10 px-2.5 py-1 text-xs font-extrabold text-[#0d3950] dark:bg-cyan-400/15 dark:text-cyan-300">
                {cards.length} {cards.length === 1 ? 'card' : 'cards'}
              </span>
            </div>

            {/* Contadores: Novos / Aprender / Revisar */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl border border-sky-500/25 bg-sky-500/10 p-3 text-center">
                <span className="block text-[10px] font-extrabold tracking-wider text-sky-700 uppercase dark:text-sky-300">
                  Novos
                </span>
                <span className="mt-0.5 block text-xl font-black text-sky-900 dark:text-white">
                  {deckStats.newCount}
                </span>
              </div>
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3 text-center">
                <span className="block text-[10px] font-extrabold tracking-wider text-amber-700 uppercase dark:text-amber-300">
                  Aprender
                </span>
                <span className="mt-0.5 block text-xl font-black text-amber-900 dark:text-white">
                  {deckStats.learningCount}
                </span>
              </div>
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-center">
                <span className="block text-[10px] font-extrabold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                  Revisar
                </span>
                <span className="mt-0.5 block text-xl font-black text-emerald-900 dark:text-white">
                  {deckStats.reviewDueCount}
                </span>
              </div>
            </div>

            {/* Lista de Cards */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedDeck('ALL')
                  setCurrentIndex(0)
                  setIsFlipped(false)
                  setShowHint(false)
                }}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  selectedDeck === 'ALL'
                    ? 'border-[#006768] bg-[#0d3950] text-white shadow-md dark:border-cyan-400/50 dark:bg-[#005063]'
                    : 'border-slate-200 bg-slate-50/80 text-[#0d3950] hover:bg-slate-100 dark:border-slate-800 dark:bg-[#041019] dark:text-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <div>
                  <span className="block text-xs font-extrabold">Todos os Cards</span>
                  <span
                    className={`text-[11px] ${
                      selectedDeck === 'ALL' ? 'text-slate-200' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {cards.length} cards cadastrados
                  </span>
                </div>
                <Play className="h-4 w-4 shrink-0" />
              </button>

              {decks.map((d) => {
                const isSelected = selectedDeck === d.deckName
                return (
                  <button
                    key={d.deckName}
                    type="button"
                    onClick={() => {
                      setSelectedDeck(d.deckName)
                      setCurrentIndex(0)
                      setIsFlipped(false)
                      setShowHint(false)
                    }}
                    className={`flex w-full flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition ${
                      isSelected
                        ? 'border-[#006768] bg-[#0d3950] text-white shadow-md dark:border-cyan-400/50 dark:bg-[#005063]'
                        : 'border-slate-200 bg-white text-[#0d3950] hover:bg-slate-50 dark:border-slate-800 dark:bg-[#041019]/70 dark:text-slate-100 dark:hover:bg-[#041019]'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="truncate text-xs font-extrabold">{d.deckName}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {d.totalCount} total
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-extrabold">
                      <span className={isSelected ? 'text-sky-200' : 'text-sky-600 dark:text-sky-400'}>
                        {d.newCount} novos
                      </span>
                      <span
                        className={isSelected ? 'text-amber-200' : 'text-amber-600 dark:text-amber-400'}
                      >
                        {d.learningCount} aprender
                      </span>
                      <span
                        className={
                          isSelected ? 'text-emerald-200' : 'text-emerald-600 dark:text-emerald-400'
                        }
                      >
                        {d.reviewCount} revisar
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </aside>

          {/* COLUNA DIREITA: ÁREA DE ESTUDO COM ANIMAÇÃO 3D FLIPPING */}
          <section className="lg:col-span-8">
            {cards.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white/95 p-12 text-center shadow-xl dark:border-[#005063]/30 dark:bg-[#081a26]/90">
                <Brain className="mx-auto h-12 w-12 text-[#005063] dark:text-cyan-400" />
                <h2 className="mt-4 text-xl font-black text-[#0d3950] dark:text-white">
                  Nenhum card cadastrado ainda
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
                  Crie seus próprios cards manualmente ou gere cards inteligentes com IA a
                  partir de qualquer tema ou anotação!
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={openAiModal}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#006768] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#005063]"
                  >
                    <Sparkles className="h-4 w-4" />
                    Gerar Cards com IA
                  </button>
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0d3950] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#005063] dark:bg-[#005063]"
                  >
                    <Plus className="h-4 w-4" />
                    Criar Card Manual
                  </button>
                </div>
              </div>
            ) : !activeCard ? (
              <div className="rounded-3xl border border-emerald-500/30 bg-white/95 p-12 text-center shadow-xl dark:bg-[#081a26]/90">
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
                <h2 className="mt-4 text-2xl font-black text-[#0d3950] dark:text-white">
                  Parabéns! Você concluiu as revisões pendentes destes cards hoje!
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
                  Todos os cards foram agendados para seus próximos intervalos ótimos. Você pode
                  praticar todos os cards ou gerar novos com a IA.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStudyAllMode(true)
                      setCurrentIndex(0)
                      setIsFlipped(false)
                    }}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0d3950] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#005063] dark:bg-[#005063]"
                  >
                    <RotateCw className="h-4 w-4" />
                    Praticar Todos os Cards ({deckCards.length})
                  </button>
                  <button
                    type="button"
                    onClick={openAiModal}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#006768]/40 bg-[#006768]/15 px-5 py-2.5 text-sm font-bold text-[#0d3950] hover:bg-[#006768]/25 dark:border-cyan-400/40 dark:bg-cyan-400/15 dark:text-cyan-300"
                  >
                    <Sparkles className="h-4 w-4" />
                    Gerar Mais com IA
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Barra de Topo do Cartão Atual */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 text-xs font-bold shadow-xs dark:border-[#005063]/30 dark:bg-[#081a26]/90">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="rounded-xl bg-[#0d3950] px-3 py-1 text-white dark:bg-[#005063]">
                      {activeCard.subject_name || activeCard.deck_name || 'Geral'}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      Card <strong>{safeIndex + 1}</strong> de <strong>{studyQueue.length}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {studyQueue.length > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setIsFlipped(false)
                            setShowHint(false)
                            setCurrentIndex((prev) =>
                              prev > 0 ? prev - 1 : studyQueue.length - 1,
                            )
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#041019] dark:text-slate-200"
                          title="Card anterior"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsFlipped(false)
                            setShowHint(false)
                            setCurrentIndex((prev) => (prev + 1) % studyQueue.length)
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#041019] dark:text-slate-200"
                          title="Próximo card"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditModal(activeCard)}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-[#005063] hover:bg-slate-100 dark:border-slate-700 dark:bg-[#041019] dark:text-cyan-400"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteCard(activeCard)}
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 text-xs font-bold text-rose-600 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </button>
                  </div>
                </div>

                {/* CENA 3D FLIPPING CARD */}
                <div
                  className="anki-flip-scene w-full cursor-pointer select-none"
                  onClick={() => setIsFlipped((prev) => !prev)}
                  role="button"
                  tabIndex={0}
                  aria-label={
                    isFlipped
                      ? 'Verso do flashcard (clique para voltar à pergunta)'
                      : 'Frente do flashcard (clique para virar e ver a resposta)'
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      setIsFlipped((prev) => !prev)
                    }
                  }}
                >
                  <div className={`anki-flip-card ${isFlipped ? 'is-flipped' : ''}`}>
                    {/* FACE 1: FRENTE (PERGUNTA) */}
                    <div
                      className="anki-flip-face anki-flip-face-front flex flex-col justify-between rounded-3xl border-2 border-[#005063]/25 bg-white p-7 shadow-xl shadow-[#0d3950]/10 sm:p-10 dark:border-cyan-500/30 dark:bg-[#081a26]"
                      style={{ pointerEvents: isFlipped ? 'none' : 'auto' }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                        <span className="rounded-full bg-sky-500/10 px-3.5 py-1 text-xs font-extrabold tracking-wider text-sky-700 uppercase dark:bg-sky-400/15 dark:text-sky-300">
                          Frente · Pergunta
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-[#041019] dark:text-slate-300">
                          <RotateCw className="h-3.5 w-3.5 text-[#005063] dark:text-cyan-400" />
                          Clique para girar 3D (Flip)
                        </span>
                      </div>

                      <div className="my-auto py-8 text-center">
                        <p className="text-xl leading-relaxed font-black whitespace-pre-wrap text-[#0d3950] sm:text-2xl lg:text-[26px] dark:text-white">
                          {activeCard.front}
                        </p>

                        {activeCard.hint ? (
                          <div
                            className="mt-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowHint((prev) => !prev)
                            }}
                          >
                            {showHint ? (
                              <span className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                                <Lightbulb className="h-3.5 w-3.5" />
                                Dica: {activeCard.hint}
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#041019] dark:text-slate-300"
                              >
                                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                                Mostrar Dica
                              </button>
                            )}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        <span>
                          Intervalo: <strong>{activeCard.interval_days}d</strong> · Facilidade:{' '}
                          <strong>{Math.round(activeCard.ease_factor * 100)}%</strong>
                        </span>
                        <span className="font-extrabold text-[#005063] dark:text-cyan-400">
                          Toque no cartão ou pressione [Espaço] →
                        </span>
                      </div>
                    </div>

                    {/* FACE 2: VERSO (RESPOSTA) */}
                    <div
                      className="anki-flip-face anki-flip-face-back flex flex-col justify-between rounded-3xl border-2 border-emerald-500/40 bg-white p-7 shadow-xl shadow-[#0d3950]/10 sm:p-10 dark:border-emerald-400/40 dark:bg-[#081a26]"
                      style={{ pointerEvents: isFlipped ? 'auto' : 'none' }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 dark:border-slate-800">
                        <span className="rounded-full bg-emerald-500/15 px-3.5 py-1 text-xs font-extrabold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                          Verso · Resposta
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-[#041019] dark:text-slate-300">
                          <RotateCw className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          Clique para voltar à pergunta
                        </span>
                      </div>

                      <div className="my-auto py-6">
                        <p className="mb-3 text-center text-xs font-bold text-slate-400 dark:text-slate-400">
                          Pergunta: {activeCard.front}
                        </p>
                        <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-500/25 bg-emerald-50/50 p-5 text-left text-base leading-relaxed font-bold whitespace-pre-wrap text-slate-900 shadow-xs sm:text-lg dark:bg-[#041019] dark:text-slate-100">
                          {activeCard.back}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        <span>Avalie sua resposta nos 4 botões abaixo (teclas 1 a 4)</span>
                        {activeCard.tags ? (
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-[#041019] dark:text-slate-300">
                            #{activeCard.tags}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                {/* DOCK DE AÇÃO INFERIOR */}
                <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-lg dark:border-[#005063]/30 dark:bg-[#081a26]/90">
                  {!isFlipped ? (
                    <button
                      type="button"
                      onClick={() => setIsFlipped(true)}
                      className="flex min-h-14 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#0d3950] px-6 py-3.5 text-base font-black text-white shadow-md transition hover:bg-[#005063] dark:bg-[#005063] dark:hover:bg-[#006b85]"
                    >
                      <RotateCw className="h-5 w-5" />
                      Mostrar Resposta (Virar Cartão 3D)
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <button
                        type="button"
                        disabled={reviewing}
                        onClick={() => void handleRating('again')}
                        className="flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 border-rose-500/40 bg-rose-500/10 px-3 py-2.5 text-center transition hover:bg-rose-500/20 disabled:opacity-50"
                      >
                        <span className="text-[11px] font-extrabold text-rose-700 dark:text-rose-300">
                          {predictNextIntervalLabel(activeCard, 'again')}
                        </span>
                        <span className="mt-0.5 text-sm font-black text-rose-950 dark:text-white">
                          1 · De novo
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={reviewing}
                        onClick={() => void handleRating('hard')}
                        className="flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-center transition hover:bg-amber-500/20 disabled:opacity-50"
                      >
                        <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300">
                          {predictNextIntervalLabel(activeCard, 'hard')}
                        </span>
                        <span className="mt-0.5 text-sm font-black text-amber-950 dark:text-white">
                          2 · Difícil
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={reviewing}
                        onClick={() => void handleRating('good')}
                        className="flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-center transition hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300">
                          {predictNextIntervalLabel(activeCard, 'good')}
                        </span>
                        <span className="mt-0.5 text-sm font-black text-emerald-950 dark:text-white">
                          3 · Bom
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={reviewing}
                        onClick={() => void handleRating('easy')}
                        className="flex min-h-14 flex-col items-center justify-center rounded-2xl border-2 border-cyan-500/40 bg-cyan-500/10 px-3 py-2.5 text-center transition hover:bg-cyan-500/20 disabled:opacity-50"
                      >
                        <span className="text-[11px] font-extrabold text-cyan-700 dark:text-cyan-300">
                          {predictNextIntervalLabel(activeCard, 'easy')}
                        </span>
                        <span className="mt-0.5 text-sm font-black text-cyan-950 dark:text-white">
                          4 · Fácil
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>

        {/* SEÇÃO DE GERENCIAMENTO: CONSULTAR, CRIAR, EDITAR E EXCLUIR CARDS */}
        {showManageList && (
          <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl dark:border-[#005063]/30 dark:bg-[#081a26]/90">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-[#0d3950] dark:text-white">
                  {selectedDeck === 'ALL'
                    ? `Todos os Cards (${deckCards.length})`
                    : `Cards — ${selectedDeck} (${deckCards.length})`}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Visualize, edite ou exclua qualquer card individualmente
                </p>
              </div>
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-[#0d3950] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#005063] dark:bg-[#005063]"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar Card
              </button>
            </div>

            {deckCards.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                Nenhum card encontrado para o filtro selecionado.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {deckCards.map((c) => (
                  <article
                    key={c.id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-[#005063]/30 dark:bg-[#041019]/80"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-[#0d3950]/10 px-2.5 py-0.5 text-xs font-extrabold text-[#0d3950] dark:bg-cyan-400/15 dark:text-cyan-300">
                          {c.subject_name || c.deck_name || 'Geral'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          Intervalo: {c.interval_days}d · Repetições: {c.repetitions}
                        </span>
                      </div>
                      <h3 className="mt-2.5 text-sm font-black text-[#0d3950] dark:text-white">
                        Frente: {c.front}
                      </h3>
                      <p className="mt-1.5 text-xs whitespace-pre-wrap text-slate-600 dark:text-slate-300">
                        Verso: {c.back}
                      </p>
                      {c.hint ? (
                        <p className="mt-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                          Dica: {c.hint}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-200/60 pt-3 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-[#005063] hover:bg-slate-200/60 dark:text-cyan-400"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCard(c)}
                        className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Excluir
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Modal de Gerar Flashcards Inteligentes pela IA */}
      {aiModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-flashcard-modal-title"
        >
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#005063]/40 dark:bg-[#081a26]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-[#005063]/30">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#006768]/15 text-[#006768] dark:bg-cyan-400/15 dark:text-cyan-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2
                    id="ai-flashcard-modal-title"
                    className="text-lg font-black text-[#0d3950] dark:text-white"
                  >
                    Gerar Flashcards com IA
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Elabora perguntas de raciocínio lógico, análise de cenários e trade-offs a partir das suas anotações
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAiModalOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#041019]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => void handleGenerateAiSubmit(e)} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold tracking-wider text-[#0d3950] uppercase dark:text-slate-200">
                    Disciplina
                  </span>
                  <select
                    value={aiSubjectId}
                    onChange={(e) => setAiSubjectId(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-sm font-semibold text-[#0d3950] focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/40 dark:bg-[#040f17] dark:text-white"
                  >
                    <option value="">(Geral / Qualquer disciplina)</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.subject.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold tracking-wider text-[#0d3950] uppercase dark:text-slate-200">
                    Quantidade de Cartões
                  </span>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-sm font-semibold text-[#0d3950] focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/40 dark:bg-[#040f17] dark:text-white"
                  >
                    <option value={3}>3 flashcards</option>
                    <option value={5}>5 flashcards (Recomendado)</option>
                    <option value={8}>8 flashcards</option>
                    <option value={10}>10 flashcards</option>
                  </select>
                </label>
              </div>

              {notes.length > 0 && (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold tracking-wider text-[#0d3950] uppercase dark:text-slate-200">
                    Basear em uma Página do Bloco de Anotações (Opcional)
                  </span>
                  <select
                    value={aiNoteId}
                    onChange={(e) => setAiNoteId(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-sm font-semibold text-[#0d3950] focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/40 dark:bg-[#040f17] dark:text-white"
                  >
                    <option value="">(Não usar anotação salva)</option>
                    {notes.map((n) => {
                      const rawTitle = (n.title ?? '').trim()
                      const displayTitle =
                        !rawTitle ||
                        rawTitle.toLowerCase() === 'nova anotaço' ||
                        rawTitle.toLowerCase() === 'nova anotaco' ||
                        rawTitle.toLowerCase() === 'sem título'
                          ? 'Nova anotação'
                          : rawTitle
                      return (
                        <option key={n.id} value={n.id}>
                          📒 {displayTitle}
                        </option>
                      )
                    })}
                  </select>
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold tracking-wider text-[#0d3950] uppercase dark:text-slate-200">
                  Tema ou Assunto Foco
                </span>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Ex: Normalização de Banco de Dados, Árvores Binárias, Padrões de Projeto..."
                  className="min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-sm font-semibold text-[#0d3950] focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/40 dark:bg-[#040f17] dark:text-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold tracking-wider text-[#0d3950] uppercase dark:text-slate-200">
                  Texto / Resumo de Aula para a IA Analisar (Opcional)
                </span>
                <textarea
                  rows={4}
                  value={aiSourceText}
                  onChange={(e) => setAiSourceText(e.target.value)}
                  placeholder="Cole aqui trechos da matéria, tópicos de slides ou definições para a IA transformar em perguntas e respostas..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/40 dark:bg-[#040f17] dark:text-white"
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAiModalOpen(false)}
                  className="min-h-11 rounded-xl border border-slate-200 px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:border-[#005063]/40 dark:text-slate-300 dark:hover:bg-[#041019]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={generatingAi}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#006768] px-6 py-2 text-sm font-bold text-white shadow-md transition hover:bg-[#005063] disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {generatingAi ? 'Gerando com IA...' : 'Gerar Flashcards com IA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Criar / Editar Flashcard Manual */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="flashcard-modal-title"
        >
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-[#005063]/40 dark:bg-[#081a26]">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-[#005063]/30">
              <h2
                id="flashcard-modal-title"
                className="text-lg font-black text-[#0d3950] dark:text-white"
              >
                {editingCard ? 'Editar Card' : 'Novo Card'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#041019]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => void handleSaveCard(e)} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold tracking-wider text-[#0d3950] uppercase dark:text-slate-200">
                    Disciplina vinculada
                  </span>
                  <select
                    value={formSubjectId}
                    onChange={(e) => {
                      const id = e.target.value
                      setFormSubjectId(id)
                      const found = subjects.find((s) => s.id === id)
                      if (found) setFormDeckName(found.subject.name)
                    }}
                    className="min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-sm font-semibold text-[#0d3950] focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/40 dark:bg-[#040f17] dark:text-white"
                  >
                    <option value="">(Geral / Sem disciplina específica)</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.subject.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold tracking-wider text-[#0d3950] uppercase dark:text-slate-200">
                    Categoria / Grupo de Cards
                  </span>
                  <input
                    type="text"
                    placeholder="Ex: Banco de Dados, P1..."
                    value={formDeckName}
                    onChange={(e) => setFormDeckName(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-sm font-semibold text-[#0d3950] focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/40 dark:bg-[#040f17] dark:text-white"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold tracking-wider text-[#0d3950] uppercase dark:text-slate-200">
                  Frente do Card (Pergunta / Conceito) *
                </span>
                <textarea
                  rows={3}
                  required
                  value={formFront}
                  onChange={(e) => setFormFront(e.target.value)}
                  placeholder="Digite a pergunta ou termo que aparecerá na frente do card..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/40 dark:bg-[#040f17] dark:text-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold tracking-wider text-[#0d3950] uppercase dark:text-slate-200">
                  Verso do Card (Resposta / Explicação) *
                </span>
                <textarea
                  rows={4}
                  required
                  value={formBack}
                  onChange={(e) => setFormBack(e.target.value)}
                  placeholder="Digite a resposta que será revelada ao virar o card (flip)..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/40 dark:bg-[#040f17] dark:text-white"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold tracking-wider text-[#0d3950] uppercase dark:text-slate-200">
                    Dica opcional (Frente)
                  </span>
                  <input
                    type="text"
                    placeholder="Ex: Lembre-se da regra LIFO..."
                    value={formHint}
                    onChange={(e) => setFormHint(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-sm font-semibold text-[#0d3950] focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/40 dark:bg-[#040f17] dark:text-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold tracking-wider text-[#0d3950] uppercase dark:text-slate-200">
                    Tags (opcional)
                  </span>
                  <input
                    type="text"
                    placeholder="Ex: prova-p1, sql"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="min-h-11 w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 text-sm font-semibold text-[#0d3950] focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/40 dark:bg-[#040f17] dark:text-white"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-11 rounded-xl border border-slate-200 px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:border-[#005063]/40 dark:text-slate-300 dark:hover:bg-[#041019]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingCard}
                  className="min-h-11 rounded-xl bg-[#0d3950] px-6 py-2 text-sm font-bold text-white shadow-md transition hover:bg-[#005063] disabled:opacity-50 dark:bg-[#005063] dark:hover:bg-[#006768]"
                >
                  {savingCard ? 'Salvando...' : editingCard ? 'Salvar Alterações' : 'Salvar Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
