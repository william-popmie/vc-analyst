import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI VC Analyst — 800+ decks, distilled",
  description: "Top 6 of 250. 800 pitch decks reviewed. Everything I learned, distilled into an AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} antialiased`}
    >
      <body className="relative min-h-screen overflow-x-hidden">
        {/* Background orbs */}
        <div className="orb orb-1" style={{ width: 420, height: 420, top: -80, left: -60, background: "radial-gradient(circle at 30% 30%, #b9f0c9, transparent 70%)" }} />
        <div className="orb orb-2" style={{ width: 480, height: 480, top: 200, right: -120, background: "radial-gradient(circle at 70% 30%, #ece0b8, transparent 70%)" }} />
        <div className="orb orb-1" style={{ width: 360, height: 360, bottom: -120, left: "30%", background: "radial-gradient(circle at 50% 50%, #d9eafc, transparent 70%)" }} />

        <div className="relative z-10">
          <nav className="px-6 py-5">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 group">
                <span className="grid place-items-center w-7 h-7 rounded-lg bg-ink text-paper text-sm font-bold">V</span>
                <span className="font-semibold tracking-tight text-ink group-hover:opacity-60 transition-opacity">
                  VC Analyst
                </span>
              </Link>
              <Link
                href="/playbook"
                className="text-sm font-medium text-muted hover:text-ink transition-colors"
              >
                The Playbook →
              </Link>
            </div>
          </nav>
          <main className="max-w-3xl mx-auto px-6 pb-24">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
