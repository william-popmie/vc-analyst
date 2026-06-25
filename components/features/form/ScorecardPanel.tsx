"use client";

import type { DueDiligenceForm } from "@/lib/diligence/types";

/**
 * The "behind the scenes" panel: the model's own scorecard (the 6 metrics it
 * rates 1–5 + the funding ask) and the sources it consulted. These are the
 * inputs to the trained invest model — not part of the due-diligence document a
 * VC would hand over, but useful to watch fill in live.
 */

const METRICS: { key: keyof DueDiligenceForm["scorecard"]; label: string }[] = [
  { key: "team", label: "Team" },
  { key: "technology", label: "Technology" },
  { key: "marketSize", label: "Market Size" },
  { key: "valueProposition", label: "Value Proposition" },
  { key: "competitiveAdvantage", label: "Competitive Advantage" },
  { key: "socialImpact", label: "Social Impact" },
];

function Stars({ value, active }: { value: number; active: boolean }) {
  if (value <= 0) {
    return active ? (
      <span className="inline-block h-3 w-20 animate-pulse rounded bg-ink/10" />
    ) : (
      <span className="text-ink/30">—</span>
    );
  }
  return (
    <span key={value} className="cell-pop inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg
          key={n}
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill={n <= value ? "var(--accent)" : "none"}
          stroke={n <= value ? "var(--accent)" : "currentColor"}
          strokeWidth="1.5"
        >
          <path
            className={n <= value ? "" : "text-ink/25"}
            d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.9l-5.8 3.06 1.1-6.47L2.6 9.9l6.5-.95L12 2.5z"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  );
}

export default function ScorecardPanel({
  form,
  active = false,
}: {
  form: DueDiligenceForm;
  active?: boolean;
}) {
  const { scorecard, sources } = form;
  return (
    <div className="overflow-hidden rounded-3xl border border-ink/12 bg-paper-2/50 backdrop-blur">
      <div className="flex items-center gap-2 px-5 py-3">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
          Model inputs · behind the scenes
        </span>
      </div>

      <div className="grid gap-x-8 gap-y-2 px-5 pb-4 sm:grid-cols-2">
        {METRICS.map((m) => (
          <div key={m.key} className="flex items-center justify-between gap-3 border-b border-ink/[0.06] py-1.5">
            <span className="text-sm text-ink/70">{m.label}</span>
            <Stars value={scorecard[m.key]} active={active} />
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 border-b border-ink/[0.06] py-1.5">
          <span className="text-sm text-ink/70">Funding raised</span>
          {scorecard.funding > 0 ? (
            <span key={scorecard.funding} className="cell-pop font-mono text-sm tabular-nums text-ink">
              {scorecard.funding.toLocaleString()}
            </span>
          ) : active ? (
            <span className="inline-block h-3 w-20 animate-pulse rounded bg-ink/10" />
          ) : (
            <span className="text-ink/30">—</span>
          )}
        </div>
      </div>

      {sources.length > 0 && (
        <div className="border-t border-ink/10 px-5 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Sources · {sources.length}
          </p>
          <ul className="space-y-1">
            {sources.map((s, i) => (
              <li key={i}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:underline"
                >
                  {s.title || s.url} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
