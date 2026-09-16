import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type {
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
  subjects?: StudentSubject[]
  tasks?: AcademicTask[]
  externalTemplate?: string | null
  onClearExternalTemplate?: () => void
}

export function StudyNotesWorkspace({
  activeSubject,
  activeTask,
  subjects = [],
  tasks = [],
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
        }
      } catch {
        if (alive) setError('Não foi possível carregar o caderno de anotações.')
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
          }
          const updated = await updateStudyNote(activeNoteId, payload)
          setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
          setSaveStatus('saved')
        } catch {
          setSaveStatus('error')
        }
      }, 1000)
    },
    [activeNoteId, editorTitle, editorContent, editorFolderId, editorSubjectId, editorTaskId],
  )

  // Create new note
  const handleCreateNote = useCallback(async (initialContent = '') => {
    try {
      setLoading(true)
      const payload: StudyNotePayload = {
        title: 'Nova anotação',
        content: initialContent,
        folder: selectedFolderId !== 'all' ? selectedFolderId : null,
        student_subject: activeSubject?.id || null,
        task: activeTask?.id || null,
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
  }, [activeSubject, activeTask, selectedFolderId, selectNote])

  // When external template injected from methodology selector
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
      // reload notes to refresh folder links
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
      aria-label="Caderno de Anotações e Pastas de Estudo"
      className="flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header with Title and Mobile View Switcher */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800 sm:px-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Textbook & Notion Workspace
          </p>
          <h3 className="mt-0.5 text-xl font-black tracking-tight text-slate-950 dark:text-slate-50">
            Caderno de Anotações
          </h3>
        </div>

        {/* Mobile toggle button */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            type="button"
            onClick={() => setMobileView(mobileView === 'sidebar' ? 'editor' : 'sidebar')}
            className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
          >
            {mobileView === 'sidebar' ? 'Ver Editor →' : '← Ver Pastas & Notas'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      ) : null}

      {/* Main Workspace Layout (2 columns on tablet/desktop, toggled on mobile) */}
      <div className="grid min-h-[520px] lg:grid-cols-12">
        {/* Left Column: Folders & Note List (4 cols) */}
        <aside
          className={`flex flex-col border-r border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40 lg:col-span-4 ${
            mobileView === 'editor' ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {/* Folders Management Bar */}
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
              className="inline-flex min-h-9 items-center rounded-lg px-2 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:text-indigo-400 dark:hover:bg-slate-800"
            >
              + Nova pasta
            </button>
          </div>

          {/* Folder Chips */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedFolderId('all')}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition ${
                selectedFolderId === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500'
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
                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="max-w-[120px] truncate">{folder.name}</span>
                    <span className="rounded-full bg-slate-200/60 px-1.5 py-0.2 text-[10px] text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                      {folder.notes_count}
                    </span>
                  </button>

                  {/* Actions to edit/delete folder on hover/focus */}
                  <button
                    type="button"
                    aria-label={`Excluir pasta ${folder.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleDeleteFolder(folder.id)
                    }}
                    className="ml-0.5 hidden text-xs text-rose-500 hover:text-rose-700 group-hover:inline-block"
                  >
                    ×
                  </button>
                </div>
              )
            })}
          </div>

          {/* Notes Search & Add */}
          <div className="mt-4 flex items-center gap-2">
            <div className="relative flex-1">
              <label htmlFor={searchInputId} className="sr-only">
                Buscar anotações
              </label>
              <input
                id={searchInputId}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar notas..."
                className="w-full min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-50"
              />
            </div>
            <button
              type="button"
              onClick={() => void handleCreateNote()}
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-indigo-600 px-3 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500"
            >
              + Nota
            </button>
          </div>

          {/* Notes List */}
          <div className="mt-3 flex-1 space-y-1.5 overflow-y-auto pr-1 max-h-[440px]">
            {filteredNotes.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                Nenhuma anotação encontrada. Clique em "+ Nota" para começar.
              </p>
            ) : (
              filteredNotes.map((note) => {
                const isSelected = note.id === activeNoteId
                return (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => selectNote(note)}
                    className={`w-full rounded-2xl p-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                      isSelected
                        ? 'border border-indigo-600 bg-white shadow-sm ring-2 ring-indigo-600/30 dark:border-indigo-400 dark:bg-slate-900'
                        : 'border border-transparent bg-white/60 hover:bg-white hover:shadow-xs dark:bg-slate-900/60 dark:hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="truncate text-xs font-bold text-slate-950 dark:text-slate-50">
                        {note.title || 'Sem título'}
                      </h5>
                      {note.methodology ? (
                        <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {note.methodology}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
                      {note.content ? note.content.slice(0, 100) : 'Sem conteúdo ainda...'}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
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

        {/* Right Column: Note Editor (8 cols) */}
        <div
          className={`flex flex-col p-4 sm:p-6 lg:col-span-8 ${
            mobileView === 'sidebar' ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {activeNote ? (
            <div className="flex flex-col h-full">
              {/* Note Metadata Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Folder picker */}
                  <div className="flex items-center gap-1.5">
                    <label htmlFor={editorFolderSelectId} className="text-xs font-semibold text-slate-500 dark:text-slate-400">
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
                      className="min-h-9 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
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
                    <div className="flex items-center gap-1.5">
                      <label htmlFor={editorSubjectSelectId} className="text-xs font-semibold text-slate-500 dark:text-slate-400">
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
                        className="min-h-9 max-w-[150px] truncate rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
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
                    <div className="flex items-center gap-1.5">
                      <label htmlFor={editorTaskSelectId} className="text-xs font-semibold text-slate-500 dark:text-slate-400">
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
                        className="min-h-9 max-w-[150px] truncate rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
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
                </div>

                {/* Save status & Delete action */}
                <div className="flex items-center gap-3">
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
                    className="inline-flex min-h-9 items-center rounded-lg px-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  >
                    Excluir
                  </button>
                </div>
              </div>

              {/* Note Title Input */}
              <div className="mt-4">
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
                  className="w-full border-0 bg-transparent p-0 text-2xl font-black tracking-tight text-slate-950 placeholder:text-slate-400 focus:ring-0 dark:text-slate-50 sm:text-3xl"
                />
              </div>

              {/* Notion-style Formatting Toolbar */}
              <div
                role="toolbar"
                aria-label="Barra de ferramentas de formatação"
                className="mt-3 flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/80 p-1 dark:border-slate-800 dark:bg-slate-950/50"
              >
                <button
                  type="button"
                  onClick={() => insertFormatting('# ')}
                  className="min-h-8 rounded px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Título H1"
                >
                  H1
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('## ')}
                  className="min-h-8 rounded px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Título H2"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('**', '**')}
                  className="min-h-8 rounded px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Negrito"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('- ')}
                  className="min-h-8 rounded px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Lista com marcadores"
                >
                  • Lista
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('- [ ] ')}
                  className="min-h-8 rounded px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Lista de tarefas"
                >
                  ☑ Checklist
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('```\n', '\n```')}
                  className="min-h-8 rounded px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Bloco de código"
                >
                  &lt;/&gt; Código
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('> ')}
                  className="min-h-8 rounded px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Citação"
                >
                  " Citação
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting('\n---\n')}
                  className="min-h-8 rounded px-2 text-xs font-bold text-slate-700 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-800"
                  title="Divisor horizontal"
                >
                  — Divisor
                </button>
              </div>

              {/* Textarea for note content */}
              <div className="mt-3 flex-1">
                <textarea
                  ref={textareaRef}
                  value={editorContent}
                  onChange={(e) => {
                    const next = e.target.value
                    setEditorContent(next)
                    triggerAutoSave({ content: next })
                  }}
                  placeholder="Escreva suas anotações, sínteses e dúvidas aqui... Use Markdown para títulos (#), listas (-), checklists (- [ ]) e citações (>)."
                  aria-label="Conteúdo da anotação"
                  className="size-full min-h-[360px] resize-y rounded-2xl border-0 bg-transparent p-3 font-mono text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 focus:ring-0 dark:text-slate-200"
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
                Organize anotações personalizadas por disciplinas e pastas, com suporte a templates
                das metodologias ativas.
              </p>
              <button
                type="button"
                onClick={() => void handleCreateNote()}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 dark:bg-indigo-500"
              >
                + Criar primeira anotação
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Folder Creation/Edit Modal */}
      {folderModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="folder-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h4
              id="folder-modal-title"
              className="text-lg font-black tracking-tight text-slate-950 dark:text-slate-50"
            >
              {editingFolderId ? 'Editar Pasta' : 'Nova Pasta'}
            </h4>
            <form onSubmit={handleSaveFolder} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor={folderNameInputId}
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
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
                  className="mt-1 block w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>

              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Cor da Pasta
                </span>
                <div className="mt-2 flex gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setFolderColor(c.value)}
                      className={`size-7 rounded-full transition ${c.bg} ${
                        folderColor === c.value
                          ? 'ring-2 ring-slate-950 ring-offset-2 dark:ring-slate-50'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      aria-label={`Cor ${c.label}`}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFolderModalOpen(false)}
                  className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 dark:bg-indigo-500"
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
