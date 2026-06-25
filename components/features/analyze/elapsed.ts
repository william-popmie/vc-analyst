import { useEffect, useState } from "react";

export function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

/** Live-ticking elapsed time; freezes when `active` goes false. */
export function useElapsed(startedAt: number | null, active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [active]);
  return startedAt ? Math.max(0, now - startedAt) : 0;
}
