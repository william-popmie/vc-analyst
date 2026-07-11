"use client";

import type { UsageTotals } from "@/components/features/analyze/streamState";

/**
 * Live token-cost readout, dev-only. `usage` events never reach a production
 * client (gated server-side in the API route), so `state.usage` stays null
 * there and this renders nothing — no separate build-time flag needed.
 */
export default function DevCostOverlay({ usage }: { usage: UsageTotals | null }) {
  if (process.env.NODE_ENV === "production" || !usage) return null;

  const stages = Object.entries(usage.byStage).sort((a, b) => b[1] - a[1]);

  return (
    <div className="fixed bottom-4 left-4 z-[60] w-64 rounded-xl border border-ink/15 bg-paper/95 p-3 font-mono text-xs text-ink shadow-lg backdrop-blur">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="font-semibold uppercase tracking-wide text-muted">Dev · cost</span>
        <span className="text-sm font-bold">${usage.totalCostUsd.toFixed(4)}</span>
      </div>
      <div className="text-muted">
        {usage.totalInputTokens.toLocaleString()} in / {usage.totalOutputTokens.toLocaleString()} out
      </div>
      {stages.length > 0 && (
        <ul className="mt-2 space-y-0.5 border-t border-ink/10 pt-2">
          {stages.map(([stage, cost]) => (
            <li key={stage} className="flex justify-between">
              <span className="text-muted">{stage}</span>
              <span>${cost.toFixed(4)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
