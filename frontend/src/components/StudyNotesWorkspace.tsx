import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  CheckSquare,
  Code,
  FolderPlus,
  Highlighter,
  Info,
  Italic,
  List,
  Plus,
  Quote,
  Table as TableIcon,
  Trash2,
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

const COLOR_OPTIONS = [
  { label: 'Índigo', value: 'indigo', bg: 'bg-indigo-500' },
  { label: 'Ciano', value: 'cyan', bg: 'bg-cyan-500' },
  { label: 'Esmeralda', value: 'emerald', bg: 'bg-emerald-500' },
  { label: 'Âmbar', value: 'amber', bg: 'bg-amber-500' },
  { label: 'Rosa', value: 'rose', bg: 'bg-rose-500' },
  { label: 'Roxo', value: 'purple', bg: 'bg-purple-500' },
]

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

  // Active note lookup
  const activeNote = useMemo(
    () => notes.find((n) => n.id === activeNoteId) || null,
    [notes, activeNoteId],
  )

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

  // Auto-save debounced
  const triggerAutoSave = useCallback(
    (
      overrides?: Partial<{
        title: string
        content: string
        folder: string | null
        student_subject: string | null
        task: string | null
        reading: string | null
      }>,
    ) => {
      if (!activeNoteId) return
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
      }
      setSaveStatus('saving')

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

  return (
    <section
      aria-label="Caderno de Anotações e Workspace de Estudo"
      className="flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header with Title and Mobile View Switcher */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 px-5 py-3.5 dark:border-slate-800 sm:px-6">
        <div>
          <h3 className="text-lg font-black tracking-tight text-slate-950 dark:text-slate-50">
            Caderno de Anotações
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Espaço de síntese e documentação acadêmica
          </p>
        </div>

        {/* Mobile toggle button */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            type="button"
            onClick={() => setMobileView(mobileView === 'sidebar' ? 'editor' : 'sidebar')}
            className="inline-flex min-h-9 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
          >
            {mobileView === 'sidebar' ? 'Ver Editor →' : '← Pastas & Notas'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {/* Main Workspace Layout */}
      <div className="grid min-h-[580px] lg:grid-cols-12">
        {/* Left Sub-Column: Folders & Note List (4 cols) */}
        <aside
          className={`flex flex-col border-r border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40 lg:col-span-4 ${
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
              className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:text-indigo-400 dark:hover:bg-slate-800"
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
              className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition ${
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

            {folders.map((folder) => {
              const isSelected = selectedFolderId === folder.id
              return (
                <div key={folder.id} className="group relative inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs dark:bg-indigo-500'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="max-w-[100px] truncate">{folder.name}</span>
                    <span className="rounded-full bg-slate-200/60 px-1.5 py-0.2 text-[10px] text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                      {folder.notes_count}
                    </span>
                  </button>

                  <button
                    type="button"
                    aria-label={`Excluir pasta ${folder.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleDeleteFolder(folder.id)
                    }}
                    className="ml-0.5 hidden text-xs font-bold text-rose-500 hover:text-rose-700 group-hover:inline-block"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>

          {/* Search and New Note Action */}
          <div className="mt-3 flex items-center gap-2">
            <input
              id={searchInputId}
              type="search"
              placeholder="Buscar anotações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-9 w-full rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />

            <button
              type="button"
              onClick={() => void handleCreateNote()}
              aria-label="Criar nova anotação"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              title="Nova anotação"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>

          {/* Notes List */}
          <div className="mt-3 flex-1 space-y-1.5 overflow-y-auto max-h-[480px] pr-1">
            {filteredNotes.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
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
                    className={`flex w-full flex-col rounded-xl p-2.5 text-left transition focus-visible:outline-2 focus-visible:outline-indigo-600 ${
                      isSelected
                        ? 'border border-indigo-600 bg-indigo-50/80 shadow-xs dark:border-indigo-500 dark:bg-indigo-950/40'
                        : 'border border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <h5 className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                        {note.title || 'Sem título'}
                      </h5>
                      {note.reading_title ? (
                        <span className="rounded bg-cyan-50 px-1 py-0.2 text-[9px] font-bold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
                          📖 Leitura
                        </span>
                      ) : note.methodology ? (
                        <span className="rounded bg-indigo-50 px-1 py-0.2 text-[9px] font-bold uppercase text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {note.methodology}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                      {note.content ? note.content.slice(0, 100) : 'Sem conteúdo ainda...'}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{note.folder_name ? `📁 ${note.folder_name}` : 'Sem pasta'}</span>
                      <span>
                        {new Date(note.updated_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        {/* Right Sub-Column: Expanded Note Editor (8 cols) */}
        <div
          className={`flex flex-col p-4 sm:p-5 lg:col-span-8 ${
            mobileView === 'sidebar' ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {activeNote ? (
            <div className="flex flex-col h-full">
              {/* Note Metadata Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Folder picker */}
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
                      className="min-h-8 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    >
                      <option value="">(Sem pasta)</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

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
                        className="min-h-8 max-w-[130px] truncate rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
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
                        className="min-h-8 max-w-[130px] truncate rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
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
                        className="min-h-8 max-w-[130px] truncate rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
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

                {/* Save status & Delete action */}
                <div className="flex items-center gap-2">
                  <span
                    aria-live="polite"
                    className="text-xs font-semibold text-slate-500 dark:text-slate-400"
                  >
                    {saveStatus === 'saving'
                      ? 'Salvando...'
                      : saveStatus === 'saved'
                        ? 'Salvo ✓'
                        : saveStatus === 'error'
                          ? 'Erro ao salvar'
                          : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleDeleteCurrentNote()}
                    className="inline-flex min-h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                    title="Excluir anotação"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    <span>Excluir</span>
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
                  placeholder="Sem título"
                  aria-label="Título da anotação"
                  className="w-full border-0 bg-transparent p-0 text-xl font-black tracking-tight text-slate-950 placeholder:text-slate-400 focus:ring-0 dark:text-slate-50 sm:text-2xl"
                />
              </div>

              {/* Notion / Rich Text Formatting Toolbar */}
              <div
                role="toolbar"
                aria-label="Barra de ferramentas de formatação"
                className="mt-3 flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/90 p-1 dark:border-slate-800 dark:bg-slate-950/50"
              >
                <button
                  type="button"
                  onClick={() => insertFormatting('# ')}
                  className="min-h-7 rounded px-1.5 text-xs font-black text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Título H1"
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('## ')}
                  className="min-h-7 rounded px-1.5 text-xs font-black text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Título H2"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('### ')}
                  className="min-h-7 rounded px-1.5 text-xs font-black text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Título H3"
                >
                  H3
                </button>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**')}
                  className="min-h-7 rounded px-1.5 text-xs font-black text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Negrito (**texto**)"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('*', '*')}
                  className="inline-flex min-h-7 items-center rounded px-1.5 text-xs italic font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Itálico (*texto*)"
                >
                  <Italic className="size-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('==', '==')}
                  className="inline-flex min-h-7 items-center gap-0.5 rounded px-1.5 text-xs font-bold text-amber-700 hover:bg-white dark:text-amber-300 dark:hover:bg-slate-800"
                  title="Realce (==texto==)"
                >
                  <Highlighter className="size-3.5" aria-hidden="true" />
                </button>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

                <button
                  type="button"
                  onClick={() => insertFormatting('- ')}
                  className="inline-flex min-h-7 items-center gap-1 rounded px-1.5 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Lista com marcadores"
                >
                  <List className="size-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('- [ ] ')}
                  className="inline-flex min-h-7 items-center gap-1 rounded px-1.5 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Lista de tarefas / Checklist"
                >
                  <CheckSquare className="size-3.5" aria-hidden="true" />
                </button>

                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-0.5" />

                <button
                  type="button"
                  onClick={() => insertFormatting('```\n', '\n```')}
                  className="inline-flex min-h-7 items-center gap-1 rounded px-1.5 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Bloco de código"
                >
                  <Code className="size-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('> ')}
                  className="inline-flex min-h-7 items-center gap-1 rounded px-1.5 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Citação"
                >
                  <Quote className="size-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('> [!NOTE]\n> ')}
                  className="inline-flex min-h-7 items-center gap-1 rounded px-1.5 text-xs font-bold text-indigo-700 hover:bg-white dark:text-indigo-300 dark:hover:bg-slate-800"
                  title="Destaque / Callout"
                >
                  <Info className="size-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    insertFormatting('\n| Coluna 1 | Coluna 2 |\n|---|---|\n| Item 1 | Item 2 |\n')
                  }
                  className="inline-flex min-h-7 items-center gap-1 rounded px-1.5 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Tabela simples"
                >
                  <TableIcon className="size-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n---\n')}
                  className="min-h-7 rounded px-1.5 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Divisor horizontal"
                >
                  —
                </button>
              </div>

              {/* Textarea for note content */}
              <div className="mt-3 flex-1 flex flex-col">
                <textarea
                  ref={textareaRef}
                  value={editorContent}
                  onChange={(e) => {
                    const next = e.target.value
                    setEditorContent(next)
                    triggerAutoSave({ content: next })
                  }}
                  placeholder="Escreva suas anotações, sínteses e dúvidas aqui... Use a barra acima ou markdown para títulos, checklists, tabelas e destaques."
                  aria-label="Conteúdo da anotação"
                  className="size-full min-h-[420px] flex-1 resize-y rounded-2xl border-0 bg-transparent p-3 font-mono text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:ring-0 dark:text-slate-200"
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center py-20 text-center">
              <span className="text-4xl">📝</span>
              <h4 className="mt-3 text-lg font-black text-slate-900 dark:text-slate-100">
                Seu Caderno de Estudo
              </h4>
              <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                Organize anotações personalizadas por disciplinas e pastas, com suporte a templates e
                metodologias ativas.
              </p>
              <button
                type="button"
                onClick={() => void handleCreateNote()}
                className="mt-4 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                <Plus className="size-4" aria-hidden="true" />
                Criar primeira anotação
              </button>
            </div>
          )}
        </div>
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
                  {COLOR_OPTIONS.map((c) => (
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
