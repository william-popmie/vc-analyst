"use client";

import { useReducer, useState } from "react";
import Dropzone from "@/components/ui/Dropzone";
import ReportView from "@/components/features/report/ReportView";
import ResearchLog from "@/components/features/analyze/ResearchLog";
import { initialState, streamReducer } from "@/components/features/analyze/streamState";
import { readProgressStream } from "@/lib/diligence/stream";
import type { DueDiligenceReport } from "@/lib/diligence/types";

type Status = "idle" | "loading" | "done" | "error";

export default function AnalyzePanel() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [report, setReport] = useState<DueDiligenceReport | null>(null);
  const [error, setError] = useState<string>("");
  const [stream, dispatch] = useReducer(streamReducer, undefined, initialState);

  async function analyze() {
    if (!file) return;
    setStatus("loading");
    setError("");
    setReport(null);
    dispatch({ type: "reset" });

    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/analyze", { method: "POST", body });
      if (!res.body) throw new Error("No response stream.");

      let finalReport: DueDiligenceReport | null = null;

      // Consume the NDJSON progress stream, feeding every event to the log.
      for await (const event of readProgressStream(res.body)) {
        dispatch({ type: "event", event });
        if (event.type === "report") finalReport = event.report;
        else if (event.type === "error") throw new Error(event.message);
      }

      if (!finalReport) throw new Error("Analysis ended without a report.");
      setReport(finalReport);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("error");
    }
  }

  const showLog = status === "loading" || (status === "done" && !!report);

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
          <span className="text-sm text-muted">Live — this runs for a minute or two.</span>
        )}
      </div>

      {status === "error" && (
        <p className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {showLog && <ResearchLog state={stream} active={status === "loading"} />}

      {status === "done" && report && (
        <div className="pt-2">
          <ReportView report={report} />
        </div>
      )}
    </section>
  );
}
