import type { DueDiligenceReport } from "@/lib/diligence/types";
import VerdictHeader from "./VerdictHeader";
import SectionCard from "./SectionCard";

export default function ReportView({ report }: { report: DueDiligenceReport }) {
  const sections = report.sections ?? [];
  const sources = report.sources ?? [];

  return (
    <div className="space-y-5">
      <VerdictHeader report={report} />

      <div className="space-y-4">
        {sections.map((section, i) => (
          <SectionCard key={section.key} section={section} index={i + 1} />
        ))}
      </div>

      {sources.length > 0 && (
        <div className="rounded-3xl border border-ink/12 bg-white/55 p-6 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
            Research sources
          </p>
          <ul className="mt-3 space-y-1.5">
            {sources.map((s, i) => (
              <li key={i}>
                <a href={s.url} target="_blank" rel="noopener noreferrer"
                   className="text-sm text-accent hover:underline">
                  {s.title || s.url} ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="px-2 text-xs text-ink/40">
        Generated {new Date(report.generatedAt).toLocaleString()} · This is an AI assessment, not
        investment advice.
      </p>
    </div>
  );
}
