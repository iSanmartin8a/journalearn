// components/Correction/CorrectionResult.tsx
"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type CorrectionResultProps = {
  result: {
    language?: string;
    corrected_markdown?: string;
    corrections?: Array<{
      original?: string;
      suggestion?: string;
      type?: string;
      explanation?: string;
      notes?: string;
    }>;
    summary?: string;
  } | null;
};

export default function CorrectionResult({ result }: CorrectionResultProps) {
  if (!result) return null;

  return (
    <div className="max-w-2xl w-full bg-card p-4 rounded-lg border border-border">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-theme-title">Correction</h3>
        <p className="text-sm text-theme-label">
          Detected language: {result.language ?? "unknown"}
        </p>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-theme-label mb-2">
          Corrected entry
        </h4>
        <div className="prose max-w-full">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {result.corrected_markdown ?? ""}
          </ReactMarkdown>
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-semibold text-theme-label mb-2">Summary</h4>
        <p className="text-sm text-theme-label">{result.summary ?? "-"}</p>
      </div>

      {result.corrections && result.corrections.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-theme-label mb-2">
            Corrections
          </h4>
          <ul className="space-y-3">
            {result.corrections.map((c, i) => (
              <li key={i} className="p-2 border border-border rounded">
                <div className="text-sm">
                  <strong>Original:</strong> {c.original}
                </div>
                <div className="text-sm">
                  <strong>Suggestion:</strong> {c.suggestion}
                </div>
                <div className="text-sm">
                  <strong>Type:</strong> {c.type}
                </div>
                <div className="text-sm text-theme-label mt-1">
                  {c.explanation}
                </div>
                {c.notes && (
                  <div className="text-sm text-theme-label mt-1 italic">
                    {c.notes}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
