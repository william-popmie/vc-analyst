"use client";

import Card from "@/components/ui/Card";
import type { DeckFeedbackItem, DeckFeedbackSeverity } from "@/lib/diligence/types";

/**
 * A critique of the pitch deck itself — gaps, weaknesses, and strengths,
 * grounded in the playbook and research signals. Sits directly under the
 * verdict banner since it's a headline output, not part of the DD document.
 */

const SEVERITY_META: Record<
  DeckFeedbackSeverity,
  { label: string; dot: string; badge: string }
> = {
  critical: { label: "Critical", dot: "bg-red-600", badge: "bg-red-500/15 text-red-700" },
  warning: { label: "Warning", dot: "bg-amber-500", badge: "bg-amber-500/20 text-amber-700" },
  strength: { label: "Strength", dot: "bg-accent", badge: "bg-accent/15 text-accent" },
};

const SEVERITY_ORDER: DeckFeedbackSeverity[] = ["critical", "warning", "strength"];

function FeedbackRow({ item }: { item: DeckFeedbackItem }) {
  const meta = SEVERITY_META[item.severity];
  return (
    <li className="cell-pop flex gap-3 border-b border-ink/[0.06] py-3 last:border-b-0">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${meta.dot}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink">{item.title}</span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.badge}`}>
            {item.category}
          </span>
        </div>
        {item.detail && <p className="mt-0.5 text-sm leading-relaxed text-ink/70">{item.detail}</p>}
      </div>
    </li>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2 px-5 pb-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-3 w-full max-w-sm animate-pulse rounded bg-ink/10" />
      ))}
    </div>
  );
}

export default function DeckFeedbackPanel({
  items,
  active = false,
}: {
  items: DeckFeedbackItem[];
  active?: boolean;
}) {
  if (items.length === 0 && !active) return null;

  const grouped = SEVERITY_ORDER.map((severity) => ({
    severity,
    items: items.filter((i) => i.severity === severity),
  })).filter((g) => g.items.length > 0);

  return (
    <Card eyebrow="Deck feedback" className="fade-up">
      {items.length === 0 ? (
        <Skeleton />
      ) : (
        <div className="divide-y divide-ink/10">
          {grouped.map((g) => (
            <div key={g.severity} className="px-5 py-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink/40">
                {SEVERITY_META[g.severity].label}
              </p>
              <ul>
                {g.items.map((item, i) => (
                  <FeedbackRow key={`${g.severity}-${i}`} item={item} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
