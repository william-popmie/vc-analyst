import type { ReactNode } from "react";

/**
 * Shared shell for result cards: rounded surface, optional eyebrow-label
 * header with trailing actions. Keeps card chrome consistent across the
 * left rail instead of each card rolling its own border/radius/background.
 */
export default function Card({
  eyebrow,
  actions,
  children,
  className = "",
}: {
  eyebrow?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-3xl border border-ink/12 bg-paper-2/50 backdrop-blur ${className}`}>
      {eyebrow && (
        <div className="flex items-center gap-2 px-5 py-3">
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{eyebrow}</span>
          {actions && <span className="ml-auto flex items-center gap-2">{actions}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
