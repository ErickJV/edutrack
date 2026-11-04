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
  Folder,
  Layers,
  ArrowRight,
  RefreshCw,
  Plus,
  Trash2,
  ChevronRight,
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
}

export function StudyDocumentsHub({
  subjects,
  folders,
  onOpenNoteWithContent,
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
    loadDocuments()
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

    fetchDetail()
  }, [selectedDocId])

  const handleFileUpload = async (file: File) => {
    if (!file) return
    setIsUploading(true)
    setMessage(null)
    try {
      const doc = await uploadStudyDocument(file, {
        title: uploadTitle.trim() || file.name,
        student_subject: uploadSubjectId || undefined,
        folder: uploadFolderId || undefined,
        topic: uploadTopic.trim() || undefined,
      })
      setMessage({ type: 'success', text: `Documento "${doc.title}" enviado e processado com sucesso!` })
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
      loadDocuments()
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
        setMessage({ type: 'success', text: 'Conteúdo transferido para o seu Caderno de Anotações!' })
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

  const handleExportFlashcardsToAnki = async (concepts: Array<{ term: string; definition: string; citation: string }>) => {
    if (!concepts.length || !selectedDoc) return
    try {
      let count = 0
      for (const c of concepts) {
        await createFlashcard({
          front: `O que define ${c.term} no contexto de ${selectedDoc.title}?`,
          back: `• ${c.definition}\n• Fonte: ${c.citation}`,
          deck_name: selectedDoc.student_subject_name || selectedDoc.title,
          student_subject: selectedDoc.student_subject || null,
          hint: `Revisão do documento ${c.citation}`,
        })
        count++
      }
      setMessage({ type: 'success', text: `${count} flashcards gerados e adicionados ao seu deck Anki com sucesso!` })
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
    <div className="flex flex-col lg:flex-row h-full w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
      {/* Sidebar: Documentos & Upload */}
      <div className="w-full lg:w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              Central de Documentos
            </h2>
            <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
              {documents.length} docs
            </span>
          </div>

          {/* Filtro de Disciplina */}
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="">Todas as Disciplinas</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.subject.name}
              </option>
            ))}
          </select>

          {/* Busca */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar em arquivos e páginas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadDocuments()}
              className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Dropzone de Upload */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
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
                handleFileUpload(e.dataTransfer.files[0])
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-slate-300 dark:border-slate-700 hover:border-primary/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0])
                }
              }}
            />
            <Upload className="w-5 h-5 mx-auto text-primary mb-1 animate-pulse" />
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {isUploading ? 'Processando páginas...' : 'Upload de PDF ou Slide'}
            </p>
            <p className="text-[10px] text-slate-500">Extrai texto e organiza por páginas</p>
          </div>
        </div>

        {/* Lista de Documentos */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="p-4 text-center text-xs text-slate-500">Carregando materiais...</div>
          ) : documents.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Nenhum documento encontrado. Envie uma apresentação ou PDF para começar!
            </div>
          ) : (
            documents.map((doc) => {
              const isSelected = doc.id === selectedDocId
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  className={`group flex items-start justify-between p-2.5 rounded-lg text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/10 border border-primary/30 text-primary font-medium'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-transparent text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <FileText className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isSelected ? 'text-primary' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate leading-tight">{doc.title}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {doc.student_subject_name || 'Sem disciplina'} • {doc.page_count} {doc.page_count === 1 ? 'pág' : 'págs'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(doc.id, doc.title)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-slate-400 rounded transition-opacity"
                    title="Excluir documento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Main Panel: Análise Cognitiva & Leitura */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
        {selectedDoc ? (
          <>
            {/* Header do Documento Selecionado */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-slate-900">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                    {selectedDoc.file_type.toUpperCase()}
                  </span>
                  <h1 className="text-lg font-bold truncate text-slate-900 dark:text-white">
                    {selectedDoc.title}
                  </h1>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedDoc.student_subject_name && `Disciplina: ${selectedDoc.student_subject_name} • `}
                  {selectedDoc.page_count} páginas processadas
                  {selectedDoc.topic && ` • Tópico: ${selectedDoc.topic}`}
                </p>
              </div>

              {/* Botões de Ação da IA */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleRunAIAnalysis}
                  disabled={analyzingAI}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-white text-xs font-medium rounded-lg shadow-sm transition-all disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${analyzingAI ? 'animate-spin' : ''}`} />
                  {analyzingAI ? 'Analisando...' : 'Análise Cognitiva Completa'}
                </button>

                <button
                  onClick={handleGenerateQuiz}
                  disabled={generatingQuiz}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 transition-all disabled:opacity-50"
                >
                  <Brain className="w-3.5 h-3.5 text-amber-500" />
                  {generatingQuiz ? 'Criando Simulado...' : 'Simulado 10 Questões'}
                </button>
              </div>
            </div>

            {/* Abas do Hub Cognitivo */}
            <div className="flex items-center gap-1 px-4 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs bg-slate-50/50 dark:bg-slate-950/50">
              {[
                { id: 'summary', label: '1. Resumo & Citações' },
                { id: 'complex', label: '2. Tópicos Complexos' },
                { id: 'concepts', label: '3. Conceitos-Chave' },
                { id: 'mentalmap', label: '4. Mapa Mental' },
                { id: 'roadmap', label: '5. Roteiro de Estudos' },
                { id: 'quiz', label: '6. Simulado (10Q)' },
                { id: 'reinforcement', label: '7. Reforço & Materiais' },
                { id: 'reader', label: 'Páginas do Documento' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2.5 font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary bg-white dark:bg-slate-900'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mensagem Toast */}
            {message && (
              <div className="px-4 py-2">
                <Alert tone={message.type === 'error' ? 'error' : 'success'}>{message.text}</Alert>
              </div>
            )}

            {/* Conteúdo da Aba */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {loadingDoc ? (
                <div className="flex items-center justify-center h-48 text-slate-500 text-xs">
                  Carregando conteúdo...
                </div>
              ) : !analysis && activeTab !== 'reader' && activeTab !== 'quiz' ? (
                <div className="text-center py-12 max-w-md mx-auto space-y-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold">Análise Cognitiva Disponível</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Clique no botão abaixo para extrair conceitos, tópicos complexos, mapa mental e citações automáticas
                    de página deste material.
                  </p>
                  <button
                    onClick={handleRunAIAnalysis}
                    disabled={analyzingAI}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-primary/90 transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    Iniciar Análise por IA
                  </button>
                </div>
              ) : (
                <>
                  {/* TAB 1: RESUMO */}
                  {activeTab === 'summary' && analysis && (
                    <div className="space-y-4 max-w-4xl">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-primary" />
                          Síntese Conceitual Estruturada
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCopy('summary', analysis.summary)}
                            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                          >
                            {copiedId === 'summary' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            Copiar
                          </button>
                          <button
                            onClick={() =>
                              handleSaveToNotes(`Resumo: ${selectedDoc.title}`, analysis.summary)
                            }
                            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Salvar no Caderno
                          </button>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 prose prose-slate dark:prose-invert max-w-none text-xs leading-relaxed whitespace-pre-wrap">
                        {analysis.summary}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: TÓPICOS COMPLEXOS */}
                  {activeTab === 'complex' && analysis && (
                    <div className="space-y-4 max-w-4xl">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <HelpCircle className="w-4 h-4 text-amber-500" />
                          Explicação dos Tópicos Mais Complexos & Exemplos de Aplicação
                        </h3>
                        <button
                          onClick={() => {
                            const md = analysis.complex_topics
                              .map((t) => `### ${t.topic} (${t.citation})\n\n${t.explanation}\n\n**Exemplo de Aplicação:**\n${t.example}`)
                              .join('\n\n---\n\n')
                            handleSaveToNotes(`Tópicos Complexos: ${selectedDoc.title}`, md)
                          }}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Salvar no Caderno
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {analysis.complex_topics.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 space-y-2 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                {item.topic}
                              </h4>
                              <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full flex-shrink-0">
                                {item.citation}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                              {item.explanation}
                            </p>
                            <div className="mt-2 p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                              <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
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
                    <div className="space-y-4 max-w-4xl">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Layers className="w-4 h-4 text-blue-500" />
                          Glossário de Conceitos-Chave
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleExportFlashcardsToAnki(analysis.key_concepts)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary/90 font-medium"
                          >
                            <Brain className="w-3.5 h-3.5" />
                            Gerar Flashcards Anki
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {analysis.key_concepts.map((kc, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                  {kc.term}
                                </span>
                                <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                  {kc.citation}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
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
                    <div className="space-y-4 max-w-4xl">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          Mapa Mental Hierárquico
                        </h3>
                        <button
                          onClick={() => handleCopy('mermaid', analysis.mental_map_mermaid)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copiar Código Mermaid
                        </button>
                      </div>

                      {/* Visualização Estruturada em Cards Hierárquicos */}
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-4">
                        <div className="flex items-center justify-center">
                          <div className="px-4 py-2 rounded-lg bg-primary text-white font-bold text-xs text-center shadow">
                            {selectedDoc.title}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                          {analysis.key_concepts.map((c, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60"
                            >
                              <div className="flex items-center gap-1.5 text-primary text-xs font-semibold mb-1">
                                <ArrowRight className="w-3 h-3" />
                                {c.term}
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-400">{c.definition}</p>
                              <span className="inline-block mt-2 text-[10px] text-slate-500 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
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
                    <div className="space-y-4 max-w-4xl">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-emerald-500" />
                          Roteiro de Estudos Guiado por Metas
                        </h3>
                        <button
                          onClick={() => {
                            const md = analysis.study_roadmap
                              .map((s) => `### Passo ${s.step}: ${s.goal} (${s.recommended_pages})\n${s.action}`)
                              .join('\n\n')
                            handleSaveToNotes(`Roteiro de Estudos: ${selectedDoc.title}`, md)
                          }}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Salvar no Caderno
                        </button>
                      </div>

                      <div className="space-y-3">
                        {analysis.study_roadmap.map((step) => (
                          <div
                            key={step.step}
                            className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40"
                          >
                            <span className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center flex-shrink-0">
                              {step.step}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h4 className="font-semibold text-xs text-slate-900 dark:text-white">
                                  {step.goal}
                                </h4>
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                                  {step.recommended_pages}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400">{step.action}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 6: SIMULADO DE 10 QUESTÕES */}
                  {activeTab === 'quiz' && (
                    <div className="space-y-4 max-w-4xl">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <h3 className="font-semibold text-sm flex items-center gap-2">
                            <Brain className="w-4 h-4 text-amber-500" />
                            Simulado de Fixação (10 Perguntas)
                          </h3>
                          <p className="text-xs text-slate-500">
                            Perguntas aprofundadas com citações das páginas e diagnóstico de reforço.
                          </p>
                        </div>
                        <button
                          onClick={handleGenerateQuiz}
                          disabled={generatingQuiz}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${generatingQuiz ? 'animate-spin' : ''}`} />
                          Gerar Novo Simulado
                        </button>
                      </div>

                      {currentQuiz ? (
                        <div className="space-y-6">
                          {/* Resumo do Resultado se já finalizou */}
                          {quizResult && (
                            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between">
                              <div>
                                <h4 className="font-bold text-sm text-primary">Resultado do Simulado</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                                  Você acertou <strong>{quizResult.score}</strong> de <strong>{quizResult.total_questions}</strong> questões ({quizResult.percentage}%).
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  const text = quizResult.feedback
                                    .map((f, i) => `Questão ${i + 1}: ${f.is_correct ? 'Acertou' : 'Errou'}\n${f.explanation}`)
                                    .join('\n\n')
                                  handleSaveToNotes(`Resultado Simulado: ${selectedDoc.title}`, text)
                                }}
                                className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white font-medium"
                              >
                                Salvar no Caderno
                              </button>
                            </div>
                          )}

                          {/* Lista das 10 Perguntas */}
                          <div className="space-y-4">
                            {currentQuiz.questions.map((q, idx) => {
                              const qId = String(q.id)
                              const userAns = quizAnswers[qId]
                              const feedback = quizResult?.feedback.find((f) => f.question_id === qId)

                              return (
                                <div
                                  key={q.id}
                                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-3"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className="font-semibold text-xs text-slate-900 dark:text-white leading-relaxed">
                                      <span className="text-primary font-bold mr-1.5">{idx + 1}.</span>
                                      {q.question}
                                    </h4>
                                    <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded flex-shrink-0">
                                      {q.citation}
                                    </span>
                                  </div>

                                  {/* Opções */}
                                  <div className="space-y-2">
                                    {q.options.map((opt, optIdx) => {
                                      const isSelected = userAns === optIdx
                                      let optionClass =
                                        'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'

                                      if (feedback) {
                                        if (optIdx === q.correct_option_index) {
                                          optionClass =
                                            'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium'
                                        } else if (isSelected && !feedback.is_correct) {
                                          optionClass =
                                            'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200'
                                        }
                                      } else if (isSelected) {
                                        optionClass = 'border-primary bg-primary/10 text-primary font-medium'
                                      }

                                      return (
                                        <button
                                          key={optIdx}
                                          disabled={!!quizResult}
                                          onClick={() =>
                                            setQuizAnswers((prev) => ({ ...prev, [qId]: optIdx }))
                                          }
                                          className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition-all ${optionClass}`}
                                        >
                                          <span>{opt}</span>
                                          {feedback && optIdx === q.correct_option_index && (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 ml-2" />
                                          )}
                                          {feedback && isSelected && !feedback.is_correct && (
                                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 ml-2" />
                                          )}
                                        </button>
                                      )
                                    })}
                                  </div>

                                  {/* Explicação e Citação após submeter */}
                                  {feedback && (
                                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                                      <p className="font-semibold text-slate-900 dark:text-white mb-0.5">
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
                              onClick={handleSubmitQuiz}
                              disabled={submittingQuiz || Object.keys(quizAnswers).length < currentQuiz.questions.length}
                              className="w-full py-3 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
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
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          <Brain className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                          <p className="text-xs font-semibold">Nenhum simulado ativo no momento</p>
                          <p className="text-[11px] text-slate-500 mb-4">
                            Clique abaixo para gerar 10 perguntas baseadas nas páginas deste documento.
                          </p>
                          <button
                            onClick={handleGenerateQuiz}
                            disabled={generatingQuiz}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs rounded-lg shadow-sm"
                          >
                            Gerar Simulado 10Q
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 7: REFORÇO & MATERIAIS COMPLEMENTARES */}
                  {activeTab === 'reinforcement' && analysis && (
                    <div className="space-y-6 max-w-4xl">
                      {/* Assuntos que precisam de reforço */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2 text-red-600 dark:text-red-400">
                          <HelpCircle className="w-4 h-4" />
                          Assuntos que Precisam de Reforço
                        </h3>
                        <div className="p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 space-y-2">
                          {analysis.reinforcement_topics.map((t, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                              <span className="text-red-500 font-bold">•</span>
                              <p>{t}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Materiais Complementares Sugeridos */}
                      <div className="space-y-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2 text-primary">
                          <BookOpen className="w-4 h-4" />
                          Pesquisa de Materiais Complementares Sugeridos pela IA
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {analysis.complementary_materials.map((mat, i) => (
                            <div
                              key={i}
                              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40"
                            >
                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                {mat.type}
                              </span>
                              <h4 className="font-bold text-xs mt-2 text-slate-900 dark:text-white">
                                {mat.title}
                              </h4>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
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
                    <div className="space-y-4 max-w-4xl">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                          <FileText className="w-4 h-4 text-primary" />
                          Conteúdo Extraído por Página
                        </h3>
                        {selectedDoc.file_url && (
                          <a
                            href={selectedDoc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Abrir Arquivo Original
                          </a>
                        )}
                      </div>

                      {selectedDoc.pages && selectedDoc.pages.length > 0 ? (
                        <div className="space-y-4">
                          {selectedDoc.pages.map((p) => (
                            <div
                              key={p.id}
                              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2"
                            >
                              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                <span className="font-bold text-xs text-primary">
                                  Página {p.page_number}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  ~{p.token_count} palavras
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-mono">
                                {p.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 py-6 text-center">
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
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700" />
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
              Selecione um Documento ou Faça Upload
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Envie apresentações, apostilas ou livros para desbloquear resumos automáticos, mapas mentais, simulados
              completos e flashcards.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
