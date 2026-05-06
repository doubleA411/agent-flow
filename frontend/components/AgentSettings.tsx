"use client"

import { useState } from "react"
import { X, Save, Loader, ChevronDown } from "lucide-react"

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"

type Agent = {
  id: string
  name: string
  agent_type: string | null
  prompt: string
  provider: string
  model: string
}

const PROVIDERS = [
  { value: "groq",      label: "Groq",      models: ["llama-3.1-8b-instant", "llama-3.1-70b-versatile", "mixtral-8x7b-32768"] },
  { value: "ollama",    label: "Ollama",    models: ["llama3", "mistral", "codellama", "phi3"] },
  { value: "openai",    label: "OpenAI",    models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"] },
  { value: "anthropic", label: "Anthropic", models: ["claude-opus-4-5", "claude-sonnet-4-5", "claude-haiku-4-5-20251001"] },
]

export default function AgentSettings({
  agent,
  token,
  onClose,
  onUpdated,
}: {
  agent: Agent
  token: string
  onClose: () => void
  onUpdated: (agent: Agent) => void
}) {
  const [name, setName] = useState(agent.name)
  const [prompt, setPrompt] = useState(agent.prompt)
  const [provider, setProvider] = useState(agent.provider)
  const [model, setModel] = useState(agent.model)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const currentProvider = PROVIDERS.find(p => p.value === provider) || PROVIDERS[0]

  async function save() {
    setSaving(true)
    const res = await fetch(`${API}/agents/${agent.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ name, prompt, provider, model }),
    })
    const updated = await res.json()
    onUpdated(updated)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 bg-stone-900/30 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white border border-stone-200 rounded-2xl w-full max-w-lg flex flex-col max-h-[90vh] shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200">
          <div>
            <h2 className="font-display text-[20px] text-stone-900 leading-none">Edit agent</h2>
            <p className="text-[11px] text-stone-500 mt-1.5 capitalize leading-none">
              {agent.agent_type || "general"} agent
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 transition-colors p-1 rounded hover:bg-stone-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="text-[11px] font-medium text-stone-600 mb-1.5 block uppercase tracking-wider">
              Agent name
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-[13px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 transition-colors"
              placeholder="e.g. Research assistant"
            />
          </div>

          {/* Provider */}
          <div>
            <label className="text-[11px] font-medium text-stone-600 mb-1.5 block uppercase tracking-wider">
              LLM provider
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map(p => (
                <button
                  key={p.value}
                  onClick={() => {
                    setProvider(p.value)
                    setModel(p.models[0])
                  }}
                  className={`px-3 py-2 rounded-lg border text-[12px] font-medium transition-colors ${
                    provider === p.value
                      ? "border-stone-900 bg-stone-900 text-white"
                      : "border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900 bg-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model */}
          <div>
            <label className="text-[11px] font-medium text-stone-600 mb-1.5 block uppercase tracking-wider">
              Model
            </label>
            <div className="relative">
              <select
                value={model}
                onChange={e => setModel(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-[13px] text-stone-900 focus:outline-none focus:border-stone-500 appearance-none transition-colors"
              >
                {currentProvider.models.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-2.5 text-stone-400 pointer-events-none" />
            </div>
          </div>

          {/* System prompt */}
          <div>
            <label className="text-[11px] font-medium text-stone-600 mb-1.5 block uppercase tracking-wider">
              System prompt
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={8}
              className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-[12.5px] text-stone-900 placeholder-stone-400 focus:outline-none focus:border-stone-500 resize-none font-mono leading-relaxed transition-colors"
              placeholder="You are a helpful assistant..."
            />
            <p className="text-[11px] text-stone-500 mt-1.5">
              This is the system prompt sent to the LLM before every run.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-stone-200 flex items-center justify-between bg-stone-50/60 rounded-b-2xl">
          <button
            onClick={onClose}
            className="text-[12px] text-stone-500 hover:text-stone-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-[12px] font-medium transition-colors"
          >
            {saving ? (
              <><Loader size={12} className="animate-spin" /> Saving...</>
            ) : saved ? (
              "Saved!"
            ) : (
              <><Save size={12} /> Save changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
