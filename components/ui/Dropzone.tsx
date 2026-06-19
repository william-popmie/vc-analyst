"use client";

import { useRef, useState } from "react";

type DropzoneProps = {
  file: File | null;
  onFile: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
};

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
  const inputRef = useRef<HTMLInputElement>(null);

  function pick(f: File | null | undefined) {
    if (disabled) return;
    if (!f) return onFile(null);
    if (accept && !f.type.match(accept.replace("*", ".*"))) return;
    onFile(f);
  }

  return (
    <div
      className={`relative rounded-3xl transition-transform ${dragging ? "dash-active scale-[1.01]" : ""} ${disabled ? "opacity-60" : ""}`}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
    >
      {/* Rounded dashed border overlay */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" fill="none" aria-hidden>
        <rect
          x="1.5"
          y="1.5"
          width="calc(100% - 3px)"
          height="calc(100% - 3px)"
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
            <p className="text-sm text-muted">PDF · up to 20MB · click or drag</p>
          </div>
        )}
      </button>
    </div>
  );
}
