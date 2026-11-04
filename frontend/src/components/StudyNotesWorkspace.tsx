import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  Bold,
  Check,
  CheckSquare,
  ChevronDown,
  FileText,
  FolderPlus,
  Heading1,
  Heading2,
  Highlighter,
  Info,
  Italic,
  Lightbulb,
  List,
  ListOrdered,
  Palette,
  Plus,
  Quote,
  Search,
  SidebarClose,
  SidebarOpen,
  Sparkles,
  Strikethrough,
  Table as TableIcon,
  Trash2,
  Type,
  Underline,
} from 'lucide-react'
import type {
  AcademicReading,
  AcademicTask,
  StudentSubject,
  StudyFolder,
  StudyNote,
  StudyNotePayload,
} from '../api/types'
import {
  createStudyFolder,
  createStudyNote,
  deleteStudyFolder,
  deleteStudyNote,
  listStudyFolders,
  listStudyNotes,
  updateStudyFolder,
  updateStudyNote,
} from '../api/client'

const FOLDER_COLORS = [
  { label: 'Azul Profundo', value: 'navy', bg: 'bg-[#0d3950]' },
  { label: 'Petróleo', value: 'petrol', bg: 'bg-[#005063]' },
  { label: 'Pinheiro', value: 'pine', bg: 'bg-[#006768]' },
  { label: 'Ciano', value: 'cyan', bg: 'bg-cyan-600' },
  { label: 'Esmeralda', value: 'emerald', bg: 'bg-emerald-600' },
  { label: 'Âmbar', value: 'amber', bg: 'bg-amber-600' },
]

export type FontFamilyChoice =
  | 'inter'
  | 'montserrat'
  | 'comfortaa'
  | 'segoe'
  | 'arial'
  | 'merriweather'
  | 'mono'

const FONT_OPTIONS: { id: FontFamilyChoice; label: string; className: string; category: string }[] = [
  { id: 'inter', label: 'Inter (Padrão)', className: 'font-sans', category: 'Sans-serif' },
  { id: 'merriweather', label: 'Merriweather', className: 'font-merriweather', category: 'Leitura / Caderno' },
  { id: 'montserrat', label: 'Montserrat', className: 'font-montserrat', category: 'Geométrica' },
  { id: 'comfortaa', label: 'Comfortaa', className: 'font-comfortaa', category: 'Arredondada' },
  { id: 'segoe', label: 'Segoe UI', className: 'font-segoe', category: 'Moderna' },
  { id: 'arial', label: 'Arial', className: 'font-arial', category: 'Universal' },
  { id: 'mono', label: 'Monospace', className: 'font-mono', category: 'Técnica' },
]

const TEXT_COLORS = [
  { name: 'Padrão Escuro', hex: '#0d3950' },
  { name: 'Petróleo', hex: '#005063' },
  { name: 'Pinheiro', hex: '#006768' },
  { name: 'Esmeralda', hex: '#059669' },
  { name: 'Âmbar', hex: '#d97706' },
  { name: 'Rosa / Crítico', hex: '#e11d48' },
  { name: 'Roxo', hex: '#7c3aed' },
]

const HIGHLIGHT_COLORS = [
  { name: 'Marca-texto Amarelo', hex: '#fef08a', text: '#713f12' },
  { name: 'Marca-texto Verde', hex: '#bbf7d0', text: '#14532d' },
  { name: 'Marca-texto Ciano', hex: '#a5f3fc', text: '#164e63' },
  { name: 'Marca-texto Rosa', hex: '#fecdd3', text: '#881337' },
  { name: 'Marca-texto Lavanda', hex: '#ddd6fe', text: '#4c1d95' },
]

export type PaperStyleChoice = 'lined' | 'dotted' | 'clean'

export type StudyNotesWorkspaceProps = {
  activeSubject?: StudentSubject | null
  activeTask?: AcademicTask | null
  activeReading?: AcademicReading | null
  subjects?: StudentSubject[]
  tasks?: AcademicTask[]
  readings?: AcademicReading[]
  externalTemplate?: string | null
  onClearExternalTemplate?: () => void
}

function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatInlineMarkdownToHtml(line: string): string {
  return line
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/==(.+?)==/g, '<mark style="background-color:#fef08a;padding:1px 4px;border-radius:4px;">$1</mark>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(15,23,42,0.08);padding:2px 6px;border-radius:4px;font-family:monospace;">$1</code>')
}

/**
 * Converte tanto anotações antigas em Markdown quanto anotações já salvas em HTML visual
 * para HTML limpo renderizável diretamente na folha de anotações.
 */
