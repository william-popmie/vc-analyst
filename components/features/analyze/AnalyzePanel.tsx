"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import Dropzone from "@/components/ui/Dropzone";
import ResearchLog from "@/components/features/analyze/ResearchLog";
import PhaseStepper from "@/components/features/analyze/PhaseStepper";
import DueDiligenceFormView from "@/components/features/form/DueDiligenceFormView";
import ScorecardPanel from "@/components/features/form/ScorecardPanel";
import VerdictPopup from "@/components/features/form/VerdictPopup";
import { initialState, streamReducer } from "@/components/features/analyze/streamState";
import { readProgressStream } from "@/lib/diligence/stream";

type Status = "idle" | "loading" | "done" | "error";

export default function AnalyzePanel() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [stream, dispatch] = useReducer(streamReducer, undefined, initialState);
  const abortRef = useRef<AbortController | null>(null);

  // Back button closes the analysis takeover.
  useEffect(() => {
    const onPop = () => {
      if (open) {
        abortRef.current?.abort();
        setOpen(false);
        setStatus("idle");
        dispatch({ type: "reset" });
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open]);

  function closeAnalysis() {
    abortRef.current?.abort();
    setOpen(false);
    setStatus("idle");
    dispatch({ type: "reset" });
    if (typeof window !== "undefined") window.history.pushState({}, "", "/");
  }

  async function analyze() {
    if (!file) return;
    setOpen(true);
    setStatus("loading");
    setError("");
    dispatch({ type: "reset" });
    if (typeof window !== "undefined") window.history.pushState({}, "", "/analyze");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/analyze", { method: "POST", body, signal: controller.signal });
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
      if (controller.signal.aborted) return; // user navigated away
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("error");
    }
  }

  const loading = status === "loading";

  return (
    <>
      {/* Landing affordances */}
      <section className="space-y-4">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Try it</span>
          <span className="h-px flex-1 bg-ink/10" />
        </div>

        <Dropzone file={file} onFile={(f) => { setFile(f); setStatus("idle"); }} disabled={loading} />

        <button
          onClick={analyze}
          disabled={!file || loading}
          className="rounded-full bg-ink px-8 py-3.5 font-semibold text-paper transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-ink"
        >
          Run due diligence →
        </button>
      </section>

      {/* Full-screen analysis takeover */}
      {open && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-paper">
          <div className="sticky top-0 z-10 border-b border-ink/10 bg-paper/85 backdrop-blur">
            <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 py-3">
              <button
                onClick={closeAnalysis}
                className="shrink-0 rounded-full border border-ink/15 px-3 py-1.5 text-sm font-medium text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                ← New analysis
              </button>
              <div className="min-w-0 flex-1">
                <PhaseStepper steps={stream.steps} startedAt={stream.startedAt} active={loading} />
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-3xl space-y-4 px-5 py-6">
            {status === "error" && (
              <p className="rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-700">
                {error}
              </p>
            )}
            {/* Verdict pins to the very top — it lands at the end of the run. */}
            {stream.verdict && <VerdictPopup verdict={stream.verdict} />}
            {/* The live "streaming thing": searches, sources, research notes. */}
            <ResearchLog state={stream} active={loading} />
            {/* Behind-the-scenes model inputs: scorecard stars + sources. */}
            <ScorecardPanel form={stream.form} active={loading} />
            {/* The due-diligence document itself. */}
            <DueDiligenceFormView form={stream.form} active={loading} />
          </div>
        </div>
      )}
    </>
  );
}
