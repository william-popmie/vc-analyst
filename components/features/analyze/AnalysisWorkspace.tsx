"use client";

import Dropzone from "@/components/ui/Dropzone";
import CurrentAnalysisCard from "@/components/features/analyze/CurrentAnalysisCard";
import RecentAnalyses from "@/components/features/analyze/RecentAnalyses";
import { useAnalysis } from "@/components/features/analyze/AnalysisProvider";

/**
 * The analysis workspace, shared by the home page and /due-diligence. While a
 * run is in flight it shows the current-analysis card + an abort control (one
 * analysis at a time); otherwise the dropzone + run button. Recent analyses
 * always sit below.
 */
export default function AnalysisWorkspace() {
  const { file, setFile, status, start, stop } = useAnalysis();
  const loading = status === "loading";

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
            {loading ? "In progress" : "Try it"}
          </span>
          <span className="h-px flex-1 bg-ink/10" />
        </div>

        {loading ? (
          <div className="space-y-3">
            <CurrentAnalysisCard />
            <button
              onClick={stop}
              className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-medium text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              Abort current analysis
            </button>
          </div>
        ) : (
          <>
            <Dropzone file={file} onFile={setFile} />
            <button
              onClick={() => start()}
              disabled={!file}
              className="rounded-full bg-ink px-8 py-3.5 font-semibold text-paper transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-ink"
            >
              Run due diligence →
            </button>
          </>
        )}
      </section>

      <RecentAnalyses />
    </div>
  );
}
