/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Input from "@/components/Input/Input";
import Title from "@/components/Title/Title";
import Result from "@/components/Result/Result";
import DayStrip from "@/components/DayStrip/DayStrip";
import { UI_MESSAGES } from "@/utils/consts";
import { storage } from "@/utils/indexed";
import { Analytics } from "@vercel/analytics/next"

const MIN_CHARS = 25;
const TARGET = 400;

const THEME_STORAGE_KEY = "selected-theme-index";
const DRAFT_STORAGE_KEY = "journal-text";
const ENTRIES_STORAGE_KEY = "journal-entries";
const STREAK_STORAGE_KEY = "journal-days";

const THEMES = ["theme-default", "theme-night", "theme-ocean"];

const pad2 = (n: number) => String(n).padStart(2, "0");

function getLocalDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseLocalDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map((v) => Number(v));
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

const todayKey = () => getLocalDateKey(new Date());

function calcStreak(days: string[]): number {
  if (days.length === 0) return 0;
  const sorted = [...days].sort();
  const today = todayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateKey(yesterday);
  const last = sorted[sorted.length - 1];
  if (last !== today && last !== yesterdayStr) return 0;
  let streak = 1;
  for (let i = sorted.length - 1; i > 0; i--) {
    const curr = parseLocalDateKey(sorted[i]);
    const prev = parseLocalDateKey(sorted[i - 1]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export default function Home() {
  const [themeIndex, setThemeIndex] = useState(0);
  const [text, setText] = useState("");
  const [uiMessages, setUiMessages] = useState<any>(UI_MESSAGES);
  const [correctionResult, setCorrectionResult] = useState<any | null>(null);
  const [sentToday, setSentToday] = useState(false);
  const [streak, setStreak] = useState(0);
  const [journaledDays, setJournaledDays] = useState<Set<string>>(new Set());
  const [entries, setEntries] = useState<Record<string, any>>({});
  const [pastResult, setPastResult] = useState<{ result: any; date: string } | null>(null);

  const hasCalledAt25Ref = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);
  const doTranslateFetchRef = useRef<(t: string) => void>(() => { });

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
      const rawEntries =
        (await storage.get<Record<string, any>>(ENTRIES_STORAGE_KEY)) ?? {};

      const normalizedEntries: Record<string, any> = {};
      for (const [key, value] of Object.entries(rawEntries)) {
        const dateKey = value?.date ?? key;
        normalizedEntries[dateKey] = value;
      }

      setEntries(normalizedEntries);
      setJournaledDays(new Set(Object.keys(normalizedEntries)));

      const todayEntry = normalizedEntries[today] ?? rawEntries[today];
      if (todayEntry) {
        setCorrectionResult(todayEntry.result);
        setSentToday(true);
      }

      // Racha
      const days = (await storage.get<string[]>(STREAK_STORAGE_KEY)) ?? [];
      setStreak(calcStreak(days));
    })();
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const params = new URLSearchParams(window.location.search);
    const seed = params.get("seed");
    if (!seed) return;

    (async () => {
      const existing = (await storage.get<Record<string, any>>(ENTRIES_STORAGE_KEY)) ?? {};
      if (Object.keys(existing).length > 0 && seed !== "force") return;

      const mkKey = (offsetDays: number) => {
        const d = new Date();
        d.setDate(d.getDate() - offsetDays);
        return getLocalDateKey(d);
      };

      const makeEntry = (date: string, score: number) => ({
        date,
        text: `Seed entry for ${date}`,
        createdAt: Date.now(),
        result: {
          language: "en",
          score,
          corrected_html: `<p><strong>Seed</strong> correction for <em>${date}</em>.</p>`,
          overall_feedback: "Seeded feedback to test past-day overlay.",
        },
      });

      const seeded: Record<string, any> = {
        [mkKey(3)]: makeEntry(mkKey(3), 6),
        [mkKey(2)]: makeEntry(mkKey(2), 7),
        [mkKey(1)]: makeEntry(mkKey(1), 8),
      };

      await storage.set(ENTRIES_STORAGE_KEY, seeded);

      const days = Object.keys(seeded).sort();
      await storage.set(STREAK_STORAGE_KEY, days);

      setEntries(seeded);
      setJournaledDays(new Set(Object.keys(seeded)));
      setStreak(calcStreak(days));
      setCorrectionResult(null);
      setSentToday(false);
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

  useEffect(() => {
    doTranslateFetchRef.current = doTranslateFetch;
  }, [doTranslateFetch]);

  /* 🧠 Checkpoint 25 + autosave */
  useEffect(() => {
    const len = text.length;

    if (len < MIN_CHARS) {
      hasCalledAt25Ref.current = false;
    } else if (!hasCalledAt25Ref.current) {
      hasCalledAt25Ref.current = true;
      doTranslateFetchRef.current(text);
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      storage.set(DRAFT_STORAGE_KEY, text);
    }, 500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [text]);

  /* 📝 Submit final */
  const handleSubmitResult = useCallback(
    async (result: any) => {
      const today = todayKey();

      // guardar entrada
      const entries =
        (await storage.get<Record<string, any>>(ENTRIES_STORAGE_KEY)) ?? {};
      entries[today] = { date: today, text, result, createdAt: Date.now() };
      await storage.set(ENTRIES_STORAGE_KEY, entries);
      const normalizedEntries: Record<string, any> = {};
      for (const [key, value] of Object.entries(entries)) {
        const dateKey = value?.date ?? key;
        normalizedEntries[dateKey] = value;
      }
      setEntries(normalizedEntries);
      setJournaledDays(new Set(Object.keys(normalizedEntries)));

      // actualizar racha
      let days = (await storage.get<string[]>(STREAK_STORAGE_KEY)) ?? [];
      if (!days.includes(today)) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = getLocalDateKey(yesterday);
        const lastDay = days.length > 0 ? days[days.length - 1] : null;
        if (lastDay !== null && lastDay !== yesterdayKey && lastDay !== today) {
          days = [];
        }
        days.push(today);
        days.sort();
        await storage.set(STREAK_STORAGE_KEY, days);
      }
      setStreak(calcStreak(days));

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
    <div
      className="min-h-screen transition-colors duration-500 flex flex-col items-center justify-center sm:p-8"
      style={{ background: "var(--theme-background)" }}
    >
      <div
        className="w-full max-w-2xl flex flex-col gap-5 sm:rounded-2xl p-5 sm:p-8 transition-colors duration-500 min-h-screen sm:min-h-0"
        style={{
          background: "var(--theme-surface)",
          borderLeft: "none",
          borderRight: "none",
          borderTop: "none",
          borderBottom: "none",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.04)",
        }}
      >
        {/* ── Header ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: title + progress */}
          <div
            className="flex flex-row items-center justify-between sm:flex-col sm:items-start sm:gap-2 cursor-pointer select-none"
            onClick={rotateTheme}
          >
            <Title title={uiMessages.TITLE} tooltip={uiMessages.TOOLTIP} />

            {/* Progress + streak */}
            <div className="flex items-center gap-3">
              <div className="h-0.5 rounded-full overflow-hidden font-mono" style={{ width: "11ch", background: "var(--theme-border)" }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${percent}%`, background: progressColor }}
                />
              </div>
              {streak > 0 && (
                <span
                  className="text-[11px] font-semibold tracking-wide px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--theme-glow)",
                    color: "var(--theme-valid)",
                    border: "1px solid var(--theme-valid)",
                  }}
                >
                  🔥 {streak}
                </span>
              )}
            </div>
          </div>

          {/* DayStrip — full width on mobile, right-aligned on desktop */}
          <div className="flex justify-center sm:justify-end sm:pt-1">
            <DayStrip
              key={themeIndex}
              journaledDays={journaledDays}
              entries={entries}
              uiMessages={uiMessages}
              onDayResult={(result, date) => setPastResult({ result, date })}
            />
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px" style={{ background: "var(--theme-border)" }} />

        {/* ── Main content ── */}
        <div className="w-full">
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

      {/* ── Past day result overlay ── */}
      {pastResult && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ background: "color-mix(in srgb, var(--theme-background) 80%, transparent)" }}
          onClick={() => setPastResult(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-auto sm:rounded-2xl rounded-t-2xl p-5 sm:p-6"
            style={{
              background: "var(--theme-surface)",
              border: "1px solid var(--theme-border)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium tracking-wide uppercase" style={{ color: "var(--theme-placeholder)" }}>
                {uiMessages.DAY_PAST_RESULT_TITLE} · {pastResult.date}
              </span>
              <button
                onClick={() => setPastResult(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full text-xs transition-opacity hover:opacity-60"
                style={{ color: "var(--theme-placeholder)", border: "1px solid var(--theme-border)" }}
              >
                ✕
              </button>
            </div>
            <Result result={pastResult.result} />
          </div>
        </div>
      )}

      <Analytics/>
    </div>
  );
}
