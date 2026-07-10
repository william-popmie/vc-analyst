import Link from "next/link";

const LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/william-ragnarsson/" },
  { label: "GitHub", href: "https://github.com/william-popmie" },
  { label: "Email", href: "mailto:william.ragnarsson@gmail.com" },
];

/**
 * Shared site footer — rendered once in app/layout.tsx (so it's on every page)
 * and again at the end of the analysis report's section list, where it also
 * gives the last chapters real trailing content to scroll to.
 */
export default function Footer() {
  return (
    <footer className="mt-16 border-t border-ink/10 px-6 py-8">
      <div className="mx-auto flex max-w-3xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-semibold tracking-tight text-ink">William Ragnarsson</p>
          <p className="text-sm text-muted">VC analyst, distilled into an AI.</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target={l.href.startsWith("http") ? "_blank" : undefined}
              rel={l.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="text-sm font-medium text-muted transition-colors hover:text-ink"
            >
              {l.label}
            </a>
          ))}
          <Link href="/playbook" className="text-sm font-medium text-muted transition-colors hover:text-ink">
            The Playbook
          </Link>
          <span className="text-sm text-muted/60">© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
