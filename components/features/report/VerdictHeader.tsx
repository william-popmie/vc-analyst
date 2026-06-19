import type { DueDiligenceReport } from "@/lib/diligence/types";

function ScoreRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(10, score)) / 10;
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-20 w-20 shrink-0 place-items-center">
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="6" className="text-ink/10" />
        <circle
          cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="text-accent"
        />
      </svg>
      <span className="absolute text-lg font-bold text-ink">{score.toFixed(1)}</span>
    </div>
  );
}

export default function VerdictHeader({ report }: { report: DueDiligenceReport }) {
  const { company, overall } = report;
  return (
    <div className="rounded-3xl border border-ink/15 bg-white/70 p-7 backdrop-blur">
      <div className="flex items-start gap-5">
        <ScoreRing score={overall.score} />
        <div className="min-w-0 flex-1">
          <h3 className="text-2xl font-bold tracking-tight text-ink">{company.name}</h3>
          {company.oneLiner && <p className="mt-1 text-muted">{company.oneLiner}</p>}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {[company.stage, company.sector, company.location].filter(Boolean).map((t) => (
              <span key={t} className="rounded-full border border-ink/15 bg-paper/60 px-2.5 py-1 text-muted">
                {t}
              </span>
            ))}
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer"
                 className="rounded-full border border-ink/15 bg-paper/60 px-2.5 py-1 text-accent hover:underline">
                {company.website.replace(/^https?:\/\//, "")} ↗
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-marker/30 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/60">Verdict</span>
        <p className="mt-1 font-medium text-ink">{overall.recommendation}</p>
      </div>

      {overall.thesis && <p className="mt-4 leading-relaxed text-muted">{overall.thesis}</p>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <FlagList label="Top strengths" items={overall.topStrengths} tone="accent" />
        <FlagList label="Top concerns" items={overall.topConcerns} tone="red" />
      </div>
    </div>
  );
}

function FlagList({ label, items, tone }: { label: string; items: string[]; tone: "accent" | "red" }) {
  if (!items.length) return null;
  const dot = tone === "accent" ? "bg-accent" : "bg-red-500";
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/50">{label}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm text-ink/80">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
