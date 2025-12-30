/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Input from "@/components/Input/Input";
import Title from "@/components/Title/Title";
import Result from "@/components/Result/Result";
import { UI_MESSAGES } from "@/utils/consts";
import { storage } from "@/utils/indexed";

const MIN_CHARS = 25;
const TARGET = 400;

const THEME_STORAGE_KEY = "selected-theme-index";
const DRAFT_STORAGE_KEY = "journal-text";
const RESULT_STORAGE_KEY = "journal-result";

const THEMES = ["theme-default", "theme-night"];

export default function Home() {
  const [themeIndex, setThemeIndex] = useState(0);
  const [text, setText] = useState("");
  const [uiMessages, setUiMessages] = useState<any>(UI_MESSAGES);
  const [correctionResult, setCorrectionResult] = useState<any | null>(null);

  // control del checkpoint
  const hasCalledAt25Ref = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);

  /* 🎨 Tema */
  useEffect(() => {
    (async () => {
      const savedTheme = await storage.get<number>(THEME_STORAGE_KEY);
      if (typeof savedTheme === "number") {
        setThemeIndex(savedTheme);
      }
    })();
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    THEMES.forEach((t) => html.classList.remove(t));
    html.classList.add(THEMES[themeIndex]);
    storage.set(THEME_STORAGE_KEY, themeIndex);
  }, [themeIndex]);

  const rotateTheme = () => {
    setThemeIndex((prev) => (prev + 1) % THEMES.length);
  };

  /* ♻️ Restaurar draft + resultado */
  useEffect(() => {
    (async () => {
      const savedText = await storage.get<string>(DRAFT_STORAGE_KEY);
      if (savedText) {
        setText(savedText);
        if (savedText.length >= MIN_CHARS) {
          hasCalledAt25Ref.current = true;
        }
      }

      const savedResult = await storage.get<any>(RESULT_STORAGE_KEY);
      if (savedResult) {
        setCorrectionResult(savedResult);
      }
    })();
  }, []);

  /* 💾 Guardar resultado */
  useEffect(() => {
    if (correctionResult) {
      storage.set(RESULT_STORAGE_KEY, correctionResult);
    } else {
      storage.remove(RESULT_STORAGE_KEY);
    }
  }, [correctionResult]);

  /* 🌍 translate_web */
  const doTranslateFetch = useCallback(async (currentText: string) => {
    try {
      const res = await fetch("/api/translate_web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentText }),
      });
      const data = await res.json();
      if (data?.ui) setUiMessages(data.ui);
    } catch (err) {
      console.error("translate fetch error", err);
    }
  }, []);

  /* 🧠 Checkpoint 25 + autosave */
  useEffect(() => {
    const len = text.length;

    // rearme
    if (len < MIN_CHARS) {
      hasCalledAt25Ref.current = false;
    }

    // cruce por 25
    if (len >= MIN_CHARS && !hasCalledAt25Ref.current) {
      hasCalledAt25Ref.current = true;
      doTranslateFetch(text);
    }

    // autosave debounce
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
      storage.set(DRAFT_STORAGE_KEY, text);
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [text, doTranslateFetch]);

  const percent = Math.min(100, Math.round((text.length / TARGET) * 100));

  return (
    <div className="min-h-screen bg-[var(--theme-background)] text-[var(--theme-label)] transition-colors duration-500 flex flex-col items-center justify-around p-8">
      <div className="mb-8 cursor-pointer select-none" onClick={rotateTheme}>
        <Title title={uiMessages.TITLE} tooltip={uiMessages.TOOLTIP} />

        {/* Progress bar tipo subrayado */}
        <div className="mt-2 flex justify-center">
          <div className="w-[14ch]">
            <div className="h-1 bg-[var(--theme-placeholder)] rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-300"
                style={{
                  width: `${percent}%`,
                  background:
                    text.length >= TARGET
                      ? "var(--theme-valid)"
                      : "var(--theme-button-background)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-2xl">
        {!correctionResult ? (
          <Input
            initialValue={text}
            onTextChange={setText}
            uiMessages={uiMessages}
            onSubmitResult={setCorrectionResult}
          />
        ) : (
          <Result result={correctionResult} />
        )}
      </div>
    </div>
  );
}
