import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "AgentFlow"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const AGENT_DOTS = [
  { label: "Research",    color: "#1D4ED8", bg: "#DBEAFE", angle: -90 },
  { label: "Engineering", color: "#047857", bg: "#D1FAE5", angle: -30 },
  { label: "Finance",     color: "#0F766E", bg: "#CCFBF1", angle:  30 },
  { label: "Sales",       color: "#B45309", bg: "#FEF3C7", angle:  90 },
  { label: "Data",        color: "#6D28D9", bg: "#EDE9FE", angle: 150 },
  { label: "Ops",         color: "#BE185D", bg: "#FCE7F3", angle: 210 },
]

export default function OGImage() {
  const cx = 840, cy = 315, R = 200

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#FAF9F7",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        {/* subtle grid dots background */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, #D6D3D1 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.4,
          display: "flex",
        }} />

        {/* left text block */}
        <div style={{
          position: "absolute", left: 80, top: 0, bottom: 0,
          display: "flex", flexDirection: "column", justifyContent: "center",
          width: 520,
        }}>
          {/* logo mark */}
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: "#1C1917",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: 32,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "transparent",
              border: "2.5px solid #ffffff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffffff", display: "flex" }} />
            </div>
          </div>

          <div style={{ fontSize: 64, fontWeight: 700, color: "#1C1917", lineHeight: 1.05, display: "flex" }}>
            AgentFlow
          </div>
          <div style={{ fontSize: 22, color: "#78716C", marginTop: 18, lineHeight: 1.5, display: "flex" }}>
            Coordinate specialist AI agents to research,{"\n"}write, code, and analyse — in parallel.
          </div>

          {/* pill badges */}
          <div style={{ display: "flex", gap: 10, marginTop: 36, flexWrap: "wrap" }}>
            {["Research", "Finance", "Sales", "Engineering", "Data"].map((a) => (
              <div key={a} style={{
                background: "#ffffff",
                border: "1px solid #E7E5E4",
                borderRadius: 100,
                padding: "6px 14px",
                fontSize: 14,
                color: "#44403C",
                display: "flex",
              }}>
                {a}
              </div>
            ))}
          </div>
        </div>

        {/* right radial canvas */}
        <svg
          width={480} height={630}
          style={{ position: "absolute", right: 0, top: 0 }}
          viewBox={`${cx - 240} ${cy - 315} 480 630`}
        >
          {/* guide ring */}
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="#E7E5E4" strokeDasharray="3 6" strokeWidth={1.5} />

          {/* rails + nodes */}
          {AGENT_DOTS.map((a) => {
            const rad = (a.angle * Math.PI) / 180
            const nx = cx + R * Math.cos(rad)
            const ny = cy + R * Math.sin(rad)
            return (
              <g key={a.label}>
                <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#E7E5E4" strokeWidth={1} />
                <circle cx={nx} cy={ny} r={26} fill={a.bg} />
                <text x={nx} y={ny + 5} textAnchor="middle" fontSize={13} fontWeight={600} fill={a.color}>
                  {a.label[0]}
                </text>
              </g>
            )
          })}

          {/* coordinator centre */}
          <circle cx={cx} cy={cy} r={38} fill="#1C1917" />
          <circle cx={cx} cy={cy} r={15} fill="none" stroke="#ffffff" strokeWidth={2.5} />
          <circle cx={cx} cy={cy} r={5} fill="#ffffff" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
