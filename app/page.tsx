import Link from "next/link";
import Hero from "@/components/features/hero/Hero";
import AnalyzePanel from "@/components/features/analyze/AnalyzePanel";

export default function Home() {
  return (
    <div className="space-y-20">
      <Hero />
      <AnalyzePanel />

      <section className="fade-up">
        <Link
          href="/playbook"
          className="group block rounded-3xl border border-ink/15 bg-gradient-to-br from-white/70 to-paper/40 p-8 backdrop-blur transition-colors hover:border-ink/30"
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Fully transparent</div>
              <p className="mt-2 text-xl font-bold tracking-tight text-ink">
                What does the AI actually look at?
              </p>
              <p className="mt-2 max-w-md leading-relaxed text-muted">
                Real insider criteria — team credibility, competition, deck quality — from a year
                inside one of the world&apos;s most active accelerators.
              </p>
            </div>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-ink text-lg text-paper transition-transform group-hover:rotate-12">
              →
            </span>
          </div>
        </Link>
      </section>
    </div>
  );
}
