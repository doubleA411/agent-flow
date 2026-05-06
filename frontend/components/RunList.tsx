"use client"

import { useEffect, useRef } from "react"
import { Play, CheckCircle, XCircle, Clock, Loader } from "lucide-react"
import { Agent, Run } from "@/app/dashboard/page"

const WS = "ws://localhost:8000/api/v1"

function StatusBadge({ status }: { status: Run["status"] }) {
  const map = {
    pending: { icon: <Clock size={12} />, cls: "text-gray-400 bg-gray-800", label: "Pending" },
    running: { icon: <Loader size={12} className="animate-spin" />, cls: "text-blue-400 bg-blue-400/10", label: "Running" },
    success: { icon: <CheckCircle size={12} />, cls: "text-green-400 bg-green-400/10", label: "Success" },
    failed:  { icon: <XCircle size={12} />, cls: "text-red-400 bg-red-400/10", label: "Failed" },
  }
  const { icon, cls, label } = map[status]
  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      {icon} {label}
    </span>
  )
}

function RunCard({ run, onUpdate }: { run: Run, onUpdate: (r: Run) => void }) {
  const wsRef = useRef<WebSocket | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (run.status !== "pending" && run.status !== "running") return

    // Poll every second as reliable fallback
    pollRef.current = setInterval(async () => {
      const res = await fetch(`http://localhost:8000/api/v1/runs/${run.id}`)
      const data = await res.json()
      onUpdate(data)
      if (data.status === "success" || data.status === "failed") {
        clearInterval(pollRef.current!)
      }
    }, 1000)

    // WebSocket for instant updates
    const ws = new WebSocket(`ws://localhost:8000/api/v1/ws/runs/${run.id}`)
    wsRef.current = ws

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data)
      onUpdate({ ...run, ...data })
      if (data.status === "success" || data.status === "failed") {
        clearInterval(pollRef.current!)
        ws.close()
      }
    }

    ws.onerror = () => ws.close()

    return () => {
      ws.close()
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [run.id, run.status])

  return (
    <div className="border border-gray-800 rounded-lg p-4 flex flex-col gap-2 bg-gray-900/50">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 font-mono">{run.id.slice(0, 8)}...</span>
        <StatusBadge status={run.status} />
      </div>
      {run.output && (
        <p className="text-sm text-gray-300 bg-gray-900 rounded-md px-3 py-2 font-mono">
          {run.output}
        </p>
      )}
      <p className="text-xs text-gray-600">
        {new Date(run.created_at + "Z").toLocaleTimeString()}
      </p>
    </div>
  )
}

export default function RunList({
  agent, runs, onTrigger, onRunUpdate
}: {
  agent: Agent
  runs: Run[]
  onTrigger: () => Promise<Run>
  onRunUpdate: (run: Run) => void
}) {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">{agent.name}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{agent.prompt}</p>
        </div>
        <button
          onClick={onTrigger}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm px-4 py-2 rounded-lg transition-all"
        >
          <Play size={14} /> Run agent
        </button>
      </div>

      {runs.length === 0 ? (
        <div className="text-center text-gray-600 py-16 border border-dashed border-gray-800 rounded-lg">
          No runs yet — trigger one above
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {runs.map(run => (
            <RunCard key={run.id} run={run} onUpdate={onRunUpdate} />
          ))}
        </div>
      )}
    </div>
  )
}