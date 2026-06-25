"use client";

import { useState } from "react";
import type { InvestVerdict } from "@/lib/diligence/types";

/**
 * The investment verdict, shown as a banner once the pipeline finishes. While
 * the trained model isn't wired (`available: false`) it shows a clear placeholder
 * rather than a fake invest/pass.
 */
export default function VerdictPopup({ verdict }: { verdict: InvestVerdict }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const pending = !verdict.available;
  const invest = verdict.invest;

  const tone = pending
    ? "border-ink/15 bg-paper-2/70 text-ink"
    : invest
      ? "border-accent/30 bg-accent/10 text-ink"
      : "border-red-500/25 bg-red-500/[0.06] text-ink";

  return (
    <div className={`fade-up flex items-center gap-4 rounded-3xl border px-6 py-5 backdrop-blur ${tone}`}>
      <div
        className={
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-paper " +
          (pending ? "bg-ink/40" : invest ? "bg-accent" : "bg-red-600")
        }
      >
        {pending ? (
          <span className="text-xl font-bold">?</span>
        ) : invest ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Investment model
        </p>
        <p className="text-lg font-bold">
          {pending ? "Verdict pending" : invest ? "Invest" : "Pass"}
        </p>
        {verdict.note && <p className="mt-0.5 text-sm text-muted">{verdict.note}</p>}
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded-full p-1.5 text-ink/40 transition-colors hover:bg-ink/5 hover:text-ink"
        aria-label="Dismiss"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
