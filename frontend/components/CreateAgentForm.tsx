"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Agent } from "@/app/dashboard/page"

const API = "http://localhost:8000/api/v1"

export default function CreateAgentForm({ onCreated }: { onCreated: (agent: Agent) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!name || !prompt) return
    setLoading(true)
    const res = await fetch(`${API}/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, prompt })
    })
    const agent = await res.json()
    onCreated(agent)
    setName("")
    setPrompt("")
    setOpen(false)
    setLoading(false)
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-300 px-3 py-2 rounded-lg border border-dashed border-gray-700 hover:border-gray-500 transition-all w-full"
    >
      <Plus size={14} /> New agent
    </button>
  )

  return (
    <div className="border border-gray-700 rounded-lg p-3 flex flex-col gap-2">
      <input
        className="bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 w-full"
        placeholder="Agent name"
        value={name}
        onChange={e => setName(e.target.value)}
      />
      <textarea
        className="bg-gray-900 border border-gray-700 rounded-md px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 w-full resize-none"
        placeholder="System prompt"
        rows={2}
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-xs py-1.5 rounded-md transition-all disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-gray-500 hover:text-gray-300 px-2"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}