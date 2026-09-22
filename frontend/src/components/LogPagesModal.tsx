/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useId, useState } from 'react'
import type { AcademicReading, ReadingLogPayload } from '../api/types'

export type LogPagesModalProps = {
  isOpen: boolean
  reading: AcademicReading | null
  onClose: () => void
  onLog: (readingId: string, payload: ReadingLogPayload) => Promise<void>
}

export function LogPagesModal({
  isOpen,
  reading,
  onClose,
  onLog,
}: LogPagesModalProps) {
  const [pages, setPages] = useState<number>(10)
  const [readDate, setReadDate] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const pagesId = useId()
  const dateId = useId()

  useEffect(() => {
    if (reading) {
      setPages(10)
      const today = new Date().toISOString().split('T')[0]
      setReadDate(today)
      setError('')
    }
  }, [reading, isOpen])

  if (!isOpen || !reading) return null

  const maxLoggable = Math.max(1, reading.total_pages - reading.current_page)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pages <= 0) {
      setError('A quantidade de páginas deve ser maior que zero.')
      return
    }

    setLoading(true)
    setError('')
    try {
      await onLog(reading.id, {
        pages: Number(pages),
        read_date: readDate || undefined,
      })
      onClose()
    } catch {
      setError('Erro ao registrar leitura.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-pages-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
    >
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <h3 id="log-pages-modal-title" className="text-base font-black text-slate-950 dark:text-slate-50">
          Registrar Leitura
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {reading.title} (atualmente na página {reading.current_page} de {reading.total_pages})
        </p>

        {error ? (
          <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-2 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label
              htmlFor={pagesId}
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Páginas Lidas Nesta Sessão
            </label>
            <input
              id={pagesId}
              type="number"
              min="1"
              max={maxLoggable}
              required
              value={pages}
              onChange={(e) => setPages(Number(e.target.value))}
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
            />
          </div>

          <div>
            <label
              htmlFor={dateId}
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Data da Leitura
            </label>
            <input
              id={dateId}
              type="date"
              value={readDate}
              onChange={(e) => setReadDate(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
            />
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
              className="min-h-9 rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              {loading ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
