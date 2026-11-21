import { useState } from 'react'
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  FileEdit,
  GraduationCap,
  MoreVertical,
  Plus,
  Trash2,
} from 'lucide-react'
import type { AcademicReading } from '../api/types'
import { formatDaysRemaining } from '../utils/readingStats'

export type ReadingCardProps = {
  reading: AcademicReading
  onQuickLog10: (reading: AcademicReading) => void
  onLogCustomPages: (reading: AcademicReading) => void
  onEdit: (reading: AcademicReading) => void
  onDelete: (reading: AcademicReading) => void
  onCreateNote: (reading: AcademicReading) => void
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NOT_STARTED: {
    label: 'Não iniciado',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  READING: {
    label: 'Lendo',
    color: 'bg-[#005063]/10 text-[#005063] dark:bg-[#005063]/30 dark:text-[#a8d5e5]',
  },
  COMPLETED: {
    label: 'Concluído',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  PAUSED: {
    label: 'Em pausa',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  DROPPED: {
    label: 'Abandonado',
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
  },
}

export function ReadingCard({
  reading,
  onQuickLog10,
  onLogCustomPages,
  onEdit,
  onDelete,
  onCreateNote,
}: ReadingCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const statusInfo = STATUS_LABELS[reading.status] || STATUS_LABELS.READING
  const daysRemaining = formatDaysRemaining(reading.exam_date || reading.target_date)

  return (
    <article
      aria-label={`Leitura acadêmica: ${reading.title}`}
      className="relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-[#005063]/30 dark:bg-[#081a26]"
    >
      <div>
        {/* Top Header: Subject & Status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {reading.subject_name ? (
              <span className="rounded-md bg-[#0d3950]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0d3950] dark:bg-[#005063]/30 dark:text-[#a8d5e5]">
                {reading.subject_name}
              </span>
            ) : null}
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
          </div>

          {/* Context Options Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label={`Opções da leitura ${reading.title}`}
              className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-[#041019] dark:hover:text-slate-200"
            >
              <MoreVertical className="size-4" aria-hidden="true" />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-[#005063]/30 dark:bg-[#081a26]">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onEdit(reading)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-[#041019]"
                >
                  <FileEdit className="size-3.5" aria-hidden="true" />
                  Editar leitura
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onLogCustomPages(reading)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-[#041019]"
                >
                  <BookOpen className="size-3.5" aria-hidden="true" />
                  Registrar páginas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onCreateNote(reading)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-[#041019]"
                >
                  <FileEdit className="size-3.5" aria-hidden="true" />
                  Criar anotação
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete(reading)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Excluir
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Book Title & Author */}
        <div className="mt-2.5">
          <h4 className="text-sm font-black text-[#0d3950] dark:text-white line-clamp-2">
            {reading.title}
          </h4>
          {reading.author ? (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              por {reading.author}
            </p>
          ) : null}
        </div>

        {/* Exam Linkage Info */}
        {reading.exam_name ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-xl bg-slate-50 p-2 text-xs text-slate-600 dark:bg-[#041019] dark:text-slate-300">
            <div className="flex items-center gap-1 font-bold text-[#005063] dark:text-[#a8d5e5]">
              <GraduationCap className="size-3.5" aria-hidden="true" />
              <span>{reading.exam_name}</span>
            </div>
            {reading.exam_questions_count > 0 ? (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                • {reading.exam_questions_count} questões
              </span>
            ) : null}
            {reading.exam_date ? (
              <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                <Calendar className="size-3" aria-hidden="true" />
                {daysRemaining || reading.exam_date}
              </span>
            ) : null}
          </div>
        ) : null}

        {/* Progress Bar & Page Stats */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-600 dark:text-slate-300">
              {reading.current_page} de {reading.total_pages} páginas
            </span>
            <span className="font-bold text-[#0d3950] dark:text-white">
              {reading.progress_percent}%
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`bar-grow h-full transition-all duration-300 ${
                reading.progress_percent >= 100
                  ? 'bg-emerald-500'
                  : 'bg-[#006768] dark:bg-[#005063]'
              }`}
              style={{ width: `${reading.progress_percent}%` }}
            />
          </div>

          {/* Suggested Daily Pace */}
          {reading.suggested_pages_per_day > 0 && reading.status !== 'COMPLETED' ? (
            <p className="text-[11px] font-semibold text-[#005063] dark:text-[#a8d5e5]">
              💡 Ritmo sugerido: ~{reading.suggested_pages_per_day} págs/dia
            </p>
          ) : null}
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        {reading.status !== 'COMPLETED' ? (
          <button
            type="button"
            onClick={() => onQuickLog10(reading)}
            className="inline-flex min-h-8 flex-1 items-center justify-center gap-1 rounded-xl bg-[#0d3950] px-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#005063] dark:bg-[#005063] dark:hover:bg-[#006768]"
          >
            <Plus className="size-3.5" aria-hidden="true" />
            +10 págs
          </button>
        ) : (
          <div className="inline-flex min-h-8 flex-1 items-center justify-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Concluído
          </div>
        )}

        <button
          type="button"
          onClick={() => onCreateNote(reading)}
          className="inline-flex min-h-8 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 transition hover:bg-white hover:text-[#0d3950] dark:border-[#005063]/30 dark:bg-[#041019] dark:text-slate-200 dark:hover:bg-[#081a26]"
          title="Criar anotação vinculada"
        >
          <FileEdit className="size-3.5" aria-hidden="true" />
          Anotar
        </button>
      </div>
    </article>
  )
}
