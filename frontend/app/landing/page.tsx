"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

/* ─── Design tokens ───────────────────────────────────────────────── */
const C = {
  nightSky:     "#1f1f29",
  cofBlue:      "#0081c0",
  azure:        "#41a1cf",
  canvas:       "#ffffff",
  offWhite:     "#fefffc",
  ashGray:      "#f9faf7",
  coolGray:     "#eef1ed",
  steelGray:    "#dee2de",
  darkCharcoal: "#171717",
  charcoal:     "#2c2c2c",
  richBlack:    "#282834",
  slateGray:    "#444141",
  medGray:      "#646464",
}

const AGENT_TYPES = [
  { type: "Research",    color: "#1D4ED8", bg: "#DBEAFE", ring: "#BFDBFE", desc: "Market research, competitive analysis, trend reports" },
  { type: "Engineering", color: "#047857", bg: "#D1FAE5", ring: "#A7F3D0", desc: "Code, architecture reviews, technical docs" },
  { type: "Finance",     color: "#0F766E", bg: "#CCFBF1", ring: "#99F6E4", desc: "Revenue models, forecasts, unit economics" },
  { type: "Sales",       color: "#B45309", bg: "#FEF3C7", ring: "#FDE68A", desc: "GTM strategy, outreach emails, pitch writing" },
  { type: "Data",        color: "#6D28D9", bg: "#EDE9FE", ring: "#DDD6FE", desc: "SQL queries, dashboards, A/B analysis" },
  { type: "Ops",         color: "#BE185D", bg: "#FCE7F3", ring: "#FBCFE8", desc: "Infrastructure planning, process docs, SOPs" },
]

const FEATURES = [
  {
    title: "Parallel execution",
    desc: "Dispatch one prompt and watch multiple specialist agents work simultaneously — not sequentially. Research, writing, and analysis happen at the same time.",
    icon: "⚡",
  },
  {
    title: "Smart routing",
    desc: "An intelligent coordinator reads your intent and routes each part of the request to the right agent automatically. No manual assignment.",
    icon: "🎯",
  },
  {
    title: "Company context",
    desc: "Agents remember your company — mission, product, goals, tech stack. Every response is grounded in who you are, not generic boilerplate.",
    icon: "🧠",
  },
  {
    title: "Persistent memory",
    desc: "Key facts extracted from every conversation are stored and injected into future runs. Agents get smarter the more you use them.",
    icon: "💾",
  },
  {
    title: "Any LLM provider",
    desc: "Connect Claude, GPT-4, Groq, or your own local Ollama instance. Mix providers per agent for cost and performance optimisation.",
    icon: "🔌",
  },
  {
    title: "Scheduled tasks",
    desc: "Set agents on autopilot — daily digests, weekly reports, recurring research. Define once, run forever.",
    icon: "📅",
  },
]

