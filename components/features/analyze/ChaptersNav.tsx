"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import { DOC_SECTIONS, sectionSlug } from "@/lib/diligence/form-schema";
import type { ReportSection } from "./reportSections";

interface NavRow {
  id: string;
  label: string;
  /** 0 = top-level section, 1 = document sub-section. */
  depth: number;
}

/** Flatten the available sections into nav rows, expanding the document into its sub-sections. */
function buildRows(sections: ReportSection[]): NavRow[] {
  const rows: NavRow[] = [];
  for (const s of sections) {
    if (s.id === "document") {
      rows.push({ id: "document", label: s.label, depth: 0 });
      for (const ds of DOC_SECTIONS) rows.push({ id: sectionSlug(ds.title), label: ds.title, depth: 1 });
    } else {
      rows.push({ id: s.id, label: s.label, depth: 0 });
    }
  }
  return rows;
}

/**
 * The sticky "chapters" rail: a vertical line + dots index of the report's
 * sections (with the document's sub-sections nested). Scroll-spy highlights the
 * section currently in view and clicking a dot jumps to it. Observation is
 * rooted on the analysis overlay's scroll element, since the report scrolls
 * inside the fixed takeover rather than the window.
 */
export default function ChaptersNav({
  sections,
  scrollRef,
}: {
  sections: ReportSection[];
  scrollRef: RefObject<HTMLElement | null>;
}) {
  const rows = useMemo(() => buildRows(sections), [sections]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // The ids we actually scroll-spy on: every row except the document container
  // (its sub-sections stand in for it, so the "Document" parent lights up when
  // any of its children is current).
  const spyKey = rows.map((r) => r.id).join("|");

  // Scroll-spy via a scroll listener on the overlay: the active section is the
  // last one whose heading has crossed the sticky-header line. (A plain scroll
  // listener is more reliable than IntersectionObserver when the scroll root is
  // a position:fixed element.)
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const ids = rows.filter((r) => r.id !== "document").map((r) => r.id);

    function update() {
      const r = root!;
      // At the very bottom of the scroll, short trailing sections may never
      // cross the activation line (there's no more room to scroll them up)
      // — force the last one active so the nav doesn't get stuck mid-list.
      if (r.scrollTop + r.clientHeight >= r.scrollHeight - 2) {
        const last = ids[ids.length - 1];
        if (last) setActiveId(last);
        return;
      }
      const rootTop = r.getBoundingClientRect().top;
      let current = ids[0] ?? null;
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - rootTop <= 96) current = id;
      }
      if (current) setActiveId(current);
    }

    update();
    root.addEventListener("scroll", update, { passive: true });
    return () => root.removeEventListener("scroll", update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollRef, spyKey]);

  function jumpTo(id: string) {
    const root = scrollRef.current;
    const el = document.getElementById(id);
    if (!root || !el) return;
    const top = el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop - 88;
    root.scrollTo({ top, behavior: "smooth" });
  }

  const activeIndex = rows.findIndex((r) => r.id === activeId);
  // "Document" parent counts as reached once any of its sub-sections is active.
  const docReached = activeId?.startsWith("doc-") ?? false;

  return (
    <nav
      className={
        "group sticky top-1/2 z-10 block w-6 max-h-[calc(100dvh-10rem)] -translate-y-1/2 self-start " +
        "overflow-hidden rounded-xl transition-[width] duration-150 " +
        // The compact→expanded pop-out is for narrow widths only; at lg+ the full
        // labelled rail is always shown, so it must never expand/shadow on hover.
        "max-lg:hover:z-20 max-lg:hover:w-[200px] max-lg:hover:overflow-visible max-lg:hover:bg-paper " +
        "max-lg:hover:px-2 max-lg:hover:shadow-lg " +
        "lg:w-[190px] lg:overflow-visible lg:bg-transparent lg:px-0 lg:shadow-none"
      }
    >
      <p
        className={
          "mb-3 hidden whitespace-nowrap pl-[18px] text-[10px] font-semibold uppercase tracking-[0.16em] " +
          "text-ink/35 group-hover:block lg:block"
        }
      >
        Chapters
      </p>
      <ul className="max-h-[calc(100dvh-9rem)] overflow-y-auto">
        {rows.map((row, i) => {
          const isActive = row.id === activeId || (row.id === "document" && docReached);
          const isPast = activeIndex >= 0 && i < activeIndex;
          const lit = isActive || isPast;
          return (
            <li key={row.id} className="relative">
              {row.depth === 1 ? (
                <span
                  className={
                    "absolute left-[18px] top-0 h-full w-px " + (lit ? "bg-accent/40" : "bg-ink/10")
                  }
                />
              ) : (
                <span
                  className={
                    "absolute left-[3px] top-0 h-full w-px " + (lit ? "bg-accent/50" : "bg-ink/12")
                  }
                />
              )}
              <button
                onClick={() => jumpTo(row.id)}
                className={
                  "relative block w-full rounded-md py-2 pr-2 text-left transition-colors hover:bg-ink/[0.05] " +
                  (row.depth === 1 ? "pl-[38px]" : "pl-[18px]")
                }
              >
                <span
                  className={
                    "absolute top-1/2 -translate-y-1/2 rounded-full ring-2 ring-paper transition-colors " +
                    (row.depth === 1 ? "left-[16px] h-1.5 w-1.5" : "left-0 h-[7px] w-[7px]") +
                    " " +
                    (isActive ? "bg-accent" : lit ? "bg-accent/50" : "bg-ink/25")
                  }
                />
                <span
                  className={
                    "hidden whitespace-nowrap group-hover:inline lg:inline " +
                    (row.depth === 1 ? "text-[11px] " : "text-xs ") +
                    (isActive
                      ? "font-medium text-ink"
                      : "text-ink/45 hover:text-ink/70")
                  }
                >
                  {row.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
