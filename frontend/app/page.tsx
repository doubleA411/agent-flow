"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import {
  Loader,
  Sparkles,
  Settings,
  X,
  ChevronDown,
  RotateCcw,
  Zap,
  Activity,
  Command,
  CornerDownLeft,
  LayoutDashboard,
  Bot,
  Brain,
  Calendar,
  FileText,
  LogOut,
  Plus,
  Search,
  Trash2,
  Save,
  Wand2,
  Check,
  ArrowRight,
  ChevronRight,
  Clock,
} from "lucide-react"
import AgentSettings from "@/components/AgentSettings"
import AddTaskModal from "@/components/AddTaskModal"

const API = "http://localhost:8000/api/v1"

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */
type Session = {
  id: string
  title: string | null
  created_at: string
  updated_at: string
}
type Message = {
  id: string
  session_id: string
  role: "user" | "assistant" | "coordinator"
  content: string
  agent_type: string | null
  run_id: string | null
  created_at: string
}
type Agent = {
  id: string
  name: string
  agent_type: string | null
  prompt: string
  provider: string
  model: string
  created_at?: string
}
type Run = {
  id: string
  agent_id: string
  status: "pending" | "running" | "success" | "failed"
  output: string | null
  created_at: string
}
type OrgContext = {
  id: string
  company_name: string | null
  mission: string | null
  industry: string | null
  team_size: string | null
  product_description: string | null
  goals: string | null
  extra: string | null
  is_active: boolean
  updated_at: string
}
type Memory = {
  id: string
  key: string
  value: string
  source: string
  session_id: string | null
  created_at: string
}
type ScheduledTask = {
  id: string
  agent_id: string
  prompt: string
  schedule_type: string
  run_at: string | null
  time_of_day: string | null
  day_of_week: string | null
  is_active: boolean
  last_run_at: string | null
  created_at: string
}

type View = "canvas" | "agents" | "memory" | "schedule" | "digest"

/* ─────────────────────────────────────────────
   Agent palette
   ───────────────────────────────────────────── */
const AGENT_COLORS: Record<string, { bg: string; text: string; ring: string; glow: string }> = {
  general:    { bg: "#E7E5E4", text: "#44403C", ring: "#D6D3D1", glow: "rgba(120,113,108,0.25)" },
  research:   { bg: "#DBEAFE", text: "#1D4ED8", ring: "#BFDBFE", glow: "rgba(37,99,235,0.25)" },
  code:       { bg: "#D1FAE5", text: "#047857", ring: "#A7F3D0", glow: "rgba(5,150,105,0.25)" },
  coder:      { bg: "#D1FAE5", text: "#047857", ring: "#A7F3D0", glow: "rgba(5,150,105,0.25)" },
  engineering:{ bg: "#D1FAE5", text: "#047857", ring: "#A7F3D0", glow: "rgba(5,150,105,0.25)" },
  writer:     { bg: "#FEF3C7", text: "#B45309", ring: "#FDE68A", glow: "rgba(217,119,6,0.25)" },
  writing:    { bg: "#FEF3C7", text: "#B45309", ring: "#FDE68A", glow: "rgba(217,119,6,0.25)" },
  sales:      { bg: "#FEF3C7", text: "#B45309", ring: "#FDE68A", glow: "rgba(217,119,6,0.25)" },
  qa:         { bg: "#FCE7F3", text: "#BE185D", ring: "#FBCFE8", glow: "rgba(219,39,119,0.25)" },
  planner:    { bg: "#EDE9FE", text: "#6D28D9", ring: "#DDD6FE", glow: "rgba(124,58,237,0.25)" },
  planning:   { bg: "#EDE9FE", text: "#6D28D9", ring: "#DDD6FE", glow: "rgba(124,58,237,0.25)" },
  analyst:    { bg: "#CCFBF1", text: "#0F766E", ring: "#99F6E4", glow: "rgba(13,148,136,0.25)" },
  data:       { bg: "#CCFBF1", text: "#0F766E", ring: "#99F6E4", glow: "rgba(13,148,136,0.25)" },
  finance:    { bg: "#CCFBF1", text: "#0F766E", ring: "#99F6E4", glow: "rgba(13,148,136,0.25)" },
  reviewer:   { bg: "#FFE4E6", text: "#BE123C", ring: "#FECDD3", glow: "rgba(190,18,60,0.25)" },
  ops:        { bg: "#F5F3FF", text: "#6D28D9", ring: "#DDD6FE", glow: "rgba(109,40,217,0.25)" },
}

function paletteFor(type?: string | null) {
  if (!type) return AGENT_COLORS.general
  return AGENT_COLORS[type.toLowerCase()] || AGENT_COLORS.general
}

/* ─────────────────────────────────────────────
   Auth
   ───────────────────────────────────────────── */
function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}
function authHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }
}

/* ─────────────────────────────────────────────
   Status pill
   ───────────────────────────────────────────── */
function StatusPill({ status }: { status: Run["status"] | "queued" }) {
  const map: Record<string, string> = {
    pending: "bg-stone-100 text-stone-600 ring-stone-200",
    queued:  "bg-stone-100 text-stone-600 ring-stone-200",
    running: "bg-blue-50 text-blue-700 ring-blue-200",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    failed:  "bg-rose-50 text-rose-700 ring-rose-200",
  }
  const label =
    status === "running" ? "Running"
    : status === "success" ? "Done"
    : status === "failed" ? "Failed"
    : "Queued"
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10.5px] font-medium px-1.5 py-0.5 rounded ring-1 ring-inset ${map[status] || map.pending}`}
    >
      {(status === "running" || status === "pending") && (
        <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
      )}
      {label}
    </span>
  )
}

/* ─────────────────────────────────────────────
   Avatar
   ───────────────────────────────────────────── */
function AgentAvatar({ type, size = 28 }: { type?: string | null; size?: number }) {
  const c = paletteFor(type)
  const initial = (type?.[0] || "A").toUpperCase()
  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        background: c.bg,
        color: c.text,
        boxShadow: `inset 0 0 0 1px ${c.ring}`,
      }}
    >
      <span className="font-semibold" style={{ fontSize: Math.max(10, size * 0.4) }}>
        {initial}
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Inline markdown (compact)
   ───────────────────────────────────────────── */
function renderInline(text: string, base: string) {
  const out: React.ReactNode[] = []
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    const t = m[0]
    if (t.startsWith("**"))
      out.push(
        <strong key={`${base}-b-${i++}`} className="font-semibold text-stone-900">
          {t.slice(2, -2)}
        </strong>,
      )
    else
      out.push(
        <code key={`${base}-c-${i++}`} className="font-mono text-[0.85em] bg-stone-100 text-stone-800 px-1 py-0.5 rounded">
          {t.slice(1, -1)}
        </code>,
      )
    last = m.index + t.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function Markdown({ source }: { source: string }) {
  const blocks = useMemo(() => {
    const out: React.ReactNode[] = []
    const lines = source.split("\n")
    let i = 0, k = 0
    while (i < lines.length) {
      const line = lines[i]
      if (line.trim().startsWith("```")) {
        const lang = line.trim().slice(3).trim()
        const buf: string[] = []
        i++
        while (i < lines.length && !lines[i].trim().startsWith("```")) {
          buf.push(lines[i])
          i++
        }
        i++
        out.push(
          <pre key={`p-${k++}`} className="bg-stone-900 text-stone-50 rounded-lg px-3.5 py-2.5 my-2 overflow-x-auto text-[12px] leading-relaxed font-mono">
            {lang && <div className="text-stone-500 text-[10px] uppercase tracking-wider mb-1.5">{lang}</div>}
            <code>{buf.join("\n")}</code>
          </pre>,
        )
        continue
      }
      if (/^\s*[-*]\s+/.test(line)) {
        const items: string[] = []
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*[-*]\s+/, ""))
          i++
        }
        out.push(
          <ul key={`u-${k++}`} className="list-disc pl-5 my-1 space-y-0.5 marker:text-stone-400">
            {items.map((x, idx) => <li key={idx}>{renderInline(x, `u-${k}-${idx}`)}</li>)}
          </ul>,
        )
        continue
      }
      if (/^\s*\d+\.\s+/.test(line)) {
        const items: string[] = []
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
          items.push(lines[i].replace(/^\s*\d+\.\s+/, ""))
          i++
        }
        out.push(
          <ol key={`o-${k++}`} className="list-decimal pl-5 my-1 space-y-0.5 marker:text-stone-400">
            {items.map((x, idx) => <li key={idx}>{renderInline(x, `o-${k}-${idx}`)}</li>)}
          </ol>,
        )
        continue
      }
      if (line.trim() === "") { i++; continue }
      const para: string[] = [line]
      i++
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !/^\s*([-*]|\d+\.)\s+/.test(lines[i]) &&
        !lines[i].trim().startsWith("```")
      ) {
        para.push(lines[i])
        i++
      }
      out.push(
        <p key={`pp-${k++}`} className="my-1 leading-relaxed">
          {renderInline(para.join(" "), `pp-${k}`)}
        </p>,
      )
    }
    return out
  }, [source])
  return <div className="text-[12.5px] text-stone-800">{blocks}</div>
}

/* ─────────────────────────────────────────────
   Time helpers
   ───────────────────────────────────────────── */
