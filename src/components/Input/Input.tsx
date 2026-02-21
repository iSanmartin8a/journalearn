/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import RandomReveal from "@/components/RandomReveal/RandomReveal";

type InputProps = {
  onTextChange: (text: string) => void;
  uiMessages: {
    LABEL: string;
    PLACEHOLDER: string;
    MINIMUN: string;
    GOOD: string;
    SUBMIT: string;
    SHORTCUT: string;
    OR: string;
    PROCESSING?: string;
    ERROR_AI_SERVICE?: string;
    ERROR_SERVICE_EVAL?: string;
    ERROR_NETWORK?: string;
  };
  initialValue?: string;
  onSubmitResult?: (result: any) => void;
};

export default function Input({
  onTextChange,
  uiMessages,
  initialValue,
  onSubmitResult,
}: InputProps) {
  const [value, setValue] = useState(initialValue ?? "");
  const [labelText, setLabelText] = useState(
    uiMessages?.LABEL ?? "Write your message below."
  );
  const [helperStatic, setHelperStatic] = useState(
    uiMessages?.MINIMUN ?? "Minimum 400 characters"
  );
  const [goodStatic, setGoodStatic] = useState(
    uiMessages?.GOOD ?? "All good! ✅"
  );

  const minLength = 400;
  const isValid = value.length >= minLength;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = window.setTimeout(() => {
      if (mountedRef.current) {
        onTextChange(value);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [value, onTextChange]);

  useEffect(
    () => setLabelText(uiMessages?.LABEL ?? "Write your message below."),
    [uiMessages?.LABEL]
  );
  useEffect(
    () => setHelperStatic(uiMessages?.MINIMUN ?? "Minimum 400 characters"),
    [uiMessages?.MINIMUN]
  );
  useEffect(
    () => setGoodStatic(uiMessages?.GOOD ?? "All good! ✅"),
    [uiMessages?.GOOD]
  );

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (initialValue !== undefined && initialValue !== value) {
      setValue(initialValue);
    }
  }, [initialValue]);

  async function handleSubmit() {
    if (!isValid || loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/check_journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: value }),
      });

      const payload = await res.json();

      if (!res.ok) {
        console.error("check_journal error:", payload);
        setError(payload?.error ?? uiMessages?.ERROR_AI_SERVICE ?? "AI service error");

        onSubmitResult?.({
          language: "unknown",
          score: 0,
          corrected_html: `<p>${value}</p>`,
          paragraph_feedback: [],
          overall_feedback:
            uiMessages?.ERROR_SERVICE_EVAL ?? "The text could not be evaluated due to a service error.",
          __raw: payload,
        });
        return;
      }

      const result = payload?.result ?? payload;
      onSubmitResult?.(result);
    } catch (err: any) {
      console.error("Network or unexpected error:", err);
      setError(err?.message ?? String(err));

      onSubmitResult?.({
        language: "unknown",
        score: 0,
        corrected_html: `<p>${value}</p>`,
        paragraph_feedback: [],
        overall_feedback: uiMessages?.ERROR_NETWORK ?? "A network error occurred. Please try again.",
        __raw: err,
      });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  const processingMessage = uiMessages?.PROCESSING ?? "Processing...";

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Label */}
      <label
        htmlFor="message"
        className="text-sm font-medium"
        style={{ color: "var(--theme-label)" }}
      >
        <RandomReveal text={labelText} speed={10} />
      </label>

      {/* Textarea */}
      <textarea
        id="message"
        placeholder={uiMessages?.PLACEHOLDER ?? "Type your message here."}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        rows={7}
        className="w-full resize-none rounded-xl px-4 py-3 text-sm leading-relaxed outline-none transition-all duration-200 disabled:opacity-50 sm:rows-9"
        style={{
          background: "transparent",
          border: "1px solid var(--theme-border)",
          color: "var(--theme-label)",
          caretColor: "var(--theme-valid)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = isValid
            ? "var(--theme-valid)"
            : "var(--theme-placeholder)";
          e.currentTarget.style.boxShadow = isValid
            ? "0 0 0 3px var(--theme-glow)"
            : "none";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--theme-border)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />

      {/* Footer row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {/* Status + counter */}
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="text-xs transition-colors duration-300 truncate"
            style={{ color: isValid ? "var(--theme-valid)" : "var(--theme-placeholder)" }}
          >
            <RandomReveal text={isValid ? goodStatic : helperStatic} speed={18} />
          </span>
          <span
            className="text-xs font-mono tabular-nums flex-shrink-0 transition-colors duration-300"
            style={{ color: isValid ? "var(--theme-valid)" : "var(--theme-placeholder)" }}
          >
            {value.length}/{minLength}
          </span>
        </div>

        {/* Submit area */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0">
          <span className="text-xs" style={{ color: "var(--theme-placeholder)" }}>
            {uiMessages?.SHORTCUT ?? "Ctrl + Enter"}
          </span>
          <span className="text-xs hidden sm:block" style={{ color: "var(--theme-placeholder)" }}>
            {uiMessages?.OR?.toLowerCase() ?? "or"}
          </span>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || loading}
            size="sm"
            className="flex items-center gap-2 rounded-lg text-xs font-semibold px-4 py-2 transition-all duration-200 disabled:opacity-40"
            style={{
              background: "var(--theme-button-background)",
              color: "var(--theme-button-text)",
            }}
          >
            {loading ? (
              <>
                <Spinner />
                {processingMessage}
              </>
            ) : (
              uiMessages?.SUBMIT ?? "Submit"
            )}
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-xs" style={{ color: "var(--theme-invalid)" }}>{error}</p>
      )}
    </div>
  );
}
