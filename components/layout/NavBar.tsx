"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAnalysis } from "@/components/features/analyze/AnalysisProvider";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/due-diligence", label: "Due Diligence" },
  { href: "/playbook", label: "Playbook" },
];

/** The always-visible top nav. Shows a glowing pill while an analysis runs in the background. */
export default function NavBar() {
  const { status, stream, currentId } = useAnalysis();
  const pathname = usePathname();
  const loading = status === "loading";
  const activeLabel = stream.steps.find((s) => s.status === "active")?.label ?? "Working";
  const doneCount = stream.steps.filter((s) => s.status === "done").length;

  return (
    <nav className="px-4 py-5 sm:px-6">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 sm:gap-4">
        <Link href="/" className="group flex shrink-0 items-center gap-2">
          <Image src="/logo.png" alt="VC Analyst" width={32} height={32} className="rounded-md" priority />
          <span className="hidden font-semibold tracking-tight text-ink transition-opacity group-hover:opacity-60 sm:inline">
            VC Analyst
          </span>
        </Link>

        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          {loading && currentId && (
            <Link
              href={`/due-diligence/${currentId}`}
              className="flex shrink-0 items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1.5 text-sm font-medium text-accent shadow-[0_0_14px_-2px_var(--accent-bright)] transition-colors hover:bg-accent/15 sm:px-3.5"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-bright opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-bright" />
              </span>
              <span className="tabular-nums">{doneCount}/{stream.steps.length}</span>
              <span className="hidden sm:inline">{activeLabel}…</span>
            </Link>
          )}
          {LINKS.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  "shrink-0 text-sm font-medium transition-colors " +
                  (isActive ? "text-ink" : "text-muted hover:text-ink")
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
