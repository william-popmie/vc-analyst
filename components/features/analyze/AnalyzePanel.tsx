"use client";

import { useState } from "react";
import Dropzone from "@/components/ui/Dropzone";
import ReportView from "@/components/features/report/ReportView";
import type { DueDiligenceReport } from "@/lib/diligence/types";

type Status = "idle" | "loading" | "done" | "error";

const LOADING_STEPS = [
  "Reading your deck…",
  "Researching the founders…",
  "Mapping the competitive landscape…",
  "Pressure-testing the market…",
  "Writing the diligence memo…",
];

export default function AnalyzePanel() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [report, setReport] = useState<DueDiligenceReport | null>(null);
  const [error, setError] = useState<string>("");
  const [step, setStep] = useState(0);

  async function analyze() {
    if (!file) return;
    setStatus("loading");
    setError("");
    setReport(null);
    setStep(0);

    // Cycle the loading copy while we wait on the research.
    const timer = setInterval(() => setStep((s) => (s + 1) % LOADING_STEPS.length), 3500);

    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/analyze", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed.");
      setReport(data as DueDiligenceReport);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("error");
    } finally {
      clearInterval(timer);
    }
  }

  return (
    <section className="space-y-4">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Try it</span>
        <span className="h-px flex-1 bg-ink/10" />
      </div>

      <Dropzone file={file} onFile={(f) => { setFile(f); setStatus("idle"); }} disabled={status === "loading"} />

      <div className="flex items-center gap-4">
        <button
          onClick={analyze}
          disabled={!file || status === "loading"}
          className="rounded-full bg-ink px-8 py-3.5 font-semibold text-paper transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-ink"
        >
          {status === "loading" ? "Researching…" : "Analyze my deck →"}
        </button>
        {status === "loading" && (
          <span className="animate-pulse text-sm text-muted">{LOADING_STEPS[step]}</span>
        )}
      </div>

      {status === "error" && (
        <p className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {status === "done" && report && (
        <div className="pt-4">
          <ReportView report={report} />
        </div>
      )}
    </section>
  );
}
