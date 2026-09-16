import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { AcademicTask, PomodoroMode, PomodoroSettings } from '../api/types'

const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  soundEnabled: true,
}

const STORAGE_KEY = 'edutrack_pomodoro_settings'

function loadSettings(): PomodoroSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PomodoroSettings>
      return {
        focusMinutes: Math.max(1, Math.min(120, Number(parsed.focusMinutes) || 25)),
        shortBreakMinutes: Math.max(1, Math.min(60, Number(parsed.shortBreakMinutes) || 5)),
        longBreakMinutes: Math.max(1, Math.min(90, Number(parsed.longBreakMinutes) || 15)),
        longBreakInterval: Math.max(1, Math.min(12, Number(parsed.longBreakInterval) || 4)),
        soundEnabled: parsed.soundEnabled ?? true,
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS
}

function playNotificationSound() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(587.33, ctx.currentTime)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.6)
  } catch {
    // browser audio gesture restriction
  }
}

export type PomodoroTimerProps = {
  activeTask?: AcademicTask | null
  onSyncMinutes?: (minutes: number) => Promise<void> | void
}

export function PomodoroTimer({ activeTask, onSyncMinutes }: PomodoroTimerProps) {
  const [settings, setSettings] = useState<PomodoroSettings>(loadSettings)
  const [mode, setMode] = useState<PomodoroMode>('focus')
  const [isRunning, setIsRunning] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(settings.focusMinutes * 60)
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [tempSettings, setTempSettings] = useState<PomodoroSettings>(settings)
  const [accumulatedFocusSeconds, setAccumulatedFocusSeconds] = useState(0)
  const [syncNotice, setSyncNotice] = useState('')

  const focusInputId = useId()
  const shortBreakInputId = useId()
  const longBreakInputId = useId()
  const intervalInputId = useId()

  const totalSeconds = useMemo(() => {
    switch (mode) {
      case 'focus':
        return settings.focusMinutes * 60
      case 'short_break':
        return settings.shortBreakMinutes * 60
      case 'long_break':
        return settings.longBreakMinutes * 60
    }
  }, [mode, settings])

  // Switch mode helper
  const switchMode = useCallback(
    (newMode: PomodoroMode, customSettings?: PomodoroSettings) => {
      const activeSettings = customSettings || settings
      setIsRunning(false)
      setMode(newMode)
      let nextSecs = activeSettings.focusMinutes * 60
      if (newMode === 'short_break') nextSecs = activeSettings.shortBreakMinutes * 60
      if (newMode === 'long_break') nextSecs = activeSettings.longBreakMinutes * 60
      setSecondsRemaining(nextSecs)
    },
    [settings],
  )

  // Commit accumulated focus minutes to task
  const commitFocusTime = useCallback(
    async (secondsToCommit: number) => {
      if (!activeTask || !onSyncMinutes || secondsToCommit < 60) return
      const minutes = Math.floor(secondsToCommit / 60)
      try {
        await onSyncMinutes(minutes)
        setAccumulatedFocusSeconds((prev) => Math.max(0, prev - minutes * 60))
        setSyncNotice(`+${minutes} min registrados na tarefa!`)
        window.setTimeout(() => setSyncNotice(''), 4000)
      } catch {
        setSyncNotice('Erro ao sincronizar minutos com a tarefa.')
        window.setTimeout(() => setSyncNotice(''), 4000)
      }
    },
    [activeTask, onSyncMinutes],
  )

  // Handle cycle finish
  const handleCycleFinished = useCallback(() => {
    if (settings.soundEnabled) {
      playNotificationSound()
    }
    if (mode === 'focus') {
      const nextCount = completedPomodoros + 1
      setCompletedPomodoros(nextCount)
      void commitFocusTime(accumulatedFocusSeconds + totalSeconds)
      if (nextCount % settings.longBreakInterval === 0) {
        switchMode('long_break')
      } else {
        switchMode('short_break')
      }
    } else {
      switchMode('focus')
    }
  }, [
    accumulatedFocusSeconds,
    commitFocusTime,
    completedPomodoros,
    mode,
    settings.longBreakInterval,
    settings.soundEnabled,
    switchMode,
    totalSeconds,
  ])

  // Timer tick
  useEffect(() => {
    if (!isRunning) return
    const timer = window.setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          handleCycleFinished()
          return 0
        }
        if (mode === 'focus') {
          setAccumulatedFocusSeconds((acc) => acc + 1)
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [handleCycleFinished, isRunning, mode])

  // Update browser tab title
  useEffect(() => {
    const mins = Math.floor(secondsRemaining / 60)
    const secs = secondsRemaining % 60
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    const modeLabel = mode === 'focus' ? 'Foco' : mode === 'short_break' ? 'Pausa' : 'Pausa Longa'
    const originalTitle = document.title
    document.title = `(${timeStr}) ${modeLabel} · EduTrack`
    return () => {
      document.title = originalTitle
    }
  }, [mode, secondsRemaining])

  const toggleRunning = () => {
    if (isRunning && mode === 'focus' && accumulatedFocusSeconds >= 60) {
      // Sync on pause if 1+ minutes accumulated
      void commitFocusTime(accumulatedFocusSeconds)
    }
    setIsRunning((prev) => !prev)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setSecondsRemaining(totalSeconds)
  }

  const skipInterval = () => {
    if (mode === 'focus') {
      if (accumulatedFocusSeconds >= 60) {
        void commitFocusTime(accumulatedFocusSeconds)
      }
      switchMode('short_break')
    } else {
      switchMode('focus')
    }
  }

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault()
    setSettings(tempSettings)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tempSettings))
    setSettingsOpen(false)
    switchMode(mode, tempSettings)
  }

  const minutesDisplay = Math.floor(secondsRemaining / 60)
  const secondsDisplay = secondsRemaining % 60
  const formattedTime = `${String(minutesDisplay).padStart(2, '0')}:${String(secondsDisplay).padStart(2, '0')}`

  // Circular progress calculation
  const progressPercent = Math.min(100, Math.max(0, ((totalSeconds - secondsRemaining) / totalSeconds) * 100))
  const radius = 88
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference

  return (
    <section
      aria-label="Temporizador Pomodoro"
      className="relative flex flex-col items-center rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8"
    >
      {/* Mode Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Modo do Pomodoro"
        className="flex max-w-full flex-wrap justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 dark:border-slate-800 dark:bg-slate-950"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'focus'}
          onClick={() => switchMode('focus')}
          className={`min-h-11 min-w-11 rounded-xl px-4 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm ${
            mode === 'focus'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 dark:bg-indigo-500'
              : 'text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50'
          }`}
        >
          Foco ({settings.focusMinutes}m)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'short_break'}
          onClick={() => switchMode('short_break')}
          className={`min-h-11 min-w-11 rounded-xl px-4 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm ${
            mode === 'short_break'
              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20 dark:bg-cyan-500'
              : 'text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50'
          }`}
        >
          Pausa Curta ({settings.shortBreakMinutes}m)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'long_break'}
          onClick={() => switchMode('long_break')}
          className={`min-h-11 min-w-11 rounded-xl px-4 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:text-sm ${
            mode === 'long_break'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 dark:bg-emerald-500'
              : 'text-slate-600 hover:bg-white hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50'
          }`}
        >
          Pausa Longa ({settings.longBreakMinutes}m)
        </button>
      </div>

      {/* Circular Timer Visual */}
      <div className="relative my-6 flex size-56 items-center justify-center sm:size-64">
        <svg className="size-full -rotate-90" viewBox="0 0 200 200" aria-hidden="true">
          <circle
            cx="100"
            cy="100"
            r={radius}
            className="stroke-slate-200 fill-none dark:stroke-slate-800"
            strokeWidth="10"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            className={`fill-none transition-all duration-300 ease-linear ${
              mode === 'focus'
                ? 'stroke-indigo-600 dark:stroke-indigo-500'
                : mode === 'short_break'
                  ? 'stroke-cyan-500 dark:stroke-cyan-400'
                  : 'stroke-emerald-500 dark:stroke-emerald-400'
            }`}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        <div
          className="absolute flex flex-col items-center justify-center text-center"
          role="progressbar"
          aria-valuenow={Math.round(progressPercent)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Tempo de ${mode === 'focus' ? 'Foco' : 'Pausa'}: ${formattedTime}`}
        >
          <span
            aria-live="polite"
            className="font-mono text-4xl font-black tracking-tight text-slate-950 dark:text-slate-50 sm:text-5xl"
          >
            {formattedTime}
          </span>
          <span className="mt-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {mode === 'focus' ? 'Ciclo de Foco' : mode === 'short_break' ? 'Pausa Curta' : 'Pausa Longa'}
          </span>
          {activeTask ? (
            <span className="mt-1 max-w-[170px] truncate text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {activeTask.title}
            </span>
          ) : null}
        </div>
      </div>

      {/* Sync feedback notification */}
      {syncNotice ? (
        <div
          role="status"
          className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-bold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
        >
          {syncNotice}
        </div>
      ) : null}

      {/* Action Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={toggleRunning}
          className={`inline-flex min-h-12 min-w-32 items-center justify-center rounded-2xl px-6 text-base font-black transition focus-visible:outline-2 focus-visible:outline-offset-2 shadow-lg ${
            isRunning
              ? 'border border-amber-300 bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600 focus-visible:outline-amber-600'
              : 'bg-indigo-600 text-white shadow-indigo-600/25 hover:bg-indigo-700 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-600'
          }`}
        >
          {isRunning ? 'Pausar' : 'Iniciar'}
        </button>

        <button
          type="button"
          onClick={resetTimer}
          aria-label="Reiniciar temporizador"
          className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition hover:bg-white hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Reiniciar
        </button>

        <button
          type="button"
          onClick={skipInterval}
          aria-label="Pular para próximo intervalo"
          className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition hover:bg-white hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Pular
        </button>

        <button
          type="button"
          onClick={() => {
            setTempSettings(settings)
            setSettingsOpen(true)
          }}
          aria-label="Configurar tempos do Pomodoro"
          className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition hover:bg-white hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Configurar
        </button>
      </div>

      {/* Session Progress Info */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-6 border-t border-slate-100 pt-5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <div>
          <span className="font-semibold">Pomodoros concluídos:</span>{' '}
          <strong className="font-bold text-slate-900 dark:text-slate-100">{completedPomodoros}</strong>
        </div>
        <div>
          <span className="font-semibold">Até a pausa longa:</span>{' '}
          <strong className="font-bold text-slate-900 dark:text-slate-100">
            {settings.longBreakInterval - (completedPomodoros % settings.longBreakInterval)} restantes
          </strong>
        </div>
        {activeTask ? (
          <div>
            <span className="font-semibold">Tempo da tarefa:</span>{' '}
            <strong className="font-bold text-slate-900 dark:text-slate-100">
              {activeTask.actual_minutes} min realizados
            </strong>
          </div>
        ) : null}
      </div>

      {/* Settings Modal */}
      {settingsOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pomodoro-settings-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h3
              id="pomodoro-settings-title"
              className="text-lg font-black tracking-tight text-slate-950 dark:text-slate-50"
            >
              Configurar Pomodoro
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Personalize a duração dos ciclos de foco e descanso de acordo com seu ritmo de estudo.
            </p>

            <form onSubmit={handleSaveSettings} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor={focusInputId}
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  Tempo de Foco (minutos)
                </label>
                <input
                  id={focusInputId}
                  type="number"
                  min="1"
                  max="120"
                  required
                  value={tempSettings.focusMinutes}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, focusMinutes: Math.max(1, Number(e.target.value)) })
                  }
                  className="mt-1 block w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor={shortBreakInputId}
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  Pausa Curta (minutos)
                </label>
                <input
                  id={shortBreakInputId}
                  type="number"
                  min="1"
                  max="60"
                  required
                  value={tempSettings.shortBreakMinutes}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, shortBreakMinutes: Math.max(1, Number(e.target.value)) })
                  }
                  className="mt-1 block w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor={longBreakInputId}
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  Pausa Longa (minutos)
                </label>
                <input
                  id={longBreakInputId}
                  type="number"
                  min="1"
                  max="90"
                  required
                  value={tempSettings.longBreakMinutes}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, longBreakMinutes: Math.max(1, Number(e.target.value)) })
                  }
                  className="mt-1 block w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>

              <div>
                <label
                  htmlFor={intervalInputId}
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                >
                  Ciclos até Pausa Longa
                </label>
                <input
                  id={intervalInputId}
                  type="number"
                  min="1"
                  max="12"
                  required
                  value={tempSettings.longBreakInterval}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, longBreakInterval: Math.max(1, Number(e.target.value)) })
                  }
                  className="mt-1 block w-full min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="sound-enabled"
                  type="checkbox"
                  checked={tempSettings.soundEnabled}
                  onChange={(e) => setTempSettings({ ...tempSettings, soundEnabled: e.target.checked })}
                  className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
                />
                <label htmlFor="sound-enabled" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Emitir sinal sonoro ao fim de cada ciclo
                </label>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  Salvar preferências
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  )
}
