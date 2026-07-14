"use client";

import { useRef, useState } from "react";

type DropzoneProps = {
  file: File | null;
  onFile: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
};

// Vercel's serverless functions cap request bodies at ~4.5MB regardless of
// Next.js config, so we reject oversized files here instead of letting the
// upload fail with an opaque 413 from the platform.
const MAX_SIZE_MB = 4;

/**
 * Generic file dropzone with a rounded SVG dashed border that hugs the
 * corners (a plain CSS dashed border can't follow border-radius cleanly).
 */
export default function Dropzone({
  file,
  onFile,
  accept = "application/pdf",
  disabled = false,
}: DropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(f: File | null | undefined) {
    if (disabled) return;
    if (!f) {
      setError("");
      return onFile(null);
    }
    if (accept && !f.type.match(accept.replace("*", ".*"))) {
      setError("Unsupported file type — upload a PDF.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File exceeds size limit: max ${MAX_SIZE_MB}MB.`);
      return;
    }
    setError("");
    onFile(f);
  }

  return (
    <div
      className={`relative rounded-3xl transition-transform ${dragging ? "dash-active scale-[1.01]" : ""} ${disabled ? "opacity-60" : ""}`}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
    >
      {/* Rounded dashed border overlay. Inset via CSS on the <svg> (not a
          calc() SVG attribute — some browsers, e.g. Safari, reject calc()
          in presentation attributes) so the rect itself can use plain,
          universally-valid percentage values. */}
      <svg className="pointer-events-none absolute inset-[1.5px] h-[calc(100%-3px)] w-[calc(100%-3px)]" fill="none" aria-hidden>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx="22"
          ry="22"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="8 8"
          className={`dash-rect ${dragging ? "text-accent" : "text-ink/20"}`}
        />
      </svg>

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-3xl bg-white/55 px-8 py-14 text-center backdrop-blur transition-colors hover:bg-white/80 disabled:cursor-not-allowed"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        {file ? (
          <div className="space-y-2">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-xl text-accent">✓</div>
            <p className="font-semibold text-ink">{file.name}</p>
            <p className="text-sm text-muted">{(file.size / 1024 / 1024).toFixed(1)} MB · ready to analyze</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ink/5 text-xl text-ink">↑</div>
            <p className="text-lg font-semibold text-ink">Drop your pitch deck</p>
            <p className={`text-sm ${error ? "text-red-600" : "text-muted"}`}>
              {error || `PDF · up to ${MAX_SIZE_MB}MB · click or drag`}
            </p>
          </div>
        )}
      </button>
    </div>
  );
}
