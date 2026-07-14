"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

/**
 * The report detail page (/due-diligence/[id]) has its own self-contained
 * scroll box with a trailing Footer baked into ReportView (so the last
 * chapter has real content to scroll to) — skip the layout's copy there to
 * avoid rendering it twice.
 */
export default function PageFooter() {
  const pathname = usePathname();
  const isReportPage = /^\/due-diligence\/.+/.test(pathname);
  if (isReportPage) return null;
  return <Footer />;
}
