/* eslint-disable @typescript-eslint/no-explicit-any */
export const runtime = "nodejs";

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse, type NextRequest } from "next/server";
import { WEB_PROMPTS } from "@/utils/prompts";
import { UI_MESSAGES } from "@/utils/consts";

function extractJson(text: string) {
  const jsonMatch = text.match(/(\{[\s\S]*\})/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[1]);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    // quick env check
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set.");
      return NextResponse.json(
        { ui: UI_MESSAGES, error: "Server misconfiguration: OPENAI_API_KEY missing" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const text = body?.text;

    if (typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing 'text' string in request body" },
        { status: 400 }
      );
    }

    const userPrompt = `
User text:
"${text}"

UI messages to translate (do not change keys):
${JSON.stringify(UI_MESSAGES, null, 2)}
`.trim();

    // Llamada al SDK 'ai' usando el bridge de openai
let response;
try {
  response = await generateText({
    model: openai("gpt-5.2-2025-12-11"),
    system: WEB_PROMPTS.TRANSLATE_WEB_PROMPT,
    prompt: userPrompt,
    temperature: 0.2,
  });
} catch (err: any) {
  console.error("[translate_web] generateText error:", err.message || err);
  return NextResponse.json({
    ui: UI_MESSAGES,
    error: "AI service error: " + (err.message || String(err)),
  }, { status: 502 });
}

    // Intentamos extraer el texto del asistente en varias formas
    const candidateText =
      (response as any)?.text ??
      (response as any)?.choices?.[0]?.message?.content ??
      (response as any)?.choices?.[0]?.text ??
      (typeof response === "string" ? response : JSON.stringify(response));

    // Extraer JSON dentro del texto si lo hay
    let translatedUI = extractJson(candidateText);

    // Si no, intentar parsear directamente (si el modelo devolvió solo JSON)
    if (!translatedUI) {
      try {
        translatedUI = JSON.parse(candidateText);
      } catch {
        translatedUI = null;
      }
    }

    // Como último intento, pedir al modelo que reenvíe solo JSON (opcional)
    // (No lo hacemos aquí para evitar otra llamada automática; prefiero fallback)

    if (!translatedUI) {
      console.warn("[translate_web] could not parse JSON from model response. Returning fallback UI_MESSAGES.");
      return NextResponse.json({ ui: UI_MESSAGES });
    }

    return NextResponse.json({ ui: translatedUI });
  } catch (err) {
    console.error("[translate_web] unexpected error:", err);
    return NextResponse.json({ ui: UI_MESSAGES, error: "Internal server error" }, { status: 500 });
  }
}