function relTime(iso: string) {
  const t = new Date(iso + (iso.endsWith("Z") ? "" : "Z")).getTime()
  const diff = Date.now() - t
  const s = Math.floor(diff / 1000)
  if (s < 5) return "just now"
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

/* ─────────────────────────────────────────────
   Nav rail
   ───────────────────────────────────────────── */
const NAV_ITEMS: { id: View; icon: React.ElementType; label: string }[] = [
  { id: "canvas",   icon: LayoutDashboard, label: "Canvas" },
  { id: "agents",   icon: Bot,             label: "Agents" },
  { id: "memory",   icon: Brain,           label: "Memory" },
  { id: "schedule", icon: Calendar,        label: "Schedule" },
  { id: "digest",   icon: FileText,        label: "Digest" },
]

function NavRail({
  view,
  onView,
  onSignOut,
}: {
  view: View
  onView: (v: View) => void
  onSignOut: () => void
}) {
  return (
    <nav className="w-14 shrink-0 border-r border-stone-200 bg-white flex flex-col items-center py-3 gap-0.5 z-40">
      {/* logo */}
      <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center mb-4 shrink-0">
        <Sparkles size={13} className="text-white" />
      </div>

      {/* nav items */}
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = view === item.id
        return (
          <button
            key={item.id}
            onClick={() => onView(item.id)}
            title={item.label}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              active
                ? "bg-stone-900 text-white"
                : "text-stone-400 hover:bg-stone-100 hover:text-stone-700"
            }`}
          >
            <Icon size={16} />
          </button>
        )
      })}

      {/* sign out at bottom */}
      <div className="mt-auto">
        <button
          onClick={onSignOut}
          title="Sign out"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
        >
          <LogOut size={15} />
        </button>
      </div>
    </nav>
  )
}

/* ═══════════════════════════════════════════════════════════
   Workspace (the page)
   ═══════════════════════════════════════════════════════════ */
export default function Workspace() {
  const [ready, setReady] = useState(false)
  const [view, setView] = useState<View>("canvas")
  const [agents, setAgents] = useState<Agent[]>([])
  const [runsByAgent, setRunsByAgent] = useState<Record<string, Run[]>>({})
  const [messagesByRun, setMessagesByRun] = useState<Record<string, Message>>({})
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [dispatching, setDispatching] = useState(false)
  const [inspector, setInspector] = useState<Agent | null>(null)
  const [editing, setEditing] = useState<Agent | null>(null)
  const [orgContext, setOrgContext] = useState<OrgContext | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([])
  const [addingTaskFor, setAddingTaskFor] = useState<Agent | null>(null)
  const [bootstrapDone, setBootstrapDone] = useState(false)
  const [onboardingSkipped, setOnboardingSkipped] = useState(false)
  const [, setTick] = useState(0)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setReady(true)
    setOnboardingSkipped(localStorage.getItem("onboarding_skipped") === "true")
    const tok = getToken()
    if (tok) bootstrap(tok)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  async function bootstrap(token: string) {
    const [agentsRes, sessionsRes] = await Promise.all([
      fetch(`${API}/agents`, { headers: authHeaders(token) }),
      fetch(`${API}/sessions/`, { headers: authHeaders(token) }),
    ])

    // Stale token (user deleted) — force re-login
    if (agentsRes.status === 401 || sessionsRes.status === 401) {
      localStorage.removeItem("token")
      window.location.reload()
      return
    }

    const ags: Agent[] = await agentsRes.json().catch(() => [])
    const sess: Session[] = await sessionsRes.json().catch(() => [])

    // Guard against unexpected non-array responses
    if (!Array.isArray(ags) || !Array.isArray(sess)) {
      localStorage.removeItem("token")
      window.location.reload()
      return
    }

    setAgents(ags)
    setSessions(sess)
    if (sess[0]?.id) {
      setSessionId(sess[0].id)
      fetchMessages(sess[0].id, token)
    }
    refreshRuns(ags, token)

    // Load org context (404 = not set up yet, that's fine)
    try {
      const orgRes = await fetch(`${API}/org`, { headers: authHeaders(token) })
      if (orgRes.ok) setOrgContext(await orgRes.json())
    } catch {}

    // Load memories
    try {
      const memRes = await fetch(`${API}/memories`, { headers: authHeaders(token) })
      if (memRes.ok) setMemories(await memRes.json())
    } catch {}

    // Load scheduled tasks
    try {
      const stRes = await fetch(`${API}/scheduled-tasks`, { headers: authHeaders(token) })
      if (stRes.ok) setScheduledTasks(await stRes.json())
    } catch {}

    setBootstrapDone(true)
  }

  async function fetchMessages(sid: string, token: string) {
    const res = await fetch(`${API}/sessions/${sid}/messages`, { headers: authHeaders(token) })
    if (!res.ok) return
    const msgs: Message[] = await res.json()
    setMessages(msgs)
    setMessagesByRun((prev) => {
      const next = { ...prev }
      msgs.forEach((m) => { if (m.run_id) next[m.run_id] = m })
      return next
    })
  }

  async function selectSession(sid: string) {
    const token = getToken()
    if (!token) return
    setSessionId(sid)
    setMessages([])
    fetchMessages(sid, token)
  }

  async function newSession() {
    const token = getToken()
    if (!token) return
    const res = await fetch(`${API}/sessions/`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ title: null }),
    })
    const s: Session = await res.json()
    setSessions((prev) => [s, ...prev])
    setSessionId(s.id)
    setMessages([])
  }

  async function refreshRuns(ags: Agent[], token: string) {
    const results = await Promise.all(
      ags.map((a) =>
        fetch(`${API}/agents/${a.id}/runs`, { headers: authHeaders(token) })
          .then((r) => r.json())
          .then((rs: Run[]) => [a.id, rs] as const)
          .catch(() => [a.id, []] as const),
      ),
    )
    const map: Record<string, Run[]> = {}
    results.forEach(([id, rs]) => {
      map[id] = rs.slice().sort(
        (x, y) => new Date(y.created_at).getTime() - new Date(x.created_at).getTime(),
      )
    })
    setRunsByAgent(map)
  }

  async function ensureSession(token: string): Promise<string> {
    if (sessionId) return sessionId
    const res = await fetch(`${API}/sessions/`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ title: null }),
    })
    const s: Session = await res.json()
    setSessionId(s.id)
    return s.id
  }

  async function dispatch() {
    const token = getToken()
    if (!token || !input.trim() || dispatching) return
    setDispatching(true)
    const content = input
    setInput("")
    const sid = await ensureSession(token)

    const optimistic: Message = {
      id: crypto.randomUUID(),
      session_id: sid,
      role: "user",
      content,
      agent_type: null,
      run_id: null,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])

    const res = await fetch(`${API}/sessions/${sid}/messages`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ content }),
    })
    const msgs: Message[] = await res.json()

    setMessages((prev) => {
      const without = prev.filter((m) => m.id !== optimistic.id)
      return [...without, ...msgs]
    })
    setMessagesByRun((prev) => {
      const next = { ...prev }
      msgs.forEach((m) => { if (m.run_id) next[m.run_id] = m })
      return next
    })

    await refreshRuns(agents, token)
    msgs.filter((m) => m.run_id).forEach((m) => pollRun(m.run_id!, token, sid))

    fetch(`${API}/sessions/`, { headers: authHeaders(token) })
      .then((r) => r.json())
      .then((s) => setSessions(s))

    setDispatching(false)
  }

  const pollRun = useCallback(
    (runId: string, token: string, sid: string) => {
      const iv = setInterval(async () => {
        try {
          const r = await fetch(`${API}/runs/${runId}`, { headers: authHeaders(token) })
          if (!r.ok) { clearInterval(iv); return }
          const run: Run = await r.json()
          setRunsByAgent((prev) => {
            const list = prev[run.agent_id] || []
            const exists = list.find((x) => x.id === run.id)
            const merged = exists ? list.map((x) => (x.id === run.id ? run : x)) : [run, ...list]
            return { ...prev, [run.agent_id]: merged }
          })
          if (run.status === "success" || run.status === "failed") {
            clearInterval(iv)
            fetchMessages(sid, token)
          }
        } catch {
          clearInterval(iv)
        }
      }, 1200)
    },
    [],
  )

  async function retry(run: Run) {
    const token = getToken()
    if (!token || !sessionId) return
    const r = await fetch(`${API}/runs/${run.id}/retry`, {
      method: "POST",
      headers: authHeaders(token),
    })
    if (r.ok) pollRun(run.id, token, sessionId)
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      dispatch()
    }
  }

  const counts = useMemo(() => {
    const out: Record<string, { running: number; queued: number; done: number; failed: number }> = {}
    agents.forEach((a) => {
      const list = runsByAgent[a.id] || []
      out[a.id] = {
        running: list.filter((r) => r.status === "running").length,
        queued:  list.filter((r) => r.status === "pending").length,
        done:    list.filter((r) => r.status === "success").length,
        failed:  list.filter((r) => r.status === "failed").length,
      }
    })
    return out
  }, [agents, runsByAgent])

  if (!ready) return null
  const token = getToken()
  if (!token)
    return (
      <LoginScreen
        onLogin={(t) => {
          localStorage.setItem("token", t)
          window.location.reload()
        }}
      />
    )

  const activeSession = sessions.find((s) => s.id === sessionId) || null

  // Show onboarding when bootstrap has finished and no org context exists yet
  if (bootstrapDone && !orgContext && !onboardingSkipped) {
    return (
      <OnboardingScreen
        token={token}
        onComplete={async (ctx) => {
          setOrgContext(ctx)
          // Refresh agents — deploy-agents may have just created new ones
          const res = await fetch(`${API}/agents`, { headers: authHeaders(token) })
          if (res.ok) {
            const ags: Agent[] = await res.json()
            setAgents(ags)
            refreshRuns(ags, token)
          }
        }}
        onSkip={() => {
          localStorage.setItem("onboarding_skipped", "true")
          setOnboardingSkipped(true)
        }}
      />
    )
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#FAF9F7] text-stone-900 flex">
      {/* ── Nav rail ─────────────────────────────── */}
      <NavRail
        view={view}
        onView={setView}
        onSignOut={() => {
          localStorage.removeItem("token")
          window.location.reload()
        }}
      />

      {/* ── Canvas view ──────────────────────────── */}
      {view === "canvas" && (
        <>
          <div className="relative flex-1 min-w-0">
            {/* top bar */}
            <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-5 py-3.5 pointer-events-none">
              <div className="pointer-events-auto">
                <p className="text-[12.5px] font-medium text-stone-700 leading-none">
                  Workspace
                </p>
                <p className="text-[10.5px] text-stone-500 mt-1 leading-none tracking-wide">
                  {agents.length} agent{agents.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-2 pointer-events-auto">
                <div className="flex items-center gap-1.5 text-[10.5px] text-stone-500 bg-white/60 backdrop-blur ring-1 ring-stone-200 px-2 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]" />
                  Live
                </div>
              </div>
            </div>

            <Canvas agents={agents} counts={counts} onSelect={(a) => setInspector(a)} active={dispatching} />

            {/* first-time setup nudge */}
            {!orgContext && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
                <div className="bg-white border border-stone-200 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.06)] max-w-[420px]">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                    <Brain size={13} className="text-amber-600" />
                  </div>
                  <p className="text-[12px] text-stone-600 leading-snug flex-1">
                    Add your company context so agents always know who they're working for.
                  </p>
                  <button
                    onClick={() => setView("memory")}
                    className="text-[11.5px] font-medium text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded-lg transition-colors shrink-0"
                  >
                    Set up
                  </button>
                </div>
              </div>
            )}

            {/* command bar */}
            <div className="absolute left-1/2 -translate-x-1/2 top-16 z-20 w-[640px] max-w-[92vw] pointer-events-auto">
              <div
                className={`bg-white/85 backdrop-blur-xl ring-1 transition-all rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.06)] ${
                  dispatching
                    ? "ring-stone-900 shadow-[0_4px_40px_rgba(28,25,23,0.15)]"
                    : "ring-stone-200 hover:ring-stone-300 focus-within:ring-stone-900"
                }`}
              >
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <div className="text-stone-400 shrink-0">
                    {dispatching ? <Loader size={14} className="animate-spin" /> : <Zap size={14} />}
                  </div>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKey}
                    placeholder={dispatching ? "Dispatching to agents…" : "Tell your agents what to do…"}
                    rows={1}
                    className="flex-1 bg-transparent text-[13.5px] text-stone-900 placeholder-stone-400 focus:outline-none resize-none leading-relaxed py-1"
                    style={{ minHeight: "24px", maxHeight: "180px" }}
                  />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] text-stone-500 bg-stone-100 ring-1 ring-stone-200 px-1.5 py-0.5 rounded font-mono">
                      <Command size={9} />K
                    </kbd>
                    <button
                      onClick={dispatch}
                      disabled={dispatching || !input.trim()}
                      className="bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-[11.5px] font-medium"
                    >
                      Dispatch
                      <CornerDownLeft size={10} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Inspector */}
            {inspector && (
              <Inspector
                agent={inspector}
                runs={runsByAgent[inspector.id] || []}
                messagesByRun={messagesByRun}
                onClose={() => setInspector(null)}
                onEdit={() => { setEditing(inspector); setInspector(null) }}
                onRetry={retry}
              />
            )}
          </div>

          <ChatPanel
            agents={agents}
            messages={messages}
            sessions={sessions}
            activeSession={activeSession}
            onSelectSession={selectSession}
            onNewSession={newSession}
            onRetry={retry}
            runsByAgent={runsByAgent}
          />
        </>
      )}

      {/* ── Memory / Company view ─────────────────── */}
      {view === "memory" && (
        <MemoryView
          token={token}
          orgContext={orgContext}
          onOrgUpdate={setOrgContext}
          memories={memories}
          onMemoriesChange={setMemories}
        />
      )}

      {/* ── Agents view ──────────────────────────── */}
      {view === "agents" && (
        <AgentsView
          agents={agents}
          counts={counts}
          runsByAgent={runsByAgent}
          onEdit={(a) => setEditing(a)}
          onAddTask={(a) => setAddingTaskFor(a)}
        />
      )}

      {/* ── Schedule view ────────────────────────── */}
      {view === "schedule" && (
        <ScheduleView
          agents={agents}
          scheduledTasks={scheduledTasks}
          token={token}
          onDelete={(id) => setScheduledTasks((prev) => prev.filter((t) => t.id !== id))}
          onAddTask={(a) => setAddingTaskFor(a)}
        />
      )}
      {view === "digest" && (
        <ComingSoon
          title="Daily Digest"
          description="A daily auto-generated summary of everything your agents accomplished."
          icon={FileText}
        />
      )}

      {/* ── Agent settings modal ─────────────────── */}
      {editing && (
        <AgentSettings
          agent={editing}
          token={token}
          onClose={() => setEditing(null)}
          onUpdated={(updated) => {
            setAgents((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
            setEditing(null)
          }}
        />
      )}

      {/* ── Add task modal ───────────────────────── */}
      {addingTaskFor && (
        <AddTaskModal
          agent={addingTaskFor}
          token={token}
          currentSessionId={sessionId}
          onClose={() => setAddingTaskFor(null)}
          onTaskRun={(newSessionId, runId, msgs) => {
            // Switch to canvas + load the new session in chat panel
            setView("canvas")
            setSessionId(newSessionId)
            setSessions((prev) =>
              prev.find((s) => s.id === newSessionId)
                ? prev
                : [{ id: newSessionId, title: msgs[0]?.content?.slice(0, 60) ?? null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...prev]
            )
            setMessages(msgs as Message[])
            setMessagesByRun((prev) => {
              const next = { ...prev }
              msgs.forEach((m) => { if (m.run_id) next[m.run_id] = m as Message })
              return next
            })
            refreshRuns(agents, token)
            pollRun(runId, token, newSessionId)
          }}
        />
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Canvas (radial agent layout)
   ───────────────────────────────────────────── */
function Canvas({
  agents,
  counts,
  onSelect,
  active,
}: {
  agents: Agent[]
  counts: Record<string, { running: number; queued: number; done: number; failed: number }>
  onSelect: (a: Agent) => void
  active: boolean
}) {
  const W = 1200
  const H = 800
  const cx = W / 2
  const cy = H / 2
  const R = Math.min(W, H) * 0.32
  const PILL_W = 168
  const PILL_H = 48
  const COORD_W = 220
  const COORD_H = 72

  const positions = useMemo(() => {
    const n = Math.max(agents.length, 1)
    const startAngle = -Math.PI / 2
    return agents.map((_, i) => {
      const angle = startAngle + (i * 2 * Math.PI) / n
      return { angle, x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) }
    })
  }, [agents, cx, cy, R])

  function rectEdgeT(angle: number, w: number, h: number) {
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    const tx = w / 2 / Math.max(Math.abs(c), 1e-6)
    const ty = h / 2 / Math.max(Math.abs(s), 1e-6)
    return Math.min(tx, ty)
  }

  return (
    <div className="absolute inset-0">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
        <circle cx={cx} cy={cy} r={R}       fill="none" stroke="#E7E5E4" strokeDasharray="2 6" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={R * 0.55} fill="none" stroke="#EFEDEB" strokeDasharray="1 7" strokeWidth={1} />

        {agents.map((agent, i) => {
          const p = positions[i]
          const palette = paletteFor(agent.agent_type)
          const tCoord = rectEdgeT(p.angle, COORD_W, COORD_H)
          const tPill  = rectEdgeT(p.angle, PILL_W, PILL_H)
          const c = Math.cos(p.angle)
          const s = Math.sin(p.angle)
          const x1 = cx + c * (tCoord + 4)
          const y1 = cy + s * (tCoord + 4)
          const x2 = p.x - c * (tPill + 4)
          const y2 = p.y - s * (tPill + 4)
          const isRunning = (counts[agent.id]?.running ?? 0) > 0
          return (
            <g key={`rail-${agent.id}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E7E5E4" strokeWidth={1} />
              {isRunning && (
                <>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={palette.text} strokeOpacity={0.18} strokeWidth={5} strokeLinecap="round" />
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={palette.text} strokeWidth={1.6} strokeLinecap="round" strokeDasharray="6 8" style={{ animation: "rail-flow 1.2s linear infinite" }} />
                </>
              )}
            </g>
          )
        })}

        <circle cx={cx} cy={cy} r={Math.max(COORD_W, COORD_H) / 2 + 24} fill="none" stroke="#E7E5E4" strokeDasharray="3 5" strokeWidth={1} opacity={0.7} />

        <foreignObject x={cx - COORD_W / 2} y={cy - COORD_H / 2} width={COORD_W} height={COORD_H} style={{ overflow: "visible" }}>
          <div
            // @ts-expect-error xmlns is fine inside foreignObject
            xmlns="http://www.w3.org/1999/xhtml"
            className={`h-full w-full bg-white rounded-2xl flex items-center transition-all`}
            style={{
              boxShadow: active
                ? "0 8px 30px rgba(28,25,23,0.10), 0 0 0 1px #D6D3D1"
                : "0 2px 12px rgba(28,25,23,0.05), 0 0 0 1px #E7E5E4",
              padding: "0 22px",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-stone-900 flex items-center justify-center">
                  <Sparkles size={15} className="text-white" strokeWidth={2} />
                </div>
                {active && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white" />
                )}
              </div>
              <div className="leading-tight">
                <p className="font-display text-[20px] text-stone-900 leading-none">Coordinator</p>
                <p className="font-mono text-[10px] text-stone-500 mt-1.5 tracking-tight">routing · llama-3.1-8b</p>
              </div>
            </div>
          </div>
        </foreignObject>

        {agents.map((agent, i) => {
          const p = positions[i]
          const c = paletteFor(agent.agent_type)
          const cnt = counts[agent.id] || { running: 0, queued: 0, done: 0, failed: 0 }
          const isRunning = cnt.running > 0
          return (
            <AgentNode key={agent.id} x={p.x} y={p.y} agent={agent} palette={c} counts={cnt} running={isRunning} onClick={() => onSelect(agent)} />
          )
        })}

        <defs>
          <style>{`
            @keyframes ping-slow {
              0% { transform: scale(1); opacity: 0.6; }
              100% { transform: scale(1.7); opacity: 0; }
            }
            @keyframes rail-flow {
              from { stroke-dashoffset: 0; }
              to   { stroke-dashoffset: -28; }
            }
          `}</style>
        </defs>
      </svg>

      {agents.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center mt-32">
            <p className="text-stone-500 text-[13px]">No agents provisioned</p>
            <p className="text-stone-400 text-[11.5px] mt-1">Create one to populate the workspace</p>
          </div>
        </div>
      )}
    </div>
  )
}

