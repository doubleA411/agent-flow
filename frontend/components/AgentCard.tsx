import { Agent } from "@/app/dashboard/page"

export default function AgentCard({
  agent, selected, onClick
}: {
  agent: Agent
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${
        selected
          ? "border-violet-500 bg-violet-500/10 text-white"
          : "border-gray-800 hover:border-gray-600 text-gray-300"
      }`}
    >
      <p className="text-sm font-medium truncate">{agent.name}</p>
      <p className="text-xs text-gray-500 truncate mt-0.5">{agent.prompt}</p>
    </button>
  )
}