const HOW_IT_WORKS = [
  { n: "01", title: "Set up your workspace", body: "Complete a short onboarding interview. AgentFlow learns about your company, team, and goals — and deploys a full fleet of specialist agents." },
  { n: "02", title: "Dispatch a task", body: "Type a natural-language request into the command bar. The coordinator reads it, builds a plan, and routes subtasks to the right agents in parallel." },
  { n: "03", title: "Review agent output", body: "Each agent's response lands in the chat panel in real-time. Retry failures, save key facts to memory, or chain the output into a new task." },
]

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <div style={{ fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif", color: C.darkCharcoal, background: C.canvas }}>

      {/* ── Sticky Nav ─────────────────────────────────────────────── */}
      <header
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: scrolled ? "rgba(255,255,255,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? `1px solid ${C.steelGray}` : "1px solid transparent",
          transition: "all 0.2s ease",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.nightSky, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 14 }}>✦</span>
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", color: C.darkCharcoal }}>AgentFlow</span>
          </div>

          {/* Nav links */}
          <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {["Features", "How it works", "Agents"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                style={{
                  padding: "5px 12px",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 400,
                  color: C.slateGray,
                  textDecoration: "none",
                  letterSpacing: "-0.012em",
                  transition: "color 0.15s, background 0.15s",
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.color = C.darkCharcoal; (e.target as HTMLElement).style.background = C.ashGray }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.color = C.slateGray; (e.target as HTMLElement).style.background = "transparent" }}
              >
                {item}
              </a>
            ))}
          </nav>

          {/* CTA */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link
              href="/"
              style={{
                padding: "6px 14px",
                fontSize: 14,
                fontWeight: 400,
                color: C.slateGray,
                textDecoration: "none",
                letterSpacing: "-0.012em",
              }}
            >
              Sign in
            </Link>
            <Link
              href="/"
              style={{
                padding: "7px 16px 8px 12px",
                background: C.nightSky,
                color: "#fff",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                letterSpacing: "-0.012em",
                border: `1px solid ${C.richBlack}`,
              }}
            >
              Get started →
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero — full-screen video ────────────────────────────────── */}
      <section style={{
        position: "relative",
        height: "100vh",
        marginTop: -60,        /* pull up behind the sticky nav */
        overflow: "hidden",
      }}>
        <video
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        >
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" style={{ background: C.canvas, padding: "96px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Label */}
          <p style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: C.cofBlue, marginBottom: 16 }}>
            Features
          </p>
          <h2 style={{
            fontFamily: "var(--font-display), 'Instrument Serif', ui-serif, serif",
            fontSize: 48,
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: C.darkCharcoal,
            maxWidth: 560,
            marginBottom: 16,
          }}>
            Built for teams that move fast
          </h2>
          <p style={{ fontSize: 18, color: C.medGray, lineHeight: 1.5, letterSpacing: "-0.012em", maxWidth: 480, marginBottom: 64 }}>
            Every feature is designed around one idea: your agents should do more work, faster, with less direction from you.
          </p>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  background: C.offWhite,
                  borderRadius: 12,
                  padding: "24px",
                  boxShadow: `rgba(0,0,0,0.08) 0px 1px 1px 0px, rgba(0,0,0,0.08) 0px 4px 5px 0px`,
                  border: `1px solid ${C.steelGray}`,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.012em", color: C.darkCharcoal, marginBottom: 8 }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 14, color: C.medGray, lineHeight: 1.6, letterSpacing: "-0.012em" }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section id="how-it-works" style={{ background: C.offWhite, padding: "96px 32px", borderTop: `1px solid ${C.steelGray}`, borderBottom: `1px solid ${C.steelGray}` }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: C.cofBlue, marginBottom: 16 }}>
            How it works
          </p>
          <h2 style={{
            fontFamily: "var(--font-display), 'Instrument Serif', ui-serif, serif",
            fontSize: 48,
            fontWeight: 400,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: C.darkCharcoal,
            maxWidth: 520,
            marginBottom: 64,
          }}>
            From one prompt to multiple outputs
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.n} style={{ position: "relative" }}>
                {/* Connector line */}
                {i < HOW_IT_WORKS.length - 1 && (
                  <div style={{
                    position: "absolute",
                    top: 20, left: "calc(100% + 8px)",
                    width: "calc(100% - 16px)",
                    height: 1,
                    background: C.steelGray,
                    zIndex: 0,
                  }} />
                )}
                <div style={{
                  width: 40, height: 40,
                  borderRadius: 8,
                  background: C.nightSky,
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 20,
                  letterSpacing: "0.02em",
                  position: "relative", zIndex: 1,
                }}>
                  {step.n}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.012em", color: C.darkCharcoal, marginBottom: 10 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 15, color: C.medGray, lineHeight: 1.6, letterSpacing: "-0.012em" }}>
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Agents ─────────────────────────────────────────────────── */}
      <section id="agents" style={{ background: C.canvas, padding: "96px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>
            {/* Left */}
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: C.cofBlue, marginBottom: 16 }}>
                Agents
              </p>
              <h2 style={{
                fontFamily: "var(--font-display), 'Instrument Serif', ui-serif, serif",
                fontSize: 48,
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                color: C.darkCharcoal,
                marginBottom: 20,
              }}>
                A full team, ready on day one
              </h2>
              <p style={{ fontSize: 16, color: C.medGray, lineHeight: 1.6, letterSpacing: "-0.012em", marginBottom: 32 }}>
                AgentFlow deploys nine specialist agents the moment you complete onboarding. Each one is pre-configured with a deep system prompt tuned for its domain, and every agent can be further customised to match your preferences.
              </p>
              <Link
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 20px",
                  background: C.nightSky,
                  color: "#fff",
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: "none",
                  letterSpacing: "-0.012em",
                  border: `1px solid ${C.richBlack}`,
                }}
              >
                Deploy your agents →
              </Link>
            </div>

            {/* Right — agent grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {AGENT_TYPES.map((a) => (
                <div
                  key={a.type}
                  style={{
                    background: C.offWhite,
                    border: `1px solid ${C.steelGray}`,
                    borderRadius: 12,
                    padding: "16px",
                    boxShadow: `rgba(0,0,0,0.05) 0px 1px 8px 0px`,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: a.bg,
                    boxShadow: `inset 0 0 0 1px ${a.ring}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: 12,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: a.color }}>
                      {a.type[0]}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.darkCharcoal, marginBottom: 4, letterSpacing: "-0.012em" }}>
                    {a.type}
                  </p>
                  <p style={{ fontSize: 12, color: C.medGray, lineHeight: 1.5, letterSpacing: "-0.012em" }}>
                    {a.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA + Footer — shared background ───────────────────────── */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        {/* Background image — contain so the full landscape is visible */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('/footer.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
        }} />
        {/* Subtle overlay — dark enough for contrast, light enough to see landscape */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.55) 60%, rgba(31,31,41,0.92) 100%)",
        }} />

        {/* CTA content */}
        <div style={{
          position: "relative", zIndex: 1,
          maxWidth: 1200, margin: "0 auto",
          padding: "120px 32px 80px",
          display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
        }}>
          <h2 style={{
            fontFamily: "var(--font-display), 'Instrument Serif', ui-serif, serif",
            fontSize: "clamp(40px, 5vw, 54px)",
            fontWeight: 400,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            color: "#ffffff",
            maxWidth: 640,
            marginBottom: 24,
          }}>
            Your agents are waiting. Set them to work.
          </h2>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, letterSpacing: "-0.012em", maxWidth: 460, marginBottom: 40 }}>
            Complete onboarding in under 5 minutes. Your full agent fleet deploys automatically.
          </p>
          <Link
            href="/"
            style={{
              padding: "12px 32px",
              background: "#ffffff",
              color: C.cofBlue,
              borderRadius: 4,
              fontSize: 15,
              fontWeight: 600,
              textDecoration: "none",
              letterSpacing: "-0.012em",
            }}
          >
            Get started — it's free
          </Link>
        </div>

        {/* Footer */}
        <footer style={{
          position: "relative", zIndex: 1,
          padding: "32px 32px 40px",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>✦</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.5)", letterSpacing: "-0.012em" }}>AgentFlow</span>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              {["Features", "How it works", "Sign in"].map((l) => (
                <a key={l} href={l === "Sign in" ? "/" : `#${l.toLowerCase().replace(/ /g, "-")}`}
                  style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none", letterSpacing: "-0.012em" }}>
                  {l}
                </a>
              ))}
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", letterSpacing: "-0.01em" }}>© 2026 AgentFlow</p>
          </div>
        </footer>
      </section>

    </div>
  )
}
