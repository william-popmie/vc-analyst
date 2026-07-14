"use client";

import Link from "next/link";
import { useAnalysis } from "./AnalysisProvider";

/**
 * Compact card for the analysis currently in flight. Links to its live report
 * page; the workspace shows it in place of the dropzone while a run is active.
 */
export default function CurrentAnalysisCard() {
  const { stream, currentId, file } = useAnalysis();
  if (!currentId) return null;

  const activeLabel = stream.steps.find((s) => s.status === "active")?.label ?? "Working";
  const doneCount = stream.steps.filter((s) => s.status === "done").length;
  const name = stream.form.company.name.value || file?.name || "Analyzing deck";

  return (
    <Link
      href={`/due-diligence/${currentId}`}
      className="group flex items-center gap-4 rounded-2xl border border-accent/30 bg-accent/[0.06] px-5 py-4 shadow-[0_0_20px_-6px_var(--accent-bright)] transition-colors hover:bg-accent/10"
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-bright opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-bright" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{name}</p>
        <p className="text-sm text-accent">
          {activeLabel}… · step {doneCount}/{stream.steps.length}
        </p>
      </div>
      <span className="shrink-0 text-sm font-medium text-accent transition-transform group-hover:translate-x-0.5">
        View →
      </span>
    </Link>
  );
}
