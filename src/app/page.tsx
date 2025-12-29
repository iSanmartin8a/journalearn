/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Input from "@/components/Input/Input";
import Title from "@/components/Title/Title";
import Result from "@/components/Result/Result";
import { UI_MESSAGES } from "@/utils/consts";

const DEBOUNCE_MS = 1200;
const COOLDOWN_MS = 30_000;

const MIN_CHARS = 50;
const BUCKET_SIZE = 125;
const CHECKPOINTS = [50, 250];
const MIN_CALL_INTERVAL_MS = 1500;

const THEME_STORAGE_KEY = "selected-theme-index";
const THEMES = ["theme-default", "theme-night"];

export default function Home() {
  const [themeIndex, setThemeIndex] = useState(() => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    const parsed = saved ? Number(saved) : 0;
    return parsed >= 0 && parsed < THEMES.length ? parsed : 0;
  });
  const [text, setText] = useState("");
  const [uiMessages, setUiMessages] = useState<any>(UI_MESSAGES);
  const [correctionResult, setCorrectionResult] = useState<any | null>(null);

  const debounceRef = useRef<number | null>(null);
  const lastBucketRef = useRef(0);
  const lastRequestAtRef = useRef(0);
  const pendingFetchControllerRef = useRef<AbortController | null>(null);
  const prevLenRef = useRef(0);

  /* 🎨 Aplicar tema al <html> */
  useEffect(() => {
    const html = document.documentElement;
    THEMES.forEach((t) => html.classList.remove(t));
    html.classList.add(THEMES[themeIndex]);
  }, [themeIndex]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, String(themeIndex));
  }, [themeIndex]);

  const rotateTheme = () => {
    setThemeIndex((prev) => (prev + 1) % THEMES.length);
  };

  /* 🌍 Llamada de traducción segura con AbortController */
  const doTranslateFetch = useCallback(async (currentText: string) => {
    const now = Date.now();
    if (pendingFetchControllerRef.current) {
      // abortar cualquier llamada pendiente
      pendingFetchControllerRef.current.abort();
    }
    if (now - lastRequestAtRef.current < MIN_CALL_INTERVAL_MS) return;

    const controller = new AbortController();
    pendingFetchControllerRef.current = controller;

    try {
      const res = await fetch("/api/translate_web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentText }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (data?.ui) setUiMessages(data.ui);
      lastRequestAtRef.current = Date.now();
    } catch (err: any) {
      if (err.name === "AbortError") return; // llamada cancelada
      console.error("translate fetch error", err);
    } finally {
      // limpiar el controlador actual
      pendingFetchControllerRef.current = null;
    }
  }, []);

  /* Evalúa si llamar ahora (cruces de checkpoints o buckets) */
  const evaluateAndMaybeFetchImmediate = useCallback(
    (currentText: string) => {
      const len = currentText.length;
      const prev = prevLenRef.current;
      const now = Date.now();

      if (len < MIN_CHARS) {
        lastBucketRef.current = 0;
        if (pendingFetchControllerRef.current) {
          pendingFetchControllerRef.current.abort();
          pendingFetchControllerRef.current = null;
        }
        return;
      }

      const crossedCheckpoint = CHECKPOINTS.some(
        (cp) => prev < cp && len >= cp
      );

      const bucket = Math.floor(len / BUCKET_SIZE);
      const crossedNewBucket = bucket > lastBucketRef.current;

      const cooldownPassed = now - lastRequestAtRef.current > COOLDOWN_MS;

      if ((crossedCheckpoint || crossedNewBucket || cooldownPassed) &&
          now - lastRequestAtRef.current > MIN_CALL_INTERVAL_MS) {
        lastBucketRef.current = bucket;
        doTranslateFetch(currentText);
      }
    },
    [doTranslateFetch]
  );

  /* Debounce de "reposo" */
  const scheduleDebouncedEvaluation = useCallback(
    (currentText: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        if (currentText.length >= MIN_CHARS) {
          doTranslateFetch(currentText);
        }
      }, DEBOUNCE_MS);
    },
    [doTranslateFetch]
  );

  /* Efecto que reacciona al texto en tiempo real */
  useEffect(() => {
    const len = text.length;
    evaluateAndMaybeFetchImmediate(text);
    scheduleDebouncedEvaluation(text);
    prevLenRef.current = len;
  }, [text, evaluateAndMaybeFetchImmediate, scheduleDebouncedEvaluation]);

  return (
    <div className="min-h-screen bg-[var(--theme-background)] text-[var(--theme-label)] transition-colors duration-500 flex flex-col items-center justify-around p-8">
      <div className="mb-8 cursor-pointer select-none" onClick={rotateTheme}>
        <Title title={uiMessages.TITLE} tooltip={uiMessages.TOOLTIP} />
      </div>

      <div className="w-full max-w-2xl">
        {!correctionResult ? (
          <Input
            onTextChange={setText}
            uiMessages={uiMessages}
            onSubmitResult={(res) => setCorrectionResult(res)}
          />
        ) : (
          <Result result={correctionResult} />
        )}
      </div>
    </div>
  );
}
