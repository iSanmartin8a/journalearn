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
const THEMES = [
  "theme-sand",
  "theme-night",
  "theme-forest",
  "theme-cosmic",
  "theme-sunrise",
  "theme-frost",
  "theme-sakura",
  "theme-neon",
  "theme-vintage",
  "theme-aurora",
];

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
  const pendingFetchRef = useRef(false);
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

  /* 🌍 Llamada de traducción (stable) */
  const doTranslateFetch = useCallback(async (currentText: string) => {
    // throttle: si hay petición pendiente o demasiado reciente, ignora
    const now = Date.now();
    if (pendingFetchRef.current) return;
    if (now - lastRequestAtRef.current < MIN_CALL_INTERVAL_MS) return;

    pendingFetchRef.current = true;
    try {
      const res = await fetch("/api/translate_web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: currentText }),
      });
      const data = await res.json();
      if (data?.ui) setUiMessages(data.ui);
      lastRequestAtRef.current = Date.now();
    } catch (err) {
      console.error("translate fetch error", err);
    } finally {
      // pequeña latencia para evitar llamadas back-to-back
      setTimeout(() => {
        pendingFetchRef.current = false;
      }, 300);
    }
  }, []);

  /* Evalúa si llamar ahora (cruces de checkpoints o buckets) */
  const evaluateAndMaybeFetchImmediate = useCallback(
    (currentText: string) => {
      const len = currentText.length;
      const prev = prevLenRef.current;
      const now = Date.now();

      // No procesar si por debajo del mínimo
      if (len < MIN_CHARS) {
        lastBucketRef.current = 0;
        return;
      }

      // 1) Checkpoints (50, 250 ...)
      const crossedCheckpoint = CHECKPOINTS.some(
        (cp) => prev < cp && len >= cp
      );

      // 2) Buckets
      const bucket = Math.floor(len / BUCKET_SIZE);
      const crossedNewBucket = bucket > lastBucketRef.current;

      // 3) cooldown global: si pasó suficiente tiempo desde la última request
      const cooldownPassed = now - lastRequestAtRef.current > COOLDOWN_MS;

      // Si cruzó checkpoint o bucket, y no hemos llamado muy recientemente -> llamar
      if (
        (crossedCheckpoint || crossedNewBucket || cooldownPassed) &&
        now - lastRequestAtRef.current > MIN_CALL_INTERVAL_MS
      ) {
        lastBucketRef.current = bucket;
        doTranslateFetch(currentText);
      }
    },
    [doTranslateFetch]
  );

  /* Debounce de "reposo" (cuando el usuario para de escribir) */
  const scheduleDebouncedEvaluation = useCallback(
    (currentText: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        // Al acabar la escritura, hacemos una llamada si cumple MIN_CHARS
        if (currentText.length >= MIN_CHARS) {
          doTranslateFetch(currentText);
        }
      }, DEBOUNCE_MS);
    },
    [doTranslateFetch]
  );

  /* Efecto que reacciona al texto en *tiempo real* */
  useEffect(() => {
    const len = text.length;
    // 1) evaluar cruzes inmediatos (no esperamos debounce)
    evaluateAndMaybeFetchImmediate(text);

    // 2) schedule debounce evaluation (cuando pare)
    scheduleDebouncedEvaluation(text);

    // 3) almacenar longitud previa
    prevLenRef.current = len;
  }, [text, evaluateAndMaybeFetchImmediate, scheduleDebouncedEvaluation]);

  return (
    <div className="min-h-screen bg-theme-bg text-theme-label transition-colors duration-500 flex flex-col items-center justify-around p-8">
      <div className="mb-8 cursor-pointer select-none" onClick={rotateTheme}>
        <Title title={uiMessages.TITLE} tooltip={uiMessages.TOOLTIP} />
      </div>

      <div className="w-full max-w-2xl">
        {/* Si ya hay resultado, mostramos corrección. Si quieres poder editar, muestra botón "Edit" que limpia result */}
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
