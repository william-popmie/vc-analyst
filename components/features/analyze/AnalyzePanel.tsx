"use client";

import { useReducer, useState } from "react";
import Dropzone from "@/components/ui/Dropzone";
import ResearchLog from "@/components/features/analyze/ResearchLog";
import DueDiligenceFormView from "@/components/features/form/DueDiligenceFormView";
import VerdictPopup from "@/components/features/form/VerdictPopup";
import { initialState, streamReducer } from "@/components/features/analyze/streamState";
import { readProgressStream } from "@/lib/diligence/stream";

type Status = "idle" | "loading" | "done" | "error";

export default function AnalyzePanel() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const [stream, dispatch] = useReducer(streamReducer, undefined, initialState);

  async function analyze() {
    if (!file) return;
    setStatus("loading");
    setError("");
    dispatch({ type: "reset" });

    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/analyze", { method: "POST", body });
      if (!res.body) throw new Error("No response stream.");

      let sawReport = false;
      for await (const event of readProgressStream(res.body)) {
        dispatch({ type: "event", event });
        if (event.type === "report") sawReport = true;
        else if (event.type === "error") throw new Error(event.message);
      }

      if (!sawReport) throw new Error("Analysis ended without a result.");
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("error");
    }
  }

  const started = status === "loading" || status === "done";
  const loading = status === "loading";

  return (
    <section className="space-y-4">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Try it</span>
        <span className="h-px flex-1 bg-ink/10" />
      </div>

      <Dropzone file={file} onFile={(f) => { setFile(f); setStatus("idle"); }} disabled={loading} />

      <div className="flex items-center gap-4">
        <button
          onClick={analyze}
          disabled={!file || loading}
          className="rounded-full bg-ink px-8 py-3.5 font-semibold text-paper transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-ink"
        >
          {loading ? "Filling the form…" : "Run due diligence →"}
        </button>
        {loading && (
          <span className="text-sm text-muted">Live — watch the form fill in below.</span>
        )}
      </div>

      {status === "error" && (
        <p className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-700">
          {error}
        </p>
      )}

      {started && (
        <div className="space-y-4 pt-2">
          {stream.verdict && <VerdictPopup verdict={stream.verdict} />}
          <DueDiligenceFormView form={stream.form} active={loading} />
          <ResearchLog state={stream} active={loading} />
        </div>
      )}
    </section>
  );
}
