/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useId, useState } from 'react'
import type {
  AcademicReading,
  AcademicReadingPayload,
  AcademicReadingStatus,
  StudentSubject,
} from '../api/types'

export type ReadingModalProps = {
  isOpen: boolean
  reading?: AcademicReading | null
  subjects?: StudentSubject[]
  onClose: () => void
  onSave: (payload: AcademicReadingPayload, readingId?: string) => Promise<void>
}

export function ReadingModal({
  isOpen,
  reading,
  subjects = [],
  onClose,
  onSave,
}: ReadingModalProps) {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [studentSubject, setStudentSubject] = useState<string>('')
  const [totalPages, setTotalPages] = useState<number>(100)
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [status, setStatus] = useState<AcademicReadingStatus>('READING')
  const [examName, setExamName] = useState('')
  const [examQuestionsCount, setExamQuestionsCount] = useState<number>(0)
  const [examDate, setExamDate] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const titleId = useId()
  const authorId = useId()
  const subjectId = useId()
  const totalPagesId = useId()
  const currentPageId = useId()
  const statusId = useId()
  const examNameId = useId()
  const examQuestionsId = useId()
  const examDateId = useId()
  const targetDateId = useId()

  useEffect(() => {
    if (reading) {
      setTitle(reading.title)
      setAuthor(reading.author || '')
      setStudentSubject(reading.student_subject || '')
      setTotalPages(reading.total_pages)
      setCurrentPage(reading.current_page)
      setStatus(reading.status)
      setExamName(reading.exam_name || '')
      setExamQuestionsCount(reading.exam_questions_count || 0)
      setExamDate(reading.exam_date || '')
      setTargetDate(reading.target_date || '')
    } else {
      setTitle('')
      setAuthor('')
      setStudentSubject('')
      setTotalPages(100)
      setCurrentPage(0)
      setStatus('READING')
      setExamName('')
      setExamQuestionsCount(0)
      setExamDate('')
      setTargetDate('')
    }
    setError('')
  }, [reading, isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('O título da obra é obrigatório.')
      return
    }
    if (totalPages <= 0) {
      setError('O total de páginas deve ser maior que zero.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const payload: AcademicReadingPayload = {
        title: title.trim(),
        author: author.trim(),
        student_subject: studentSubject || null,
        total_pages: Number(totalPages),
        current_page: Number(currentPage),
        status,
        exam_name: examName.trim(),
        exam_questions_count: Number(examQuestionsCount) || 0,
        exam_date: examDate || null,
        target_date: targetDate || null,
      }
      await onSave(payload, reading?.id)
      onClose()
    } catch {
      setError('Erro ao salvar a leitura acadêmica.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reading-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs overflow-y-auto"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900 my-8">
        <h3 id="reading-modal-title" className="text-lg font-black text-slate-950 dark:text-slate-50">
          {reading ? 'Editar Leitura Acadêmica' : 'Nova Leitura Acadêmica'}
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Acompanhe livros, artigos e materiais com metas diárias vinculadas às suas provas.
        </p>

        {error ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label
              htmlFor={titleId}
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Título da Obra | Artigo *
            </label>
            <input
              id={titleId}
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Engenharia de Software Moderna"
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/30 dark:bg-[#041019] dark:text-slate-100 dark:focus:border-[#006768]"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor={authorId}
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Autor | Organizador
              </label>
              <input
                id={authorId}
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ex: Marco Tulio Valente"
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/30 dark:bg-[#041019] dark:text-slate-100 dark:focus:border-[#006768]"
              />
            </div>

            <div>
              <label
                htmlFor={subjectId}
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Disciplina Vinculada
              </label>
              <select
                id={subjectId}
                value={studentSubject}
                onChange={(e) => setStudentSubject(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/30 dark:bg-[#041019] dark:text-slate-100 dark:focus:border-[#006768]"
              >
                <option value="">(Geral | Sem disciplina)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label
                htmlFor={totalPagesId}
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Total de Páginas *
              </label>
              <input
                id={totalPagesId}
                type="number"
                min="1"
                required
                value={totalPages}
                onChange={(e) => setTotalPages(Number(e.target.value))}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/30 dark:bg-[#041019] dark:text-slate-100 dark:focus:border-[#006768]"
              />
            </div>

            <div>
              <label
                htmlFor={currentPageId}
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Página Atual
              </label>
              <input
                id={currentPageId}
                type="number"
                min="0"
                max={totalPages}
                value={currentPage}
                onChange={(e) => setCurrentPage(Number(e.target.value))}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/30 dark:bg-[#041019] dark:text-slate-100 dark:focus:border-[#006768]"
              />
            </div>

            <div>
              <label
                htmlFor={statusId}
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Status
              </label>
              <select
                id={statusId}
                value={status}
                onChange={(e) => setStatus(e.target.value as AcademicReadingStatus)}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/30 dark:bg-[#041019] dark:text-slate-100 dark:focus:border-[#006768]"
              >
                <option value="NOT_STARTED">Não iniciado</option>
                <option value="READING">Lendo</option>
                <option value="COMPLETED">Concluído</option>
                <option value="PAUSED">Em pausa</option>
                <option value="DROPPED">Abandonado</option>
              </select>
            </div>
          </div>

          {/* Exam Linkage Section */}
          <div className="rounded-xl border border-[#005063]/20 bg-[#005063]/5 p-3 dark:border-[#005063]/30 dark:bg-[#041019]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#005063] dark:text-[#a8d5e5]">
              Vínculo com Avaliação | Prova (Opcional)
            </span>

            <div className="mt-2.5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor={examNameId}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Exame | Prova
                </label>
                <input
                  id={examNameId}
                  type="text"
                  placeholder="Ex: P1 Semestral"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-[#005063] focus:outline-hidden dark:border-[#005063]/30 dark:bg-[#081a26] dark:text-slate-100 dark:focus:border-[#006768]"
                />
              </div>

              <div>
                <label
                  htmlFor={examQuestionsId}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Qtd. Questões
                </label>
                <input
                  id={examQuestionsId}
                  type="number"
                  min="0"
                  placeholder="Ex: 10"
                  value={examQuestionsCount || ''}
                  onChange={(e) => setExamQuestionsCount(Number(e.target.value) || 0)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-[#005063] focus:outline-hidden dark:border-[#005063]/30 dark:bg-[#081a26] dark:text-slate-100 dark:focus:border-[#006768]"
                />
              </div>

              <div>
                <label
                  htmlFor={examDateId}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Data da Prova
                </label>
                <input
                  id={examDateId}
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-[#005063] focus:outline-hidden dark:border-[#005063]/30 dark:bg-[#081a26] dark:text-slate-100 dark:focus:border-[#006768]"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-9 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="min-h-9 rounded-xl bg-[#0d3950] px-5 text-xs font-bold text-white hover:bg-[#005063] focus-visible:outline-2 focus-visible:outline-[#005063] dark:bg-[#005063] dark:hover:bg-[#006768]"
            >
              {loading ? 'Salvando...' : 'Salvar Leitura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