function noteContentToVisualHtml(content: string): string {
  if (!content || !content.trim()) return ''
  const trimmed = content.trim()
  // Se já for um documento visual HTML salvo pelo bloco de anotações, preserva
  if (
    trimmed.startsWith('<p') ||
    trimmed.startsWith('<h1') ||
    trimmed.startsWith('<h2') ||
    trimmed.startsWith('<h3') ||
    trimmed.startsWith('<div') ||
    trimmed.startsWith('<ul') ||
    trimmed.startsWith('<ol') ||
    trimmed.startsWith('<blockquote')
  ) {
    return content
  }

  // Converte Markdown/ templates de metodologias ativas em blocos visuais ricos
  const lines = content.split('\n')
  const htmlParts: string[] = []
  let inList = false

  const closeList = () => {
    if (inList) {
      htmlParts.push('</ul>')
      inList = false
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    if (!line.trim()) {
      closeList()
      continue
    }

    if (line.startsWith('# ')) {
      closeList()
      htmlParts.push(
        `<h2 style="font-size:1.35rem;font-weight:800;margin:0.75rem 0 0.35rem;">${formatInlineMarkdownToHtml(escapeHtml(line.slice(2)))}</h2>`,
      )
      continue
    }
    if (line.startsWith('## ')) {
      closeList()
      htmlParts.push(
        `<h3 style="font-size:1.1rem;font-weight:800;margin:0.65rem 0 0.25rem;">${formatInlineMarkdownToHtml(escapeHtml(line.slice(3)))}</h3>`,
      )
      continue
    }
    if (line.startsWith('### ')) {
      closeList()
      htmlParts.push(
        `<h4 style="font-size:0.98rem;font-weight:700;margin:0.5rem 0 0.2rem;">${formatInlineMarkdownToHtml(escapeHtml(line.slice(4)))}</h4>`,
      )
      continue
    }
    if (line.startsWith('> ')) {
      closeList()
      const cleanQuote = line
        .replace(/^>\s*/, '')
        .replace(/^\[!(NOTE|TIP|WARNING|IMPORTANT)\]\s*/i, '')
      htmlParts.push(
        `<blockquote style="border-left:4px solid #006768;padding:0.5rem 0.85rem;margin:0.5rem 0;background:rgba(0,103,104,0.08);border-radius:0 0.65rem 0.65rem 0;">${formatInlineMarkdownToHtml(escapeHtml(cleanQuote))}</blockquote>`,
      )
      continue
    }
    if (/^[-*]\s+\[([ xX])\]\s+/.test(line)) {
      closeList()
      const checked = line.toLowerCase().includes('[x]')
      const itemText = line.replace(/^[-*]\s+\[([ xX])\]\s+/, '')
      htmlParts.push(
        `<div data-note-checklist="true" style="display:flex;align-items:center;gap:0.5rem;margin:0.3rem 0;"><input type="checkbox" ${checked ? 'checked' : ''} style="width:16px;height:16px;accent-color:#006768;cursor:pointer;" /><span>${formatInlineMarkdownToHtml(escapeHtml(itemText))}</span></div>`,
      )
      continue
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        htmlParts.push('<ul style="padding-left:1.35rem;list-style-type:disc;margin:0.4rem 0;">')
        inList = true
      }
      htmlParts.push(`<li>${formatInlineMarkdownToHtml(escapeHtml(line.slice(2)))}</li>`)
      continue
    }

    closeList()
    htmlParts.push(`<p style="margin:0.35rem 0;">${formatInlineMarkdownToHtml(line)}</p>`)
  }

  closeList()
  return htmlParts.join('')
}

