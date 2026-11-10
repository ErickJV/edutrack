import { useState, useEffect, useRef } from 'react'
import {
  FileText,
  Upload,
  Brain,
  Search,
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react'
import type {
  StudyDocument,
  StudyDocumentAnalysis,
  StudyQuiz,
  QuizSubmissionResult,
  StudentSubject,
  StudyFolder,
} from '../api/types'
import {
  listStudyDocuments,
  getStudyDocument,
  uploadStudyDocument,
  deleteStudyDocument,
  analyzeStudyDocumentWithAI,
  generateStudyQuiz,
  submitStudyQuiz,
  createStudyNote,
  createFlashcard,
} from '../api/client'
import { Alert } from './Feedback'

interface StudyDocumentsHubProps {
  subjects: StudentSubject[]
  folders: StudyFolder[]
  onOpenNoteWithContent?: (title: string, content: string) => void
  embedded?: boolean
}

export function StudyDocumentsHub({
  subjects,
  folders,
  onOpenNoteWithContent,
  embedded = false,
}: StudyDocumentsHubProps) {
  const [documents, setDocuments] = useState<StudyDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [selectedDoc, setSelectedDoc] = useState<StudyDocument | null>(null)
  const [loadingDoc, setLoadingDoc] = useState(false)

  // Filters & Search
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  // Upload state
  const [isUploading, setIsUploading] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadSubjectId, setUploadSubjectId] = useState('')
  const [uploadFolderId, setUploadFolderId] = useState('')
  const [uploadTopic, setUploadTopic] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // AI Pipeline State
  const [activeTab, setActiveTab] = useState<
    'reader' | 'summary' | 'complex' | 'concepts' | 'mentalmap' | 'roadmap' | 'quiz' | 'reinforcement'
  >('summary')
  const [analyzingAI, setAnalyzingAI] = useState(false)
  const [analysis, setAnalysis] = useState<StudyDocumentAnalysis | null>(null)

  // Quiz State
  const [currentQuiz, setCurrentQuiz] = useState<StudyQuiz | null>(null)
  const [generatingQuiz, setGeneratingQuiz] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizResult, setQuizResult] = useState<QuizSubmissionResult | null>(null)
  const [submittingQuiz, setSubmittingQuiz] = useState(false)

  // Feedback & Copy State
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const data = await listStudyDocuments({
        subject: selectedSubjectId || undefined,
        search: searchQuery || undefined,
      })
      setDocuments(data)
      if (data.length > 0 && !selectedDocId) {
        setSelectedDocId(data[0].id)
      }
    } catch {
      setMessage({ type: 'error', text: 'Não foi possível carregar os documentos de estudo.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDocuments()
  }, [selectedSubjectId])

  useEffect(() => {
    if (!selectedDocId) {
      setSelectedDoc(null)
      setAnalysis(null)
      setCurrentQuiz(null)
      setQuizResult(null)
      return
    }

    const fetchDetail = async () => {
      try {
        setLoadingDoc(true)
        const doc = await getStudyDocument(selectedDocId)
        setSelectedDoc(doc)
        if (doc.analysis_cache) {
          setAnalysis(doc.analysis_cache)
        } else {
          setAnalysis(null)
        }
        setCurrentQuiz(null)
        setQuizResult(null)
        setQuizAnswers({})
      } catch {
        setMessage({ type: 'error', text: 'Erro ao carregar detalhes do documento.' })
      } finally {
        setLoadingDoc(false)
      }
    }

    void fetchDetail()
  }, [selectedDocId])

  const handleFileUpload = async (file: File) => {
    if (!file) return
    setIsUploading(true)
    setMessage(null)
    try {
      const doc = await uploadStudyDocument(file, {
        title: uploadTitle.trim() || file.name,
        student_subject: uploadSubjectId || selectedSubjectId || undefined,
        folder: uploadFolderId || undefined,
        topic: uploadTopic.trim() || undefined,
      })
      setMessage({
        type: 'success',
        text: `Documento "${doc.title}" enviado e indexado por páginas com sucesso!`,
      })
      setUploadTitle('')
      setUploadTopic('')
      await loadDocuments()
      setSelectedDocId(doc.id)
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Falha no upload do documento.' })
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (docId: string, title: string) => {
    if (!window.confirm(`Deseja realmente remover "${title}"?`)) return
    try {
      await deleteStudyDocument(docId)
      setMessage({ type: 'success', text: 'Documento excluído.' })
      if (selectedDocId === docId) {
        setSelectedDocId(null)
      }
      void loadDocuments()
    } catch {
      setMessage({ type: 'error', text: 'Erro ao excluir o documento.' })
    }
  }

  const handleRunAIAnalysis = async () => {
    if (!selectedDoc) return
    try {
      setAnalyzingAI(true)
      setMessage(null)
      const res = await analyzeStudyDocumentWithAI(selectedDoc.id)
      setAnalysis(res)
      setMessage({ type: 'success', text: 'Análise cognitiva concluída com sucesso!' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao gerar análise por IA.' })
    } finally {
      setAnalyzingAI(false)
    }
  }

  const handleGenerateQuiz = async () => {
    if (!selectedDoc) return
    try {
      setGeneratingQuiz(true)
      setQuizResult(null)
      setQuizAnswers({})
      const quiz = await generateStudyQuiz(selectedDoc.id)
      setCurrentQuiz(quiz)
      setActiveTab('quiz')
      setMessage({ type: 'success', text: 'Simulado de 10 questões gerado com sucesso!' })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao gerar simulado.' })
    } finally {
      setGeneratingQuiz(false)
    }
  }

  const handleSubmitQuiz = async () => {
    if (!selectedDoc || !currentQuiz) return
    try {
      setSubmittingQuiz(true)
      const res = await submitStudyQuiz(selectedDoc.id, currentQuiz.id, quizAnswers)
      setQuizResult(res)
      setMessage({
        type: 'success',
        text: `Simulado finalizado! Nota: ${res.score}/${res.total_questions} (${res.percentage}%).`,
      })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Erro ao submeter simulado.' })
    } finally {
      setSubmittingQuiz(false)
    }
  }

  const handleSaveToNotes = async (title: string, markdownContent: string) => {
    try {
      if (onOpenNoteWithContent) {
        onOpenNoteWithContent(title, markdownContent)
        setMessage({
          type: 'success',
          text: 'Conteúdo inserido diretamente na sua Folha de Anotações!',
        })
        return
      }

      await createStudyNote({
        title,
        content: markdownContent,
        student_subject: selectedDoc?.student_subject || null,
        folder: selectedDoc?.folder || null,
      })
      setMessage({ type: 'success', text: 'Salvo com sucesso no seu Banco Pessoal de Anotações!' })
    } catch {
      setMessage({ type: 'error', text: 'Erro ao salvar nas anotações.' })
    }
  }

  const handleExportFlashcardsToAnki = async (
    concepts: Array<{ term: string; definition: string; citation: string }>,
  ) => {
    if (!concepts.length || !selectedDoc) return
    try {
      let count = 0
      const shortDocTitle =
        selectedDoc.title.length > 28 ? `${selectedDoc.title.slice(0, 28)}…` : selectedDoc.title
      for (const c of concepts) {
        await createFlashcard({
          front: `Qual a função de "${c.term}" (${shortDocTitle})?`,
          back: `• ${c.definition}\n• Fonte: ${c.citation}`,
          deck_name: selectedDoc.student_subject_name || selectedDoc.title,
          student_subject: selectedDoc.student_subject || null,
          hint: `Revisão do documento ${c.citation}`,
        })
        count++
      }
      setMessage({
        type: 'success',
        text: `${count} flashcards concisos adicionados ao seu deck Anki com sucesso!`,
      })
    } catch {
      setMessage({ type: 'error', text: 'Erro ao exportar flashcards para o Anki.' })
    }
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div
      className={`flex h-full w-full flex-col lg:flex-row ${
        embedded
          ? 'bg-white text-[#0d3950] dark:bg-[#081a26] dark:text-slate-100'
          : 'overflow-hidden rounded-2xl border border-slate-200 bg-white text-[#0d3950] shadow-xs dark:border-[#005063]/30 dark:bg-[#081a26] dark:text-slate-100'
      }`}
    >
      {/* Coluna Lateral: Documentos & Upload */}
      <div className="flex w-full shrink-0 flex-col border-b border-slate-200 bg-slate-50/70 lg:w-80 lg:border-r lg:border-b-0 xl:w-88 dark:border-[#005063]/30 dark:bg-[#040f17]/50">
        <div className="space-y-3 border-b border-slate-200 p-3.5 dark:border-[#005063]/30">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-black text-[#0d3950] dark:text-white">
              <BookOpen className="size-4 text-[#006768] dark:text-cyan-400" />
              Materiais & Documentos IA
            </h2>
            <span className="rounded-full bg-[#0d3950]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#0d3950] dark:bg-cyan-400/15 dark:text-cyan-300">
              {documents.length} {documents.length === 1 ? 'arquivo' : 'arquivos'}
            </span>
          </div>

          {/* Filtro de Disciplina Sem Truncamento */}
          <div>
            <label className="mb-1 block text-[10px] font-extrabold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              Filtrar por Disciplina
            </label>
            <select
              aria-label="Filtrar documentos por disciplina"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="min-h-8 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-[#0d3950] focus:border-[#005063] focus:outline-hidden dark:border-slate-700 dark:bg-[#081a26] dark:text-slate-100"
            >
              <option value="">🎓 Todas as Disciplinas</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  🎓 {s.subject.name}
                </option>
              ))}
            </select>
          </div>

          {/* Busca em Arquivos e Páginas */}
          <div className="relative">
            <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Pesquisar em documentos e páginas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void loadDocuments()}
              className="min-h-8 w-full rounded-xl border border-slate-200 bg-white py-1.5 pr-2.5 pl-8 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#005063] focus:outline-hidden dark:border-slate-700 dark:bg-[#081a26] dark:text-slate-100"
            />
          </div>
        </div>

        {/* Configuração Rápida de Vínculo + Dropzone de Upload */}
        <div className="space-y-2 border-b border-slate-200 bg-white/60 p-3 dark:border-[#005063]/30 dark:bg-[#081a26]/40">
          <div className="grid grid-cols-1 gap-2">
            <select
              aria-label="Disciplina para o novo documento"
              value={uploadSubjectId}
              onChange={(e) => setUploadSubjectId(e.target.value)}
              className="min-h-8 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-[#0d3950] focus:border-[#005063] focus:outline-hidden dark:border-slate-700 dark:bg-[#040f17] dark:text-slate-100"
            >
              <option value="">📚 Vincular à disciplina (opcional)</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  📚 {s.subject.name}
                </option>
              ))}
            </select>

            {folders.length > 0 && (
              <select
                aria-label="Pasta para o novo documento"
                value={uploadFolderId}
                onChange={(e) => setUploadFolderId(e.target.value)}
                className="min-h-8 w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-[#0d3950] focus:border-[#005063] focus:outline-hidden dark:border-slate-700 dark:bg-[#040f17] dark:text-slate-100"
              >
                <option value="">📁 Vincular ao caderno/pasta (opcional)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    📁 {f.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragActive(true)
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragActive(false)
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                void handleFileUpload(e.dataTransfer.files[0])
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-3 text-center transition ${
              dragActive
                ? 'border-[#006768] bg-[#005063]/10'
                : 'border-slate-300 hover:border-[#005063] hover:bg-slate-50 dark:border-slate-700 dark:hover:border-cyan-400/50 dark:hover:bg-[#040f17]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  void handleFileUpload(e.target.files[0])
                }
              }}
            />
            <Upload className="mx-auto mb-1 size-5 text-[#006768] dark:text-cyan-400" />
            <p className="text-xs font-extrabold text-[#0d3950] dark:text-slate-200">
              {isUploading ? 'Processando páginas...' : 'Enviar PDF, Slide ou Documento'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Extrai o texto e cita automaticamente a página de origem
            </p>
          </div>
        </div>

        {/* Lista de Documentos */}
        <div className="max-h-64 flex-1 space-y-1.5 overflow-y-auto p-2.5 lg:max-h-none">
          {loading ? (
            <div className="p-4 text-center text-xs text-slate-500">Carregando materiais...</div>
          ) : documents.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Nenhum documento encontrado. Envie um PDF ou apresentação para analisar com IA!
            </div>
          ) : (
            documents.map((doc) => {
              const isSelected = doc.id === selectedDocId
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`group flex cursor-pointer items-start justify-between rounded-xl border p-2.5 text-left transition ${
                    isSelected
                      ? 'border-[#006768] bg-[#dce6ef]/70 font-bold text-[#0d3950] shadow-2xs dark:border-cyan-500/60 dark:bg-[#081a26] dark:text-white'
                      : 'border-slate-200/80 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-[#040f17] dark:text-slate-300 dark:hover:bg-[#081a26]/60'
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-2.5">
                    <FileText
                      className={`mt-0.5 size-4 shrink-0 ${
                        isSelected ? 'text-[#006768] dark:text-cyan-400' : 'text-slate-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="break-words text-xs font-extrabold leading-snug">{doc.title}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                        {doc.student_subject_name || 'Geral'} • {doc.page_count}{' '}
                        {doc.page_count === 1 ? 'pág' : 'págs'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleDelete(doc.id, doc.title)
                    }}
                    className="rounded p-1 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-500"
                    title="Excluir documento"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Painel Principal: Análise Cognitiva & Leitura */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-white dark:bg-[#081a26]">
        {selectedDoc ? (
          <>
            {/* Header do Documento Selecionado */}
            <div className="flex flex-col justify-between gap-3 border-b border-slate-200 bg-slate-50/50 p-4 sm:flex-row sm:items-center dark:border-[#005063]/30 dark:bg-[#041019]/50">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-[#0d3950] px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-white uppercase dark:bg-[#005063]">
                    {selectedDoc.file_type.toUpperCase()}
                  </span>
                  <h1 className="break-words text-base font-black text-[#0d3950] sm:text-lg dark:text-white">
                    {selectedDoc.title}
                  </h1>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {selectedDoc.student_subject_name &&
                    `Disciplina: ${selectedDoc.student_subject_name} • `}
                  {selectedDoc.page_count} páginas indexadas
                  {selectedDoc.topic && ` • Tópico: ${selectedDoc.topic}`}
                </p>
              </div>

              {/* Botões de Ação da IA */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleRunAIAnalysis()}
                  disabled={analyzingAI}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-[#0d3950] px-3.5 py-1.5 text-xs font-extrabold text-white shadow-xs transition hover:bg-[#005063] disabled:opacity-50 dark:bg-[#005063] dark:hover:bg-[#006768]"
                >
                  <Sparkles className={`size-3.5 text-amber-300 ${analyzingAI ? 'animate-spin' : ''}`} />
                  {analyzingAI ? 'Analisando material...' : 'Análise Cognitiva Completa'}
                </button>

                <button
                  type="button"
                  onClick={() => void handleGenerateQuiz()}
                  disabled={generatingQuiz}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-extrabold text-[#0d3950] transition hover:bg-slate-100 disabled:opacity-50 dark:border-[#005063]/40 dark:bg-[#040f17] dark:text-slate-100 dark:hover:bg-[#0d3950]/40"
                >
                  <Brain className="size-3.5 text-amber-500" />
                  {generatingQuiz ? 'Criando Simulado...' : 'Simulado 10 Questões'}
                </button>
              </div>
            </div>

            {/* Abas do Hub Cognitivo */}
            <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50/80 px-3 text-xs dark:border-[#005063]/30 dark:bg-[#040f17]/60">
              {[
                { id: 'summary', label: '1. Resumo & Citações' },
                { id: 'complex', label: '2. Tópicos Complexos' },
                { id: 'concepts', label: '3. Conceitos & Flashcards' },
                { id: 'mentalmap', label: '4. Mapa Mental' },
                { id: 'roadmap', label: '5. Roteiro de Estudos' },
                { id: 'quiz', label: '6. Simulado (10Q)' },
                { id: 'reinforcement', label: '7. Reforço & Materiais' },
                { id: 'reader', label: 'Páginas do Documento' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`border-b-2 px-3 py-2.5 font-extrabold whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#006768] bg-white text-[#0d3950] dark:border-cyan-400 dark:bg-[#081a26] dark:text-white'
                      : 'border-transparent text-slate-500 hover:text-[#0d3950] dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mensagem Toast */}
            {message && (
              <div className="px-4 pt-3">
                <Alert tone={message.type === 'error' ? 'error' : 'success'}>{message.text}</Alert>
              </div>
            )}

            {/* Conteúdo da Aba */}
            <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6">
              {loadingDoc ? (
                <div className="flex h-48 items-center justify-center text-xs text-slate-500">
                  Carregando conteúdo...
                </div>
              ) : !analysis && activeTab !== 'reader' && activeTab !== 'quiz' ? (
                <div className="mx-auto max-w-md space-y-4 py-12 text-center">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#005063]/10 text-[#005063] dark:bg-cyan-400/15 dark:text-cyan-300">
                    <Sparkles className="size-6" />
                  </div>
                  <h3 className="text-base font-black text-[#0d3950] dark:text-white">
                    Análise Cognitiva Disponível
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Extraia resumo estruturado, explicação de tópicos complexos, exemplos práticos,
                    mapa mental, flashcards Anki e citações de página deste documento.
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleRunAIAnalysis()}
                    disabled={analyzingAI}
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#0d3950] px-5 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#005063] dark:bg-[#005063] dark:hover:bg-[#006768]"
                  >
                    <Sparkles className="size-4 text-amber-300" />
                    Iniciar Análise por IA
                  </button>
                </div>
              ) : (
                <>
                  {/* TAB 1: RESUMO */}
                  {activeTab === 'summary' && analysis && (
                    <div className="max-w-4xl space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="flex items-center gap-2 text-sm font-black text-[#0d3950] dark:text-white">
                          <BookOpen className="size-4 text-[#006768] dark:text-cyan-400" />
                          Síntese Conceitual Estruturada
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopy('summary', analysis.summary)}
                            className="inline-flex min-h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#040f17] dark:text-slate-200"
                          >
                            {copiedId === 'summary' ? (
                              <Check className="size-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                            Copiar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void handleSaveToNotes(`Resumo: ${selectedDoc.title}`, analysis.summary)
                            }
                            className="inline-flex min-h-8 items-center gap-1 rounded-xl bg-[#0d3950] px-3 text-xs font-extrabold text-white hover:bg-[#005063] dark:bg-[#005063]"
                          >
                            <Plus className="size-3.5" />
                            Enviar para Folha de Anotações
                          </button>
                        </div>
                      </div>

                      <div className=" rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs leading-relaxed whitespace-pre-wrap text-slate-800 dark:border-[#005063]/30 dark:bg-[#040f17]/60 dark:text-slate-200">
                        {analysis.summary}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: TÓPICOS COMPLEXOS */}
                  {activeTab === 'complex' && analysis && (
                    <div className="max-w-4xl space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="flex items-center gap-2 text-sm font-black text-[#0d3950] dark:text-white">
                          <HelpCircle className="size-4 text-amber-500" />
                          Explicação dos Tópicos Mais Complexos & Exemplos de Aplicação
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            const md = analysis.complex_topics
                              .map(
                                (t) =>
                                  `### ${t.topic} (${t.citation})\n\n${t.explanation}\n\n**Exemplo de Aplicação:**\n${t.example}`,
                              )
                              .join('\n\n---\n\n')
                            void handleSaveToNotes(`Tópicos Complexos: ${selectedDoc.title}`, md)
                          }}
                          className="inline-flex min-h-8 items-center gap-1 rounded-xl bg-[#0d3950] px-3 text-xs font-extrabold text-white hover:bg-[#005063] dark:bg-[#005063]"
                        >
                          <Plus className="size-3.5" />
                          Enviar para Folha de Anotações
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {analysis.complex_topics.map((item, idx) => (
                          <div
                            key={idx}
                            className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-[#005063]/30 dark:bg-[#040f17]/60"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <h4 className="text-sm font-black text-[#0d3950] dark:text-white">
                                {item.topic}
                              </h4>
                              <span className="shrink-0 rounded-full bg-[#005063]/10 px-2.5 py-0.5 text-[10px] font-extrabold text-[#0d3950] dark:bg-cyan-400/15 dark:text-cyan-300">
                                {item.citation}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                              {item.explanation}
                            </p>
                            <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                              <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                                💡 Exemplo Prático: {item.example}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: CONCEITOS-CHAVE & FLASHCARDS */}
                  {activeTab === 'concepts' && analysis && (
                    <div className="max-w-4xl space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="flex items-center gap-2 text-sm font-black text-[#0d3950] dark:text-white">
                          <Layers className="size-4 text-[#006768] dark:text-cyan-400" />
                          Conceitos-Chave Identificados
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void handleExportFlashcardsToAnki(analysis.key_concepts)}
                            className="inline-flex min-h-8 items-center gap-1.5 rounded-xl bg-[#0d3950] px-3.5 text-xs font-extrabold text-white hover:bg-[#005063] dark:bg-[#005063]"
                          >
                            <Brain className="size-3.5 text-amber-300" />
                            Gerar Flashcards Anki Concisos
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {analysis.key_concepts.map((kc, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-[#005063]/30 dark:bg-[#040f17]/60"
                          >
                            <div>
                              <div className="mb-1.5 flex items-center justify-between gap-2">
                                <span className="text-xs font-black text-[#0d3950] dark:text-white">
                                  {kc.term}
                                </span>
                                <span className="rounded-lg bg-[#005063]/10 px-2 py-0.5 text-[10px] font-bold text-[#0d3950] dark:bg-cyan-400/15 dark:text-cyan-300">
                                  {kc.citation}
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                {kc.definition}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: MAPA MENTAL */}
                  {activeTab === 'mentalmap' && analysis && (
                    <div className="max-w-4xl space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="flex items-center gap-2 text-sm font-black text-[#0d3950] dark:text-white">
                          <Sparkles className="size-4 text-amber-500" />
                          Mapa Mental Hierárquico
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleCopy('mermaid', analysis.mental_map_mermaid)}
                          className="inline-flex min-h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#040f17] dark:text-slate-200"
                        >
                          <Copy className="size-3.5" />
                          Copiar Estrutura Mermaid
                        </button>
                      </div>

                      <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-[#005063]/30 dark:bg-[#040f17]/50">
                        <div className="flex items-center justify-center">
                          <div className="rounded-xl bg-[#0d3950] px-4 py-2 text-center text-xs font-extrabold text-white shadow-xs dark:bg-[#005063]">
                            {selectedDoc.title}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-2 lg:grid-cols-3">
                          {analysis.key_concepts.map((c, i) => (
                            <div
                              key={i}
                              className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#081a26]"
                            >
                              <div className="mb-1 flex items-center gap-1.5 text-xs font-extrabold text-[#005063] dark:text-cyan-400">
                                <ArrowRight className="size-3" />
                                {c.term}
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                                {c.definition}
                              </p>
                              <span className="mt-2 inline-block rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                {c.citation}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: ROTEIRO DE ESTUDOS */}
                  {activeTab === 'roadmap' && analysis && (
                    <div className="max-w-4xl space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="flex items-center gap-2 text-sm font-black text-[#0d3950] dark:text-white">
                          <BookOpen className="size-4 text-emerald-500" />
                          Roteiro de Estudos Guiado por Metas
                        </h3>
                        <button
                          type="button"
                          onClick={() => {
                            const md = analysis.study_roadmap
                              .map(
                                (s) =>
                                  `### Passo ${s.step}: ${s.goal} (${s.recommended_pages})\n${s.action}`,
                              )
                              .join('\n\n')
                            void handleSaveToNotes(`Roteiro de Estudos: ${selectedDoc.title}`, md)
                          }}
                          className="inline-flex min-h-8 items-center gap-1 rounded-xl bg-[#0d3950] px-3 text-xs font-extrabold text-white hover:bg-[#005063] dark:bg-[#005063]"
                        >
                          <Plus className="size-3.5" />
                          Enviar para Folha de Anotações
                        </button>
                      </div>

                      <div className="space-y-3">
                        {analysis.study_roadmap.map((step) => (
                          <div
                            key={step.step}
                            className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#005063]/30 dark:bg-[#040f17]/60"
                          >
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {step.step}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                                <h4 className="text-xs font-extrabold text-[#0d3950] dark:text-white">
                                  {step.goal}
                                </h4>
                                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  {step.recommended_pages}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300">
                                {step.action}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 6: SIMULADO DE 10 QUESTÕES */}
                  {activeTab === 'quiz' && (
                    <div className="max-w-4xl space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="flex items-center gap-2 text-sm font-black text-[#0d3950] dark:text-white">
                            <Brain className="size-4 text-amber-500" />
                            Simulado de Fixação (10 Perguntas)
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Questões analíticas com citação da página do documento e diagnóstico de reforço.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleGenerateQuiz()}
                          disabled={generatingQuiz}
                          className="inline-flex min-h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-[#0d3950] hover:bg-slate-50 dark:border-slate-700 dark:bg-[#040f17] dark:text-slate-200"
                        >
                          <RefreshCw className={`size-3.5 ${generatingQuiz ? 'animate-spin' : ''}`} />
                          Gerar Novo Simulado
                        </button>
                      </div>

                      {currentQuiz ? (
                        <div className="space-y-6">
                          {quizResult && (
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#006768]/40 bg-[#005063]/10 p-4 dark:bg-[#005063]/20">
                              <div>
                                <h4 className="text-sm font-black text-[#0d3950] dark:text-white">
                                  Resultado do Simulado
                                </h4>
                                <p className="mt-0.5 text-xs text-slate-700 dark:text-slate-200">
                                  Você acertou <strong>{quizResult.score}</strong> de{' '}
                                  <strong>{quizResult.total_questions}</strong> questões (
                                  {quizResult.percentage}%).
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const text = quizResult.feedback
                                    .map(
                                      (f, i) =>
                                        `Questão ${i + 1}: ${f.is_correct ? 'Acertou' : 'Errou'}\n${f.explanation}`,
                                    )
                                    .join('\n\n')
                                  void handleSaveToNotes(
                                    `Resultado Simulado: ${selectedDoc.title}`,
                                    text,
                                  )
                                }}
                                className="rounded-xl bg-[#0d3950] px-3.5 py-2 text-xs font-extrabold text-white hover:bg-[#005063] dark:bg-[#005063]"
                              >
                                Enviar para Folha de Anotações
                              </button>
                            </div>
                          )}

                          <div className="space-y-4">
                            {currentQuiz.questions.map((q, idx) => {
                              const qId = String(q.id)
                              const userAns = quizAnswers[qId]
                              const feedback = quizResult?.feedback.find(
                                (f) => f.question_id === qId,
                              )

                              return (
                                <div
                                  key={q.id}
                                  className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#005063]/30 dark:bg-[#040f17]/60"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="text-xs leading-relaxed font-extrabold text-[#0d3950] dark:text-white">
                                      <span className="mr-1.5 font-black text-[#006768] dark:text-cyan-400">
                                        {idx + 1}.
                                      </span>
                                      {q.question}
                                    </h4>
                                    <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                      {q.citation}
                                    </span>
                                  </div>

                                  <div className="space-y-2">
                                    {q.options.map((opt, optIdx) => {
                                      const isSelected = userAns === optIdx
                                      let optionClass =
                                        'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60'

                                      if (feedback) {
                                        if (optIdx === q.correct_option_index) {
                                          optionClass =
                                            'border-emerald-500 bg-emerald-50 font-bold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
                                        } else if (isSelected && !feedback.is_correct) {
                                          optionClass =
                                            'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200'
                                        }
                                      } else if (isSelected) {
                                        optionClass =
                                          'border-[#006768] bg-[#005063]/10 font-bold text-[#0d3950] dark:border-cyan-400 dark:bg-cyan-400/15 dark:text-white'
                                      }

                                      return (
                                        <button
                                          key={optIdx}
                                          type="button"
                                          disabled={!!quizResult}
                                          onClick={() =>
                                            setQuizAnswers((prev) => ({ ...prev, [qId]: optIdx }))
                                          }
                                          className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left text-xs transition ${optionClass}`}
                                        >
                                          <span>{opt}</span>
                                          {feedback && optIdx === q.correct_option_index && (
                                            <CheckCircle2 className="ml-2 size-4 shrink-0 text-emerald-500" />
                                          )}
                                          {feedback && isSelected && !feedback.is_correct && (
                                            <XCircle className="ml-2 size-4 shrink-0 text-rose-500" />
                                          )}
                                        </button>
                                      )
                                    })}
                                  </div>

                                  {feedback && (
                                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-[#081a26] dark:text-slate-300">
                                      <p className="mb-0.5 font-extrabold text-[#0d3950] dark:text-white">
                                        💡 Justificativa Fundamentada:
                                      </p>
                                      <p>{feedback.explanation}</p>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {!quizResult && (
                            <button
                              type="button"
                              onClick={() => void handleSubmitQuiz()}
                              disabled={
                                submittingQuiz ||
                                Object.keys(quizAnswers).length < currentQuiz.questions.length
                              }
                              className="w-full rounded-xl bg-[#0d3950] py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#005063] disabled:opacity-50 dark:bg-[#005063]"
                            >
                              {submittingQuiz
                                ? 'Corrigindo...'
                                : Object.keys(quizAnswers).length < currentQuiz.questions.length
                                  ? `Responda todas as 10 perguntas (${Object.keys(quizAnswers).length}/10)`
                                  : 'Finalizar e Corrigir Simulado'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center dark:border-slate-800">
                          <Brain className="mx-auto mb-2 size-8 text-amber-500" />
                          <p className="text-xs font-extrabold text-[#0d3950] dark:text-white">
                            Nenhum simulado ativo no momento
                          </p>
                          <p className="mb-4 text-[11px] text-slate-500 dark:text-slate-400">
                            Gere 10 perguntas baseadas nas páginas deste documento.
                          </p>
                          <button
                            type="button"
                            onClick={() => void handleGenerateQuiz()}
                            disabled={generatingQuiz}
                            className="rounded-xl bg-[#0d3950] px-4 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-[#005063] dark:bg-[#005063]"
                          >
                            Gerar Simulado 10Q
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 7: REFORÇO & MATERIAIS COMPLEMENTARES */}
                  {activeTab === 'reinforcement' && analysis && (
                    <div className="max-w-4xl space-y-6">
                      <div className="space-y-3">
                        <h3 className="flex items-center gap-2 text-sm font-black text-rose-600 dark:text-rose-400">
                          <HelpCircle className="size-4" />
                          Assuntos que Precisam de Reforço
                        </h3>
                        <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/50 dark:bg-rose-950/20">
                          {analysis.reinforcement_topics.map((t, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                            >
                              <span className="font-bold text-rose-500">•</span>
                              <p>{t}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h3 className="flex items-center gap-2 text-sm font-black text-[#0d3950] dark:text-white">
                          <BookOpen className="size-4 text-[#006768] dark:text-cyan-400" />
                          Materiais Complementares Sugeridos pela IA
                        </h3>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {analysis.complementary_materials.map((mat, i) => (
                            <div
                              key={i}
                              className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-[#005063]/30 dark:bg-[#040f17]/60"
                            >
                              <span className="rounded bg-[#005063]/10 px-2 py-0.5 text-[10px] font-extrabold text-[#0d3950] dark:bg-cyan-400/15 dark:text-cyan-300">
                                {mat.type}
                              </span>
                              <h4 className="mt-2 text-xs font-extrabold text-[#0d3950] dark:text-white">
                                {mat.title}
                              </h4>
                              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                {mat.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: LEITOR DE PÁGINAS */}
                  {activeTab === 'reader' && (
                    <div className="max-w-4xl space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="flex items-center gap-2 text-sm font-black text-[#0d3950] dark:text-white">
                          <FileText className="size-4 text-[#006768] dark:text-cyan-400" />
                          Conteúdo Extraído por Página
                        </h3>
                        {selectedDoc.file_url && (
                          <a
                            href={selectedDoc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-bold text-[#005063] hover:underline dark:text-cyan-400"
                          >
                            <ExternalLink className="size-3.5" />
                            Abrir Arquivo Original
                          </a>
                        )}
                      </div>

                      {selectedDoc.pages && selectedDoc.pages.length > 0 ? (
                        <div className="space-y-4">
                          {selectedDoc.pages.map((p) => (
                            <div
                              key={p.id}
                              className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#005063]/30 dark:bg-[#040f17]/60"
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                                <span className="text-xs font-extrabold text-[#005063] dark:text-cyan-400">
                                  Página {p.page_number}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  ~{p.token_count} palavras
                                </span>
                              </div>
                              <p className="font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300">
                                {p.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="py-6 text-center text-xs text-slate-500">
                          Nenhum texto de página indexado para este arquivo.
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center space-y-3 p-8 text-center">
            <BookOpen className="size-12 text-slate-300 dark:text-slate-700" />
            <h3 className="text-base font-black text-[#0d3950] dark:text-slate-200">
              Selecione um Documento ou Faça Upload
            </h3>
            <p className="max-w-sm text-xs text-slate-500 dark:text-slate-400">
              Envie apresentações, apostilas ou livros para gerar resumos com citação de página,
              explicação de tópicos complexos, mapas mentais, simulados de 10 questões e flashcards
              Anki.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
