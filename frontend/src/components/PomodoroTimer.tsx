import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Play, Pause, SkipForward, RotateCcw, Settings2 } from 'lucide-react'
import type { AcademicTask, PomodoroMode, PomodoroSettings } from '../api/types'

/* ══ Time scrubber ════════════════════════════════════════
   A time over a ruler. Drag the ruler under the centre mark and
   the time runs with it; fling it and it coasts, then settles on
   the nearest step.

   ── ONE SPRING FOR THE THROW AND THE SNAP ───────────────
   On release the landing is decided at once: where the ruler
   would coast to at the speed it was let go, rounded to the
   nearest step. Then one spring carries it there, starting with
   the hand's own velocity — so a flick coasts and a slow
   release just settles, and there is no seam between "gliding"
   and "snapping" because they are the same motion.

   ── A DIAL SEEN FROM THE FRONT ──────────────────────────
   Ticks at the centre stand tall and dark and fall away toward
   the edges, in height and in ink, which is what makes a flat
   strip read as the face of a wheel. Only the ticks near the
   window are drawn at all, so a day of them costs thirty. */

const stillness = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const W = 300
/* px per unit along the ruler */
const PX = 2
const HALF = (W - 36) / 2
const DAY = 1440
const MAX_POMODORO_SECONDS = 120 * 60
const MIN_POMODORO_SECONDS = 1

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const wrap = (m: number) => ((m % DAY) + DAY) % DAY

/* ── a digit that rolls, through a window that fades ──────── */
function Digit({ d }: { d: string }) {
  const prev = useRef(d)
  const flip = useRef<boolean | null>(null)
  if (prev.current !== d) {
    prev.current = d
    flip.current = !flip.current
  }
  return (
    <span className="tms-col">
      <span
        className="tms-strip"
        data-flip={flip.current === null ? undefined : flip.current ? 'a' : 'b'}
        style={{ transform: `translateY(${-Number(d) * 1.5}em)` }}
      >
        {'0123456789'.split('').map((n) => (
          <span key={n}>{n}</span>
        ))}
      </span>
    </span>
  )
}

function label(m: number, h24: boolean) {
  const t = wrap(Math.round(m))
  const h = Math.floor(t / 60)
  const mm = String(t % 60).padStart(2, '0')
  if (h24) return { time: `${String(h).padStart(2, '0')}:${mm}`, mer: '' }
  return { time: `${h % 12 || 12}:${mm}`, mer: h < 12 ? 'AM' : 'PM' }
}

function formatPomodoroTime(seconds: number) {
  const safe = clamp(Math.round(seconds), 0, MAX_POMODORO_SECONDS)
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return {
    time: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
    mer: 'MIN',
  }
}

