import {
  Brain,
  CheckCircle2,
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
  listFlashcards,
  listStudentSubjects,
  reviewFlashcard,
  updateFlashcard,
} from '../api/client'
import type { Flashcard, FlashcardRating, StudentSubject } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { AppNavigation } from '../components/AppNavigation'
import { Brand } from '../components/Brand'
import { Alert } from '../components/Feedback'
import { Input, PrimaryButton, Select } from '../components/FormControls'
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
  const [selectedDeck, setSelectedDeck] = useState<string>('ALL')
  const [mode, setMode] = useState<'study' | 'decks' | 'manage'>('study')
  const [studyAllMode, setStudyAllMode] = useState(false)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [reviewing, setReviewing] = useState(false)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal de Criar / Editar Flashcard
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null)
  const [formSubjectId, setFormSubjectId] = useState('')
  const [formDeckName, setFormDeckName] = useState('')
  const [formFront, setFormFront] = useState('')
  const [formBack, setFormBack] = useState('')
  const [formHint, setFormHint] = useState('')
  const [formTags, setFormTags] = useState('')
  const [savingCard, setSavingCard] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [loadedCards, loadedSubjects] = await Promise.all([
        listFlashcards(),
        listStudentSubjects(),
      ])
      setCards(loadedCards)
      setSubjects(loadedSubjects)
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

  // Agrupamento de Baralhos (Decks) estilo Anki
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

  // Fila de estudo Anki (cartões vencidos/novos ou todos quando studyAllMode=true)
  const studyQueue = useMemo(() => {
    const due = deckCards.filter((c) => c.is_due)
    if (due.length > 0 || !studyAllMode) return due
    return deckCards
  }, [deckCards, studyAllMode])

  const activeCard = studyQueue[currentIndex] || studyQueue[0] || null

  // Totais globais estilo Anki
  const globalStats = useMemo(() => {
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
        setCurrentIndex(0)
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
    [activeCard, reviewing],
  )

  // Atalhos de teclado estilo Anki (Espaço para flipar, 1-4 para responder)
  useEffect(() => {
    if (mode !== 'study' || modalOpen || !activeCard) return
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
  }, [mode, modalOpen, activeCard, isFlipped, handleRating])

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
    setFormDeckName(defaultSubj?.subject.name || 'Geral')
    setFormFront('')
    setFormBack('')
    setFormHint('')
    setFormTags('')
    setModalOpen(true)
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
      } else {
        const created = await createFlashcard(payload)
        setCards((prev) => [created, ...prev])
      }
      setModalOpen(false)
      setEditingCard(null)
    } catch (reason) {
      setError(
        reason instanceof ApiError ? reason.message : 'Não foi possível salvar o flashcard.',
      )
    } finally {
      setSavingCard(false)
    }
  }

  async function handleDeleteCard(card: Flashcard) {
    try {
      await deleteFlashcard(card.id)
      setCards((prev) => prev.filter((c) => c.id !== card.id))
      setIsFlipped(false)
    } catch {
      setError('Não foi possível excluir o flashcard.')
    }
  }

  async function handleSeedStarterCards() {
    setLoading(true)
    setError('')
    try {
      const firstSubj = subjects[0]
      const samples = [
        {
          student_subject: firstSubj?.id || null,
          deck_name: firstSubj?.subject.name || 'Computação & Algoritmos',
          front: 'Qual é a diferença entre uma Pilha (Stack) e uma Fila (Queue)?',
          back: '• Pilha (Stack): segue o princípio LIFO (Last In, First Out) — o último elemento inserido é o primeiro a sair.\n• Fila (Queue): segue o princípio FIFO (First In, First Out) — o primeiro elemento inserido é o primeiro a sair.',
          hint: 'Pense em LIFO vs FIFO',
          tags: 'estruturas-de-dados, p1',
        },
        {
          student_subject: firstSubj?.id || null,
          deck_name: firstSubj?.subject.name || 'Computação & Algoritmos',
          front: 'Como funciona o algoritmo de Repetição Espaçada (SM-2) usado no Anki?',
          back: 'Baseado na curva do esquecimento de Ebbinghaus: a cada revisão bem-sucedida (Bom/Fácil), o intervalo até a próxima revisão multiplica pelo Fator de Facilidade (Ease Factor). Se errar (De novo), o cartão volta para aprendizagem imediata.',
          hint: 'Curva do esquecimento',
          tags: 'anki, estudo-ativo',
        },
        {
          student_subject: firstSubj?.id || null,
          deck_name: firstSubj?.subject.name || 'Computação & Algoritmos',
          front: 'O que é uma Chave Primária (Primary Key) em um banco de dados relacional?',
          back: 'É um identificador único e não nulo (NOT NULL + UNIQUE) de cada registro em uma tabela, garantindo integridade de entidade.',
          hint: 'Identificador único de linha',
          tags: 'banco-de-dados, sql',
        },
      ]
      const createdList: Flashcard[] = []
      for (const item of samples) {
        const c = await createFlashcard(item)
        createdList.push(c)
      }
      setCards((prev) => [...createdList, ...prev])
      setMode('study')
    } catch {
      setError('Não foi possível gerar os flashcards de demonstração.')
    } finally {
      setLoading(false)
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
        {/* Cabeçalho do Módulo Flashcards (Anki) */}
        <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-[#0d3950]/5 sm:p-8 dark:border-[#005063]/30 dark:bg-[#081a26]/90">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#005063]/20 bg-[#0d3950]/5 px-3 py-1 text-xs font-extrabold tracking-wide text-[#0d3950] uppercase dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-300">
                <Brain className="h-3.5 w-3.5" />
                Repetição Espaçada Estilo Anki (SM-2)
              </span>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-[#0d3950] sm:text-3xl dark:text-white">
                Flashcards
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                vire o cartão em 3D para revelar a resposta e avalie sua memória com{' '}
                <strong>De novo</strong>, <strong>Difícil</strong>, <strong>Bom</strong> ou{' '}
                <strong>Fácil</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-[#005063]/40 dark:bg-[#041019]">
                <button
                  type="button"
                  onClick={() => setMode('study')}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-extrabold transition ${
                    mode === 'study'
                      ? 'bg-[#0d3950] text-white shadow-xs dark:bg-[#005063]'
                      : 'text-slate-600 hover:text-[#0d3950] dark:text-slate-300'
                  }`}
                >
                  <Play className="h-3.5 w-3.5" />
                  Estudar Agora
                </button>
                <button
                  type="button"
                  onClick={() => setMode('decks')}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-extrabold transition ${
                    mode === 'decks'
                      ? 'bg-[#0d3950] text-white shadow-xs dark:bg-[#005063]'
                      : 'text-slate-600 hover:text-[#0d3950] dark:text-slate-300'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  Baralhos ({decks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMode('manage')}
                  className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-extrabold transition ${
                    mode === 'manage'
                      ? 'bg-[#0d3950] text-white shadow-xs dark:bg-[#005063]'
                      : 'text-slate-600 hover:text-[#0d3950] dark:text-slate-300'
                  }`}
                >
                  Todos ({cards.length})
                </button>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0d3950] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#0d3950]/20 transition hover:bg-[#005063] dark:bg-[#005063] dark:hover:bg-[#006b85]"
              >
                <Plus className="h-4 w-4" />
                Novo Flashcard
              </button>
            </div>
          </div>

          {/* Contadores estilo Anki (Novos / Aprender / Revisar / Baralho) */}
          <div className="mt-6 flex flex-col gap-4 border-t border-slate-200/70 pt-5 lg:flex-row lg:items-center lg:justify-between dark:border-[#005063]/30">
            <div className="grid grid-cols-3 gap-3 sm:flex sm:items-center sm:gap-4">
              <div className="rounded-2xl border border-sky-500/25 bg-sky-500/10 px-4 py-2.5">
                <span className="block text-[10px] font-extrabold tracking-wider text-sky-700 uppercase dark:text-sky-300">
                  Novos
                </span>
                <span className="text-xl font-black text-sky-900 dark:text-white">
                  {globalStats.newCount}
                </span>
              </div>
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-2.5">
                <span className="block text-[10px] font-extrabold tracking-wider text-amber-700 uppercase dark:text-amber-300">
                  Aprender
                </span>
                <span className="text-xl font-black text-amber-900 dark:text-white">
                  {globalStats.learningCount}
                </span>
              </div>
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-2.5">
                <span className="block text-[10px] font-extrabold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                  Revisar
                </span>
                <span className="text-xl font-black text-emerald-900 dark:text-white">
                  {globalStats.reviewDueCount}
                </span>
              </div>
            </div>

            <div className="w-full sm:w-72">
              <Select
                label="Baralho / Disciplina em foco"
                value={selectedDeck}
                onChange={(e) => {
                  setSelectedDeck(e.target.value)
                  setCurrentIndex(0)
                  setIsFlipped(false)
                  setShowHint(false)
                }}
              >
                <option value="ALL">Todos os baralhos ({cards.length})</option>
                {decks.map((d) => (
                  <option key={d.deckName} value={d.deckName}>
                    {d.deckName} ({d.dueCount} pendentes / {d.totalCount} total)
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </section>

        {error ? <Alert tone="error">{error}</Alert> : null}

        {/* MODO 1: ESTUDO COM ANIMAÇÃO 3D FLIP */}
        {mode === 'study' && (
          <section className="mx-auto w-full max-w-4xl">
            {cards.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white/95 p-12 text-center shadow-lg dark:border-[#005063]/30 dark:bg-[#081a26]/90">
                <Brain className="mx-auto h-12 w-12 text-[#005063] dark:text-cyan-400" />
                <h2 className="mt-4 text-xl font-black text-[#0d3950] dark:text-white">
                  Seu baralho ainda está vazio
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
                  Crie seus próprios flashcards por disciplina ou gere um baralho inicial de
                  demonstração para testar o efeito 3D de virar o cartão (flipping) agora mesmo!
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0d3950] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#005063] dark:bg-[#005063]"
                  >
                    <Plus className="h-4 w-4" />
                    Criar primeiro Flashcard
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleSeedStarterCards()}
                    disabled={loading}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#005063]/30 bg-[#005063]/10 px-5 py-2.5 text-sm font-bold text-[#0d3950] transition hover:bg-[#005063]/20 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-300"
                  >
                    <Sparkles className="h-4 w-4" />
                    Gerar 3 Flashcards de Exemplo
                  </button>
                </div>
              </div>
            ) : !activeCard ? (
              <div className="rounded-3xl border border-emerald-500/30 bg-white/95 p-12 text-center shadow-lg dark:bg-[#081a26]/90">
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
                <h2 className="mt-4 text-2xl font-black text-[#0d3950] dark:text-white">
                  Parabéns! Você concluiu todas as revisões pendentes hoje!
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-300">
                  Todos os cartões deste baralho estão agendados para seus próximos intervalos
                  ótimos de memorização.
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
                    Revisar Todos Mesmo Assim ({deckCards.length})
                  </button>
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-[#0d3950] hover:bg-slate-50 dark:border-[#005063]/40 dark:bg-[#041019] dark:text-slate-200"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar Mais Cartões
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Barra de Progresso do Cartão Atual */}
                <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#0d3950] px-3 py-1 text-white dark:bg-[#005063]">
                      {activeCard.subject_name || activeCard.deck_name || 'Geral'}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Cartão {currentIndex + 1} de {studyQueue.length} na fila
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(activeCard)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-[#005063] hover:bg-white/60 dark:text-cyan-400 dark:hover:bg-[#081a26]"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      Editar cartão
                    </button>
                  </div>
                </div>

                {/* CONTAINER 3D FLIPPING CARD */}
                <div
                  className="w-full cursor-pointer select-none"
                  style={{ perspective: '1400px' }}
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
                  <div
                    className="relative min-h-[360px] w-full sm:min-h-[400px]"
                    style={{
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.65s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    }}
                  >
                    {/* FACE 1: FRENTE (PERGUNTA) */}
                    <div
                      className="absolute inset-0 flex flex-col justify-between rounded-3xl border-2 border-[#005063]/25 bg-white p-7 shadow-2xl shadow-[#0d3950]/10 sm:p-10 dark:border-cyan-500/30 dark:bg-[#081a26]"
                      style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-extrabold tracking-wider text-sky-700 uppercase dark:bg-sky-400/15 dark:text-sky-300">
                          Frente · Pergunta
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
                          <RotateCw className="h-3.5 w-3.5" />
                          Clique para virar (Flip 3D)
                        </span>
                      </div>

                      <div className="my-auto py-6 text-center">
                        <p className="text-xl leading-relaxed font-black whitespace-pre-wrap text-[#0d3950] sm:text-2xl lg:text-3xl dark:text-white">
                          {activeCard.front}
                        </p>

                        {activeCard.hint && (
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
                                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#041019] dark:text-slate-300"
                              >
                                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                                Mostrar Dica
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400 dark:border-slate-800">
                        <span>
                          Intervalo atual: <strong>{activeCard.interval_days}d</strong> · Facilidade:{' '}
                          <strong>{Math.round(activeCard.ease_factor * 100)}%</strong>
                        </span>
                        <span className="font-bold text-[#005063] dark:text-cyan-400">
                          Toque ou pressione [Espaço] para revelar →
                        </span>
                      </div>
                    </div>

                    {/* FACE 2: VERSO (RESPOSTA) */}
                    <div
                      className="absolute inset-0 flex flex-col justify-between rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-white via-white to-emerald-50/40 p-7 shadow-2xl shadow-[#0d3950]/10 sm:p-10 dark:border-emerald-400/40 dark:from-[#081a26] dark:via-[#081a26] dark:to-[#041d24]"
                      style={{
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-extrabold tracking-wider text-emerald-700 uppercase dark:text-emerald-300">
                          Verso · Resposta
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400">
                          <RotateCw className="h-3.5 w-3.5" />
                          Clique para voltar à frente
                        </span>
                      </div>

                      <div className="my-auto overflow-y-auto py-4 text-center">
                        <p className="mb-3 text-xs font-bold text-slate-400 dark:text-slate-400">
                          Pergunta: {activeCard.front}
                        </p>
                        <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-500/20 bg-white/80 p-5 text-left text-base leading-relaxed font-bold whitespace-pre-wrap text-slate-900 shadow-xs sm:text-lg dark:bg-[#041019]/80 dark:text-slate-100">
                          {activeCard.back}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200/70 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        <span>Avalie o quão bem você lembrou nos botões abaixo</span>
                        {activeCard.tags && (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold dark:bg-slate-800">
                            #{activeCard.tags}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* BOTÕES DE AVALIAÇÃO ANKI SM-2 */}
                {!isFlipped ? (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setIsFlipped(true)}
                      className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#0d3950] px-8 py-3 text-sm font-black text-white shadow-lg shadow-[#0d3950]/25 transition hover:scale-[1.01] hover:bg-[#005063] dark:bg-[#005063] dark:hover:bg-[#006b85]"
                    >
                      <RotateCw className="h-4 w-4" />
                      Mostrar Resposta (Virar Cartão)
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <button
                      type="button"
                      disabled={reviewing}
                      onClick={() => void handleRating('again')}
                      className="flex flex-col items-center justify-center rounded-2xl border-2 border-rose-500/40 bg-rose-500/10 py-3.5 text-center transition hover:bg-rose-500/20 disabled:opacity-50"
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
                      className="flex flex-col items-center justify-center rounded-2xl border-2 border-amber-500/40 bg-amber-500/10 py-3.5 text-center transition hover:bg-amber-500/20 disabled:opacity-50"
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
                      className="flex flex-col items-center justify-center rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 py-3.5 text-center transition hover:bg-emerald-500/20 disabled:opacity-50"
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
                      className="flex flex-col items-center justify-center rounded-2xl border-2 border-cyan-500/40 bg-cyan-500/10 py-3.5 text-center transition hover:bg-cyan-500/20 disabled:opacity-50"
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
            )}
          </section>
        )}

        {/* MODO 2: PAINEL DE BARALHOS (DECKS ESTILO ANKI) */}
        {mode === 'decks' && (
          <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl dark:border-[#005063]/30 dark:bg-[#081a26]/90">
            <h2 className="text-lg font-black text-[#0d3950] dark:text-white">
              Meus Baralhos (Decks)
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Selecione um baralho para iniciar a sessão de estudo focada naquela disciplina.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase dark:border-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="py-3 pr-4">Baralho / Disciplina</th>
                    <th className="px-3 py-3 text-center text-sky-600 dark:text-sky-400">Novos</th>
                    <th className="px-3 py-3 text-center text-amber-600 dark:text-amber-400">
                      Aprender
                    </th>
                    <th className="px-3 py-3 text-center text-emerald-600 dark:text-emerald-400">
                      Revisar
                    </th>
                    <th className="px-3 py-3 text-center">Total</th>
                    <th className="py-3 pl-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  {decks.map((d) => (
                    <tr key={d.deckName} className="hover:bg-slate-50/80 dark:hover:bg-[#041019]/50">
                      <td className="py-3.5 pr-4 font-black text-[#0d3950] dark:text-white">
                        {d.deckName}
                      </td>
                      <td className="px-3 py-3.5 text-center font-extrabold text-sky-600 dark:text-sky-400">
                        {d.newCount}
                      </td>
                      <td className="px-3 py-3.5 text-center font-extrabold text-amber-600 dark:text-amber-400">
                        {d.learningCount}
                      </td>
                      <td className="px-3 py-3.5 text-center font-extrabold text-emerald-600 dark:text-emerald-400">
                        {d.reviewCount}
                      </td>
                      <td className="px-3 py-3.5 text-center font-bold text-slate-600 dark:text-slate-300">
                        {d.totalCount}
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDeck(d.deckName)
                            setStudyAllMode(true)
                            setCurrentIndex(0)
                            setIsFlipped(false)
                            setMode('study')
                          }}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#0d3950] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#005063] dark:bg-[#005063]"
                        >
                          <Play className="h-3.5 w-3.5" />
                          Estudar Baralho
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* MODO 3: GERENCIAR TODOS OS CARTÕES */}
        {mode === 'manage' && (
          <section className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl dark:border-[#005063]/30 dark:bg-[#081a26]/90">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#0d3950] dark:text-white">
                Gerenciar Cartões ({deckCards.length})
              </h2>
            </div>

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
          </section>
        )}
      </div>

      {/* Modal de Criar / Editar Flashcard */}
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
                {editingCard ? 'Editar Flashcard' : 'Novo Flashcard'}
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
                <Select
                  label="Disciplina vinculada"
                  value={formSubjectId}
                  onChange={(e) => {
                    const id = e.target.value
                    setFormSubjectId(id)
                    const found = subjects.find((s) => s.id === id)
                    if (found) setFormDeckName(found.subject.name)
                  }}
                >
                  <option value="">(Geral / Baralho livre)</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.subject.name}
                    </option>
                  ))}
                </Select>

                <Input
                  label="Nome do Baralho (Deck)"
                  placeholder="Ex: Banco de Dados, P1..."
                  value={formDeckName}
                  onChange={(e) => setFormDeckName(e.target.value)}
                />
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-800 dark:text-slate-200">
                  Frente do Cartão (Pergunta / Conceito) *
                </span>
                <textarea
                  rows={3}
                  required
                  value={formFront}
                  onChange={(e) => setFormFront(e.target.value)}
                  placeholder="Digite a pergunta ou termo que aparecerá na frente do cartão..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#005063] focus:outline-hidden dark:border-[#005063]/40 dark:bg-[#040f17] dark:text-white"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-bold text-slate-800 dark:text-slate-200">
                  Verso do Cartão (Resposta / Explicação) *
                </span>
                <textarea
                  rows={4}
                  required
                  value={formBack}
                  onChange={(e) => setFormBack(e.target.value)}
                  placeholder="Digite a resposta que será revelada ao virar o cartão (flip)..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#005063] focus:outline-hidden dark:border-[#005063]/40 dark:bg-[#040f17] dark:text-white"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Dica opcional (Frente)"
                  placeholder="Ex: Lembre-se da regra LIFO..."
                  value={formHint}
                  onChange={(e) => setFormHint(e.target.value)}
                />
                <Input
                  label="Tags (opcional)"
                  placeholder="Ex: prova-p1, sql"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-11 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:border-[#005063]/40 dark:text-slate-300 dark:hover:bg-[#041019]"
                >
                  Cancelar
                </button>
                <PrimaryButton type="submit" disabled={savingCard}>
                  {savingCard ? 'Salvando...' : 'Salvar Flashcard'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
