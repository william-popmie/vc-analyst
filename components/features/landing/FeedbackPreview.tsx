const GROUPS: { label: string; chip: string; items: string[] }[] = [
  {
    label: "Strengths",
    chip: "bg-accent/15 text-accent",
    items: [
      "Sharp, specific problem: you name the customer and the pain in one line.",
      "Traction slide leads with real revenue, not vanity metrics.",
    ],
  },
  {
    label: "What's missing",
    chip: "bg-amber-500/20 text-amber-700",
    items: [
      "No competitive landscape: an investor will assume you haven't looked.",
      "Round size, terms, and cap table aren't stated.",
      "Go-to-market is a claim, not a plan.",
    ],
  },
  {
    label: "Online visibility",
    chip: "bg-blue-500/15 text-blue-700",
    items: [
      "Both founders are easy to find on LinkedIn with relevant backgrounds.",
      "But the company has almost no web footprint and no press; expect investors to read the silence as early-stage risk.",
    ],
  },
];

/**
 * A static, illustrative sample of the founder-facing feedback the engine returns —
 * styled to match the real memo card so the two read as the same product. Hardcoded
 * example content (framed by the "A sample…" eyebrow), so it carries no dependency on
 * the feedback engine's types.
 */
export default function FeedbackPreview() {
  return (
    <div className="overflow-hidden rounded-3xl border border-ink/15 bg-white/60 shadow-sm backdrop-blur">
      <div className="border-b border-ink/10 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">
          A sample of the feedback you get
        </p>
      </div>
      {GROUPS.map((group) => (
        <div key={group.label} className="border-b border-ink/10 px-4 py-4 last:border-b-0">
          <span
            className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${group.chip}`}
          >
            {group.label}
          </span>
          <ul className="mt-2 space-y-1.5">
            {group.items.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-ink/90">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