export function Scrub({
  step = '1',
  momentum = 50,
  format = '12h',
  corner = 20,
  start = 570,
}: {
  step?: string
  momentum?: number
  format?: string
  corner?: number
  start?: number
} = {}) {
  const still = stillness()
  const [pos, setPos] = useState(start)
  const p = useRef({ x: start, v: 0, to: start })
  const raf = useRef(0)
  const knobs = useRef({ step: Number(step) || 1, momentum })
  knobs.current = { step: Number(step) || 1, momentum }
  const ruler = useRef<HTMLDivElement>(null)
  const lastStep = useRef(Math.floor(start / (Number(step) || 1)))

  const hear = (x: number) => {
    const s = knobs.current.step
    const k = Math.floor(x / s)
    if (k === lastStep.current) return
    lastStep.current = k
  }

  const set = (x: number) => {
    p.current.x = x
    hear(x)
    setPos(x)
  }

  const run = () => {
    if (raf.current) return
    let prev = 0
    const tick = (t: number) => {
      const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1
      prev = t
      const c = p.current
      c.v += ((c.to - c.x) * 0.022 - c.v * 0.26) * dt
      const x = c.x + c.v * dt
      if (Math.abs(c.to - x) < 0.01 && Math.abs(c.v) < 0.01) {
        c.v = 0
        set(c.to)
        raf.current = 0
        return
      }
      set(x)
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
  }

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current)
      raf.current = 0
    },
    [],
  )

  const goTo = (to: number, v = p.current.v) => {
    p.current.to = to
    p.current.v = v
    if (still) {
      p.current.v = 0
      set(to)
      return
    }
    run()
  }

  const drag = useRef<null | { x: number; t: number; v: number; k: number }>(null)

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* a scripted pointer */
    }
    cancelAnimationFrame(raf.current)
    raf.current = 0
    const k = e.currentTarget.getBoundingClientRect().width / e.currentTarget.offsetWidth || 1
    drag.current = { x: e.clientX, t: performance.now(), v: 0, k }
    p.current.v = 0
  }

  const onMove = (e: React.PointerEvent) => {
    const g = drag.current
    if (!g) return
    const now = performance.now()
    const dm = -(e.clientX - g.x) / g.k / PX
    const dt = Math.max(1, now - g.t) / 16.67
    g.v = g.v * 0.5 + (dm / dt) * 0.5
    g.x = e.clientX
    g.t = now
    set(p.current.x + dm)
  }

  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = drag.current
    drag.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* never captured */
    }
    if (!g) return
    const v = performance.now() - g.t > 80 ? 0 : clamp(g.v, -14, 14)
    const s = knobs.current.step
    const carry = 6 + (clamp(knobs.current.momentum, 0, 100) / 100) * 30
    const land = Math.round((p.current.x + v * carry) / s) * s
    goTo(land, v * 0.6)
  }

  useEffect(() => {
    const el = ruler.current
    if (!el) return
    let idle = 0
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      cancelAnimationFrame(raf.current)
      raf.current = 0
      set(p.current.x + e.deltaX / PX)
      clearTimeout(idle)
      idle = window.setTimeout(() => {
        const s = knobs.current.step
        goTo(Math.round(p.current.x / s) * s, 0)
      }, 120)
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', wheel)
      clearTimeout(idle)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const ticks: { m: number; x: number; f: number; kind: 'hour' | 'quarter' | 'five' }[] = []
  const span = HALF / PX + 10
  for (let m = Math.ceil((pos - span) / 5) * 5; m <= pos + span; m += 5) {
    const x = (m - pos) * PX
    const f = clamp(1 - Math.pow(Math.abs(x) / HALF, 2), 0, 1)
    const w = wrap(m)
    ticks.push({ m, x, f, kind: w % 60 === 0 ? 'hour' : w % 15 === 0 ? 'quarter' : 'five' })
  }

  const h24 = format === '24h'
  const { time, mer } = label(pos, h24)
  const s = Number(step) || 15

  return (
    <div className="tms" style={{ '--tms-r': `${Math.max(0, corner)}px` } as React.CSSProperties}>
      <div className="tms-read" aria-live="polite" aria-label={`${time} ${mer}`}>
        <span className="tms-time">
          {time.split('').map((c, i) =>
            c === ':' ? (
              <span key={`c${i}`} className="tms-colon">
                :
              </span>
            ) : (
              <Digit key={time.length - i} d={c} />
            ),
          )}
        </span>
        {mer && <span className="tms-mer">{mer}</span>}
      </div>
      <div
        ref={ruler}
        className="tms-ruler"
        role="slider"
        tabIndex={0}
        aria-label="Time"
        aria-valuetext={`${time} ${mer}`}
        aria-valuenow={wrap(Math.round(pos))}
        aria-valuemin={0}
        aria-valuemax={DAY - 1}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onKeyDown={(e) => {
          const d = e.key === 'ArrowRight' ? s : e.key === 'ArrowLeft' ? -s : 0
          if (!d) return
          e.preventDefault()
          goTo(Math.round(p.current.to / s) * s + d, 0)
        }}
      >
        <div className="tms-track">
          {ticks.map((t) => (
            <span
              key={t.m}
              className="tms-tick"
              data-kind={t.kind}
              style={{
                transform: `translateX(${t.x.toFixed(2)}px) scaleY(${(0.55 + 0.45 * t.f).toFixed(3)})`,
                opacity: 0.18 + 0.82 * t.f,
              }}
            />
          ))}
          {ticks
            .filter((t) => t.kind === 'hour')
            .map((t) => {
              const h = Math.floor(wrap(t.m) / 60)
              return (
                <span
                  key={`l${t.m}`}
                  className="tms-hour"
                  style={{
                    transform: `translateX(${t.x.toFixed(2)}px) translateX(-50%)`,
                    opacity: 0.15 + 0.85 * t.f,
                  }}
                >
                  {h24 ? String(h).padStart(2, '0') : `${h % 12 || 12} ${h < 12 ? 'AM' : 'PM'}`}
                </span>
              )
            })}
        </div>
        <span className="tms-mark" aria-hidden="true" />
      </div>
    </div>
  )
}

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

  /* ── Interactive Ruler Scrubber State & Spring Physics ── */
  const still = stillness()
  const initialSeconds = settings.focusMinutes * 60
  const [pos, setPos] = useState(initialSeconds)
  const [customTotalSeconds, setCustomTotalSeconds] = useState<number | null>(null)
  const p = useRef({ x: initialSeconds, v: 0, to: initialSeconds })
  const raf = useRef(0)
  const knobs = useRef({ step: 1, momentum: 50 })
  const ruler = useRef<HTMLDivElement>(null)
  const lastStep = useRef(Math.floor(initialSeconds))
  const drag = useRef<null | { x: number; t: number; v: number; k: number }>(null)

  const hear = (x: number) => {
    const s = knobs.current.step
    const k = Math.floor(x / s)
    if (k === lastStep.current) return
    lastStep.current = k
  }

  const applyDurationFromRuler = useCallback((rawSeconds: number) => {
    const clampedSecs = clamp(Math.round(rawSeconds), MIN_POMODORO_SECONDS, MAX_POMODORO_SECONDS)
    setSecondsRemaining(clampedSecs)
    setCustomTotalSeconds(clampedSecs)
  }, [])

  const setRulerPos = useCallback(
    (x: number, syncTimer = false) => {
      const clamped = clamp(x, 0, MAX_POMODORO_SECONDS)
      p.current.x = clamped
      hear(clamped)
      setPos(clamped)
      if (syncTimer) {
        applyDurationFromRuler(clamped)
      }
    },
    [applyDurationFromRuler],
  )

  const runSpring = useCallback(
    (syncTimerWhileMoving = true) => {
      if (raf.current) return
      let prev = 0
      const tick = (t: number) => {
        const dt = prev ? clamp((t - prev) / 16.67, 0, 2.5) : 1
        prev = t
        const c = p.current
        c.v += ((c.to - c.x) * 0.022 - c.v * 0.26) * dt
        const x = c.x + c.v * dt
        if (Math.abs(c.to - x) < 0.01 && Math.abs(c.v) < 0.01) {
          c.v = 0
          setRulerPos(c.to, syncTimerWhileMoving)
          raf.current = 0
          return
        }
        setRulerPos(x, syncTimerWhileMoving)
        raf.current = requestAnimationFrame(tick)
      }
      raf.current = requestAnimationFrame(tick)
    },
    [setRulerPos],
  )

  useEffect(
    () => () => {
      cancelAnimationFrame(raf.current)
      raf.current = 0
    },
    [],
  )

  const goTo = useCallback(
    (to: number, v = p.current.v, syncTimerWhileMoving = true) => {
      const target = clamp(to, 0, MAX_POMODORO_SECONDS)
      p.current.to = target
      p.current.v = v
      if (still) {
        p.current.v = 0
        setRulerPos(target, syncTimerWhileMoving)
        return
      }
      runSpring(syncTimerWhileMoving)
    },
    [runSpring, setRulerPos, still],
  )

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* scripted pointer */
    }
    setIsRunning(false)
    cancelAnimationFrame(raf.current)
    raf.current = 0
    const k = e.currentTarget.getBoundingClientRect().width / e.currentTarget.offsetWidth || 1
    drag.current = { x: e.clientX, t: performance.now(), v: 0, k }
    p.current.v = 0
  }

  const onMove = (e: React.PointerEvent) => {
    const g = drag.current
    if (!g) return
    const now = performance.now()
    const dm = -(e.clientX - g.x) / g.k / PX
    const dt = Math.max(1, now - g.t) / 16.67
    g.v = g.v * 0.5 + (dm / dt) * 0.5
    g.x = e.clientX
    g.t = now
    setRulerPos(clamp(p.current.x + dm, MIN_POMODORO_SECONDS, MAX_POMODORO_SECONDS), true)
  }

  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = drag.current
    drag.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* never captured */
    }
    if (!g) return
    const v = performance.now() - g.t > 80 ? 0 : clamp(g.v, -14, 14)
    const s = knobs.current.step
    const carry = 6 + (clamp(knobs.current.momentum, 0, 100) / 100) * 30
    const land = clamp(
      Math.round((p.current.x + v * carry) / s) * s,
      MIN_POMODORO_SECONDS,
      MAX_POMODORO_SECONDS,
    )
    goTo(land, v * 0.6, true)
  }

  useEffect(() => {
    const el = ruler.current
    if (!el) return
    let idle = 0
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return
      e.preventDefault()
      setIsRunning(false)
      cancelAnimationFrame(raf.current)
      raf.current = 0
      setRulerPos(
        clamp(p.current.x + e.deltaX / PX, MIN_POMODORO_SECONDS, MAX_POMODORO_SECONDS),
        true,
      )
      clearTimeout(idle)
      idle = window.setTimeout(() => {
        const s = knobs.current.step
        const snapped = clamp(
          Math.round(p.current.x / s) * s,
          MIN_POMODORO_SECONDS,
          MAX_POMODORO_SECONDS,
        )
        goTo(snapped, 0, true)
      }, 120)
    }
    el.addEventListener('wheel', wheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', wheel)
      clearTimeout(idle)
    }
  }, [goTo, setRulerPos])

  const modeDefaultSeconds = useMemo(() => {
    switch (mode) {
      case 'focus':
        return settings.focusMinutes * 60
      case 'short_break':
        return settings.shortBreakMinutes * 60
      case 'long_break':
        return settings.longBreakMinutes * 60
    }
  }, [mode, settings])

  const totalSeconds = customTotalSeconds ?? modeDefaultSeconds

  // Switch mode helper
  const switchMode = useCallback(
    (newMode: PomodoroMode, customSettings?: PomodoroSettings) => {
      const activeSettings = customSettings || settings
      setIsRunning(false)
      setMode(newMode)
      setCustomTotalSeconds(null)
      let nextSecs = activeSettings.focusMinutes * 60
      if (newMode === 'short_break') nextSecs = activeSettings.shortBreakMinutes * 60
      if (newMode === 'long_break') nextSecs = activeSettings.longBreakMinutes * 60
      setSecondsRemaining(nextSecs)
      goTo(nextSecs, 0, false)
    },
    [goTo, settings],
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
        const next = prev - 1
        goTo(next, 0, false)
        return next
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [goTo, handleCycleFinished, isRunning, mode])

  // Update browser tab title
  useEffect(() => {
    const mins = Math.floor(secondsRemaining / 60)
    const secs = secondsRemaining % 60
    const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    const modeLabel = mode === 'focus' ? 'Foco' : mode === 'short_break' ? 'Pausa' : 'Pausa Longa'
    const originalTitle = document.title
    document.title = `(${timeStr}) ${modeLabel} · Impatrack`
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
    goTo(totalSeconds, 0, false)
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

  /* ── Ruler ticks around current position ── */
  const ticks: { m: number; x: number; f: number; kind: 'hour' | 'quarter' | 'five' }[] = []
  const span = HALF / PX + 10
  for (let m = Math.ceil((pos - span) / 5) * 5; m <= pos + span; m += 5) {
    if (m < 0 || m > MAX_POMODORO_SECONDS) continue
    const x = (m - pos) * PX
    const f = clamp(1 - Math.pow(Math.abs(x) / HALF, 2), 0, 1)
    ticks.push({
      m,
      x,
      f,
      kind: m % 60 === 0 ? 'hour' : m % 15 === 0 ? 'quarter' : 'five',
    })
  }

  const displaySeconds = isRunning ? secondsRemaining : Math.round(pos)
  const { time, mer } = formatPomodoroTime(displaySeconds)
  const s = knobs.current.step

  return (
    <section
      aria-label="Temporizador Pomodoro"
      className="relative flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-[#005063]/30 dark:bg-[#081a26]"
    >
      {/* Header / Mode Segmented Bar */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div
          role="tablist"
          aria-label="Modo do Pomodoro"
          className="grid flex-1 max-w-[240px] grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-[#005063]/30 dark:bg-[#041019]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'focus'}
            onClick={() => switchMode('focus')}
            className={`min-h-8 rounded-lg px-2 text-[11px] font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005063] ${
              mode === 'focus'
                ? 'bg-[#0d3950] text-white shadow-sm dark:bg-[#005063]'
                : 'text-slate-600 hover:text-[#0d3950] dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Foco
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'short_break'}
            onClick={() => switchMode('short_break')}
            className={`min-h-8 rounded-lg px-2 text-[11px] font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005063] ${
              mode === 'short_break'
                ? 'bg-[#006768] text-white shadow-sm dark:bg-[#006768]'
                : 'text-slate-600 hover:text-[#0d3950] dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Curta
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'long_break'}
            onClick={() => switchMode('long_break')}
            className={`min-h-8 rounded-lg px-2 text-[11px] font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005063] ${
              mode === 'long_break'
                ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
                : 'text-slate-600 hover:text-[#0d3950] dark:text-slate-300 dark:hover:text-white'
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
          className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-[#0d3950] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005063] dark:border-[#005063]/30 dark:text-slate-400 dark:hover:bg-[#041019] dark:hover:text-white"
          title="Configurações"
        >
          <Settings2 className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* Interactive Time Scrubber Dial */}
      <div className="flex flex-col items-center justify-center py-3 text-center">
        <div
          className="tms"
          style={{ '--tms-r': '20px' } as React.CSSProperties}
        >
          <div
            role="timer"
            className="tms-read"
            aria-live="polite"
            aria-label={`Tempo de ${mode === 'focus' ? 'Foco' : 'Pausa'}: ${time}`}
          >
            <span className="tms-time">
              {time.split('').map((c, i) =>
                c === ':' ? (
                  <span key={`c${i}`} className="tms-colon">
                    :
                  </span>
                ) : (
                  <Digit key={time.length - i} d={c} />
                ),
              )}
            </span>
            {mer && <span className="tms-mer">{mer}</span>}
          </div>

          <div
            ref={ruler}
            className="tms-ruler"
            role="slider"
            tabIndex={0}
            aria-label="Ajustar tempo arrastando a régua"
            aria-valuetext={`${time} ${mer}`}
            aria-valuenow={displaySeconds}
            aria-valuemin={MIN_POMODORO_SECONDS}
            aria-valuemax={MAX_POMODORO_SECONDS}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onKeyDown={(e) => {
              const stepSize = e.shiftKey ? 15 : s
              const d = e.key === 'ArrowRight' ? stepSize : e.key === 'ArrowLeft' ? -stepSize : 0
              if (!d) return
              e.preventDefault()
              setIsRunning(false)
              const next = clamp(
                Math.round(p.current.to / s) * s + d,
                MIN_POMODORO_SECONDS,
                MAX_POMODORO_SECONDS,
              )
              goTo(next, 0, true)
            }}
          >
            <div className="tms-track">
              {ticks.map((t) => (
                <span
                  key={t.m}
                  className="tms-tick"
                  data-kind={t.kind}
                  style={{
                    transform: `translateX(${t.x.toFixed(2)}px) scaleY(${(0.55 + 0.45 * t.f).toFixed(3)})`,
                    opacity: 0.18 + 0.82 * t.f,
                  }}
                />
              ))}
              {ticks
                .filter((t) => t.kind === 'hour')
                .map((t) => {
                  const mins = Math.floor(t.m / 60)
                  return (
                    <span
                      key={`l${t.m}`}
                      className="tms-hour"
                      style={{
                        transform: `translateX(${t.x.toFixed(2)}px) translateX(-50%)`,
                        opacity: 0.15 + 0.85 * t.f,
                      }}
                    >
                      {`${String(mins).padStart(2, '0')}m`}
                    </span>
                  )
                })}
            </div>
            <span className="tms-mark" aria-hidden="true" />
          </div>
        </div>

        {/* Status / Task Subtext */}
        <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400">
            {mode === 'focus'
              ? 'Ciclo de Foco'
              : mode === 'short_break'
                ? 'Pausa Curta'
                : 'Pausa Longa'}{' '}
            · Arraste a régua para ajustar
          </span>
          {activeTask ? (
            <span className="max-w-[120px] truncate rounded bg-[#005063]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#005063] dark:bg-[#005063]/30 dark:text-[#a8d5e5]">
              {activeTask.title}
            </span>
          ) : null}
        </div>
      </div>

      {/* Sync feedback notification */}
      {syncNotice ? (
        <div
          role="status"
          className="mb-2 rounded-lg border border-[#005063]/30 bg-[#005063]/10 px-2.5 py-1 text-center text-[11px] font-bold text-[#005063] dark:border-[#005063]/50 dark:bg-[#005063]/30 dark:text-[#a8d5e5]"
        >
          {syncNotice}
        </div>
      ) : null}

      {/* Action Controls Row */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <button
          type="button"
          onClick={toggleRunning}
          className={`inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-black shadow-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 ${
            isRunning
              ? 'bg-amber-500 text-white hover:bg-amber-600 focus-visible:outline-amber-600'
              : 'bg-[#006768] text-white hover:bg-[#005063] focus-visible:outline-[#006768] dark:bg-[#006768] dark:hover:bg-[#005063]'
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
          className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-white hover:text-[#0d3950] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005063] dark:border-[#005063]/30 dark:bg-[#041019] dark:text-slate-200 dark:hover:bg-[#081a26]"
          title="Pular intervalo"
        >
          <SkipForward className="size-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={resetTimer}
          aria-label="Reiniciar temporizador"
          className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-white hover:text-[#0d3950] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005063] dark:border-[#005063]/30 dark:bg-[#041019] dark:text-slate-200 dark:hover:bg-[#081a26]"
          title="Reiniciar"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* Discrete Cycles Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
        <span className="font-semibold">
          🍅 <strong>{completedPomodoros}</strong>{' '}
          {completedPomodoros === 1 ? 'concluído' : 'concluídos'}
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
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/30 dark:bg-[#041019] dark:text-slate-100 dark:focus:border-[#006768]"
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
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/30 dark:bg-[#041019] dark:text-slate-100 dark:focus:border-[#006768]"
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
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/30 dark:bg-[#041019] dark:text-slate-100 dark:focus:border-[#006768]"
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
                  className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-[#005063] focus:bg-white focus:outline-hidden dark:border-[#005063]/30 dark:bg-[#041019] dark:text-slate-100 dark:focus:border-[#006768]"
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
                  className="size-4 rounded border-slate-300 text-[#006768] focus:ring-[#006768] dark:border-slate-700 dark:bg-[#041019]"
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
                  className="min-h-9 rounded-xl bg-[#0d3950] px-4 text-xs font-bold text-white hover:bg-[#005063] dark:bg-[#005063] dark:hover:bg-[#006768]"
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
