"use client"

import { useState, useRef, useEffect } from "react"
import {
  X, Zap, Clock, Calendar, ChevronDown, Loader, CornerDownLeft,
} from "lucide-react"

const API = "http://localhost:8000/api/v1"

type Agent = {
  id: string
  name: string
  agent_type: string | null
  provider: string
  model: string
}

type Message = {
  id: string
  session_id: string
  role: string
  content: string
  agent_type: string | null
  run_id: string | null
  created_at: string
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export default function AddTaskModal({
  agent,
  token,
  currentSessionId,
  onClose,
  onTaskRun,
}: {
  agent: Agent
  token: string
  currentSessionId: string | null
  onClose: () => void
  onTaskRun: (sessionId: string, runId: string, messages: Message[]) => void
}) {
  const [prompt, setPrompt]               = useState("")
  const [mode, setMode]                   = useState<"now" | "schedule">("now")
  const [scheduleType, setScheduleType]   = useState<"once" | "daily" | "weekly">("daily")
  const [timeOfDay, setTimeOfDay]         = useState("09:00")
  const [dayOfWeek, setDayOfWeek]         = useState("Monday")
  const [runAt, setRunAt]                 = useState("")
  const [submitting, setSubmitting]       = useState(false)
  const [scheduled, setScheduled]         = useState(false)
  const textareaRef                       = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const palette: Record<string, { bg: string; text: string; ring: string }> = {
    general:    { bg: "#E7E5E4", text: "#44403C", ring: "#D6D3D1" },
    research:   { bg: "#DBEAFE", text: "#1D4ED8", ring: "#BFDBFE" },
    engineering:{ bg: "#D1FAE5", text: "#047857", ring: "#A7F3D0" },
    finance:    { bg: "#CCFBF1", text: "#0F766E", ring: "#99F6E4" },
    sales:      { bg: "#FEF3C7", text: "#B45309", ring: "#FDE68A" },
    ops:        { bg: "#F5F3FF", text: "#6D28D9", ring: "#DDD6FE" },
    data:       { bg: "#CCFBF1", text: "#0F766E", ring: "#99F6E4" },
    hr:         { bg: "#FCE7F3", text: "#BE185D", ring: "#FBCFE8" },
    support:    { bg: "#FFE4E6", text: "#BE123C", ring: "#FECDD3" },
  }
  const c = palette[agent.agent_type?.toLowerCase() ?? ""] ?? palette.general

  async function runNow() {
    if (!prompt.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/agents/${agent.id}/run-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: prompt.trim(), session_id: currentSessionId }),
      })
      if (res.ok) {
        const data = await res.json()
        onTaskRun(data.session_id, data.run_id, data.messages)
        onClose()
      }
    } catch {}
    setSubmitting(false)
  }

  async function scheduleTask() {
    if (!prompt.trim() || submitting) return
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        prompt: prompt.trim(),
        schedule_type: scheduleType,
        time_of_day: scheduleType !== "once" ? timeOfDay : undefined,
        day_of_week: scheduleType === "weekly" ? dayOfWeek.toLowerCase() : undefined,
        run_at: scheduleType === "once" && runAt ? new Date(runAt).toISOString() : undefined,
      }
      const res = await fetch(`${API}/agents/${agent.id}/schedule-task`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setScheduled(true)
        setTimeout(onClose, 1400)
      }
    } catch {}
    setSubmitting(false)
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      mode === "now" ? runNow() : scheduleTask()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-stone-900/30 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-lg shadow-[0_8px_32px_rgba(0,0,0,0.10)] flex flex-col overflow-hidden">

        {/* header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: c.bg, boxShadow: `inset 0 0 0 1px ${c.ring}` }}
          >
            <span className="font-semibold text-[13px]" style={{ color: c.text }}>
              {(agent.agent_type?.[0] || agent.name[0]).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[13.5px] text-stone-900 leading-none">{agent.name}</p>
            <p className="text-[11px] text-stone-400 mt-1 font-mono">{agent.provider} · {agent.model}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1 rounded transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* prompt */}
        <div className="px-5 pt-4 pb-3">
          <label className="text-[10.5px] font-medium text-stone-500 uppercase tracking-wider mb-2 block">
            Task
          </label>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onKey}
            rows={4}
            placeholder={`What should ${agent.name} do?`}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-3 text-[13.5px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 resize-none transition-colors leading-relaxed"
          />
          <p className="text-[10.5px] text-stone-400 mt-1.5">
            {mode === "now" ? <><kbd className="font-mono bg-stone-100 px-1 rounded">⌘ Enter</kbd> to run</> : <><kbd className="font-mono bg-stone-100 px-1 rounded">⌘ Enter</kbd> to schedule</>}
          </p>
        </div>

        {/* mode toggle */}
        <div className="px-5 pb-4">
          <div className="flex gap-2 p-1 bg-stone-100 rounded-xl">
            {(["now", "schedule"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12.5px] font-medium transition-colors ${
                  mode === m ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"
                }`}
              >
                {m === "now" ? <Zap size={12} /> : <Clock size={12} />}
                {m === "now" ? "Run now" : "Schedule"}
              </button>
            ))}
          </div>
        </div>

        {/* schedule options */}
        {mode === "schedule" && (
          <div className="px-5 pb-4 space-y-3 border-t border-stone-100 pt-4">
            {/* frequency */}
            <div>
              <label className="text-[10.5px] font-medium text-stone-500 uppercase tracking-wider mb-1.5 block">
                Frequency
              </label>
              <div className="flex gap-2">
                {(["once", "daily", "weekly"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setScheduleType(t)}
                    className={`flex-1 py-2 rounded-lg border text-[12px] font-medium capitalize transition-colors ${
                      scheduleType === t
                        ? "bg-stone-900 border-stone-900 text-white"
                        : "bg-white border-stone-200 text-stone-600 hover:border-stone-400"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* time picker */}
            {scheduleType === "once" ? (
              <div>
                <label className="text-[10.5px] font-medium text-stone-500 uppercase tracking-wider mb-1.5 block">
                  Run at
                </label>
                <input
                  type="datetime-local"
                  value={runAt}
                  onChange={(e) => setRunAt(e.target.value)}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-[13px] text-stone-900 focus:outline-none focus:border-stone-400 transition-colors"
                />
              </div>
            ) : (
              <div className={`grid gap-3 ${scheduleType === "weekly" ? "grid-cols-2" : "grid-cols-1"}`}>
                {scheduleType === "weekly" && (
                  <div>
                    <label className="text-[10.5px] font-medium text-stone-500 uppercase tracking-wider mb-1.5 block">
                      Day
                    </label>
                    <div className="relative">
                      <select
                        value={dayOfWeek}
                        onChange={(e) => setDayOfWeek(e.target.value)}
                        className="w-full appearance-none bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-[13px] text-stone-900 focus:outline-none focus:border-stone-400 transition-colors"
                      >
                        {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <ChevronDown size={13} className="absolute right-3 top-3 text-stone-400 pointer-events-none" />
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-[10.5px] font-medium text-stone-500 uppercase tracking-wider mb-1.5 block">
                    Time
                  </label>
                  <input
                    type="time"
                    value={timeOfDay}
                    onChange={(e) => setTimeOfDay(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-[13px] text-stone-900 focus:outline-none focus:border-stone-400 transition-colors"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* footer */}
        <div className="px-5 py-4 border-t border-stone-100 flex items-center justify-between bg-stone-50/50">
          <button onClick={onClose} className="text-[12px] text-stone-500 hover:text-stone-700 transition-colors">
            Cancel
          </button>
          <button
            onClick={mode === "now" ? runNow : scheduleTask}
            disabled={!prompt.trim() || submitting || scheduled}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[12.5px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              mode === "now"
                ? "bg-stone-900 hover:bg-stone-800 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {submitting ? (
              <><Loader size={12} className="animate-spin" /> {mode === "now" ? "Running…" : "Scheduling…"}</>
            ) : scheduled ? (
              "Scheduled ✓"
            ) : mode === "now" ? (
              <><Zap size={12} /> Run now</>
            ) : (
              <><Calendar size={12} /> Schedule task</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
