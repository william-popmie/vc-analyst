import Link from "next/link";

const stats = [
  { value: "Ranked top 6", label: "Program rank of 250+" },
  { value: "800+", label: "Decks reviewed" },
  { value: "Custom-trained AI model", label: "Based on 800+ real VC verdicts" },
];

export default function Hero() {
  return (
    <section className="pt-10 sm:pt-16">
      <div className="fade-up inline-flex items-center gap-2 rounded-full border border-ink/15 bg-paper/60 px-3 py-1 text-xs font-medium text-muted backdrop-blur">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
        Plug and Play Tech Center · San Francisco
      </div>

      <h1 className="fade-up mt-6 text-5xl font-bold leading-[0.95] tracking-[-0.03em] text-ink sm:text-6xl" style={{ animationDelay: "0.05s" }}>
        I reviewed 800+ pitch decks{" "}
        <span className="font-serif font-normal italic">as a VC</span> and trained an AI on
        the verdicts.
        <br />
        <span className="marker">Have yours reviewed the same way.</span>
      </h1>

      <p className="fade-up mt-6 max-w-xl text-lg leading-relaxed text-muted" style={{ animationDelay: "0.15s" }}>
        You&apos;ll get the read a VC actually gives your deck: what&apos;s strong, what&apos;s
        missing, and how you look to an investor who Googles you first.
      </p>

      <div className="fade-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: "0.25s" }}>
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-ink/15 bg-white/70 px-4 py-3 backdrop-blur">
            <div className="text-xl font-bold tracking-tight text-ink">{s.value}</div>
            <div className="mt-0.5 text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
