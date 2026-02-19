// components/Correction/CorrectionResult.tsx
"use client";

import React from "react";

type CorrectionResultProps = {
  result: {
    language?: string;
    score?: number;
    corrected_html?: string;
    paragraph_feedback?: string[];
    overall_feedback?: string;
  } | null;
};

export default function CorrectionResult({ result }: CorrectionResultProps) {
  if (!result) return null;

  const score = result.score ?? 0;
  const scoreColor =
    score >= 8 ? "var(--theme-valid)" :
    score >= 5 ? "var(--theme-button-background)" :
    "var(--theme-invalid)";

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* ── Score + language row ── */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--theme-placeholder)" }}>
            Correction
          </span>
          {result.language && (
            <span className="text-xs" style={{ color: "var(--theme-placeholder)" }}>
              {result.language}
            </span>
          )}
        </div>

        {/* Score badge */}
        <div
          className="flex items-baseline gap-0.5 px-3 py-1 rounded-xl"
          style={{
            border: `1px solid ${scoreColor}`,
            color: scoreColor,
          }}
        >
          <span className="text-2xl font-bold font-mono leading-none">{score}</span>
          <span className="text-xs font-medium" style={{ color: "var(--theme-placeholder)" }}>/10</span>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-px" style={{ background: "var(--theme-border)" }} />

      {/* ── Corrected text ── */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--theme-placeholder)" }}>
          Corrected entry
        </span>
        <div
          className="max-h-64 overflow-auto rounded-xl px-4 py-3 text-sm leading-relaxed"
          style={{
            background: "color-mix(in srgb, var(--theme-border) 40%, transparent)",
            color: "var(--theme-label)",
            border: "1px solid var(--theme-border)",
          }}
          dangerouslySetInnerHTML={{ __html: result.corrected_html ?? "" }}
        />
      </div>

      {/* ── Overall feedback ── */}
      {result.overall_feedback && (
        <div
          className="rounded-xl px-4 py-3 text-sm leading-relaxed"
          style={{
            background: "color-mix(in srgb, var(--theme-valid) 8%, transparent)",
            color: "var(--theme-label)",
            border: "1px solid color-mix(in srgb, var(--theme-valid) 25%, transparent)",
          }}
        >
          {result.overall_feedback}
        </div>
      )}
    </div>
  );
}
