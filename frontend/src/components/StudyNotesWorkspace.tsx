import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code,
  Columns2,
  Copy,
  Eye,
  FileEdit,
  FolderPlus,
  Highlighter,
  Info,
  Italic,
  Lightbulb,
  List,
  ListOrdered,
  Palette,
  Pipette,
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
  { label: 'Índigo', value: 'indigo', bg: 'bg-indigo-500' },
  { label: 'Ciano', value: 'cyan', bg: 'bg-cyan-500' },
  { label: 'Esmeralda', value: 'emerald', bg: 'bg-emerald-500' },
  { label: 'Âmbar', value: 'amber', bg: 'bg-amber-500' },
  { label: 'Rosa', value: 'rose', bg: 'bg-rose-500' },
  { label: 'Roxo', value: 'purple', bg: 'bg-purple-500' },
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
  { id: 'montserrat', label: 'Montserrat', className: 'font-montserrat', category: 'Geométrica' },
  { id: 'comfortaa', label: 'Comfortaa', className: 'font-comfortaa', category: 'Arredondada' },
  { id: 'segoe', label: 'Segoe UI', className: 'font-segoe', category: 'Moderna' },
  { id: 'arial', label: 'Arial', className: 'font-arial', category: 'Universal' },
  { id: 'merriweather', label: 'Merriweather', className: 'font-merriweather', category: 'Acadêmica Serif' },
  { id: 'mono', label: 'Fira / JetBrains Mono', className: 'font-mono', category: 'Código' },
]

const COLOR_PRESETS = [
  { name: 'Índigo', hex: '#6366F1' },
  { name: 'Ciano', hex: '#06B6D4' },
  { name: 'Esmeralda', hex: '#10B981' },
  { name: 'Âmbar / Amarelo', hex: '#F59E0B' },
  { name: 'Laranja', hex: '#F97316' },
  { name: 'Rosa', hex: '#EC4899' },
  { name: 'Roxo', hex: '#8B5CF6' },
  { name: 'Vermelho', hex: '#EF4444' },
  { name: 'Grafite', hex: '#475569' },
]