function AgentNode({
  x, y, agent, palette, running, onClick,
}: {
  x: number; y: number; agent: Agent
  palette: { bg: string; text: string; ring: string; glow: string }
  counts: { running: number; queued: number; done: number; failed: number }
  running: boolean
  onClick: () => void
}) {
  const W = 168, H = 48, PAD = 12
  return (
    <foreignObject x={x - W / 2 - PAD} y={y - H / 2 - PAD} width={W + PAD * 2} height={H + PAD * 2} style={{ overflow: "visible" }}>
      <div
        // @ts-expect-error xmlns is fine inside foreignObject
        xmlns="http://www.w3.org/1999/xhtml"
        onClick={onClick}
        className="group cursor-pointer flex items-center justify-center h-full w-full"
      >
        <div
          className="relative bg-white rounded-full transition-all flex items-center gap-2.5 pl-1.5 pr-4 hover:-translate-y-0.5"
          style={{
            width: W, height: H,
            boxShadow: running
              ? `0 6px 20px ${palette.glow}, 0 0 0 1px ${palette.ring}`
              : "0 1px 2px rgba(28,25,23,0.04), 0 0 0 1px #E7E5E4",
          }}
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: palette.bg, color: palette.text, boxShadow: `inset 0 0 0 1px ${palette.ring}` }}>
            <span className="font-semibold text-[12px]">
              {(agent.agent_type?.[0] || agent.name[0]).toUpperCase()}
            </span>
          </div>
          <span className="text-[13px] font-medium text-stone-900 tracking-tight truncate">
            {agent.name}
          </span>
          {running && (
            <span className="absolute -top-1 -right-1 flex">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping" style={{ background: palette.text }} />
              <span className="relative inline-flex w-2.5 h-2.5 rounded-full ring-2 ring-white" style={{ background: palette.text }} />
            </span>
          )}
        </div>
      </div>
    </foreignObject>
  )
}

