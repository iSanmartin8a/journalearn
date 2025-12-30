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
const ENTRIES_STORAGE_KEY = "journal-entries";
const STREAK_STORAGE_KEY = "journal-days";

const THEMES = ["theme-default", "theme-night"];

const todayKey = () => new Date().toISOString().slice(0, 10);

export default function Home() {
  const [themeIndex, setThemeIndex] = useState(0);
  const [text, setText] = useState("");
  const [uiMessages, setUiMessages] = useState<any>(UI_MESSAGES);
  const [correctionResult, setCorrectionResult] = useState<any | null>(null);
  const [sentToday, setSentToday] = useState(false);
  const [streak, setStreak] = useState(0);

  const hasCalledAt25Ref = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);

  /* 🎨 Restaurar tema */
  useEffect(() => {
    (async () => {
      const savedTheme = await storage.get<number>(THEME_STORAGE_KEY);
      if (typeof savedTheme === "number") setThemeIndex(savedTheme);
    })();
  }, []);

  /* 🎨 Aplicar tema */
  useEffect(() => {
    const html = document.documentElement;
    THEMES.forEach((t) => html.classList.remove(t));
    html.classList.add(THEMES[themeIndex]);
    storage.set(THEME_STORAGE_KEY, themeIndex);
  }, [themeIndex]);

  const rotateTheme = () => setThemeIndex((prev) => (prev + 1) % THEMES.length);

  /* ♻️ Restaurar draft, resultado y racha */
  useEffect(() => {
    (async () => {
      const today = todayKey();

      // Draft
      const savedText = await storage.get<string>(DRAFT_STORAGE_KEY);
      if (savedText) {
        setText(savedText);
        if (savedText.length >= MIN_CHARS) hasCalledAt25Ref.current = true;
      }

      // Entradas guardadas
      const entries =
        (await storage.get<Record<string, any>>(ENTRIES_STORAGE_KEY)) ?? {};
      const todayEntry = entries[today];
      if (todayEntry) {
        setCorrectionResult(todayEntry.result);
        setSentToday(true);
      }

      // Racha
      const days = (await storage.get<string[]>(STREAK_STORAGE_KEY)) ?? [];
      setStreak(days.length);
    })();
  }, []);

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

    if (len < MIN_CHARS) hasCalledAt25Ref.current = false;

    if (len >= MIN_CHARS && !hasCalledAt25Ref.current) {
      hasCalledAt25Ref.current = true;
      doTranslateFetch(text);
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      storage.set(DRAFT_STORAGE_KEY, text);
    }, 500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [text, doTranslateFetch]);

  /* 📝 Submit final */
  const handleSubmitResult = useCallback(
    async (result: any) => {
      const today = todayKey();

      // guardar entrada
      const entries =
        (await storage.get<Record<string, any>>(ENTRIES_STORAGE_KEY)) ?? {};
      entries[today] = { date: today, text, result, createdAt: Date.now() };
      await storage.set(ENTRIES_STORAGE_KEY, entries);

      // actualizar racha
      const days = (await storage.get<string[]>(STREAK_STORAGE_KEY)) ?? [];
      if (!days.includes(today)) {
        days.push(today);
        days.sort();
        await storage.set(STREAK_STORAGE_KEY, days);
      }
      setStreak(days.length);

      // limpiar draft
      await storage.remove(DRAFT_STORAGE_KEY);
      hasCalledAt25Ref.current = false;
      setText("");

      // mostrar resultado
      setCorrectionResult(result);
      setSentToday(true);
    },
    [text]
  );

  const percent = sentToday
    ? 100
    : Math.min(100, Math.round((text.length / TARGET) * 100));

  const progressColor = sentToday
    ? "var(--theme-valid)"
    : text.length >= TARGET
    ? "var(--theme-valid)"
    : "var(--theme-button-background)";

  return (
    <div className="min-h-screen bg-[var(--theme-background)] text-[var(--theme-label)] transition-colors duration-500 flex flex-col items-center justify-around p-8">
      <div className="mb-8 cursor-pointer select-none" onClick={rotateTheme}>
        <Title title={uiMessages.TITLE} tooltip={uiMessages.TOOLTIP} />

        <div className="mt-2 flex justify-center items-center gap-2">
          <div className="w-[14ch]">
            <div className="h-1 bg-[var(--theme-placeholder)] rounded overflow-hidden">
              <div
                className="h-full rounded transition-all duration-300"
                style={{ width: `${percent}%`, background: progressColor }}
              />
            </div>
          </div>

          {/* Badge con la racha */}
          {streak > 0 && (
            <div className="ml-2 px-2 py-0.5 rounded-full bg-[var(--theme-valid)] text-black text-xs font-semibold">
              🔥 {streak} {streak === 1 ? "día" : "días"}
            </div>
          )}
        </div>
      </div>

      <div className="w-full max-w-2xl h-[480px]">
        {!correctionResult || !sentToday ? (
          <Input
            initialValue={text}
            onTextChange={setText}
            uiMessages={uiMessages}
            onSubmitResult={handleSubmitResult}
          />
        ) : (
          <Result result={correctionResult} />
        )}
      </div>
    </div>
  );
}
