/* eslint-disable @typescript-eslint/no-explicit-any */
// components/Input/Input.tsx
"use client";

import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import RandomReveal from "@/components/RandomReveal/RandomReveal";

type InputProps = {
  onTextChange: (text: string) => void;
  uiMessages: {
    LABEL: string;
    PLACEHOLDER: string;
    MINIMUN: string;
    GOOD: string;
    SUBMIT: string;
  };
  onSubmitResult?: (result: any) => void; // callback con el objeto devuelto por la IA
};

export default function Input({ onTextChange, uiMessages, onSubmitResult }: InputProps) {
  const [value, setValue] = useState("");
  const [labelText, setLabelText] = useState(uiMessages?.LABEL ?? "Write your message below.");
  const [helperStatic, setHelperStatic] = useState(uiMessages?.MINIMUN ?? "Minimum 400 characters");
  const [goodStatic, setGoodStatic] = useState(uiMessages?.GOOD ?? "All good! ✅");

  const minLength = 400;
  const isValid = value.length >= minLength;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Emitir texto al padre
  useEffect(() => {
    onTextChange(value);
  }, [value, onTextChange]);

  // Actualizar textos cuando uiMessages cambian (solo idioma)
  useEffect(() => {
    setLabelText(uiMessages?.LABEL ?? "Write your message below.");
  }, [uiMessages?.LABEL]);

  useEffect(() => {
    setHelperStatic(uiMessages?.MINIMUN ?? "Minimum 400 characters");
  }, [uiMessages?.MINIMUN]);

  useEffect(() => {
    setGoodStatic(uiMessages?.GOOD ?? "All good! ✅");
  }, [uiMessages?.GOOD]);

  async function handleSubmit() {
    if (!isValid) return;
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
        // si la API devuelve error optamos por mostrar mensaje
        console.error("check_journal error:", payload);
        setError(payload?.error ?? "AI service error");
        // también podemos pasar fallback al padre
        onSubmitResult?.({
          language: "unknown",
          corrected_markdown: value,
          corrections: [],
          summary: "Service returned an error.",
          __raw: payload,
        });
      } else {
        // payload.result es la estructura esperada por el endpoint anterior
        const result = payload?.result ?? payload;
        onSubmitResult?.(result);
      }
    } catch (err: any) {
      console.error("Network or unexpected error:", err);
      setError(err?.message ?? String(err));
      onSubmitResult?.({
        language: "unknown",
        corrected_markdown: value,
        corrections: [],
        summary: "Network error or unexpected error.",
        __raw: err,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid w-full gap-3">
      <Label htmlFor="message" className="text-theme-label">
        <RandomReveal text={labelText} speed={10} />
      </Label>

      <Textarea
        id="message"
        placeholder={uiMessages?.PLACEHOLDER ?? "Type your message here."}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className={`
          !h-60 bg-transparent text-theme-label placeholder:text-theme-placeholder
          ${isValid ? "border-theme-valid" : "border-theme-invalid"}
        `}
      />

      <div className={`text-sm ${isValid ? "text-theme-valid" : "text-theme-invalid"}`}>
        {isValid ? (
          <RandomReveal text={goodStatic} speed={18} />
        ) : (
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <RandomReveal text={helperStatic} speed={18} />
            </div>
            <div className="ml-4 flex-shrink-0 font-mono">
              {value.length}/{minLength}
            </div>
          </div>
        )}
      </div>

      {error && <div className="text-sm text-theme-invalid mt-1">{error}</div>}

      <div className="flex justify-end">
        <Button
          disabled={!isValid || loading}
          onClick={handleSubmit}
          className={`
            px-6 py-2 font-bold rounded-md shadow-lg transition-colors
            ${isValid ? "bg-theme-button text-white hover:opacity-90" : "bg-theme-muted text-theme-label opacity-50 cursor-not-allowed"}
          `}
        >
          {loading ? "Checking..." : (uiMessages?.SUBMIT ?? "Submit")}
        </Button>
      </div>
    </div>
  );
}
