"use client";

import { useEffect, useRef, useState } from "react";
import { Row, SourceBadge } from "@/components/features/form/DueDiligenceFormView";
import type { FieldSource } from "@/lib/diligence/types";

const SAMPLE_ROWS: { label: string; value: string; source: FieldSource }[] = [
  { label: "Company", value: "B2B checkout infra for marketplaces", source: "deck" },
  {
    label: "Competitive Landscape",
    value: "Also positions against Stripe Connect and Adyen for Platforms",
    source: "web",
  },
  {
    label: "Defensibility",
    value: "Data moat is thin - a competitor could replicate the core flow in ~2 months",
    source: "inferred",
  },
];

const STAGGER_MS = 350;

function SampleSkeleton() {
  return <span className="inline-block h-3 w-40 animate-pulse rounded bg-ink/10 align-middle" />;
}

/**
 * A static excerpt of the real memo format (same Row/SourceBadge components as the
 * actual document), animating in once on first scroll into view — proof, not a claim.
 */
export default function SampleMemoPreview() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        SAMPLE_ROWS.forEach((_, i) => {
          timeouts.push(setTimeout(() => setRevealed((r) => Math.max(r, i + 1)), i * STAGGER_MS));
        });
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      timeouts.forEach(clearTimeout);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-3xl border border-ink/15 bg-white/60 shadow-sm backdrop-blur"
    >
      <div className="border-b border-ink/10 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">
          A real excerpt from the memo format
        </p>
      </div>
      {SAMPLE_ROWS.map((row, i) => (
        <Row key={row.label} label={row.label}>
          {i < revealed ? (
            <span key={row.value} className="cell-pop">
              <span className="whitespace-pre-wrap text-ink/90">{row.value}</span>
              <SourceBadge source={row.source} />
            </span>
          ) : (
            <SampleSkeleton />
          )}
        </Row>
      ))}
    </div>
  );
}
