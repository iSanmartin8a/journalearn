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

  return (
    <div className="relative max-w-2xl w-full bg-card p-4 rounded-lg border border-border">
      {/* Nota arriba a la derecha */}
      <div className="absolute top-3 right-3 text-sm font-mono text-theme-title">
        {result.score ?? 0}/10
      </div>

      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-theme-title">Correction</h3>
        <p className="text-sm text-theme-label">
          Detected language: {result.language ?? "unknown"}
        </p>
      </div>

      {/* Texto corregido (HTML) con scroll */}
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-theme-label mb-2">
          Corrected entry
        </h4>

        <div
          className="
            max-h-[320px]
            overflow-auto
            rounded-md
            border
            border-border
            p-3
            prose
            max-w-full
            text-theme-label
          "
          dangerouslySetInnerHTML={{
            __html: result.corrected_html ?? "",
          }}
        />
      </div>

      {/* Feedback global */}
      {result.overall_feedback && (
        <div className="mt-4 p-3 rounded-md bg-muted text-sm text-theme-label">
          {result.overall_feedback}
        </div>
      )}
    </div>
  );
}
