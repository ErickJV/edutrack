import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Play, Pause, SkipForward, RotateCcw, Settings2 } from 'lucide-react'
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
        setSyncNotice(`+${minutes} min sincronizados!`)
        window.setTimeout(() => setSyncNotice(''), 3500)
      } catch {
        setSyncNotice('Erro ao sincronizar minutos com a tarefa.')
        window.setTimeout(() => setSyncNotice(''), 3500)
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
  const progressPercent = Math.min(100, Math.max(0, ((totalSeconds - secondsRemaining) / totalSeconds) * 100))

  return (
    <section
      aria-label="Temporizador Pomodoro"
      className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header / Mode Segmented Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div
          role="tablist"
          aria-label="Modo do Pomodoro"
          className="grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950 flex-1 max-w-[240px]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'focus'}
            onClick={() => switchMode('focus')}
            className={`min-h-8 rounded-lg px-2 text-[11px] font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              mode === 'focus'
                ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500'
                : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-50'
            }`}
          >
            Foco
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'short_break'}
            onClick={() => switchMode('short_break')}
            className={`min-h-8 rounded-lg px-2 text-[11px] font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              mode === 'short_break'
                ? 'bg-cyan-600 text-white shadow-sm dark:bg-cyan-500'
                : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-50'
            }`}
          >
            Curta
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'long_break'}
            onClick={() => switchMode('long_break')}
            className={`min-h-8 rounded-lg px-2 text-[11px] font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              mode === 'long_break'
                ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
                : 'text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-50'
            }`}
          >
            Longa
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setTempSettings(settings)
            setSettingsOpen(true)
          }}
          aria-label="Configurar tempos do Pomodoro"
          className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          title="Configurações"
        >
          <Settings2 className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* Main Digital Display & Progress Line */}
      <div className="flex flex-col items-center justify-center py-4 text-center">
        <div
          role="timer"
          aria-label={`Tempo de ${mode === 'focus' ? 'Foco' : 'Pausa'}: ${formattedTime}`}
          className="font-mono text-4xl font-black tracking-tight text-slate-950 dark:text-slate-50"
        >
          {formattedTime}
        </div>

        {/* Linear Slim Progress Bar */}
        <div className="mt-2.5 h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
          <div
            className={`h-full transition-all duration-300 ease-linear ${
              mode === 'focus'
                ? 'bg-indigo-600 dark:bg-indigo-500'
                : mode === 'short_break'
                  ? 'bg-cyan-500 dark:bg-cyan-400'
                  : 'bg-emerald-500 dark:bg-emerald-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Status / Task Subtext */}
        <div className="mt-2 flex items-center justify-center gap-1.5 text-xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400">
            {mode === 'focus' ? 'Ciclo de Foco' : mode === 'short_break' ? 'Pausa Curta' : 'Pausa Longa'}
          </span>
          {activeTask ? (
            <span className="max-w-[120px] truncate rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
              {activeTask.title}
            </span>
          ) : null}
        </div>
      </div>

      {/* Sync feedback notification */}
      {syncNotice ? (
        <div
          role="status"
          className="mb-2 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-center text-[11px] font-bold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
        >
          {syncNotice}
        </div>
      ) : null}

      {/* Action Controls Row */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <button
          type="button"
          onClick={toggleRunning}
          className={`inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-black transition focus-visible:outline-2 focus-visible:outline-offset-2 shadow-sm ${
            isRunning
              ? 'bg-amber-500 text-white hover:bg-amber-600 focus-visible:outline-amber-600'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-600'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="size-3.5" aria-hidden="true" /> Pausar
            </>
          ) : (
            <>
              <Play className="size-3.5 fill-current" aria-hidden="true" /> Iniciar
            </>
          )}
        </button>

        <button
          type="button"
          onClick={skipInterval}
          aria-label="Pular intervalo"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-white hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          title="Pular intervalo"
        >
          <SkipForward className="size-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={resetTimer}
          aria-label="Reiniciar temporizador"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-white hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          title="Reiniciar"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* Discrete Cycles Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span className="font-semibold">
          🍅 <strong>{completedPomodoros}</strong> {completedPomodoros === 1 ? 'concluído' : 'concluídos'}
        </span>
        <span>
          {settings.longBreakInterval - (completedPomodoros % settings.longBreakInterval)} p/ longa
        </span>
      </div>

      {/* Settings Modal */}
      {settingsOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pomodoro-settings-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <h3
              id="pomodoro-settings-title"
              className="text-base font-black text-slate-950 dark:text-slate-50"
            >
              Configurar Pomodoro
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Ajuste as durações personalizadas para sua rotina de foco.
            </p>

            <form onSubmit={handleSaveSettings} className="mt-4 space-y-3">
              <div>
                <label
                  htmlFor={focusInputId}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Tempo de Foco (minutos)
                </label>
                <input
                  id={focusInputId}
                  type="number"
                  min="1"
                  max="120"
                  value={tempSettings.focusMinutes}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, focusMinutes: Number(e.target.value) || 25 })
                  }
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
                />
              </div>

              <div>
                <label
                  htmlFor={shortBreakInputId}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Pausa Curta (minutos)
                </label>
                <input
                  id={shortBreakInputId}
                  type="number"
                  min="1"
                  max="60"
                  value={tempSettings.shortBreakMinutes}
                  onChange={(e) =>
                    setTempSettings({
                      ...tempSettings,
                      shortBreakMinutes: Number(e.target.value) || 5,
                    })
                  }
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
                />
              </div>

              <div>
                <label
                  htmlFor={longBreakInputId}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Pausa Longa (minutos)
                </label>
                <input
                  id={longBreakInputId}
                  type="number"
                  min="1"
                  max="90"
                  value={tempSettings.longBreakMinutes}
                  onChange={(e) =>
                    setTempSettings({
                      ...tempSettings,
                      longBreakMinutes: Number(e.target.value) || 15,
                    })
                  }
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
                />
              </div>

              <div>
                <label
                  htmlFor={intervalInputId}
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Intervalo para Pausa Longa (ciclos)
                </label>
                <input
                  id={intervalInputId}
                  type="number"
                  min="1"
                  max="12"
                  value={tempSettings.longBreakInterval}
                  onChange={(e) =>
                    setTempSettings({
                      ...tempSettings,
                      longBreakInterval: Number(e.target.value) || 4,
                    })
                  }
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-hidden dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="sound-enabled-checkbox"
                  type="checkbox"
                  checked={tempSettings.soundEnabled}
                  onChange={(e) =>
                    setTempSettings({ ...tempSettings, soundEnabled: e.target.checked })
                  }
                  className="size-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 dark:border-slate-700 dark:bg-slate-950"
                />
                <label
                  htmlFor="sound-enabled-checkbox"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Tocar som ao finalizar ciclo
                </label>
              </div>

              <div className="mt-4 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
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