export type ViewModeChoice = 'edit' | 'preview' | 'split'

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

  // Sidebar collapsible state
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Editor styling & view states
  const [selectedFont, setSelectedFont] = useState<FontFamilyChoice>('inter')
  const [fontMenuOpen, setFontMenuOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewModeChoice>('edit')
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [colorTarget, setColorTarget] = useState<'text' | 'highlight'>('text')
  const [customColor, setCustomColor] = useState('#6366F1')
  const [calloutMenuOpen, setCalloutMenuOpen] = useState(false)
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null)

  // Editor states
  const [editorTitle, setEditorTitle] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [editorFolderId, setEditorFolderId] = useState<string>('')
  const [editorSubjectId, setEditorSubjectId] = useState<string>('')
  const [editorTaskId, setEditorTaskId] = useState<string>('')
  const [editorReadingId, setEditorReadingId] = useState<string>('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Mobile navigation view: 'sidebar' | 'editor'
  const [mobileView, setMobileView] = useState<'sidebar' | 'editor'>('sidebar')

  // Modals
  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [folderColor, setFolderColor] = useState('indigo')
  const [folderIcon, setFolderIcon] = useState('folder')
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimeoutRef = useRef<number | null>(null)

  const searchInputId = useId()
  const folderNameInputId = useId()
  const editorFolderSelectId = useId()
  const editorSubjectSelectId = useId()
  const editorTaskSelectId = useId()
  const editorReadingSelectId = useId()

  // Load folders and notes on mount
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

        // Auto-select first note if none selected
        if (fetchedNotes.length > 0) {
          const first = fetchedNotes[0]
          setActiveNoteId(first.id)
          setEditorTitle(first.title)
          setEditorContent(first.content)
          setEditorFolderId(first.folder || '')
          setEditorSubjectId(first.student_subject || '')
          setEditorTaskId(first.task || '')
          setEditorReadingId(first.reading || '')
        }
      } catch {
        if (!alive) return
        setError('Não foi possível carregar o caderno de anotações.')
      } finally {
        if (alive) setLoading(false)
      }
    }
    void init()
    return () => {
      alive = false
    }
  }, [])

  // Switch active note
  const selectNote = useCallback((note: StudyNote) => {
    setActiveNoteId(note.id)
    setEditorTitle(note.title)
    setEditorContent(note.content)
    setEditorFolderId(note.folder || '')
    setEditorSubjectId(note.student_subject || '')
    setEditorTaskId(note.task || '')
    setEditorReadingId(note.reading || '')
    setSaveStatus('idle')
    setMobileView('editor')
  }, [])

  // Auto-save debounce
  const triggerAutoSave = useCallback(
    (overrides?: Partial<StudyNotePayload>) => {
      if (!activeNoteId) return
      setSaveStatus('saving')
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
      }
      saveTimeoutRef.current = window.setTimeout(async () => {
        try {
          const payload: StudyNotePayload = {
            title: overrides?.title !== undefined ? overrides.title : editorTitle || 'Sem título',
            content: overrides?.content !== undefined ? overrides.content : editorContent,
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
      }, 1000)
    },
    [activeNoteId, editorTitle, editorContent, editorFolderId, editorSubjectId, editorTaskId, editorReadingId],
  )

  // Create new note
  const handleCreateNote = useCallback(
    async (initialContent = '', initialTitle = 'Nova anotação', readingId?: string) => {
      try {
        setLoading(true)
        const payload: StudyNotePayload = {
          title: initialTitle,
          content: initialContent,
          folder: selectedFolderId !== 'all' ? selectedFolderId : null,
          student_subject: activeSubject?.id || null,
          task: activeTask?.id || null,
          reading: readingId || activeReading?.id || null,
        }
        const created = await createStudyNote(payload)
        setNotes((prev) => [created, ...prev])
        selectNote(created)
        // Refresh folder counts
        const updatedFolders = await listStudyFolders()
        setFolders(updatedFolders)
      } catch {
        setError('Erro ao criar anotação.')
      } finally {
        setLoading(false)
      }
    },
    [activeSubject, activeTask, activeReading, selectedFolderId, selectNote],
  )

  // When external template injected from methodology selector or reading
  useEffect(() => {
    if (!externalTemplate) return
    const timer = window.setTimeout(() => {
      if (activeNoteId) {
        setEditorContent((prev) => {
          const newContent = prev ? `${prev}\n\n${externalTemplate}` : externalTemplate
          triggerAutoSave({ content: newContent })
          return newContent
        })
      } else {
        void handleCreateNote(externalTemplate)
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

  // Delete current note
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

  // Save Folder modal submit
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

  // Delete folder
  const handleDeleteFolder = async (folderId: string) => {
    const confirmed = window.confirm(
      'Deseja excluir esta pasta? As anotações contidas não serão excluídas, mas ficarão desvinculadas.',
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

  // Insert formatting into textarea
  const insertFormatting = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = editorContent.substring(start, end)
    const replacement = `${prefix}${selected}${suffix}`
    const newContent =
      editorContent.substring(0, start) + replacement + editorContent.substring(end)
    setEditorContent(newContent)
    triggerAutoSave({ content: newContent })

    // Restore focus and cursor
    window.setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, end + prefix.length)
    }, 0)
  }

  // EyeDropper API handler
  const handlePickColorFromScreen = async () => {
    try {
      if ('EyeDropper' in window) {
        const EyeDropperClass = (
          window as unknown as {
            EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> }
          }
        ).EyeDropper
        const eyeDropper = new EyeDropperClass()
        const result = await eyeDropper.open()
        if (result?.sRGBHex) {
          setCustomColor(result.sRGBHex)
        }
      }
    } catch {
      // User cancelled eye dropper
    }
  }

  // Apply custom color from picker
  const handleApplyColor = () => {
    if (colorTarget === 'text') {
      insertFormatting(`<span style="color: ${customColor}; font-weight: 600;">`, '</span>')
    } else {
      insertFormatting(`<mark style="background-color: ${customColor}; padding: 2px 4px; border-radius: 4px;">`, '</mark>')
    }
    setColorPickerOpen(false)
  }

  // Word & Character count calculation
  const noteStats = useMemo(() => {
    const trimmed = editorContent.trim()
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0
    const chars = editorContent.length
    const readingTimeMinutes = Math.max(1, Math.ceil(words / 200))
    return { words, chars, readingTimeMinutes }
  }, [editorContent])

  // Filtered notes by folder and search
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const matchesFolder = selectedFolderId === 'all' || note.folder === selectedFolderId
      const matchesSearch =
        !searchQuery.trim() ||
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFolder && matchesSearch
    })
  }, [notes, selectedFolderId, searchQuery])

  // Active font class helper
  const activeFontClass = useMemo(() => {
    const found = FONT_OPTIONS.find((f) => f.id === selectedFont)
    return found ? found.className : 'font-sans'
  }, [selectedFont])

  // Simple and clean Rich Markdown Parser for Preview
  const renderFormattedPreview = useCallback((content: string) => {
    if (!content.trim()) {
      return (
        <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
          Nenhum conteúdo para visualização. Escreva algo no editor!
        </div>
      )
    }

    const lines = content.split('\n')
    const elements: React.ReactNode[] = []
    let inCodeBlock = false
    let codeBlockLang = ''
    let codeBlockContent: string[] = []
    let inTable = false
    let tableRows: string[][] = []
    let inList = false
    let listItems: React.ReactNode[] = []

    const flushList = () => {
      if (inList && listItems.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="my-3 space-y-1.5 pl-5 list-disc text-sm text-slate-800 dark:text-slate-200">
            {listItems}
          </ul>
        )
        inList = false
        listItems = []
      }
    }

    const flushTable = () => {
      if (inTable && tableRows.length > 0) {
        const headerRow = tableRows[0]
        const bodyRows = tableRows.slice(1).filter((r) => !r.every((c) => c.match(/^[-:]+$/)))
        elements.push(
          <div key={`table-${elements.length}`} className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100 text-slate-900 font-bold dark:bg-slate-800 dark:text-slate-100">
                <tr>
                  {headerRow.map((cell, idx) => (
                    <th key={idx} className="border-b border-slate-200 px-3 py-2 dark:border-slate-700">
                      {parseInlineFormatting(cell.trim())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-slate-700 dark:text-slate-300">
                        {parseInlineFormatting(cell.trim())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        inTable = false
        tableRows = []
      }
    }

    const parseInlineFormatting = (text: string): React.ReactNode => {
      const parts: React.ReactNode[] = []
      let cursor = 0
      const tokenRegex =
        /(==[^=]+==|<b>.*?<\/b>|\*\*.*?\*\*|<u>.*?<\/u>|~~.*?~~|\*.*?\*|<mark(?: style="([^"]*)")?(?: class="([^"]*)")?>([\s\S]*?)<\/mark>|<span(?: style="([^"]*)")?(?: class="([^"]*)")?>([\s\S]*?)<\/span>|`[^`]+`)/g
      let match: RegExpExecArray | null

      while ((match = tokenRegex.exec(text)) !== null) {
        if (match.index > cursor) {
          parts.push(text.substring(cursor, match.index))
        }
        const full = match[0]

        if (full.startsWith('==') && full.endsWith('==')) {
          parts.push(
            <mark key={match.index} className="rounded bg-yellow-200/90 px-1 py-0.5 text-yellow-950 dark:bg-yellow-900/60 dark:text-yellow-200">
              {full.slice(2, -2)}
            </mark>
          )
        } else if (full.startsWith('**') && full.endsWith('**')) {
          parts.push(<strong key={match.index} className="font-bold text-slate-950 dark:text-slate-50">{full.slice(2, -2)}</strong>)
        } else if (full.startsWith('<u>') && full.endsWith('</u>')) {
          parts.push(<u key={match.index} className="underline decoration-slate-400">{full.slice(3, -4)}</u>)
        } else if (full.startsWith('~~') && full.endsWith('~~')) {
          parts.push(<del key={match.index} className="line-through text-slate-400">{full.slice(2, -2)}</del>)
        } else if (full.startsWith('*') && full.endsWith('*')) {
          parts.push(<em key={match.index} className="italic">{full.slice(1, -1)}</em>)
        } else if (full.startsWith('<mark')) {
          const markStyle = match[1] || ''
          const markClass = match[2] || ''
          const markContent = match[3] || ''
          parts.push(
            <mark key={match.index} className={markClass} style={markStyle ? parseStyleString(markStyle) : undefined}>
              {markContent}
            </mark>
          )
        } else if (full.startsWith('<span')) {
          const spanStyle = match[4] || ''
          const spanClass = match[5] || ''
          const spanContent = match[6] || ''
          parts.push(
            <span key={match.index} className={spanClass} style={spanStyle ? parseStyleString(spanStyle) : undefined}>
              {spanContent}
            </span>
          )
        } else if (full.startsWith('`') && full.endsWith('`')) {
          parts.push(
            <code key={match.index} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-indigo-600 dark:bg-slate-800 dark:text-indigo-400">
              {full.slice(1, -1)}
            </code>
          )
        }
        cursor = tokenRegex.lastIndex
      }

      if (cursor < text.length) {
        parts.push(text.substring(cursor))
      }
      return parts.length > 0 ? parts : text
    }

    const parseStyleString = (styleStr: string): React.CSSProperties => {
      const styles: Record<string, string> = {}
      styleStr.split(';').forEach((rule) => {
        const [k, v] = rule.split(':')
        if (k && v) {
          const camelKey = k.trim().replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
          styles[camelKey] = v.trim()
        }
      })
      return styles as React.CSSProperties
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Code blocks
      if (line.startsWith('```')) {
        flushList()
        flushTable()
        if (inCodeBlock) {
          const codeText = codeBlockContent.join('\n')
          const blockIdx = elements.length
          elements.push(
            <div key={`code-${blockIdx}`} className="relative my-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-50 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/80 px-4 py-1.5 text-[11px] text-slate-400">
                <span>{codeBlockLang || 'código'}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(codeText)
                    setCopiedCodeIndex(blockIdx)
                    setTimeout(() => setCopiedCodeIndex(null), 2000)
                  }}
                  className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition"
                >
                  {copiedCodeIndex === blockIdx ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                  {copiedCodeIndex === blockIdx ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto leading-relaxed">
                <code>{codeText}</code>
              </pre>
            </div>
          )
          inCodeBlock = false
          codeBlockContent = []
        } else {
          inCodeBlock = true
          codeBlockLang = line.replace('```', '').trim()
        }
        continue
      }

      if (inCodeBlock) {
        codeBlockContent.push(line)
        continue
      }

      // Tables
      if (line.includes('|') && line.trim().startsWith('|') && line.trim().endsWith('|')) {
        flushList()
        inTable = true
        const rowCells = line.trim().slice(1, -1).split('|')
        tableRows.push(rowCells)
        continue
      } else if (inTable) {
        flushTable()
      }

      // Callouts / Blockquotes
      if (line.startsWith('>')) {
        flushList()
        flushTable()
        const quoteContent = line.replace(/^>\s?/, '')

        if (quoteContent.startsWith('[!NOTE]')) {
          elements.push(
            <div key={`callout-note-${i}`} className="my-3 flex items-start gap-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 text-xs text-indigo-950 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200">
              <Info className="size-4 shrink-0 text-indigo-600 dark:text-indigo-400 mt-0.5" />
              <div className="flex-1 font-medium">{parseInlineFormatting(quoteContent.replace('[!NOTE]', '').trim())}</div>
            </div>
          )
          continue
        } else if (quoteContent.startsWith('[!TIP]')) {
          elements.push(
            <div key={`callout-tip-${i}`} className="my-3 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-950 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
              <Lightbulb className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div className="flex-1 font-medium">{parseInlineFormatting(quoteContent.replace('[!TIP]', '').trim())}</div>
            </div>
          )
          continue
        } else if (quoteContent.startsWith('[!WARNING]')) {
          elements.push(
            <div key={`callout-warn-${i}`} className="my-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1 font-medium">{parseInlineFormatting(quoteContent.replace('[!WARNING]', '').trim())}</div>
            </div>
          )
          continue
        } else if (quoteContent.startsWith('[!IMPORTANT]')) {
          elements.push(
            <div key={`callout-imp-${i}`} className="my-3 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-xs text-rose-950 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
              <Sparkles className="size-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div className="flex-1 font-medium">{parseInlineFormatting(quoteContent.replace('[!IMPORTANT]', '').trim())}</div>
            </div>
          )
          continue
        }

        elements.push(
          <blockquote key={`quote-${i}`} className="my-3 border-l-4 border-indigo-500 pl-4 py-1 italic text-slate-700 dark:text-slate-300 text-sm bg-slate-50 dark:bg-slate-900/50 rounded-r-lg">
            {parseInlineFormatting(quoteContent)}
          </blockquote>
        )
        continue
      }

      // Checklists
      if (line.match(/^-\s*\[([ xX])\]\s+(.*)/)) {
        flushList()
        flushTable()
        const isChecked = line.toLowerCase().includes('[x]')
        const taskText = line.replace(/^-\s*\[([ xX])\]\s+/, '')
        elements.push(
          <div key={`check-${i}`} className="my-1.5 flex items-center gap-2 text-sm">
            <span className={`flex size-4 items-center justify-center rounded border ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}>
              {isChecked && <Check className="size-3" />}
            </span>
            <span className={isChecked ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-200'}>
              {parseInlineFormatting(taskText)}
            </span>
          </div>
        )
        continue
      }

      // Bullet lists
      if (line.startsWith('- ') || line.startsWith('* ')) {
        inList = true
        listItems.push(
          <li key={`li-${i}`}>
            {parseInlineFormatting(line.replace(/^[-*]\s+/, ''))}
          </li>
        )
        continue
      } else {
        flushList()
      }

      // Headings
      if (line.startsWith('# ')) {
        elements.push(<h1 key={`h1-${i}`} className="mt-6 mb-3 text-2xl font-black tracking-tight text-slate-950 dark:text-slate-50 border-b border-slate-200 dark:border-slate-800 pb-1.5">{parseInlineFormatting(line.slice(2))}</h1>)
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={`h2-${i}`} className="mt-5 mb-2.5 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{parseInlineFormatting(line.slice(3))}</h2>)
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={`h3-${i}`} className="mt-4 mb-2 text-base font-bold text-slate-800 dark:text-slate-200">{parseInlineFormatting(line.slice(4))}</h3>)
      } else if (line.startsWith('#### ')) {
        elements.push(<h4 key={`h4-${i}`} className="mt-3 mb-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">{parseInlineFormatting(line.slice(5))}</h4>)
      } else if (line.startsWith('---')) {
        elements.push(<hr key={`hr-${i}`} className="my-5 border-slate-200 dark:border-slate-800" />)
      } else if (line.trim()) {
        elements.push(<p key={`p-${i}`} className="my-2 leading-relaxed text-sm text-slate-800 dark:text-slate-200">{parseInlineFormatting(line)}</p>)
      }
    }

    flushList()
    flushTable()
    return elements
  }, [copiedCodeIndex])

  return (
    <section
      aria-label="Caderno de Anotações e Workspace de Estudo"
      className="flex w-full flex-col rounded-3xl border border-slate-200 bg-white shadow-sm transition dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Top Header of the Notebook with Sidebar Drawer Toggle, Fonts & View Modes */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Explicit Sidebar Drawer Button */}
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? 'Recolher menu de pastas' : 'Expandir menu de pastas'}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {sidebarOpen ? (
              <>
                <SidebarClose className="size-4 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">Recolher Pastas</span>
              </>
            ) : (
              <>
                <SidebarOpen className="size-4 text-indigo-600 dark:text-indigo-400" />
                <span>Pastas & Notas ({notes.length})</span>
              </>
            )}
          </button>

          <div>
            <h3 className="text-sm font-black tracking-tight text-slate-950 dark:text-slate-50 sm:text-base">
              Caderno de Anotações (Textbook)
            </h3>
          </div>
        </div>

        {/* Fonts & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Font Family Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setFontMenuOpen((prev) => !prev)}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
              title="Escolher fonte tipográfica"
            >
              <Type className="size-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{FONT_OPTIONS.find((f) => f.id === selectedFont)?.label || 'Fonte'}</span>
              <ChevronDown className="size-3 text-slate-400" />
            </button>

            {fontMenuOpen ? (
              <div className="absolute right-0 top-9.5 z-40 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <span className="block px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tipografia de Estudo
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
                            ? 'bg-indigo-50 font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                        } ${f.className}`}
                      >
                        <div>
                          <div>{f.label}</div>
                          <span className="text-[10px] text-slate-400">{f.category}</span>
                        </div>
                        {isSelected ? <Check className="size-3.5 text-indigo-600 dark:text-indigo-400" /> : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>

          {/* View mode toggle pills */}
          <div
            role="group"
            aria-label="Modo de visualização"
            className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-800 dark:bg-slate-950"
          >
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`inline-flex min-h-7 items-center gap-1 rounded-lg px-2.5 text-xs font-bold transition ${
                viewMode === 'edit'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Modo Edição"
            >
              <FileEdit className="size-3.5" />
              <span className="hidden sm:inline">Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`hidden md:inline-flex min-h-7 items-center gap-1 rounded-lg px-2.5 text-xs font-bold transition ${
                viewMode === 'split'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Modo Dividido (Editor + Preview)"
            >
              <Columns2 className="size-3.5" />
              <span>Dividido</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`inline-flex min-h-7 items-center gap-1 rounded-lg px-2.5 text-xs font-bold transition ${
                viewMode === 'preview'
                  ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
              title="Modo Leitura / Visualização"
            >
              <Eye className="size-3.5" />
              <span className="hidden sm:inline">Visualizar</span>
            </button>
          </div>

          {/* Mobile view toggle */}
          <div className="flex items-center gap-2 sm:hidden">
            <button
              type="button"
              onClick={() => setMobileView(mobileView === 'sidebar' ? 'editor' : 'sidebar')}
              className="inline-flex min-h-8 items-center rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              {mobileView === 'sidebar' ? 'Ver Anotação →' : '← Pastas'}
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {/* Main Workspace Grid with Collapsible Sidebar */}
      <div className="flex flex-1 min-h-[620px] overflow-hidden">
        {/* Left Sub-Column: Folders & Note List */}
        {sidebarOpen ? (
          <aside
            className={`flex-col border-r border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40 transition-all duration-300 w-full lg:w-72 xl:w-80 shrink-0 ${
              mobileView === 'editor' ? 'hidden sm:flex' : 'flex'
            }`}
          >
            {/* Folders Bar */}
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pastas ({folders.length})
              </h4>
              <button
                type="button"
                onClick={() => {
                  setFolderName('')
                  setFolderColor('indigo')
                  setEditingFolderId(null)
                  setFolderModalOpen(true)
                }}
                className="inline-flex min-h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-indigo-400 dark:hover:bg-slate-800"
              >
                <FolderPlus className="size-3.5" aria-hidden="true" />
                <span>Nova pasta</span>
              </button>
            </div>

            {/* Folder Chips */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedFolderId('all')}
                className={`inline-flex min-h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition ${
                  selectedFolderId === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
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
                          ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
                          : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
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
                      className="ml-0.5 hidden text-slate-400 hover:text-rose-500 group-hover:inline-block"
                      title="Excluir pasta"
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Search Notes */}
            <div className="relative mt-3">
              <Search className="size-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                id={searchInputId}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar anotação..."
                className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>

            {/* Notes List Header */}
            <div className="mt-3.5 flex items-center justify-between">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Anotações ({filteredNotes.length})
              </h4>
              <button
                type="button"
                onClick={() => void handleCreateNote()}
                className="inline-flex min-h-7 items-center gap-1 rounded-lg bg-indigo-50 px-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900/60"
              >
                <Plus className="size-3.5" aria-hidden="true" />
                <span>Nova nota</span>
              </button>
            </div>

            {/* Notes Scrollable Cards */}
            <div className="mt-2 flex-1 space-y-1.5 overflow-y-auto pr-1">
              {filteredNotes.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  Nenhuma anotação encontrada.
                </div>
              ) : (
                filteredNotes.map((note) => {
                  const isSelected = note.id === activeNoteId
                  return (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => selectNote(note)}
                      className={`flex w-full flex-col rounded-xl border p-2.5 text-left transition focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-xs dark:border-indigo-400 dark:bg-indigo-950/40'
                          : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex w-full items-center justify-between gap-2">
                        <h5 className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
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
                        {note.content ? note.content.slice(0, 100) : 'Sem conteúdo...'}
                      </p>
                      {note.subject_name || note.reading_title ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {note.subject_name && (
                            <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {note.subject_name}
                            </span>
                          )}
                          {note.reading_title && (
                            <span className="rounded bg-indigo-100/70 px-1.5 py-0.2 text-[9px] font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
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

        {/* Right Main Column: Editor & Preview Area */}
        <main
          className={`flex-1 flex-col p-4 sm:p-6 ${
            mobileView === 'sidebar' && sidebarOpen ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {activeNoteId ? (
            <div className="flex h-full flex-col">
              {/* Note Metadata Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Folder select */}
                  {folders.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <label
                        htmlFor={editorFolderSelectId}
                        className="text-xs font-semibold text-slate-500 dark:text-slate-400"
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
                        className="min-h-7 max-w-[130px] truncate rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="">(Nenhuma)</option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  {/* Subject link */}
                  {subjects.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <label
                        htmlFor={editorSubjectSelectId}
                        className="text-xs font-semibold text-slate-500 dark:text-slate-400"
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
                        className="min-h-7 max-w-[130px] truncate rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="">(Nenhuma)</option>
                        {subjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.subject.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  {/* Task link */}
                  {tasks.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <label
                        htmlFor={editorTaskSelectId}
                        className="text-xs font-semibold text-slate-500 dark:text-slate-400"
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
                        className="min-h-7 max-w-[130px] truncate rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="">(Nenhuma)</option>
                        {tasks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  {/* Reading link */}
                  {readings.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <label
                        htmlFor={editorReadingSelectId}
                        className="text-xs font-semibold text-slate-500 dark:text-slate-400"
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
                        className="min-h-7 max-w-[130px] truncate rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <option value="">(Nenhuma)</option>
                        {readings.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </div>

                {/* Delete button */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleDeleteCurrentNote()}
                    className="inline-flex min-h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                    title="Excluir anotação"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Excluir</span>
                  </button>
                </div>
              </div>

              {/* Note Title Input */}
              <div className="mt-3">
                <input
                  type="text"
                  value={editorTitle}
                  onChange={(e) => {
                    const next = e.target.value
                    setEditorTitle(next)
                    triggerAutoSave({ title: next })
                  }}
                  placeholder="Título da anotação..."
                  aria-label="Título da anotação"
                  className={`w-full border-0 bg-transparent p-0 text-xl font-black tracking-tight text-slate-950 placeholder:text-slate-400 focus:ring-0 dark:text-slate-50 sm:text-2xl ${activeFontClass}`}
                />
              </div>

              {/* Comprehensive Rich Formatting Toolbar */}
              <div
                role="toolbar"
                aria-label="Barra de ferramentas de formatação"
                className="mt-3 flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50/95 p-1.5 dark:border-slate-800 dark:bg-slate-950/80 shadow-2xs"
              >
                {/* Headings */}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => insertFormatting('# ')}
                    className="min-h-7 rounded-lg px-2 text-xs font-black text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Título Principal (H1)"
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('## ')}
                    className="min-h-7 rounded-lg px-2 text-xs font-black text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Seção (H2)"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('### ')}
                    className="min-h-7 rounded-lg px-2 text-xs font-black text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Subseção (H3)"
                  >
                    H3
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('#### ')}
                    className="min-h-7 rounded-lg px-2 text-xs font-black text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Tópico (H4)"
                  >
                    H4
                  </button>
                </div>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                {/* Inline Formatting */}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => insertFormatting('**', '**')}
                    className="min-h-7 rounded-lg px-2 text-xs font-black text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Negrito (**texto**)"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('*', '*')}
                    className="inline-flex min-h-7 items-center rounded-lg px-2 text-xs italic font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Itálico (*texto*)"
                  >
                    <Italic className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('<u>', '</u>')}
                    className="inline-flex min-h-7 items-center rounded-lg px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Sublinhado (<u>texto</u>)"
                  >
                    <Underline className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('~~', '~~')}
                    className="inline-flex min-h-7 items-center rounded-lg px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Tachado (~~texto~~)"
                  >
                    <Strikethrough className="size-3.5" aria-hidden="true" />
                  </button>
                </div>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                {/* Advanced Color Picker Modal/Popover */}
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setColorPickerOpen((prev) => !prev)}
                    className="inline-flex min-h-7 items-center gap-1.5 rounded-lg px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Seletor de cores livre (Hex, Roda de Cores, Conta-gotas)"
                  >
                    <Palette className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="flex size-3 rounded-full border border-slate-300" style={{ backgroundColor: customColor }} />
                    <span>Cor & Realce</span>
                  </button>

                  {colorPickerOpen ? (
                    <div className="absolute left-0 top-8.5 z-40 w-72 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                      {/* Target Selector (Texto ou Marca-Texto) */}
                      <div className="flex rounded-xl bg-slate-100 p-0.5 dark:bg-slate-800">
                        <button
                          type="button"
                          onClick={() => setColorTarget('text')}
                          className={`flex-1 rounded-lg py-1 text-center text-xs font-bold transition ${
                            colorTarget === 'text'
                              ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Cor do Texto
                        </button>
                        <button
                          type="button"
                          onClick={() => setColorTarget('highlight')}
                          className={`flex-1 rounded-lg py-1 text-center text-xs font-bold transition ${
                            colorTarget === 'highlight'
                              ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-900 dark:text-indigo-400'
                              : 'text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          Marca-Texto
                        </button>
                      </div>

                      {/* Native Color Picker & Hex Code Input */}
                      <div className="mt-3 flex items-center gap-2">
                        <label className="relative flex size-9 cursor-pointer items-center justify-center rounded-xl border border-slate-300 overflow-hidden shadow-2xs dark:border-slate-700">
                          <input
                            type="color"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            className="absolute -inset-2 size-14 cursor-pointer opacity-0"
                            title="Escolher no círculo de cores"
                          />
                          <span className="size-full rounded-xl" style={{ backgroundColor: customColor }} />
                        </label>

                        {/* Hex Input */}
                        <div className="flex-1">
                          <input
                            type="text"
                            value={customColor}
                            onChange={(e) => setCustomColor(e.target.value)}
                            placeholder="#6366F1"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-xs font-bold uppercase text-slate-800 focus:border-indigo-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                          />
                        </div>

                        {/* EyeDropper button if supported */}
                        {typeof window !== 'undefined' && 'EyeDropper' in window ? (
                          <button
                            type="button"
                            onClick={() => void handlePickColorFromScreen()}
                            className="inline-flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
                            title="Conta-gotas: capturar cor na tela"
                          >
                            <Pipette className="size-4 text-indigo-600 dark:text-indigo-400" />
                          </button>
                        ) : null}
                      </div>

                      {/* Color Palette Presets */}
                      <div className="mt-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Cores Rápidas
                        </span>
                        <div className="mt-1.5 grid grid-cols-9 gap-1">
                          {COLOR_PRESETS.map((p) => (
                            <button
                              key={p.hex}
                              type="button"
                              onClick={() => setCustomColor(p.hex)}
                              className="size-6 rounded-lg border border-black/10 transition hover:scale-110 shadow-2xs"
                              style={{ backgroundColor: p.hex }}
                              title={p.name}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setColorPickerOpen(false)}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyColor}
                          className="rounded-xl bg-indigo-600 px-3 py-1 text-xs font-bold text-white hover:bg-indigo-700 dark:bg-indigo-500"
                        >
                          Aplicar {colorTarget === 'text' ? 'no Texto' : 'no Realce'}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                {/* Lists & Checklists */}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => insertFormatting('- ')}
                    className="inline-flex min-h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Lista com marcadores"
                  >
                    <List className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('1. ')}
                    className="inline-flex min-h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Lista numerada"
                  >
                    <ListOrdered className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('- [ ] ')}
                    className="inline-flex min-h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Checklist de estudo"
                  >
                    <CheckSquare className="size-3.5" aria-hidden="true" />
                  </button>
                </div>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

                {/* Callouts Dropdown */}
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setCalloutMenuOpen((prev) => !prev)}
                    className="inline-flex min-h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold text-indigo-700 hover:bg-white dark:text-indigo-300 dark:hover:bg-slate-800"
                    title="Blocos de Destaque / Callouts"
                  >
                    <Info className="size-3.5" />
                    <span>Callout</span>
                  </button>

                  {calloutMenuOpen ? (
                    <div className="absolute left-0 top-8 z-30 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          insertFormatting('> [!NOTE] ')
                          setCalloutMenuOpen(false)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg p-1.5 text-left text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                      >
                        <Info className="size-3.5" />
                        <span>Nota Informativa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          insertFormatting('> [!TIP] ')
                          setCalloutMenuOpen(false)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg p-1.5 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                      >
                        <Lightbulb className="size-3.5" />
                        <span>Dica Acadêmica</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          insertFormatting('> [!WARNING] ')
                          setCalloutMenuOpen(false)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg p-1.5 text-left text-xs font-semibold text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/40"
                      >
                        <AlertTriangle className="size-3.5" />
                        <span>Alerta / Pegadinha</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          insertFormatting('> [!IMPORTANT] ')
                          setCalloutMenuOpen(false)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg p-1.5 text-left text-xs font-semibold text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                      >
                        <Sparkles className="size-3.5" />
                        <span>Crítico para Prova</span>
                      </button>
                    </div>
                  ) : null}
                </div>

                {/* Structure: Code, Quote, Table, Divider */}
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => insertFormatting('```typescript\n', '\n```')}
                    className="inline-flex min-h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Bloco de Código"
                  >
                    <Code className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('> ')}
                    className="inline-flex min-h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Citação"
                  >
                    <Quote className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      insertFormatting('\n| Conceito | Definição | Exemplo |\n|---|---|---|\n| Item 1 | ... | ... |\n| Item 2 | ... | ... |\n')
                    }
                    className="inline-flex min-h-7 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Tabela formatada"
                  >
                    <TableIcon className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertFormatting('\n---\n')}
                    className="min-h-7 rounded-lg px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                    title="Divisor horizontal"
                  >
                    —
                  </button>
                </div>
              </div>

              {/* Main Workspace Editor & Preview Content */}
              <div className="mt-3 flex flex-1 gap-4 overflow-hidden min-h-[440px]">
                {/* Editor Textarea Pane */}
                {(viewMode === 'edit' || viewMode === 'split') && (
                  <div className="flex flex-col flex-1 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950/40 p-2 shadow-2xs">
                    <textarea
                      ref={textareaRef}
                      value={editorContent}
                      onChange={(e) => {
                        const next = e.target.value
                        setEditorContent(next)
                        triggerAutoSave({ content: next })
                      }}
                      placeholder="Escreva suas anotações, sínteses e dúvidas aqui... Use a barra acima para títulos, cores livres, destaques, checklists e callouts."
                      aria-label="Conteúdo da anotação"
                      className={`size-full flex-1 resize-none border-0 bg-transparent p-3 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:ring-0 dark:text-slate-100 ${activeFontClass}`}
                    />
                  </div>
                )}

                {/* Rich Markdown Preview Pane */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                  <div className={`flex flex-col flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/70 shadow-2xs ${activeFontClass}`}>
                    <div className="prose dark:prose-invert max-w-none text-slate-900 dark:text-slate-100">
                      {renderFormattedPreview(editorContent)}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Status Bar with Stats */}
              <footer className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
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
                  <span aria-live="polite" className="font-semibold">
                    {saveStatus === 'saving' ? (
                      <span className="text-indigo-600 dark:text-indigo-400">Salvando alterações...</span>
                    ) : saveStatus === 'saved' ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Salvo ✓</span>
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
              <span className="text-5xl">📝</span>
              <h4 className="mt-4 text-xl font-black text-slate-900 dark:text-slate-100">
                Seu Caderno de Estudo
              </h4>
              <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
                Organize anotações acadêmicas personalizadas por disciplinas e pastas, com suporte a templates de
                metodologias ativas, paleta de cores e formatação rica.
              </p>
              <button
                type="button"
                onClick={() => void handleCreateNote()}
                className="mt-5 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <Plus className="size-4" aria-hidden="true" />
                Criar primeira anotação
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Folder Creation / Edit Modal */}
      {folderModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="folder-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h3 id="folder-modal-title" className="text-base font-black text-slate-950 dark:text-slate-50">
              {editingFolderId ? 'Editar Pasta' : 'Nova Pasta'}
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
                  placeholder="Ex: Engenharia de Software"
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
                />
              </div>

              <div>
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Cor
                </span>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFolderColor(c.value)}
                      className={`size-6 rounded-full ${c.bg} transition ${
                        folderColor === c.value
                          ? 'ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-slate-900'
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
                  className="min-h-9 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="min-h-9 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