function stripHtmlForPreview(raw: string): string {
  if (!raw) return ''
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function StudyNotesWorkspace({
  activeSubject,
  activeTask,
  activeReading,
  subjects = [],
  tasks = [],
  readings = [],
  externalTemplate,
  onClearExternalTemplate,
}: StudyNotesWorkspaceProps) {
  const [folders, setFolders] = useState<StudyFolder[]>([])
  const [notes, setNotes] = useState<StudyNote[]>([])
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all'>('all')
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Sidebar e estilo do bloco
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedFont, setSelectedFont] = useState<FontFamilyChoice>('inter')
  const [paperStyle, setPaperStyle] = useState<PaperStyleChoice>('lined')
  const [fontMenuOpen, setFontMenuOpen] = useState(false)
  const [colorMenuOpen, setColorMenuOpen] = useState(false)
  const [calloutMenuOpen, setCalloutMenuOpen] = useState(false)

  // Estados da anotação ativa
  const [editorTitle, setEditorTitle] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [editorFolderId, setEditorFolderId] = useState<string>('')
  const [editorSubjectId, setEditorSubjectId] = useState<string>('')
  const [editorTaskId, setEditorTaskId] = useState<string>('')
  const [editorReadingId, setEditorReadingId] = useState<string>('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  const [mobileView, setMobileView] = useState<'sidebar' | 'editor'>('sidebar')

  // Modal de pasta
  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [folderColor, setFolderColor] = useState('navy')
  const [folderIcon] = useState('folder')
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)

  const editorRef = useRef<HTMLDivElement>(null)
  const saveTimeoutRef = useRef<number | null>(null)
  const loadedNoteIdRef = useRef<string | null>(null)

  const searchInputId = useId()
  const folderNameInputId = useId()
  const editorFolderSelectId = useId()
  const editorSubjectSelectId = useId()
  const editorTaskSelectId = useId()
  const editorReadingSelectId = useId()

  // Sincroniza o conteúdo visual do contentEditable quando muda a nota selecionada
  const syncEditorDom = useCallback((rawContent: string) => {
    const html = noteContentToVisualHtml(rawContent)
    if (editorRef.current) {
      editorRef.current.innerHTML = html
    }
  }, [])

  // Carrega pastas e notas ao montar
  useEffect(() => {
    let alive = true
    async function init() {
      try {
        const [fetchedFolders, fetchedNotes] = await Promise.all([
          listStudyFolders(),
          listStudyNotes(),
        ])
        if (!alive) return
        setFolders(fetchedFolders)
        setNotes(fetchedNotes)

        if (fetchedNotes.length > 0) {
          const first = fetchedNotes[0]
          loadedNoteIdRef.current = first.id
          setActiveNoteId(first.id)
          setEditorTitle(first.title)
          const visualHtml = noteContentToVisualHtml(first.content)
          setEditorContent(visualHtml)
          setEditorFolderId(first.folder || '')
          setEditorSubjectId(first.student_subject || '')
          setEditorTaskId(first.task || '')
          setEditorReadingId(first.reading || '')
          window.setTimeout(() => syncEditorDom(visualHtml), 0)
        }
      } catch {
        if (!alive) return
        setError('Não foi possível carregar o bloco de anotações.')
      } finally {
        if (alive) setLoading(false)
      }
    }
    void init()
    return () => {
      alive = false
    }
  }, [syncEditorDom])

  const selectNote = useCallback(
    (note: StudyNote) => {
      loadedNoteIdRef.current = note.id
      setActiveNoteId(note.id)
      setEditorTitle(note.title)
      const visualHtml = noteContentToVisualHtml(note.content)
      setEditorContent(visualHtml)
      setEditorFolderId(note.folder || '')
      setEditorSubjectId(note.student_subject || '')
      setEditorTaskId(note.task || '')
      setEditorReadingId(note.reading || '')
      setSaveStatus('idle')
      setMobileView('editor')
      window.setTimeout(() => syncEditorDom(visualHtml), 0)
    },
    [syncEditorDom],
  )

  const triggerAutoSave = useCallback(
    (overrides?: Partial<StudyNotePayload>) => {
      if (!activeNoteId) return
      setSaveStatus('saving')
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = window.setTimeout(async () => {
        try {
          const currentDomHtml =
            overrides?.content !== undefined
              ? overrides.content
              : editorRef.current?.innerHTML ?? editorContent

          const payload: StudyNotePayload = {
            title:
              overrides?.title !== undefined ? overrides.title : editorTitle || 'Sem título',
            content: currentDomHtml,
            folder:
              overrides?.folder !== undefined
                ? overrides.folder
                : editorFolderId
                  ? editorFolderId
                  : null,
            student_subject:
              overrides?.student_subject !== undefined
                ? overrides.student_subject
                : editorSubjectId
                  ? editorSubjectId
                  : null,
            task:
              overrides?.task !== undefined
                ? overrides.task
                : editorTaskId
                  ? editorTaskId
                  : null,
            reading:
              overrides?.reading !== undefined
                ? overrides.reading
                : editorReadingId
                  ? editorReadingId
                  : null,
          }
          const updated = await updateStudyNote(activeNoteId, payload)
          setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
          setSaveStatus('saved')
        } catch {
          setSaveStatus('error')
        }
      }, 800)
    },
    [
      activeNoteId,
      editorTitle,
      editorContent,
      editorFolderId,
      editorSubjectId,
      editorTaskId,
      editorReadingId,
    ],
  )

  const handleCreateNote = useCallback(
    async (initialContent = '', initialTitle = 'Nova anotação', readingId?: string) => {
      try {
        setLoading(true)
        const visualContent = noteContentToVisualHtml(initialContent)
        const payload: StudyNotePayload = {
          title: initialTitle,
          content: visualContent,
          folder: selectedFolderId !== 'all' ? selectedFolderId : null,
          student_subject: activeSubject?.id || null,
          task: activeTask?.id || null,
          reading: readingId || activeReading?.id || null,
        }
        const created = await createStudyNote(payload)
        setNotes((prev) => [created, ...prev])
        selectNote(created)
        const updatedFolders = await listStudyFolders()
        setFolders(updatedFolders)
      } catch {
        setError('Erro ao criar nova anotação.')
      } finally {
        setLoading(false)
      }
    },
    [activeSubject, activeTask, activeReading, selectedFolderId, selectNote],
  )

  // Quando template externo (Feynman, Mapa Mental, Leitura) é injetado
  useEffect(() => {
    if (!externalTemplate) return
    const timer = window.setTimeout(() => {
      const convertedTemplate = noteContentToVisualHtml(externalTemplate)
      if (activeNoteId && editorRef.current) {
        const nextHtml = editorRef.current.innerHTML
          ? `${editorRef.current.innerHTML}<hr style="margin:1rem 0;border-color:rgba(148,163,184,0.3);" />${convertedTemplate}`
          : convertedTemplate
        editorRef.current.innerHTML = nextHtml
        setEditorContent(nextHtml)
        triggerAutoSave({ content: nextHtml })
      } else {
        void handleCreateNote(convertedTemplate, 'Anotação Guiada')
      }
      onClearExternalTemplate?.()
      setMobileView('editor')
    }, 0)
    return () => window.clearTimeout(timer)
  }, [
    externalTemplate,
    activeNoteId,
    triggerAutoSave,
    handleCreateNote,
    onClearExternalTemplate,
  ])

  const handleDeleteCurrentNote = async () => {
    if (!activeNoteId) return
    const confirmed = window.confirm('Deseja realmente excluir esta anotação?')
    if (!confirmed) return
    try {
      await deleteStudyNote(activeNoteId)
      const remaining = notes.filter((n) => n.id !== activeNoteId)
      setNotes(remaining)
      if (remaining.length > 0) {
        selectNote(remaining[0])
      } else {
        setActiveNoteId(null)
        setEditorTitle('')
        setEditorContent('')
        setMobileView('sidebar')
      }
      const updatedFolders = await listStudyFolders()
      setFolders(updatedFolders)
    } catch {
      setError('Erro ao excluir anotação.')
    }
  }

  const handleSaveFolder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!folderName.trim()) return
    try {
      if (editingFolderId) {
        const updated = await updateStudyFolder(editingFolderId, {
          name: folderName.trim(),
          color: folderColor,
          icon: folderIcon,
        })
        setFolders((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
      } else {
        const created = await createStudyFolder({
          name: folderName.trim(),
          color: folderColor,
          icon: folderIcon,
        })
        setFolders((prev) => [...prev, created])
        setSelectedFolderId(created.id)
      }
      setFolderModalOpen(false)
      setFolderName('')
      setEditingFolderId(null)
    } catch {
      setError('Erro ao salvar pasta.')
    }
  }

  const handleDeleteFolder = async (folderId: string) => {
    const confirmed = window.confirm(
      'Deseja excluir esta pasta? As anotações contidas não serão excluídas.',
    )
    if (!confirmed) return
    try {
      await deleteStudyFolder(folderId)
      setFolders((prev) => prev.filter((f) => f.id !== folderId))
      if (selectedFolderId === folderId) {
        setSelectedFolderId('all')
      }
      const freshNotes = await listStudyNotes()
      setNotes(freshNotes)
    } catch {
      setError('Erro ao excluir pasta.')
    }
  }

  // Comandos visuais WYSIWYG (aplicados diretamente na folha sem mostrar HTML)
  const applyVisualCommand = (command: string, value?: string) => {
    const el = editorRef.current
    if (!el) return
    el.focus()
    document.execCommand(command, false, value)
    const html = el.innerHTML
    setEditorContent(html)
    triggerAutoSave({ content: html })
  }

  const insertVisualHtmlBlock = (blockHtml: string) => {
    const el = editorRef.current
    if (!el) return
    el.focus()
    document.execCommand('insertHTML', false, blockHtml)
    const html = el.innerHTML
    setEditorContent(html)
    triggerAutoSave({ content: html })
  }

  const handleInsertChecklist = () => {
    insertVisualHtmlBlock(
      `<div data-note-checklist="true" style="display:flex;align-items:center;gap:0.5rem;margin:0.35rem 0;"><input type="checkbox" style="width:16px;height:16px;accent-color:#006768;cursor:pointer;" /><span>Item para revisar...</span></div><p><br/></p>`,
    )
  }

  const handleInsertCallout = (kind: 'note' | 'tip' | 'warning' | 'exam') => {
    const styles = {
      note: {
        border: '#005063',
        bg: 'rgba(0, 80, 99, 0.08)',
        title: '📌 Anotação de Aula',
      },
      tip: {
        border: '#10b981',
        bg: 'rgba(16, 185, 129, 0.10)',
        title: '💡 Dica / Exemplo Prático',
      },
      warning: {
        border: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.12)',
        title: '⚠️ Ponto de Atenção',
      },
      exam: {
        border: '#e11d48',
        bg: 'rgba(225, 29, 72, 0.10)',
        title: '🎯 Cai na Prova / Revisão Obrigatória',
      },
    }[kind]

    insertVisualHtmlBlock(
      `<div style="border-left:4px solid ${styles.border};background:${styles.bg};padding:0.75rem 1rem;border-radius:0 0.75rem 0.75rem 0;margin:0.65rem 0;"><strong>${styles.title}:</strong> Escreva aqui o ponto principal...</div><p><br/></p>`,
    )
    setCalloutMenuOpen(false)
  }

  const handleInsertTable = () => {
    insertVisualHtmlBlock(
      `<table style="width:100%;border-collapse:collapse;margin:0.75rem 0;font-size:0.875rem;"><thead><tr style="background:rgba(0,80,99,0.12);"><th style="border:1px solid rgba(148,163,184,0.4);padding:6px 10px;text-align:left;">Tópico / Conceito</th><th style="border:1px solid rgba(148,163,184,0.4);padding:6px 10px;text-align:left;">Explicação / Resumo</th></tr></thead><tbody><tr><td style="border:1px solid rgba(148,163,184,0.4);padding:6px 10px;">Conceito 1</td><td style="border:1px solid rgba(148,163,184,0.4);padding:6px 10px;"> Anotação...</td></tr><tr><td style="border:1px solid rgba(148,163,184,0.4);padding:6px 10px;">Conceito 2</td><td style="border:1px solid rgba(148,163,184,0.4);padding:6px 10px;"> Anotação...</td></tr></tbody></table><p><br/></p>`,
    )
  }

  const noteStats = useMemo(() => {
    const plain = stripHtmlForPreview(editorContent)
    const words = plain ? plain.split(/\s+/).filter(Boolean).length : 0
    const chars = plain.length
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200))
    return { words, chars, readingTimeMinutes }
  }, [editorContent])

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesFolder = selectedFolderId === 'all' || note.folder === selectedFolderId
      const plain = stripHtmlForPreview(note.content).toLowerCase()
      const matchesSearch =
        !searchQuery.trim() ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plain.includes(searchQuery.toLowerCase())
      return matchesFolder && matchesSearch
    })
  }, [notes, selectedFolderId, searchQuery])

  const activeFontClass = useMemo(() => {
    const found = FONT_OPTIONS.find((f) => f.id === selectedFont)
    return found ? found.className : 'font-sans'
  }, [selectedFont])

  const paperBackgroundStyle = useMemo((): React.CSSProperties => {
    if (paperStyle === 'lined') {
      return {
        backgroundImage:
          'repeating-linear-gradient(transparent, transparent 31px, rgba(148, 163, 184, 0.22) 31px, rgba(148, 163, 184, 0.22) 32px)',
        lineHeight: '32px',
      }
    }
    if (paperStyle === 'dotted') {
      return {
        backgroundImage: 'radial-gradient(rgba(148, 163, 184, 0.38) 1.2px, transparent 1.2px)',
        backgroundSize: '20px 20px',
        lineHeight: '28px',
      }
    }
    return {
      lineHeight: '28px',
    }
  }, [paperStyle])

  return (
    <section
      aria-label="Bloco de Anotações de Estudo"
      className="flex w-full flex-col rounded-3xl border border-slate-200 bg-white shadow-sm transition dark:border-[#005063]/30 dark:bg-[#081a26]"
    >
      {/* Barra Superior do Bloco de Anotações */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-6 dark:border-[#005063]/30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? 'Recolher menu de pastas' : 'Expandir menu de pastas'}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-[#005063] dark:border-slate-800 dark:bg-[#040f17] dark:text-slate-200 dark:hover:bg-[#081a26]"
          >
            {sidebarOpen ? (
              <>
                <SidebarClose className="size-4 text-[#005063] dark:text-[#006768]" />
                <span className="hidden sm:inline">Recolher Cadernos</span>
              </>
            ) : (
              <>
                <SidebarOpen className="size-4 text-[#005063] dark:text-[#006768]" />
                <span>Minhas Notas ({notes.length})</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <FileText className="size-4 text-[#006768] dark:text-cyan-400" />
            <h3 className="text-sm font-black tracking-tight text-[#0d3950] sm:text-base dark:text-slate-50">
              Bloco de Anotações
            </h3>
          </div>
        </div>

        {/* Estilo da Folha & Tipografia */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Estilo de Folha */}
          <div
            role="group"
            aria-label="Estilo da folha do caderno"
            className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-[#040f17]"
          >
            {(
              [
                { id: 'lined', label: 'Pautada' },
                { id: 'dotted', label: 'Pontilhada' },
                { id: 'clean', label: 'Folha Limpa' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPaperStyle(opt.id)}
                className={`inline-flex min-h-7 items-center rounded-lg px-2.5 text-xs font-bold transition ${
                  paperStyle === opt.id
                    ? 'bg-white text-[#0d3950] shadow-xs dark:bg-[#081a26] dark:text-slate-100'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Seletor de Fonte */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setFontMenuOpen((prev) => !prev)}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-[#040f17] dark:text-slate-100"
              title="Escolher fonte do caderno"
            >
              <Type className="size-3.5 text-[#005063] dark:text-[#006768]" />
              <span>{FONT_OPTIONS.find((f) => f.id === selectedFont)?.label || 'Fonte'}</span>
              <ChevronDown className="size-3 text-slate-400" />
            </button>

            {fontMenuOpen ? (
              <div className="absolute top-9.5 right-0 z-40 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-[#005063]/30 dark:bg-[#081a26]">
                <span className="block px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  Letra do Caderno
                </span>
                <div className="space-y-0.5">
                  {FONT_OPTIONS.map((f) => {
                    const isSelected = f.id === selectedFont
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setSelectedFont(f.id)
                          setFontMenuOpen(false)
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition ${
                          isSelected
                            ? 'bg-[#005063]/10 font-bold text-[#0d3950] dark:bg-[#005063]/30 dark:text-slate-100'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#040f17]'
                        } ${f.className}`}
                      >
                        <div>
                          <div>{f.label}</div>
                          <span className="text-[10px] text-slate-400">{f.category}</span>
                        </div>
                        {isSelected ? (
                          <Check className="size-3.5 text-[#006768] dark:text-[#005063]" />
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {/* Alternância mobile */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              type="button"
              onClick={() => setMobileView(mobileView === 'sidebar' ? 'editor' : 'sidebar')}
              className="inline-flex min-h-8 items-center rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-[#040f17] dark:text-slate-200"
            >
              {mobileView === 'sidebar' ? 'Abrir Folha →' : '← Notas'}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {/* Corpo Principal do Bloco de Anotações */}
      <div className="flex min-h-[640px] flex-1 overflow-hidden">
        {/* Coluna Lateral: Pastas e Lista de Anotações */}
        {sidebarOpen ? (
          <aside
            className={`w-full shrink-0 flex-col border-r border-slate-200 bg-slate-50/60 p-4 transition-all duration-300 lg:w-72 xl:w-80 dark:border-[#005063]/30 dark:bg-[#040f17]/40 ${
              mobileView === 'editor' ? 'hidden sm:flex' : 'flex'
            }`}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Pastas / Cadernos ({folders.length})
              </h4>
              <button
                type="button"
                onClick={() => {
                  setFolderName('')
                  setFolderColor('navy')
                  setEditingFolderId(null)
                  setFolderModalOpen(true)
                }}
                className="inline-flex min-h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold text-[#006768] transition hover:bg-[#005063]/10 dark:text-cyan-400 dark:hover:bg-[#081a26]"
              >
                <FolderPlus className="size-3.5" aria-hidden="true" />
                <span>Nova pasta</span>
              </button>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedFolderId('all')}
                className={`inline-flex min-h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition ${
                  selectedFolderId === 'all'
                    ? 'bg-[#0d3950] text-white shadow-xs dark:bg-[#005063]'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-[#081a26] dark:text-slate-300'
                }`}
              >
                <span>Todas</span>
                <span className="rounded-full bg-slate-200/60 px-1.5 py-0.2 text-[10px] text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                  {notes.length}
                </span>
              </button>
              {folders.map((f) => {
                const isSelected = selectedFolderId === f.id
                return (
                  <div key={f.id} className="group relative inline-flex items-center">
                    <button
                      type="button"
                      onClick={() => setSelectedFolderId(f.id)}
                      className={`inline-flex min-h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition ${
                        isSelected
                          ? 'bg-[#0d3950] text-white shadow-xs dark:bg-[#005063]'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-[#081a26] dark:text-slate-300'
                      }`}
                    >
                      <span>{f.name}</span>
                      <span className="rounded-full bg-slate-200/60 px-1.5 py-0.2 text-[10px] text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                        {f.notes_count}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        void handleDeleteFolder(f.id)
                      }}
                      className="ml-0.5 hidden text-slate-400 group-hover:inline-block hover:text-rose-500"
                      title="Excluir pasta"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="relative mt-3">
              <Search className="absolute top-2.5 left-3 size-3.5 text-slate-400" />
              <input
                id={searchInputId}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar nas anotações..."
                className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pr-3 pl-8 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#005063] focus:outline-hidden dark:border-slate-800 dark:bg-[#040f17] dark:text-slate-200"
              />
            </div>

            <div className="mt-3.5 flex items-center justify-between">
              <h4 className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Páginas de Anotação ({filteredNotes.length})
              </h4>
              <button
                type="button"
                onClick={() => void handleCreateNote()}
                className="inline-flex min-h-7 items-center gap-1 rounded-lg bg-[#0d3950] px-2.5 text-xs font-bold text-white transition hover:bg-[#005063] dark:bg-[#005063] dark:hover:bg-[#006768]"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                <span>Nova página</span>
              </button>
            </div>

            <div className="mt-2 flex-1 space-y-2 overflow-y-auto pr-1">
              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Carregando...</div>
              ) : filteredNotes.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  Nenhuma página de anotação encontrada.
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const isSelected = note.id === activeNoteId
                  const cleanPreview = stripHtmlForPreview(note.content)
                  return (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => selectNote(note)}
                      className={`flex w-full flex-col rounded-2xl border p-3 text-left transition ${
                        isSelected
                          ? 'border-[#006768] bg-[#dce6ef]/60 shadow-xs dark:border-cyan-500/60 dark:bg-[#081a26]'
                          : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-[#040f17] dark:hover:bg-[#081a26]/60'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <h5 className="truncate text-xs font-extrabold text-slate-900 dark:text-slate-100">
                          {note.title || 'Sem título'}
                        </h5>
                        <span className="shrink-0 text-[10px] text-slate-400">
                          {new Date(note.updated_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">
                        {cleanPreview ? cleanPreview.slice(0, 110) : 'Folha em branco...'}
                      </p>
                      {note.subject_name || note.reading_title ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {note.subject_name && (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-[#0d3950] dark:bg-[#041019] dark:text-cyan-300">
                              {note.subject_name}
                            </span>
                          )}
                          {note.reading_title && (
                            <span className="rounded-md bg-[#005063]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#005063] dark:bg-[#005063]/30 dark:text-slate-200">
                              📖 {note.reading_title}
                            </span>
                          )}
                        </div>
                      ) : null}
                    </button>
                  )
                })
              )}
            </div>
          </aside>
        ) : null}

        {/* Área Principal da Folha de Anotações */}
        <main
          className={`flex-1 flex-col p-4 sm:p-6 ${
            mobileView === 'sidebar' && sidebarOpen ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {activeNoteId ? (
            <div className="flex h-full flex-col">
              {/* Vínculos da Anotação (Pasta, Disciplina, Tarefa, Leitura) */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1">
                    <label
                      htmlFor={editorFolderSelectId}
                      className="text-xs font-bold text-slate-500 dark:text-slate-400"
                    >
                      Pasta:
                    </label>
                    <select
                      id={editorFolderSelectId}
                      value={editorFolderId}
                      onChange={(e) => {
                        const next = e.target.value
                        setEditorFolderId(next)
                        triggerAutoSave({ folder: next || null })
                      }}
                      className="min-h-8 max-w-[140px] truncate rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <option value="">(Sem pasta)</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <label
                      htmlFor={editorSubjectSelectId}
                      className="text-xs font-bold text-slate-500 dark:text-slate-400"
                    >
                      Disciplina:
                    </label>
                    <select
                      id={editorSubjectSelectId}
                      value={editorSubjectId}
                      onChange={(e) => {
                        const next = e.target.value
                        setEditorSubjectId(next)
                        triggerAutoSave({ student_subject: next || null })
                      }}
                      className="min-h-8 max-w-[170px] truncate rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <option value="">(Geral)</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.subject.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {tasks.length > 0 && (
                    <div className="flex items-center gap-1">
                      <label
                        htmlFor={editorTaskSelectId}
                        className="text-xs font-bold text-slate-500 dark:text-slate-400"
                      >
                        Tarefa:
                      </label>
                      <select
                        id={editorTaskSelectId}
                        value={editorTaskId}
                        onChange={(e) => {
                          const next = e.target.value
                          setEditorTaskId(next)
                          triggerAutoSave({ task: next || null })
                        }}
                        className="min-h-8 max-w-[150px] truncate rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="">(Nenhuma)</option>
                        {tasks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {readings.length > 0 && (
                    <div className="flex items-center gap-1">
                      <label
                        htmlFor={editorReadingSelectId}
                        className="text-xs font-bold text-slate-500 dark:text-slate-400"
                      >
                        Leitura:
                      </label>
                      <select
                        id={editorReadingSelectId}
                        value={editorReadingId}
                        onChange={(e) => {
                          const next = e.target.value
                          setEditorReadingId(next)
                          triggerAutoSave({ reading: next || null })
                        }}
                        className="min-h-8 max-w-[150px] truncate rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="">(Nenhuma)</option>
                        {readings.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => void handleDeleteCurrentNote()}
                  className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  title="Excluir página de anotação"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  <span>Excluir</span>
                </button>
              </div>

              {/* Barra de Ferramentas Visual (Aplica estilo diretamente na folha sem tags HTML visíveis) */}
              <div
                role="toolbar"
                aria-label="Ferramentas do bloco de anotações"
                className="mt-3 flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-2xs dark:border-slate-800 dark:bg-[#040f17]"
              >
                {/* Títulos */}
                <button
                  type="button"
                  onClick={() => applyVisualCommand('formatBlock', 'H2')}
                  className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-extrabold text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
                  title="Título de Seção"
                >
                  <Heading1 className="size-3.5" />
                  <span>Título</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyVisualCommand('formatBlock', 'H3')}
                  className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
                  title="Subtítulo"
                >
                  <Heading2 className="size-3.5" />
                  <span>Subtítulo</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyVisualCommand('formatBlock', 'P')}
                  className="inline-flex min-h-8 items-center rounded-lg px-2 text-xs font-semibold text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Texto normal"
                >
                  Texto
                </button>

                <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-800" />

                {/* Formatação de Texto Visual */}
                <button
                  type="button"
                  onClick={() => applyVisualCommand('bold')}
                  className="inline-flex min-h-8 w-8 items-center justify-center rounded-lg text-xs font-black text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
                  title="Negrito"
                >
                  <Bold className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyVisualCommand('italic')}
                  className="inline-flex min-h-8 w-8 items-center justify-center rounded-lg text-xs text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
                  title="Itálico"
                >
                  <Italic className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyVisualCommand('underline')}
                  className="inline-flex min-h-8 w-8 items-center justify-center rounded-lg text-xs text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
                  title="Sublinhado"
                >
                  <Underline className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyVisualCommand('strikeThrough')}
                  className="inline-flex min-h-8 w-8 items-center justify-center rounded-lg text-xs text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
                  title="Riscado"
                >
                  <Strikethrough className="size-3.5" />
                </button>

                <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-800" />

                {/* Marca-texto e Cores Visuais */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setColorMenuOpen((prev) => !prev)}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
                    title="Marca-texto e Cor da Caneta"
                  >
                    <Highlighter className="size-3.5 text-amber-500" />
                    <span>Marca-texto & Cor</span>
                  </button>

                  {colorMenuOpen && (
                    <div className="absolute top-9.5 left-0 z-40 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-[#005063]/40 dark:bg-[#081a26]">
                      <p className="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                        Marca-Texto (Selecione o texto e clique)
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {HIGHLIGHT_COLORS.map((h) => (
                          <button
                            key={h.hex}
                            type="button"
                            onClick={() => {
                              applyVisualCommand('hiliteColor', h.hex)
                              setColorMenuOpen(false)
                            }}
                            className="h-7 w-7 rounded-lg border border-black/10 transition hover:scale-105"
                            style={{ backgroundColor: h.hex }}
                            title={h.name}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() => {
                            applyVisualCommand('hiliteColor', 'transparent')
                            setColorMenuOpen(false)
                          }}
                          className="rounded-lg border border-slate-200 px-2 text-[10px] font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                        >
                          Limpar
                        </button>
                      </div>

                      <p className="mt-3 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">
                        Cor da Caneta
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {TEXT_COLORS.map((c) => (
                          <button
                            key={c.hex}
                            type="button"
                            onClick={() => {
                              applyVisualCommand('foreColor', c.hex)
                              setColorMenuOpen(false)
                            }}
                            className="h-6 w-6 rounded-full border border-white/20 shadow-xs transition hover:scale-110"
                            style={{ backgroundColor: c.hex }}
                            title={c.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-800" />

                {/* Listas e Checklists */}
                <button
                  type="button"
                  onClick={() => applyVisualCommand('insertUnorderedList')}
                  className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
                  title="Lista com marcadores"
                >
                  <List className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => applyVisualCommand('insertOrderedList')}
                  className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
                  title="Lista numerada"
                >
                  <ListOrdered className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleInsertChecklist}
                  className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
                  title="Inserir item de checklist clicável"
                >
                  <CheckSquare className="size-3.5 text-[#006768] dark:text-cyan-400" />
                  <span>Checklist</span>
                </button>

                <div className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-800" />

                {/* Blocos Visuais de Estudo (Post-it / Callouts) */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCalloutMenuOpen((prev) => !prev)}
                    className="inline-flex min-h-8 items-center gap-1 rounded-lg bg-[#0d3950]/10 px-2.5 text-xs font-extrabold text-[#0d3950] hover:bg-[#0d3950]/20 dark:bg-cyan-400/15 dark:text-cyan-300"
                    title="Inserir caixa de destaque na folha"
                  >
                    <Sparkles className="size-3.5" />
                    <span>Bloco de Destaque</span>
                  </button>

                  {calloutMenuOpen && (
                    <div className="absolute top-9.5 left-0 z-40 w-56 space-y-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl dark:border-[#005063]/40 dark:bg-[#081a26]">
                      <button
                        type="button"
                        onClick={() => handleInsertCallout('note')}
                        className="flex w-full items-center gap-2 rounded-xl p-2 text-left text-xs font-bold text-[#0d3950] hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        <Info className="size-4 text-[#005063]" />
                        <span>📌 Anotação de Aula</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertCallout('tip')}
                        className="flex w-full items-center gap-2 rounded-xl p-2 text-left text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                      >
                        <Lightbulb className="size-4" />
                        <span>💡 Dica / Exemplo Prático</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertCallout('warning')}
                        className="flex w-full items-center gap-2 rounded-xl p-2 text-left text-xs font-bold text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40"
                      >
                        <AlertTriangle className="size-4" />
                        <span>⚠️ Ponto de Atenção</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInsertCallout('exam')}
                        className="flex w-full items-center gap-2 rounded-xl p-2 text-left text-xs font-bold text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                      >
                        <Palette className="size-4" />
                        <span>🎯 Cai na Prova!</span>
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleInsertTable}
                  className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
                  title="Inserir tabela resumo"
                >
                  <TableIcon className="size-3.5" />
                  <span className="hidden md:inline">Tabela</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertVisualHtmlBlock(
                      `<blockquote style="border-left:4px solid #006768;padding:0.5rem 0.85rem;margin:0.5rem 0;background:rgba(0,103,104,0.08);border-radius:0 0.65rem 0.65rem 0;">Citação ou definição do livro...</blockquote><p><br/></p>`,
                    )
                  }
                  className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-200 dark:hover:bg-slate-800"
                  title="Inserir citação"
                >
                  <Quote className="size-3.5" />
                </button>
              </div>

              {/* FOLHA DE CADERNO REAL (Sem HTML puro, escrita direta e fluida) */}
              <div className="mt-4 flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-[#fcfbf7] shadow-inner dark:border-[#005063]/40 dark:bg-[#05131d]">
                {/* Cabeçalho da Folha (Título + Data) */}
                <div className="border-b-2 border-rose-400/30 px-6 pt-5 pb-3 sm:px-8 dark:border-cyan-500/25">
                  <input
                    type="text"
                    value={editorTitle}
                    onChange={(e) => {
                      const next = e.target.value
                      setEditorTitle(next)
                      triggerAutoSave({ title: next })
                    }}
                    placeholder="Título da sua anotação..."
                    aria-label="Título da anotação"
                    className={`w-full border-0 bg-transparent p-0 text-xl font-black tracking-tight text-[#0d3950] placeholder:text-slate-400 focus:ring-0 focus:outline-hidden sm:text-2xl dark:text-white ${activeFontClass}`}
                  />
                </div>

                {/* Corpo Editável da Folha */}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline="true"
                  aria-label="Folha de anotações"
                  onInput={(e) => {
                    const html = (e.currentTarget as HTMLDivElement).innerHTML
                    setEditorContent(html)
                    triggerAutoSave({ content: html })
                  }}
                  onClick={(e) => {
                    const target = e.target as HTMLElement
                    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'checkbox') {
                      const inp = target as HTMLInputElement
                      if (inp.checked) {
                        inp.setAttribute('checked', 'checked')
                      } else {
                        inp.removeAttribute('checked')
                      }
                      if (editorRef.current) {
                        const html = editorRef.current.innerHTML
                        setEditorContent(html)
                        triggerAutoSave({ content: html })
                      }
                    }
                  }}
                  style={paperBackgroundStyle}
                  data-placeholder="Comece a escrever suas anotações de aula, resumos ou ideias aqui..."
                  className={`min-h-[420px] flex-1 overflow-y-auto px-6 py-4 text-base text-slate-900 focus:outline-hidden sm:px-8 dark:text-slate-100 empty:before:text-slate-400 empty:before:content-[attr(data-placeholder)] ${activeFontClass}`}
                />
              </div>

              {/* Rodapé da Folha com Estatísticas e Status de Salvamento */}
              <footer className="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-3">
                  <span>
                    <strong>{noteStats.words}</strong> palavras
                  </span>
                  <span>·</span>
                  <span>
                    <strong>{noteStats.chars}</strong> caracteres
                  </span>
                  <span>·</span>
                  <span>
                    ~<strong>{noteStats.readingTimeMinutes}</strong> min de leitura
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span aria-live="polite" className="font-bold">
                    {saveStatus === 'saving' ? (
                      <span className="text-[#005063] dark:text-cyan-400">
                        Salvando no caderno...
                      </span>
                    ) : saveStatus === 'saved' ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        Salvo automaticamente ✓
                      </span>
                    ) : saveStatus === 'error' ? (
                      <span className="text-rose-600 dark:text-rose-400">Erro ao salvar</span>
                    ) : (
                      'Sincronizado'
                    )}
                  </span>
                </div>
              </footer>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-24 text-center">
              <span className="text-5xl">📒</span>
              <h4 className="mt-4 text-xl font-black text-[#0d3950] dark:text-slate-100">
                Seu Bloco de Anotações
              </h4>
              <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                Crie páginas de anotação por disciplina, destaque pontos importantes com marca-texto
                e organize tudo em folhas pautadas, pontilhadas ou limpas.
              </p>
              <button
                type="button"
                onClick={() => void handleCreateNote()}
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-[#0d3950] px-5 text-xs font-bold text-white shadow-sm hover:bg-[#005063] dark:bg-[#005063] dark:hover:bg-[#006768]"
              >
                <Plus className="size-4" aria-hidden="true" />
                Criar primeira página de anotação
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Modal de Nova Pasta */}
      {folderModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="folder-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-[#005063]/30 dark:bg-[#081a26]">
            <h3
              id="folder-modal-title"
              className="text-base font-black text-[#0d3950] dark:text-slate-50"
            >
              {editingFolderId ? 'Editar Pasta' : 'Nova Pasta de Anotações'}
            </h3>
            <form onSubmit={handleSaveFolder} className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor={folderNameInputId}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Nome da Pasta
                </label>
                <input
                  id={folderNameInputId}
                  type="text"
                  required
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="Ex: Resumos P1, Estrutura de Dados..."
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-[#040f17] dark:text-slate-100"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Cor de identificação
                </span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFolderColor(c.value)}
                      className={`size-6 rounded-full ${c.bg} transition ${
                        folderColor === c.value
                          ? 'ring-2 ring-[#006768] ring-offset-2 dark:ring-offset-slate-900'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFolderModalOpen(false)}
                  className="min-h-9 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-[#040f17]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-9 rounded-xl bg-[#0d3950] px-4 text-xs font-bold text-white hover:bg-[#005063] dark:bg-[#005063] dark:hover:bg-[#006768]"
                >
                  Salvar Pasta
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
