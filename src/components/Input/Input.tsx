/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
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

  useEffect(() => onTextChange(value), [value, onTextChange]);
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
  useEffect(() => {
    if (initialValue !== undefined) {
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
        setError(payload?.error ?? "AI service error");

        onSubmitResult?.({
          language: "unknown",
          score: 0,
          corrected_html: `<p>${value}</p>`,
          paragraph_feedback: [],
          overall_feedback:
            "The text could not be evaluated due to a service error.",
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
        overall_feedback: "A network error occurred. Please try again.",
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
    <div className="grid w-full gap-3">
      <Label htmlFor="message" className="text-[var(--theme-label)]">
        <RandomReveal text={labelText} speed={10} />
      </Label>

      <Textarea
        id="message"
        placeholder={uiMessages?.PLACEHOLDER ?? "Type your message here."}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={loading}
        className={`
          !h-60 bg-[var(--theme-background)] text-[var(--theme-label)] placeholder:text-[var(--theme-placeholder)]
          border ${
            isValid
              ? "border-[var(--theme-valid)]"
              : "border-[var(--theme-invalid)]"
          }
        `}
      />

      {/* Contador y mensaje — siempre visible */}
      <div
        className={`flex justify-between items-center text-sm ${
          isValid ? "text-[var(--theme-valid)]" : "text-[var(--theme-invalid)]"
        }`}
      >
        <div className="flex-1">
          <RandomReveal text={isValid ? goodStatic : helperStatic} speed={18} />
        </div>

        <div className="ml-4 flex-shrink-0 font-mono">
          {value.length}/{minLength}
        </div>
      </div>

      {error && (
        <div className="text-sm text-[var(--theme-invalid)] mt-1">{error}</div>
      )}

      {/* Mensaje de atajo y botón */}
      <div className="flex flex-row items-center justify-end mt-2 gap-1 text-[var(--theme-title)]">
        <span className="text-xs text-[var(--theme-title)]">
          {uiMessages?.SHORTCUT ?? "Press Ctrl + Enter"}
        </span>

        <span className="text-xs text-[var(--theme-title)] opacity-70">
          {uiMessages?.OR.toLowerCase() ?? "or"}
        </span>

        <Button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          size="sm"
          className="flex items-center gap-2 bg-[var(--theme-button-background)] text-[var(--theme-button-text)] hover:opacity-90"
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
  );
}
