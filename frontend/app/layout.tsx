import type { Metadata } from "next";
import { Onest, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Onest({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const APP_URL = "https://agent-flow-lime.vercel.app"

export const metadata: Metadata = {
  title: "AgentFlow",
  description: "Multi-agent orchestration workspace — coordinate specialist AI agents to research, write, code, and analyse in parallel.",
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "AgentFlow",
    description: "Multi-agent orchestration workspace — coordinate specialist AI agents to research, write, code, and analyse in parallel.",
    url: APP_URL,
    siteName: "AgentFlow",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "AgentFlow" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgentFlow",
    description: "Multi-agent orchestration workspace — coordinate specialist AI agents in parallel.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
