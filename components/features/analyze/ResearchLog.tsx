"use client";

import { useEffect, useRef, useState } from "react";
import type { AnalysisState, SearchGroup } from "./streamState";
import { domainOf, faviconOf } from "./sourceDisplay";
import { formatElapsed, useElapsed } from "./elapsed";

function SourceRow({ title, url }: { title: string; url: string }) {
  const favicon = faviconOf(url);
  const domain = domainOf(url);
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fade-up group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-ink/[0.04]"
    >
      {favicon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={favicon} alt="" width={16} height={16} className="h-4 w-4 shrink-0 rounded-sm" />
      ) : (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-ink/40">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
          </svg>
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-sm text-ink/80 group-hover:text-ink">{title}</span>
      {domain && <span className="shrink-0 font-mono text-[11px] text-muted">{domain}</span>}
    </a>
  );
}

function SearchBlock({ group }: { group: SearchGroup }) {
  return (
    <div className="fade-up">
      <div className="flex items-center gap-2 px-1">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-accent" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
        </svg>
        <span className="text-sm font-medium text-ink">{group.query}</span>
        {group.sources.length > 0 && (
          <span className="font-mono text-[11px] text-muted">{group.sources.length}</span>
        )}
      </div>
      <div className="mt-1 ml-[7px] border-l border-ink/10 pl-3">
        {group.sources.map((s, i) => (
          <SourceRow key={`${s.url}-${i}`} title={s.title} url={s.url} />
        ))}
      </div>
    </div>
  );
}

function NotesPanel({ notes, active }: { notes: string; active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (open && ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [notes, open]);

  if (!notes && !active) return null;

  return (
    <div className="rounded-2xl border border-ink/10 bg-paper-2/60">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Live research notes
        </span>
        <span className={"ml-auto text-ink/40 transition-transform " + (open ? "rotate-90" : "")}>›</span>
      </button>
      {open && (
        <div
          ref={ref}
          className="max-h-48 overflow-y-auto px-4 pb-3 font-mono text-xs leading-relaxed text-ink/70"
        >
          {notes ? (
            <span className="whitespace-pre-wrap">{notes}</span>
          ) : (
            <span className="text-ink/40">Waiting for the model to start writing…</span>
          )}
          {active && <span className="ml-0.5 inline-block w-1.5 animate-blink">▌</span>}
        </div>
      )}
    </div>
  );
}

/**
 * The detailed live research log. While `active`, shows the full streaming view;
 * once the report is ready it collapses to a one-line "research trail" the user
 * can expand to audit every query, source, and note.
 */
export default function ResearchLog({ state, active }: { state: AnalysisState; active: boolean }) {
  const elapsed = useElapsed(state.startedAt, active);
  const done = !active;
  const [expanded, setExpanded] = useState(false);

  const fullTrail = (
    <div className="space-y-4">
      <div className="flex items-center gap-3 text-xs text-muted">
        <span><span className="font-semibold text-ink">{state.searches.length}</span> searches</span>
        <span className="text-ink/20">•</span>
        <span><span className="font-semibold text-ink">{state.sourceCount}</span> sources</span>
      </div>
      {state.searches.length > 0 && (
        <div className="space-y-3">
          {state.searches.map((g, i) => (
            <SearchBlock key={`${g.query}-${i}`} group={g} />
          ))}
        </div>
      )}
      <NotesPanel notes={state.notes} active={active} />
    </div>
  );

  // Collapsed "research trail" after completion.
  if (done) {
    return (
      <div className="rounded-3xl border border-ink/12 bg-white/55 backdrop-blur">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-paper">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3.5">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-sm text-ink">
            Researched <span className="font-semibold">{state.sourceCount}</span> sources across{" "}
            <span className="font-semibold">{state.searches.length}</span> searches in {formatElapsed(elapsed)}
          </span>
          <span className={"ml-auto text-ink/40 transition-transform " + (expanded ? "rotate-90" : "")}>›</span>
        </button>
        {expanded && <div className="border-t border-ink/10 px-5 py-4">{fullTrail}</div>}
      </div>
    );
  }

  return (
    <div className="fade-up rounded-3xl border border-ink/12 bg-white/55 p-5 backdrop-blur">
      {fullTrail}
    </div>
  );
}
