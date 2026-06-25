"use client";

import { DD_SECTIONS, type FieldDescriptor } from "@/lib/diligence/form-schema";
import type { DueDiligenceForm, Field, FieldSource } from "@/lib/diligence/types";

function readField(form: DueDiligenceForm, key: string): Field | null {
  const [section, field] = key.split(".");
  const node = (form as unknown as Record<string, Record<string, unknown>>)[section];
  const target = node?.[field];
  if (target && typeof target === "object" && "value" in target) return target as Field;
  return null;
}

function readNumber(form: DueDiligenceForm, key: string): number {
  const metric = key.split(".")[1];
  return (form.scorecard as unknown as Record<string, number>)[metric] ?? 0;
}

const SOURCE_BADGE: Record<FieldSource, { label: string; cls: string } | null> = {
  deck: { label: "deck", cls: "bg-accent/15 text-accent" },
  web: { label: "web", cls: "bg-blue-500/15 text-blue-700" },
  inferred: { label: "inferred", cls: "bg-amber-500/20 text-amber-700" },
  unknown: null,
};

function SourceBadge({ source }: { source: FieldSource }) {
  const badge = SOURCE_BADGE[source];
  if (!badge) return null;
  return (
    <span className={`ml-2 rounded px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide ${badge.cls}`}>
      {badge.label}
    </span>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5 align-middle">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 24 24" className="h-4 w-4"
          fill={n <= value ? "var(--accent)" : "none"}
          stroke={n <= value ? "var(--accent)" : "currentColor"}
          strokeWidth="1.5"
        >
          <path className={n <= value ? "" : "text-ink/25"}
            d="M12 2.5l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.9l-5.8 3.06 1.1-6.47L2.6 9.9l6.5-.95L12 2.5z"
            strokeLinejoin="round" />
        </svg>
      ))}
    </span>
  );
}

/** The value side of one row, with live skeleton / fill states. */
function FieldValue({
  descriptor,
  form,
  active,
}: {
  descriptor: FieldDescriptor;
  form: DueDiligenceForm;
  active: boolean;
}) {
  if (descriptor.kind === "rating") {
    const n = readNumber(form, descriptor.key);
    return n > 0 ? <Stars value={n} /> : <Skeleton active={active} />;
  }

  if (descriptor.kind === "number") {
    const n = readNumber(form, descriptor.key);
    return n > 0 ? (
      <span key={n} className="cell-pop font-mono tabular-nums text-ink">{n.toLocaleString()}</span>
    ) : (
      <Skeleton active={active} />
    );
  }

  const field = readField(form, descriptor.key);
  if (field && field.value) {
    return (
      <span key={field.value} className="cell-pop">
        <span className="whitespace-pre-wrap text-ink/90">{field.value}</span>
        <SourceBadge source={field.source} />
      </span>
    );
  }
  if (descriptor.manualOnly) {
    return <span className="text-sm italic text-ink/30">add manually</span>;
  }
  return <Skeleton active={active} />;
}

function Skeleton({ active }: { active: boolean }) {
  if (!active) return <span className="text-ink/30">—</span>;
  return <span className="inline-block h-3 w-28 animate-pulse rounded bg-ink/10 align-middle" />;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] divide-x divide-ink/10 border-b border-ink/10 last:border-b-0 sm:grid-cols-[160px_1fr]">
      <div className="bg-paper-2/40 px-4 py-3 text-sm font-semibold text-ink/75">{label}</div>
      <div className="px-4 py-3 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function FoundersRows({ form, active }: { form: DueDiligenceForm; active: boolean }) {
  const members = form.founders.members;
  if (members.length === 0) {
    return (
      <Row label="Founders">
        <Skeleton active={active} />
      </Row>
    );
  }
  return (
    <>
      {members.map((m, i) => (
        <Row key={i} label={m.role || "Founder"}>
          <div className="cell-pop space-y-1">
            <div className="font-semibold text-ink">{m.name}</div>
            {m.commitment && <div className="text-xs italic text-muted">{m.commitment}</div>}
            {m.background.length > 0 && (
              <ul className="mt-1 list-disc space-y-0.5 pl-4 text-ink/80">
                {m.background.map((b, j) => (
                  <li key={j}>{b}</li>
                ))}
              </ul>
            )}
          </div>
        </Row>
      ))}
    </>
  );
}

/**
 * The due-diligence form, rendered as the PDF-style grid (black section bars,
 * label/value cells). Cells fill in live as `field` events arrive.
 */
export default function DueDiligenceFormView({
  form,
  active = false,
}: {
  form: DueDiligenceForm;
  active?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-ink/15 bg-white/60 shadow-sm backdrop-blur">
      {DD_SECTIONS.map((section) => (
        <section key={section.title}>
          <div className="bg-ink px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] text-paper">
            {section.title}
          </div>
          <div>
            {section.fields.map((f) =>
              f.kind === "founders" ? (
                <FoundersRows key={f.key} form={form} active={active} />
              ) : (
                <Row key={f.key} label={f.label}>
                  <FieldValue descriptor={f} form={form} active={active} />
                </Row>
              ),
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
