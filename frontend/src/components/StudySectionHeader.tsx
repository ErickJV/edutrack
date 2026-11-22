import { BookOpen, FileText, Plus, SidebarClose, SidebarOpen, Sparkles, Timer } from 'lucide-react'

import type { AcademicTask } from '../api/types'

export type StudyTab = 'workspace' | 'readings' | 'documents'

export type StudySectionHeaderProps = {
  activeTab: StudyTab
  onSwitchTab: (tab: StudyTab) => void
  readingsCount: number
  title: string
  variant: 'notes' | 'readings'
  notesCount?: number
  sidebarOpen?: boolean
  onToggleSidebar?: () => void
  showFocusTools?: boolean
  onToggleFocusTools?: () => void
  tasks?: AcademicTask[]
  selectedTaskId?: string
  onTaskChange?: (taskId: string) => void
  primaryLabel: string
  onPrimaryAction: () => void
}

export function StudySectionHeader({
  activeTab,
  onSwitchTab,
  readingsCount,
  title,
  variant,
  notesCount = 0,
  sidebarOpen = true,
  onToggleSidebar,
  showFocusTools = false,
  onToggleFocusTools,
  tasks = [],
  selectedTaskId = '',
  onTaskChange,
  primaryLabel,
  onPrimaryAction,
}: StudySectionHeaderProps) {
  const TitleIcon = variant === 'notes' ? FileText : BookOpen

  function tabClass(tab: StudyTab) {
    return `inline-flex min-h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-extrabold transition ${
      activeTab === tab
        ? 'bg-[#0d3950] text-white shadow-xs dark:bg-[#005063]'
        : 'text-slate-600 hover:text-[#0d3950] dark:text-slate-300 dark:hover:text-white'
    }`
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/70 px-3 py-2 sm:px-4 dark:border-[#005063]/30 dark:bg-[#041019]/60">
      <div className="flex items-center gap-2.5">
        {onToggleSidebar ? (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? 'Recolher menu de pastas' : 'Expandir menu de pastas'}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-[#005063] dark:border-slate-800 dark:bg-[#081a26] dark:text-slate-200 dark:hover:bg-[#040f17]"
          >
            {sidebarOpen ? (
              <>
                <SidebarClose className="size-3.5 text-[#005063] dark:text-[#006768]" />
                <span className="hidden sm:inline">Tela Cheia (Ocultar Menu)</span>
              </>
            ) : (
              <>
                <SidebarOpen className="size-3.5 text-[#005063] dark:text-[#006768]" />
                <span>Cadernos ({notesCount})</span>
              </>
            )}
          </button>
        ) : null}

        <div className="flex items-center gap-1.5">
          <TitleIcon className="size-4 text-[#006768] dark:text-cyan-400" />
          <h3 className="text-sm font-black tracking-tight text-[#0d3950] dark:text-slate-50">
            {title}
          </h3>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Seção de Anotações"
          className="flex rounded-xl border border-slate-200 bg-white p-0.5 dark:border-[#005063]/40 dark:bg-[#041019]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'workspace'}
            onClick={() => onSwitchTab('workspace')}
            className={tabClass('workspace')}
          >
            <FileText className="size-3.5" aria-hidden="true" />
            Anotações
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'readings'}
            onClick={() => onSwitchTab('readings')}
            className={tabClass('readings')}
          >
            <BookOpen className="size-3.5" aria-hidden="true" />
            Leituras ({readingsCount})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'documents'}
            onClick={() => onSwitchTab('documents')}
            className={tabClass('documents')}
          >
            <Sparkles className="size-3.5 text-amber-500" aria-hidden="true" />
            Upload de arquivos
          </button>
        </div>

        {onToggleFocusTools ? (
          <button
            type="button"
            onClick={onToggleFocusTools}
            className={`inline-flex min-h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition ${
              showFocusTools
                ? 'border-[#006768] bg-[#0d3950] text-white dark:bg-[#005063]'
                : 'border-slate-200 bg-white text-[#0d3950] hover:bg-slate-100 dark:border-[#005063]/40 dark:bg-[#081a26] dark:text-slate-200'
            }`}
          >
            <Timer className="size-3.5" />
            <span>{showFocusTools ? 'Ocultar Pomodoro' : 'Pomodoro & Metodologias'}</span>
          </button>
        ) : null}

        {onTaskChange ? (
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1 dark:border-[#005063]/30 dark:bg-[#081a26]">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Foco:</span>
            <select
              aria-label="Foco da sessão"
              value={selectedTaskId}
              onChange={(e) => onTaskChange(e.target.value)}
              className="w-auto min-w-fit max-w-full bg-transparent pr-2 text-xs font-bold text-[#0d3950] focus:outline-hidden dark:text-slate-100"
            >
              <option value="">(Anotação Livre)</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title} ({task.subject_name})
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onPrimaryAction}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-xl bg-[#0d3950] px-3 text-xs font-bold text-white shadow-xs transition hover:bg-[#005063] dark:bg-[#005063] dark:hover:bg-[#006768]"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          <span>{primaryLabel}</span>
        </button>
      </div>
    </div>
  )
}
