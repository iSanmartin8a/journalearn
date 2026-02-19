"use client";

import { useState, useEffect, useRef } from "react";

type UiMessages = {
  DAY_NO_JOURNAL: string;
  DAY_PAST_RESULT_TITLE: string;
  [key: string]: string;
};

type DayStripProps = {
  journaledDays: Set<string>;
  entries: Record<string, { result: unknown; date: string }>;
  uiMessages: UiMessages;
  onDayResult: (result: unknown, date: string) => void;
};

function getDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getDayLabel(date: Date): string {
  return date.toLocaleDateString("es-ES", { weekday: "short" }).slice(0, 2).toUpperCase();
}

function getDayNumber(date: Date): number {
  return date.getDate();
}

export default function DayStrip({ journaledDays, entries, uiMessages, onDayResult }: DayStripProps) {
  const [toast, setToast] = useState<string | null>(null);
  const lastToastRef = useRef<string>("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = getDateKey(today);

  const days: Date[] = [];
  for (let i = -3; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }

  function handleClick(d: Date, key: string, isFuture: boolean, hasEntry: boolean) {
    if (isFuture || key === todayKey) return;
    if (hasEntry) {
      onDayResult(entries[key].result, key);
    } else {
      lastToastRef.current = uiMessages.DAY_NO_JOURNAL;
      setToast(uiMessages.DAY_NO_JOURNAL);
    }
  }

  return (
    <div className="relative flex flex-col items-center sm:items-end gap-2 animate-fadein">
      {/* Toast */}
      <div
        className="absolute -top-7 left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 z-20 pointer-events-none transition-opacity duration-300"
        style={{ opacity: toast ? 1 : 0 }}
      >
        <span
          className="whitespace-nowrap text-[10px] px-2.5 py-1 rounded-lg font-medium"
          style={{
            background: "var(--theme-button-background)",
            color: "var(--theme-button-text)",
          }}
        >
          {lastToastRef.current}
        </span>
      </div>

      {/* Strip */}
      <div className="relative flex items-end gap-4 sm:gap-3 overflow-hidden px-2">
        {/* fade left */}
        <div
          className="pointer-events-none absolute left-0 top-0 h-full w-6 z-10"
          style={{ background: "linear-gradient(to right, var(--theme-surface), transparent)" }}
        />
        {/* fade right */}
        <div
          className="pointer-events-none absolute right-0 top-0 h-full w-6 z-10"
          style={{ background: "linear-gradient(to left, var(--theme-surface), transparent)" }}
        />

        {days.map((d) => {
          const key = getDateKey(d);
          const isToday = key === todayKey;
          const hasEntry = journaledDays.has(key);
          const isFuture = d > today;
          const isClickable = !isFuture && !isToday;

          return (
            <button
              key={key}
              onClick={() => handleClick(d, key, isFuture, hasEntry)}
              disabled={!isClickable}
              className="flex flex-col items-center gap-1 focus:outline-none transition-opacity duration-200"
              style={{
                opacity: isFuture ? 0.25 : isToday ? 1 : 0.7,
                transform: isToday ? "scale(1.15)" : "scale(1)",
                cursor: isClickable ? "pointer" : "default",
                WebkitTapHighlightColor: "transparent",
              }}
              onMouseEnter={(e) => { if (isClickable) e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={(e) => { if (isClickable) e.currentTarget.style.opacity = "0.7"; }}
            >
              {/* Day label */}
              <span
                className="text-[8px] font-semibold tracking-widest uppercase"
                style={{
                  color: isToday
                    ? "var(--theme-placeholder)"
                    : hasEntry && !isFuture
                    ? "var(--theme-valid)"
                    : "var(--theme-placeholder)",
                }}
              >
                {getDayLabel(d)}
              </span>

              {/* Day number */}
              <span
                className="text-xs font-semibold leading-none"
                style={{
                  color: isToday
                    ? "var(--theme-title)"
                    : hasEntry && !isFuture
                    ? "var(--theme-valid)"
                    : "var(--theme-placeholder)",
                }}
              >
                {getDayNumber(d)}
              </span>

              {/* Dot indicator */}
              <div
                className="rounded-full transition-all duration-300"
                style={{
                  width: isToday ? "16px" : "4px",
                  height: "2px",
                  background: hasEntry
                    ? "var(--theme-valid)"
                    : isToday
                    ? "var(--theme-border)"
                    : "transparent",
                  opacity: isFuture ? 0 : 1,
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