/* ─────────────────────────────────────────────
   Chat panel (docked right, always open)
   ───────────────────────────────────────────── */
function ChatPanel({
  agents, messages, sessions, activeSession, onSelectSession, onNewSession, onRetry, runsByAgent,
}: {
  agents: Agent[]; messages: Message[]; sessions: Session[]
  activeSession: Session | null; onSelectSession: (id: string) => void
  onNewSession: () => void; onRetry: (r: Run) => void
  runsByAgent: Record<string, Run[]>
}) {
  const [showSessions, setShowSessions] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  const runById = useMemo(() => {
    const map: Record<string, Run> = {}
    Object.values(runsByAgent).forEach((list) => list.forEach((r) => { map[r.id] = r }))
    return map
  }, [runsByAgent])

  const agentByType = useMemo(() => {
    const map: Record<string, Agent> = {}
    agents.forEach((a) => { if (a.agent_type) map[a.agent_type] = a })
    return map
  }, [agents])

  return (
    <aside className="w-[400px] shrink-0 border-l border-stone-200 bg-white/60 backdrop-blur flex flex-col h-full">
      <div className="px-4 py-3 border-b border-stone-200 flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <button
            onClick={() => setShowSessions((s) => !s)}
            className="flex items-center gap-1.5 hover:bg-stone-100/70 rounded px-1.5 py-0.5 -mx-1.5 transition-colors"
          >
            <p className="font-display text-[16px] text-stone-900 leading-none truncate">
              {activeSession?.title || "New conversation"}
            </p>
            <ChevronDown size={12} className={`text-stone-400 transition-transform ${showSessions ? "rotate-180" : ""}`} />
          </button>
          <p className="text-[10.5px] text-stone-500 mt-1 leading-none">
            {messages.length} message{messages.length === 1 ? "" : "s"} · {sessions.length} session{sessions.length === 1 ? "" : "s"}
          </p>
        </div>
        <button
          onClick={onNewSession}
          className="text-[10.5px] font-medium text-stone-600 hover:text-stone-900 bg-white ring-1 ring-stone-200 hover:ring-stone-300 px-2 py-1 rounded-md transition-colors"
        >
          + New
        </button>
      </div>

      {showSessions && (
        <div className="border-b border-stone-200 max-h-[40vh] overflow-y-auto bg-white/80">
          {sessions.length === 0 ? (
            <p className="text-[11.5px] text-stone-400 px-4 py-3">No sessions yet</p>
          ) : (
            sessions.map((s) => (
              <button key={s.id} onClick={() => { onSelectSession(s.id); setShowSessions(false) }}
                className={`w-full text-left px-4 py-2 transition-colors ${s.id === activeSession?.id ? "bg-stone-100" : "hover:bg-stone-50"}`}>
                <p className="text-[12px] text-stone-800 truncate">{s.title || "New conversation"}</p>
                <p className="text-[10px] text-stone-400 mt-0.5">{relTime(s.updated_at)}</p>
              </button>
            ))
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-16 text-center">
            <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center mb-3">
              <Sparkles size={14} className="text-white" />
            </div>
            <p className="text-stone-700 text-[12.5px] font-medium">Dispatch a task</p>
            <p className="text-stone-400 text-[11px] mt-1 max-w-[240px]">
              Type into the command bar above. The coordinator will route it to the right agents.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <ChatMessage
              key={m.id}
              message={m}
              run={m.run_id ? runById[m.run_id] : null}
              agent={m.agent_type ? agentByType[m.agent_type] || agents.find((a) => a.agent_type === m.agent_type) || null : null}
              onRetry={onRetry}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-2.5 border-t border-stone-200 flex items-center justify-between text-[10.5px] text-stone-400 bg-white/40">
        <span className="inline-flex items-center gap-1"><Activity size={10} /> Live</span>
        <span>
          Use the command bar above —{" "}
          <kbd className="font-mono bg-stone-100 ring-1 ring-stone-200 px-1 py-0.5 rounded">
            <Command size={8} className="inline -mt-0.5" />K
          </kbd>
        </span>
      </div>
    </aside>
  )
}

function ChatMessage({ message, run, agent, onRetry }: {
  message: Message; run: Run | null; agent: Agent | null; onRetry: (r: Run) => void
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] bg-stone-900 text-white px-3.5 py-2 rounded-2xl rounded-br-md text-[12.5px] leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    )
  }
  if (message.role === "coordinator") {
    return (
      <div className="flex justify-center my-1">
        <span className="inline-flex items-center gap-1.5 text-[10.5px] text-stone-500 bg-white ring-1 ring-stone-200 px-2.5 py-1 rounded-full">
          <span className="w-1 h-1 rounded-full bg-stone-400" />
          {message.content}
        </span>
      </div>
    )
  }
  const palette = paletteFor(message.agent_type)
  const status: Run["status"] =
    run?.status ??
    (message.content.startsWith("Running ") || message.content.startsWith("Retrying")
      ? "running"
      : message.content.startsWith("Failed:")
      ? "failed"
      : "success")
  const isLoading = status === "running" || status === "pending"
  const isFailed = status === "failed"
  const output = run?.output ?? message.content
  return (
    <div className={`rounded-xl ring-1 transition-colors ${isFailed ? "bg-rose-50/50 ring-rose-200" : "bg-white ring-stone-200"}`}>
      <div className="px-3 py-2 flex items-center gap-2 border-b border-stone-100">
        <AgentAvatar type={message.agent_type} size={22} />
        <span className="text-[12px] font-medium text-stone-900">
          {agent?.name || (message.agent_type ? message.agent_type.charAt(0).toUpperCase() + message.agent_type.slice(1) : "Agent")}
        </span>
        <span className="text-[9.5px] px-1.5 py-0.5 rounded font-medium"
          style={{ background: palette.bg, color: palette.text, boxShadow: `inset 0 0 0 1px ${palette.ring}` }}>
          {message.agent_type || "general"}
        </span>
        <StatusPill status={status === "pending" ? "queued" : (status as any)} />
        <span className="ml-auto text-[10px] text-stone-400">{relTime(message.created_at)}</span>
      </div>
      <div className="px-3 py-2.5">
        {isLoading ? (
          <div className="flex items-center gap-2 text-[12px] text-stone-500">
            <Loader size={11} className="animate-spin" /> Working…
          </div>
        ) : isFailed ? (
          <div>
            <p className="text-[11.5px] text-rose-700 font-mono whitespace-pre-wrap wrap-break-word leading-relaxed">
              {output.replace(/^Failed:\s*/, "")}
            </p>
            {run && (
              <button onClick={() => onRetry(run)}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-stone-700 hover:text-stone-900 bg-white ring-1 ring-stone-300 hover:ring-stone-400 px-2 py-1 rounded-md transition-colors">
                <RotateCcw size={10} /> Retry
              </button>
            )}
          </div>
        ) : (
          <Markdown source={output} />
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Inspector
   ───────────────────────────────────────────── */
function Inspector({ agent, runs, messagesByRun, onClose, onEdit, onRetry }: {
  agent: Agent; runs: Run[]; messagesByRun: Record<string, Message>
  onClose: () => void; onEdit: () => void; onRetry: (r: Run) => void
}) {
  const palette = paletteFor(agent.agent_type)
  const counts = useMemo(() => ({
    total:   runs.length,
    running: runs.filter((r) => r.status === "running").length,
    success: runs.filter((r) => r.status === "success").length,
    failed:  runs.filter((r) => r.status === "failed").length,
  }), [runs])

  return (
    <div className="absolute top-0 right-0 bottom-0 z-30 w-[440px] max-w-[92vw] bg-white border-l border-stone-200 shadow-[-8px_0_30px_rgba(0,0,0,0.06)] flex flex-col animate-[slidein_0.2s_ease-out]">
      <style>{`
        @keyframes slidein {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <div className="px-5 py-4 border-b border-stone-200 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AgentAvatar type={agent.agent_type} size={36} />
          <div>
            <p className="font-display text-[22px] text-stone-900 leading-none">{agent.name}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                style={{ background: palette.bg, color: palette.text, boxShadow: `inset 0 0 0 1px ${palette.ring}` }}>
                {agent.agent_type || "general"}
              </span>
              <span className="text-[10.5px] text-stone-500 font-mono">{agent.provider} · {agent.model}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="text-stone-400 hover:text-stone-800 p-1.5 rounded hover:bg-stone-100 transition-colors"><Settings size={14} /></button>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-800 p-1.5 rounded hover:bg-stone-100 transition-colors"><X size={14} /></button>
        </div>
      </div>
      <div className="px-5 py-3 border-b border-stone-200 grid grid-cols-4 gap-2 bg-stone-50/60">
        <Stat label="Total"   value={counts.total} />
        <Stat label="Running" value={counts.running} accent="#1D4ED8" />
        <Stat label="Success" value={counts.success} accent="#047857" />
        <Stat label="Failed"  value={counts.failed}  accent="#BE123C" />
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-3 font-medium">Recent runs</p>
        {runs.length === 0 ? (
          <p className="text-[12px] text-stone-400">This agent hasn't run yet.</p>
        ) : (
          <ol className="relative border-l border-stone-200 ml-1.5 space-y-4">
            {runs.slice(0, 15).map((r) => {
              const msg = messagesByRun[r.id]
              const status = r.status === "pending" ? "queued" : r.status
              return (
                <li key={r.id} className="pl-4 relative">
                  <span className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-white"
                    style={{ background: r.status === "running" ? "#3B82F6" : r.status === "success" ? "#10B981" : r.status === "failed" ? "#F43F5E" : "#A8A29E" }} />
                  <div className="flex items-center gap-2 mb-1">
                    <StatusPill status={status as any} />
                    <span className="text-[10.5px] text-stone-400">{relTime(r.created_at)}</span>
                  </div>
                  {msg?.content && (
                    <p className="text-[11.5px] text-stone-600 mb-1.5 leading-relaxed">
                      {msg.content.length > 160 ? msg.content.slice(0, 160) + "…" : msg.content}
                    </p>
                  )}
                  {r.output && (
                    <div className="bg-stone-50 ring-1 ring-stone-200 rounded-lg px-2.5 py-1.5">
                      {r.status === "failed" ? (
                        <p className="text-[11.5px] text-rose-700 font-mono whitespace-pre-wrap wrap-break-word">
                          {r.output.length > 240 ? r.output.slice(0, 240) + "…" : r.output}
                        </p>
                      ) : (
                        <p className="text-[11.5px] text-stone-700 leading-relaxed line-clamp-4">{r.output}</p>
                      )}
                    </div>
                  )}
                  {r.status === "failed" && (
                    <button onClick={() => onRetry(r)} className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-stone-600 hover:text-stone-900 transition-colors">
                      <RotateCcw size={10} /> Retry
                    </button>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">{label}</p>
      <p className="text-[16px] font-semibold mt-0.5" style={{ color: accent || "#1C1917" }}>{value}</p>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Agents view
   ───────────────────────────────────────────── */
function AgentsView({
  agents, counts, runsByAgent, onEdit, onAddTask,
}: {
  agents: Agent[]
  counts: Record<string, { running: number; queued: number; done: number; failed: number }>
  runsByAgent: Record<string, Run[]>
  onEdit: (a: Agent) => void
  onAddTask: (a: Agent) => void
}) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="px-8 pt-8 pb-4 border-b border-stone-200 flex items-end justify-between">
        <div>
          <h1 className="font-display text-[30px] text-stone-900 leading-none">Agents</h1>
          <p className="text-[12.5px] text-stone-500 mt-2">
            {agents.length} agent{agents.length === 1 ? "" : "s"} deployed in this workspace
          </p>
        </div>
      </div>

      {agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-24 text-center">
          <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center mb-4">
            <Bot size={20} className="text-stone-400" />
          </div>
          <p className="text-stone-600 font-medium text-[14px]">No agents yet</p>
          <p className="text-stone-400 text-[12px] mt-1 max-w-[260px]">
            Agents are provisioned through the API. Each agent has a type, model, and system prompt.
          </p>
        </div>
      ) : (
        <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => {
            const c = paletteFor(agent.agent_type)
            const cnt = counts[agent.id] || { running: 0, queued: 0, done: 0, failed: 0 }
            const runs = runsByAgent[agent.id] || []
            const lastRun = runs[0]
            const isRunning = cnt.running > 0
            return (
              <div
                key={agent.id}
                className="bg-white border border-stone-200 rounded-2xl p-4 hover:border-stone-300 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all cursor-default"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: c.bg, boxShadow: `inset 0 0 0 1px ${c.ring}` }}
                    >
                      <span className="font-semibold text-[14px]" style={{ color: c.text }}>
                        {(agent.agent_type?.[0] || agent.name[0]).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-[13px] text-stone-900 leading-none">{agent.name}</p>
                      <p className="text-[10.5px] text-stone-500 mt-1 font-mono">{agent.provider} · {agent.model}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onEdit(agent)}
                    className="text-stone-400 hover:text-stone-700 p-1 rounded hover:bg-stone-100 transition-colors"
                  >
                    <Settings size={13} />
                  </button>
                </div>

                <button
                  onClick={() => onAddTask(agent)}
                  className="w-full mb-3 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-stone-200 text-[12px] font-medium text-stone-600 hover:border-stone-900 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                >
                  <Plus size={12} /> Add task
                </button>

                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                    style={{ background: c.bg, color: c.text, boxShadow: `inset 0 0 0 1px ${c.ring}` }}>
                    {agent.agent_type || "general"}
                  </span>
                  {isRunning && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 ring-1 ring-blue-200 px-1.5 py-0.5 rounded-md font-medium">
                      <span className="w-1 h-1 rounded-full bg-blue-600 animate-pulse" />
                      Running
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-stone-100">
                  <div>
                    <p className="text-[9.5px] uppercase tracking-wider text-stone-400 font-medium">Runs</p>
                    <p className="text-[15px] font-semibold text-stone-900 mt-0.5">{runs.length}</p>
                  </div>
                  <div>
                    <p className="text-[9.5px] uppercase tracking-wider text-stone-400 font-medium">Done</p>
                    <p className="text-[15px] font-semibold mt-0.5" style={{ color: "#047857" }}>{cnt.done}</p>
                  </div>
                  <div>
                    <p className="text-[9.5px] uppercase tracking-wider text-stone-400 font-medium">Last run</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">{lastRun ? relTime(lastRun.created_at) : "—"}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Memory view (Company + Memories)
   ───────────────────────────────────────────── */
function MemoryView({
  token, orgContext, onOrgUpdate, memories, onMemoriesChange,
}: {
  token: string
  orgContext: OrgContext | null
  onOrgUpdate: (ctx: OrgContext) => void
  memories: Memory[]
  onMemoriesChange: (mems: Memory[]) => void
}) {
  const [tab, setTab] = useState<"company" | "memory">("company")

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {/* header */}
      <div className="px-8 pt-8 pb-0 border-b border-stone-200">
        <h1 className="font-display text-[30px] text-stone-900 leading-none">Memory</h1>
        <p className="text-[12.5px] text-stone-500 mt-2 mb-4">
          Context injected into every agent run automatically.
        </p>
        <div className="flex gap-1">
          {(["company", "memory"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-[12.5px] font-medium rounded-t-lg transition-colors border border-b-0 ${
                tab === t
                  ? "bg-white border-stone-200 text-stone-900"
                  : "border-transparent text-stone-500 hover:text-stone-700"
              }`}
            >
              {t === "company" ? "Company" : "Memories"}
              {t === "memory" && memories.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-full">
                  {memories.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {tab === "company" && (
        <CompanyTab token={token} orgContext={orgContext} onOrgUpdate={onOrgUpdate} />
      )}
      {tab === "memory" && (
        <MemoryTab token={token} memories={memories} onMemoriesChange={onMemoriesChange} />
      )}
    </div>
  )
}

function CompanyTab({
  token, orgContext, onOrgUpdate,
}: {
  token: string
  orgContext: OrgContext | null
  onOrgUpdate: (ctx: OrgContext) => void
}) {
  const [companyName, setCompanyName]           = useState(orgContext?.company_name || "")
  const [mission, setMission]                   = useState(orgContext?.mission || "")
  const [industry, setIndustry]                 = useState(orgContext?.industry || "")
  const [teamSize, setTeamSize]                 = useState(orgContext?.team_size || "")
  const [productDesc, setProductDesc]           = useState(orgContext?.product_description || "")
  const [goals, setGoals]                       = useState(orgContext?.goals || "")
  const [extra, setExtra]                       = useState(orgContext?.extra || "")
  const [isActive, setIsActive]                 = useState(orgContext?.is_active ?? true)

  // Sync form when orgContext loads async after mount
  useEffect(() => {
    if (!orgContext) return
    setCompanyName(orgContext.company_name || "")
    setMission(orgContext.mission || "")
    setIndustry(orgContext.industry || "")
    setTeamSize(orgContext.team_size || "")
    setProductDesc(orgContext.product_description || "")
    setGoals(orgContext.goals || "")
    setExtra(orgContext.extra || "")
    setIsActive(orgContext.is_active)
  }, [orgContext?.id])
  const [saving, setSaving]                     = useState(false)
  const [saved, setSaved]                       = useState(false)
  const [showInterview, setShowInterview]       = useState(false)
  const [interviewText, setInterviewText]       = useState("")
  const [extracting, setExtracting]             = useState(false)

  async function save() {
    setSaving(true)
    const res = await fetch(`${API}/org`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify({
        company_name: companyName || null,
        mission: mission || null,
        industry: industry || null,
        team_size: teamSize || null,
        product_description: productDesc || null,
        goals: goals || null,
        extra: extra || null,
        is_active: isActive,
      }),
    })
    if (res.ok) {
      const ctx: OrgContext = await res.json()
      onOrgUpdate(ctx)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  async function aiExtract() {
    if (!interviewText.trim()) return
    setExtracting(true)
    const res = await fetch(`${API}/org/extract`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ description: interviewText }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.company_name) setCompanyName(data.company_name)
      if (data.mission)      setMission(data.mission)
      if (data.industry)     setIndustry(data.industry)
      if (data.team_size)    setTeamSize(data.team_size)
      if (data.product_description) setProductDesc(data.product_description)
      if (data.goals)        setGoals(data.goals)
      setShowInterview(false)
      setInterviewText("")
    }
    setExtracting(false)
  }

  const fieldClass = "w-full bg-white border border-stone-200 rounded-xl px-3.5 py-2.5 text-[13px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors"

  return (
    <div className="flex-1 overflow-auto px-8 py-6">
      {/* AI interview banner */}
      {!showInterview ? (
        <div className="mb-6 bg-stone-50 border border-stone-200 rounded-2xl px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[13px] font-medium text-stone-800">Let AI fill this in</p>
            <p className="text-[11.5px] text-stone-500 mt-0.5">
              Describe your company and we'll extract the structured fields automatically.
            </p>
          </div>
          <button
            onClick={() => setShowInterview(true)}
            className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0 ml-4"
          >
            <Wand2 size={12} /> AI Fill
          </button>
        </div>
      ) : (
        <div className="mb-6 bg-white border border-stone-300 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-medium text-stone-800">Describe your company</p>
            <button onClick={() => setShowInterview(false)} className="text-stone-400 hover:text-stone-700 transition-colors">
              <X size={14} />
            </button>
          </div>
          <textarea
            value={interviewText}
            onChange={(e) => setInterviewText(e.target.value)}
            rows={4}
            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-[13px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 resize-none transition-colors"
            placeholder="E.g. We're a 12-person B2B SaaS company building developer tools for data pipelines. Our mission is to make data infrastructure invisible. We're focused on Series A this year."
          />
          <div className="flex items-center justify-end gap-2 mt-3">
            <button onClick={() => setShowInterview(false)} className="text-[12px] text-stone-500 hover:text-stone-700 px-3 py-1.5 transition-colors">Cancel</button>
            <button
              onClick={aiExtract}
              disabled={extracting || !interviewText.trim()}
              className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              {extracting ? <><Loader size={11} className="animate-spin" /> Extracting…</> : <><Wand2 size={11} /> Extract fields</>}
            </button>
          </div>
        </div>
      )}

      {/* form */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 max-w-3xl">
        <div>
          <label className="text-[10.5px] font-medium text-stone-500 uppercase tracking-wider mb-1.5 block">Company name</label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className={fieldClass} placeholder="Acme Inc." />
        </div>
        <div>
          <label className="text-[10.5px] font-medium text-stone-500 uppercase tracking-wider mb-1.5 block">Industry</label>
          <input value={industry} onChange={(e) => setIndustry(e.target.value)} className={fieldClass} placeholder="B2B SaaS, Fintech, Healthcare…" />
        </div>
        <div>
          <label className="text-[10.5px] font-medium text-stone-500 uppercase tracking-wider mb-1.5 block">Team size</label>
          <input value={teamSize} onChange={(e) => setTeamSize(e.target.value)} className={fieldClass} placeholder="1–10, 11–50, 51–200…" />
        </div>
        <div>
          <label className="text-[10.5px] font-medium text-stone-500 uppercase tracking-wider mb-1.5 block">Active context</label>
          <button
            onClick={() => setIsActive((v) => !v)}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-[12.5px] font-medium transition-colors w-full ${
              isActive
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-stone-200 bg-white text-stone-500"
            }`}
          >
            <span className={`w-4 h-4 rounded-full flex items-center justify-center ${isActive ? "bg-emerald-500" : "bg-stone-300"}`}>
              {isActive && <Check size={9} className="text-white" strokeWidth={3} />}
            </span>
            {isActive ? "Injected into all runs" : "Disabled"}
          </button>
        </div>
        <div className="col-span-2">
          <label className="text-[10.5px] font-medium text-stone-500 uppercase tracking-wider mb-1.5 block">Mission</label>
          <textarea value={mission} onChange={(e) => setMission(e.target.value)} rows={2} className={`${fieldClass} resize-none`} placeholder="What you're building and why it matters…" />
        </div>
        <div className="col-span-2">
          <label className="text-[10.5px] font-medium text-stone-500 uppercase tracking-wider mb-1.5 block">Product description</label>
          <textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)} rows={3} className={`${fieldClass} resize-none`} placeholder="What your product does, who it's for, key features…" />
        </div>
        <div className="col-span-2">
          <label className="text-[10.5px] font-medium text-stone-500 uppercase tracking-wider mb-1.5 block">Goals</label>
          <textarea value={goals} onChange={(e) => setGoals(e.target.value)} rows={2} className={`${fieldClass} resize-none`} placeholder="Current priorities, OKRs, or quarterly goals…" />
        </div>
        <div className="col-span-2">
          <label className="text-[10.5px] font-medium text-stone-500 uppercase tracking-wider mb-1.5 block">Additional context</label>
          <textarea value={extra} onChange={(e) => setExtra(e.target.value)} rows={3} className={`${fieldClass} resize-none`} placeholder="Anything else agents should know — tech stack, target customers, constraints…" />
        </div>
      </div>

      <div className="flex items-center gap-3 mt-6 max-w-3xl">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-[13px] font-medium transition-colors"
        >
          {saving ? <><Loader size={12} className="animate-spin" /> Saving…</> : saved ? <><Check size={12} /> Saved</> : <><Save size={12} /> Save context</>}
        </button>
        {orgContext && (
          <p className="text-[11px] text-stone-400">
            Last updated {relTime(orgContext.updated_at)}
          </p>
        )}
      </div>
    </div>
  )
}

function MemoryTab({
  token, memories, onMemoriesChange,
}: {
  token: string
  memories: Memory[]
  onMemoriesChange: (mems: Memory[]) => void
}) {
  const [search, setSearch]         = useState("")
  const [addingKey, setAddingKey]   = useState("")
  const [addingVal, setAddingVal]   = useState("")
  const [showAdd, setShowAdd]       = useState(false)
  const [adding, setAdding]         = useState(false)

  const filtered = memories.filter(
    (m) =>
      m.key.toLowerCase().includes(search.toLowerCase()) ||
      m.value.toLowerCase().includes(search.toLowerCase()),
  )

  async function addMemory() {
    if (!addingKey.trim() || !addingVal.trim()) return
    setAdding(true)
    const res = await fetch(`${API}/memories`, {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({ key: addingKey.trim(), value: addingVal.trim(), source: "manual" }),
    })
    if (res.ok) {
      const mem: Memory = await res.json()
      onMemoriesChange([mem, ...memories])
      setAddingKey("")
      setAddingVal("")
      setShowAdd(false)
    }
    setAdding(false)
  }

  async function deleteMemory(id: string) {
    const res = await fetch(`${API}/memories/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    })
    if (res.ok) onMemoriesChange(memories.filter((m) => m.id !== id))
  }

  return (
    <div className="flex-1 overflow-auto px-8 py-6">
      {/* toolbar */}
      <div className="flex items-center gap-3 mb-5 max-w-3xl">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-stone-200 rounded-xl pl-9 pr-3.5 py-2.5 text-[13px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
            placeholder="Search memories…"
          />
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-[12px] font-medium px-3.5 py-2.5 rounded-xl transition-colors shrink-0"
        >
          <Plus size={13} /> Add memory
        </button>
      </div>

      {/* add form */}
      {showAdd && (
        <div className="mb-5 bg-white border border-stone-200 rounded-2xl p-4 max-w-3xl">
          <p className="text-[12px] font-medium text-stone-700 mb-3">New memory</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              value={addingKey}
              onChange={(e) => setAddingKey(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-[12.5px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
              placeholder="Key (e.g. Preferred stack)"
            />
            <input
              value={addingVal}
              onChange={(e) => setAddingVal(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-[12.5px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
              placeholder="Value (e.g. Python + FastAPI)"
              onKeyDown={(e) => e.key === "Enter" && addMemory()}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="text-[12px] text-stone-500 hover:text-stone-700 px-3 py-1.5 transition-colors">Cancel</button>
            <button
              onClick={addMemory}
              disabled={adding || !addingKey.trim() || !addingVal.trim()}
              className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              {adding ? <Loader size={11} className="animate-spin" /> : <Plus size={11} />} Save
            </button>
          </div>
        </div>
      )}

      {/* empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center pt-20 text-center max-w-3xl">
          <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center mb-4">
            <Brain size={20} className="text-stone-400" />
          </div>
          <p className="text-stone-600 font-medium text-[14px]">
            {search ? "No matching memories" : "No memories yet"}
          </p>
          <p className="text-stone-400 text-[12px] mt-1 max-w-[240px]">
            {search ? "Try a different search term." : "Add facts manually or let the coordinator extract them from conversations."}
          </p>
        </div>
      )}

      {/* memory cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl">
        {filtered.map((mem) => (
          <div key={mem.id} className="group bg-white border border-stone-200 rounded-2xl p-4 hover:border-stone-300 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-[12px] font-semibold text-stone-900 leading-snug">{mem.key}</p>
              <button
                onClick={() => deleteMemory(mem.id)}
                className="text-stone-300 hover:text-rose-500 transition-colors shrink-0 opacity-0 group-hover:opacity-100 p-0.5"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <p className="text-[12px] text-stone-600 leading-relaxed">{mem.value}</p>
            <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-stone-100">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                mem.source === "auto"
                  ? "bg-blue-50 text-blue-600 ring-1 ring-blue-200"
                  : "bg-stone-100 text-stone-500 ring-1 ring-stone-200"
              }`}>
                {mem.source}
              </span>
              <span className="text-[10px] text-stone-400 ml-auto">{relTime(mem.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Schedule view
   ───────────────────────────────────────────── */
function ScheduleView({
  agents, scheduledTasks, token, onDelete, onAddTask,
}: {
  agents: Agent[]
  scheduledTasks: ScheduledTask[]
  token: string
  onDelete: (id: string) => void
  onAddTask: (a: Agent) => void
}) {
  const agentMap = useMemo(() => {
    const m: Record<string, Agent> = {}
    agents.forEach((a) => { m[a.id] = a })
    return m
  }, [agents])

  async function deleteTask(id: string) {
    const res = await fetch(`${API}/scheduled-tasks/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) onDelete(id)
  }

  function scheduleLabel(t: ScheduledTask) {
    if (t.schedule_type === "once" && t.run_at) {
      return `Once · ${new Date(t.run_at + (t.run_at.endsWith("Z") ? "" : "Z")).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`
    }
    if (t.schedule_type === "daily") return `Daily · ${t.time_of_day ?? ""}`
    if (t.schedule_type === "weekly") {
      const day = t.day_of_week ? t.day_of_week.charAt(0).toUpperCase() + t.day_of_week.slice(1) : ""
      return `Weekly · ${day} ${t.time_of_day ?? ""}`
    }
    return t.schedule_type
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-8 pt-8 pb-4 border-b border-stone-200 flex items-end justify-between">
        <div>
          <h1 className="font-display text-[30px] text-stone-900 leading-none">Schedule</h1>
          <p className="text-[12.5px] text-stone-500 mt-2">
            {scheduledTasks.length} scheduled task{scheduledTasks.length === 1 ? "" : "s"}
          </p>
        </div>
        {agents.length > 0 && (
          <div className="relative group">
            <button className="flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-[12.5px] font-medium px-4 py-2.5 rounded-xl transition-colors">
              <Plus size={13} /> New task
            </button>
            {/* agent picker dropdown */}
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-stone-200 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] py-1 z-20 hidden group-focus-within:block group-hover:block">
              {agents.map((a) => {
                const c = paletteFor(a.agent_type)
                return (
                  <button
                    key={a.id}
                    onClick={() => onAddTask(a)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-stone-50 text-left transition-colors"
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: c.bg, boxShadow: `inset 0 0 0 1px ${c.ring}` }}>
                      <span className="text-[10px] font-semibold" style={{ color: c.text }}>
                        {(a.agent_type?.[0] || a.name[0]).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[12.5px] text-stone-800 truncate">{a.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {scheduledTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-24 text-center">
          <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center mb-4">
            <Calendar size={20} className="text-stone-400" />
          </div>
          <p className="text-stone-600 font-medium text-[14px]">No scheduled tasks yet</p>
          <p className="text-stone-400 text-[12px] mt-1 max-w-[240px]">
            Go to the Agents view and click "+ Add task" on any agent to schedule recurring work.
          </p>
        </div>
      ) : (
        <div className="px-8 py-6 space-y-3 max-w-3xl">
          {scheduledTasks.map((task) => {
            const agent = agentMap[task.agent_id]
            const c = paletteFor(agent?.agent_type)
            return (
              <div key={task.id} className="group bg-white border border-stone-200 rounded-2xl px-5 py-4 flex items-start gap-4 hover:border-stone-300 transition-colors">
                {agent && (
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: c.bg, boxShadow: `inset 0 0 0 1px ${c.ring}` }}>
                    <span className="font-semibold text-[12px]" style={{ color: c.text }}>
                      {(agent.agent_type?.[0] || agent.name[0]).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-stone-900 leading-snug mb-1 line-clamp-2">
                    {task.prompt}
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10.5px] text-stone-500">{agent?.name ?? "Unknown agent"}</span>
                    <span className="text-stone-300">·</span>
                    <span className="inline-flex items-center gap-1 text-[10.5px] text-blue-600 bg-blue-50 ring-1 ring-blue-200 px-1.5 py-0.5 rounded-md font-medium">
                      <Clock size={9} /> {scheduleLabel(task)}
                    </span>
                    {task.last_run_at && (
                      <>
                        <span className="text-stone-300">·</span>
                        <span className="text-[10.5px] text-stone-400">Last ran {relTime(task.last_run_at)}</span>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  className="text-stone-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 p-1 shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Coming soon placeholder
   ───────────────────────────────────────────── */
function ComingSoon({ title, description, icon: Icon }: {
  title: string; description: string; icon: React.ElementType
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
      <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mb-5">
        <Icon size={24} className="text-stone-400" />
      </div>
      <h2 className="font-display text-[28px] text-stone-900 leading-none mb-3">{title}</h2>
      <p className="text-[13px] text-stone-500 max-w-[320px] leading-relaxed">{description}</p>
      <span className="mt-5 text-[11px] font-medium text-stone-400 bg-stone-100 px-3 py-1.5 rounded-full ring-1 ring-stone-200">
        Coming soon
      </span>
    </div>
  )
}

/* ─────────────────────────────────────────────
   Login
   ───────────────────────────────────────────── */
function LoginScreen({ onLogin }: { onLogin: (token: string) => void }) {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [name, setName]         = useState("")
  const [isRegister, setIsRegister] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")

  async function handleSubmit() {
    setLoading(true)
    setError("")
    const endpoint = isRegister ? "register" : "login"
    const body = isRegister ? { email, password, name } : { email, password }
    const res = await fetch(`${API}/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) setError(data.detail || "Something went wrong")
    else onLogin(data.access_token)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white border border-stone-200 rounded-2xl p-7 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <h1 className="font-display text-[22px] tracking-tight text-stone-900 leading-none">AgentFlow</h1>
            <p className="text-[11px] text-stone-500 mt-1 leading-none">
              {isRegister ? "Create your account" : "Sign in to continue"}
            </p>
          </div>
        </div>
        {isRegister && (
          <input
            className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-[13px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 mb-2.5 transition-colors"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-[13px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 mb-2.5 transition-colors"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-[13px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 mb-3 transition-colors"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
        {error && <p className="text-[11.5px] text-rose-600 mb-3">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white py-2.5 rounded-lg text-[13px] font-medium transition-colors mb-3"
        >
          {loading ? "…" : isRegister ? "Create account" : "Sign in"}
        </button>
        <button
          onClick={() => setIsRegister(!isRegister)}
          className="w-full text-[11.5px] text-stone-500 hover:text-stone-800 transition-colors"
        >
          {isRegister ? "Already have an account? Sign in" : "No account? Register"}
        </button>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Onboarding screen
   ═══════════════════════════════════════════════════════════ */
type OnboardingStep = "intro" | "interview" | "review"
type ChatMsg = { role: "ai" | "user"; content: string }

function OnboardingScreen({
  token,
  onComplete,
  onSkip,
}: {
  token: string
  onComplete: (ctx: OrgContext) => void
  onSkip: () => void
}) {
  const [step, setStep]                         = useState<OnboardingStep>("intro")
  const [companyName, setCompanyName]           = useState("")
  const [userRole, setUserRole]                 = useState("")
  const [chatMsgs, setChatMsgs]                 = useState<ChatMsg[]>([])
  const [answer, setAnswer]                     = useState("")
  const [questionIdx, setQuestionIdx]           = useState(0)
  const [generating, setGenerating]             = useState(false)
  const [extracted, setExtracted]               = useState<Record<string, string>>({})
  const [saving, setSaving]                     = useState(false)
  const answerRef                               = useRef<HTMLTextAreaElement>(null)
  const bottomRef                               = useRef<HTMLDivElement>(null)

  const QUESTIONS = [
    `What does ${companyName || "your company"} do? Tell me about your product and who it's for.`,
    "What problem are you solving, and why does it matter?",
    "What stage are you at, and how big is your team?",
    "What are your main goals for the next 6–12 months?",
    "Anything else the agents should know — tech stack, target customers, how you work?",
  ]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMsgs.length])

  useEffect(() => {
    if (step === "interview") answerRef.current?.focus()
  }, [step, questionIdx])

  function startInterview() {
    if (!companyName.trim()) return
    setStep("interview")
    setChatMsgs([{ role: "ai", content: QUESTIONS[0] }])
    setQuestionIdx(0)
  }

  async function submitAnswer() {
    const trimmed = answer.trim()
    if (!trimmed || generating) return
    setAnswer("")

    const updated: ChatMsg[] = [...chatMsgs, { role: "user", content: trimmed }]
    setChatMsgs(updated)
    const nextIdx = questionIdx + 1
    setQuestionIdx(nextIdx)

    if (nextIdx < QUESTIONS.length) {
      setTimeout(() => {
        setChatMsgs((prev) => [...prev, { role: "ai", content: QUESTIONS[nextIdx] }])
        answerRef.current?.focus()
      }, 350)
    } else {
      // All answered — extract context
      setGenerating(true)
      setChatMsgs((prev) => [
        ...prev,
        { role: "ai", content: "Got it — let me put that together for you…" },
      ])

      const userAnswers = updated.filter((m) => m.role === "user")
      const description = [
        `Company: ${companyName}`,
        userRole ? `My role: ${userRole}` : "",
        "",
        ...QUESTIONS.slice(0, userAnswers.length).map(
          (q, i) => `Q: ${q}\nA: ${userAnswers[i].content}`,
        ),
      ]
        .filter(Boolean)
        .join("\n\n")

      try {
        const res = await fetch(`${API}/org/extract`, {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({ description }),
        })
        if (res.ok) {
          const data = await res.json()
          setExtracted({ ...data, company_name: data.company_name || companyName })
          setStep("review")
        }
      } catch {}
      setGenerating(false)
    }
  }

  async function activate() {
    setSaving(true)
    const res = await fetch(`${API}/org`, {
      method: "PUT",
      headers: authHeaders(token),
      body: JSON.stringify({ ...extracted, is_active: true }),
    })
    if (res.ok) {
      const ctx: OrgContext = await res.json()
      // Deploy all agents with default config
      await fetch(`${API}/org/deploy-agents`, {
        method: "POST",
        headers: authHeaders(token),
      })
      onComplete(ctx)
    }
    setSaving(false)
  }

  /* ── Intro step ─────────────────────────────────────────── */
  if (step === "intro") {
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center">
              <Sparkles size={15} className="text-white" />
            </div>
            <span className="font-display text-[22px] text-stone-900">AgentFlow</span>
          </div>

          {/* heading */}
          <h1 className="font-display text-[40px] text-stone-900 leading-[1.1] mb-3">
            Welcome.<br />
            <span className="text-stone-400">Let's set up<br />your workspace.</span>
          </h1>
          <p className="text-[13.5px] text-stone-500 leading-relaxed mb-8 max-w-[340px]">
            We'll ask a few quick questions so your agents always have the right context about your company.
          </p>

          {/* inputs */}
          <div className="space-y-5">
            <div>
              <label className="text-[10.5px] font-medium text-stone-500 uppercase tracking-wider mb-1.5 block">
                Company or project name
              </label>
              <input
                autoFocus
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && startInterview()}
                className="w-full bg-white border border-stone-200 rounded-xl px-4 py-3 text-[15px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 transition-colors"
                placeholder="Acme Inc."
              />
            </div>
            <div>
              <label className="text-[10.5px] font-medium text-stone-500 uppercase tracking-wider mb-2 block">
                Your role <span className="text-stone-400 normal-case font-normal tracking-normal">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  "Founder", "Co-founder", "CEO", "CTO", "CPO",
                  "CMO", "COO", "Engineer", "Designer", "Product Manager",
                  "Marketing", "Sales",
                ].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setUserRole(userRole === r ? "" : r)}
                    className={`px-3 py-1.5 rounded-lg border text-[12.5px] font-medium transition-colors ${
                      userRole === r
                        ? "bg-stone-900 border-stone-900 text-white"
                        : "bg-white border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900"
                    }`}
                  >
                    {r}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setUserRole(
                    ["Founder","Co-founder","CEO","CTO","CPO","CMO","COO","Engineer","Designer","Product Manager","Marketing","Sales"].includes(userRole)
                      ? "" : userRole
                  )}
                  className={`px-3 py-1.5 rounded-lg border text-[12.5px] font-medium transition-colors ${
                    userRole && !["Founder","Co-founder","CEO","CTO","CPO","CMO","COO","Engineer","Designer","Product Manager","Marketing","Sales"].includes(userRole)
                      ? "bg-stone-900 border-stone-900 text-white"
                      : "bg-white border-stone-200 text-stone-400 hover:border-stone-400 hover:text-stone-600"
                  }`}
                >
                  Other…
                </button>
              </div>
              {/* custom role input — shown when Other is active */}
              {userRole !== "" && !["Founder","Co-founder","CEO","CTO","CPO","CMO","COO","Engineer","Designer","Product Manager","Marketing","Sales"].includes(userRole) && (
                <input
                  autoFocus
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startInterview()}
                  className="mt-2 w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-[14px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 transition-colors"
                  placeholder="Describe your role…"
                />
              )}
            </div>
          </div>

          <button
            onClick={startInterview}
            disabled={!companyName.trim()}
            className="w-full mt-5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white py-3.5 rounded-xl text-[14px] font-medium transition-colors flex items-center justify-center gap-2"
          >
            Let's begin <ArrowRight size={15} />
          </button>

          <button
            onClick={onSkip}
            className="w-full mt-3 text-[12px] text-stone-400 hover:text-stone-600 transition-colors py-2"
          >
            Skip for now — I'll set this up later
          </button>
        </div>
      </div>
    )
  }

  /* ── Interview step ─────────────────────────────────────── */
  if (step === "interview") {
    const progress = Math.min(questionIdx, QUESTIONS.length)
    return (
      <div className="min-h-screen bg-[#FAF9F7] flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-xl flex flex-col" style={{ minHeight: "calc(100vh - 80px)" }}>
          {/* header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-stone-900 flex items-center justify-center">
                <Sparkles size={12} className="text-white" />
              </div>
              <span className="text-[12.5px] font-medium text-stone-700">Setting up {companyName}</span>
            </div>
            {/* progress dots */}
            <div className="flex items-center gap-1.5">
              {QUESTIONS.map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i < progress ? "bg-stone-800" : i === progress ? "bg-stone-400" : "bg-stone-200"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* chat messages */}
          <div className="flex-1 space-y-4 mb-4 overflow-y-auto">
            {chatMsgs.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""} animate-[fadein_0.25s_ease-out]`}
              >
                {msg.role === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles size={12} className="text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed ${
                    msg.role === "ai"
                      ? "bg-white border border-stone-200 text-stone-800 rounded-tl-md"
                      : "bg-stone-900 text-white rounded-tr-md"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {generating && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center shrink-0">
                  <Loader size={12} className="text-white animate-spin" />
                </div>
                <div className="bg-white border border-stone-200 px-4 py-2.5 rounded-2xl rounded-tl-md">
                  <span className="inline-flex gap-1">
                    {[0, 1, 2].map((d) => (
                      <span key={d} className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${d * 120}ms` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* input */}
          {!generating && questionIdx < QUESTIONS.length && (
            <div className="bg-white border border-stone-200 rounded-2xl focus-within:border-stone-500 transition-colors">
              <textarea
                ref={answerRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitAnswer() }
                }}
                rows={2}
                placeholder="Type your answer…"
                className="w-full bg-transparent px-4 pt-3 pb-1 text-[13.5px] text-stone-900 placeholder-stone-400 focus:outline-none resize-none"
              />
              <div className="flex items-center justify-between px-3 pb-2.5">
                <span className="text-[11px] text-stone-400">
                  {progress + 1} of {QUESTIONS.length}
                </span>
                <button
                  onClick={submitAnswer}
                  disabled={!answer.trim()}
                  className="flex items-center gap-1 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed text-white text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  {progress + 1 === QUESTIONS.length ? "Finish" : "Next"}
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes fadein {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    )
  }

  /* ── Review step ────────────────────────────────────────── */
  const fields: { label: string; key: string }[] = [
    { label: "Company",     key: "company_name" },
    { label: "Industry",    key: "industry" },
    { label: "Team size",   key: "team_size" },
    { label: "Mission",     key: "mission" },
    { label: "Product",     key: "product_description" },
    { label: "Goals",       key: "goals" },
  ]

  return (
    <div className="min-h-screen bg-[#FAF9F7] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* heading */}
        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center">
            <Sparkles size={13} className="text-white" />
          </div>
          <div>
            <p className="font-display text-[22px] text-stone-900 leading-none">
              Here's what I learned
            </p>
            <p className="text-[11.5px] text-stone-500 mt-1">
              Review your company context — agents will use this in every run.
            </p>
          </div>
        </div>

        {/* context card */}
        <div className="bg-white border border-stone-200 rounded-2xl divide-y divide-stone-100 mb-5">
          {fields.map(({ label, key }) =>
            extracted[key] ? (
              <div key={key} className="px-5 py-3.5 flex gap-4">
                <span className="text-[10.5px] font-medium text-stone-400 uppercase tracking-wider w-24 shrink-0 pt-0.5">
                  {label}
                </span>
                <span className="text-[13px] text-stone-800 leading-relaxed">{extracted[key]}</span>
              </div>
            ) : null,
          )}
        </div>

        {/* actions */}
        <button
          onClick={activate}
          disabled={saving}
          className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white py-3.5 rounded-xl text-[14px] font-medium transition-colors flex items-center justify-center gap-2 mb-3"
        >
          {saving ? (
            <><Loader size={14} className="animate-spin" /> Activating…</>
          ) : (
            <><Check size={14} /> Activate &amp; enter workspace</>
          )}
        </button>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => { setStep("interview"); setQuestionIdx(0); setChatMsgs([{ role: "ai", content: QUESTIONS[0] }]) }}
            className="text-[12px] text-stone-500 hover:text-stone-700 transition-colors"
          >
            ← Start over
          </button>
          <span className="text-stone-300">·</span>
          <button
            onClick={onSkip}
            className="text-[12px] text-stone-500 hover:text-stone-700 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  )
}
