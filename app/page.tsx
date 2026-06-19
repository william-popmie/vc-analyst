"use client";

import { useState, useRef } from "react";
import Link from "next/link";

const stats = [
  { value: "6 / 250", label: "Program rank" },
  { value: "800+", label: "Decks reviewed" },
  { value: "~70", label: "Per week" },
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile(f: File | null | undefined) {
    if (f?.type === "application/pdf") setFile(f);
  }

  return (
    <div className="space-y-20">
      {/* Hero */}
      <section className="pt-10 sm:pt-16">
        <div className="fade-up inline-flex items-center gap-2 rounded-full border border-ink/10 bg-paper/60 backdrop-blur px-3 py-1 text-xs font-medium text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Plug and Play Tech Center · San Francisco
        </div>

        <h1 className="fade-up mt-6 text-5xl sm:text-6xl font-bold tracking-[-0.03em] leading-[0.95] text-ink" style={{ animationDelay: "0.05s" }}>
          800 pitch decks,
          <br />
          <span className="font-serif italic font-normal">everything</span>{" "}
          <span className="marker">I learned</span>,
          <br />
          distilled into an AI.
        </h1>

        <p className="fade-up mt-6 text-lg text-muted max-w-xl leading-relaxed" style={{ animationDelay: "0.15s" }}>
          During my year as a VC analyst, I reviewed hundreds of decks every week
          alongside partners. This tool runs your deck through that same framework —
          and unlike every other tool, the{" "}
          <Link href="/playbook" className="text-ink font-medium underline decoration-marker decoration-2 underline-offset-4 hover:decoration-accent transition-colors">
            exact criteria are public
          </Link>
          .
        </p>

        {/* Stat chips */}
        <div className="fade-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: "0.25s" }}>
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-ink/10 bg-white/50 backdrop-blur px-4 py-3">
              <div className="text-xl font-bold tracking-tight text-ink">{s.value}</div>
              <div className="text-xs text-muted mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Upload */}
      <section className="fade-up" style={{ animationDelay: "0.35s" }}>
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-semibold text-muted uppercase tracking-[0.2em]">
            Try it
          </span>
          <span className="h-px flex-1 bg-ink/10" />
        </div>

        <div
          className={`dropzone-border rounded-3xl p-1 transition-transform ${dragging ? "dragging scale-[1.01]" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); pickFile(e.dataTransfer.files[0]); }}
        >
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-[20px] bg-white/60 backdrop-blur px-8 py-14 text-center hover:bg-white/80 transition-colors cursor-pointer"
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])}
            />
            {file ? (
              <div className="space-y-2">
                <div className="mx-auto w-12 h-12 grid place-items-center rounded-2xl bg-accent/10 text-accent text-xl">✓</div>
                <p className="text-ink font-semibold">{file.name}</p>
                <p className="text-sm text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB · ready to analyze</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="mx-auto w-12 h-12 grid place-items-center rounded-2xl bg-ink/5 text-ink text-xl">↑</div>
                <p className="text-ink font-semibold text-lg">Drop your pitch deck</p>
                <p className="text-sm text-muted">PDF · up to 20MB · click or drag</p>
              </div>
            )}
          </button>
        </div>

        <button
          disabled={!file}
          className="mt-5 w-full sm:w-auto px-8 py-3.5 rounded-full bg-ink text-paper font-semibold hover:bg-accent transition-colors disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:bg-ink"
        >
          Analyze my deck →
        </button>
      </section>

      {/* Playbook CTA */}
      <section className="fade-up" style={{ animationDelay: "0.1s" }}>
        <Link
          href="/playbook"
          className="group block rounded-3xl border border-ink/10 bg-gradient-to-br from-white/70 to-paper/40 backdrop-blur p-8 hover:border-ink/25 transition-colors"
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-xs font-semibold text-accent uppercase tracking-[0.2em]">Fully transparent</div>
              <p className="mt-2 text-xl font-bold tracking-tight text-ink">
                What does the AI actually look at?
              </p>
              <p className="mt-2 text-muted leading-relaxed max-w-md">
                Real insider criteria — team credibility, competition, deck quality —
                from a year inside one of the world&apos;s most active accelerators.
              </p>
            </div>
            <span className="shrink-0 grid place-items-center w-12 h-12 rounded-2xl bg-ink text-paper text-lg group-hover:rotate-12 transition-transform">
              →
            </span>
          </div>
        </Link>
      </section>
    </div>
  );
}
