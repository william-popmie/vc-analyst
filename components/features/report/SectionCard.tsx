import type { DiligenceSection } from "@/lib/diligence/types";

function scoreColor(score: number) {
  if (score >= 8) return "text-accent";
  if (score >= 5) return "text-ink";
  return "text-red-500";
}

function List({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">{label}</p>
      <ul className="mt-1.5 space-y-1">
        {items.map((it, i) => (
          <li key={i} className="text-sm leading-relaxed text-ink/80">{it}</li>
        ))}
      </ul>
    </div>
  );
}

export default function SectionCard({ section, index }: { section: DiligenceSection; index: number }) {
  return (
    <div className="rounded-3xl border border-ink/12 bg-white/55 p-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-xl bg-ink text-xs font-bold text-paper">
          {index}
        </span>
        <h4 className="flex-1 text-lg font-bold tracking-tight text-ink">{section.title}</h4>
        <span className={`text-xl font-bold tabular-nums ${scoreColor(section.score)}`}>
          {section.score.toFixed(1)}
          <span className="text-sm font-normal text-ink/30">/10</span>
        </span>
      </div>

      {section.summary && <p className="mt-3 leading-relaxed text-muted">{section.summary}</p>}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <List label="From the deck" items={section.fromDeck} />
        <List label="From research" items={section.fromResearch} />
      </div>

      {(section.greenFlags.length > 0 || section.redFlags.length > 0) && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {section.greenFlags.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Green flags</p>
              <ul className="mt-1.5 space-y-1">
                {section.greenFlags.map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink/80">
                    <span className="text-accent">+</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {section.redFlags.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-500">Red flags</p>
              <ul className="mt-1.5 space-y-1">
                {section.redFlags.map((f, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink/80">
                    <span className="text-red-500">−</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {section.questionsAVCWouldAsk.length > 0 && (
        <div className="mt-4 rounded-2xl bg-paper/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/45">
            Questions a VC would ask
          </p>
          <ul className="mt-1.5 space-y-1">
            {section.questionsAVCWouldAsk.map((q, i) => (
              <li key={i} className="text-sm italic text-ink/75">“{q}”</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
