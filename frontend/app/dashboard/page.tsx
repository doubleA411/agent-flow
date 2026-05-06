"use client"

import { useState, useEffect } from "react"
import AgentCard from "@/components/AgentCard"
import RunList from "@/components/RunList"
import CreateAgentForm from "@/components/CreateAgentForm"

const API = "http://localhost:8000/api/v1"

export type Agent = {
  id: string
  name: string
  prompt: string
  created_at: string
}

export type Run = {
  id: string
  agent_id: string
  status: "pending" | "running" | "success" | "failed"
  output: string | null
  created_at: string
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [runs, setRuns] = useState<Run[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)

  async function fetchAgents() {
    const res = await fetch(`${API}/agents`)
    const data = await res.json()
    setAgents(data)
    if (data.length > 0 && !selectedAgent) setSelectedAgent(data[0])
    setLoading(false)
  }

  async function fetchRuns(agentId: string) {
    const res = await fetch(`${API}/agents/${agentId}/runs`)
    const data = await res.json()
    setRuns(data.reverse())
  }

  async function triggerRun(agentId: string) {
    const res = await fetch(`${API}/agents/${agentId}/runs`, { method: "POST" })
    const run = await res.json()
    setRuns(prev => [run, ...prev])
    return run
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  useEffect(() => {
    if (selectedAgent) fetchRuns(selectedAgent.id)
  }, [selectedAgent])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Loading...
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">AgentFlow</h1>
          <p className="text-xs text-gray-400">Autonomous agent orchestration</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </header>

      <div className="flex h-[calc(100vh-65px)]">
        <aside className="w-72 border-r border-gray-800 p-4 flex flex-col gap-3 overflow-y-auto">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider px-1">Agents</p>
          {agents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              selected={selectedAgent?.id === agent.id}
              onClick={() => setSelectedAgent(agent)}
            />
          ))}
          <CreateAgentForm onCreated={(agent) => {
            setAgents(prev => [...prev, agent])
            setSelectedAgent(agent)
          }} />
        </aside>

        <main className="flex-1 p-6 overflow-y-auto">
          {selectedAgent ? (
            <RunList
              agent={selectedAgent}
              runs={runs}
              onTrigger={async () => {
                const run = await triggerRun(selectedAgent.id)
                return run
              }}
              onRunUpdate={(updatedRun) => {
                setRuns(prev => prev.map(r => r.id === updatedRun.id ? updatedRun : r))
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Create an agent to get started
            </div>
          )}
        </main>
      </div>
    </div>
  )
}