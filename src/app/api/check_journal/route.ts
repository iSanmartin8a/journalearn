/* eslint-disable @typescript-eslint/no-explicit-any */
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse, type NextRequest } from "next/server";
import { WEB_PROMPTS } from "@/utils/prompts";

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
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not set.");
      return NextResponse.json(
        { error: "Server misconfiguration: OPENAI_API_KEY missing" },
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
User journal entry:
"${text}"

Instructions:
- Detect the language automatically.
- Correct grammar, spelling, punctuation, and naturalness.
- Preserve meaning.
- Provide a JSON object with:
  {
    "language": "<detected language>",
    "corrected_markdown": "<corrected entry with ~~strike~~ and **bold** for corrections>",
    "corrections": [
      {
        "original": "<original fragment>",
        "suggestion": "<replacement fragment>",
        "type": "<grammar|vocabulary|idiom|punctuation|style>",
        "explanation": "<short learner-friendly explanation>"
      }
    ],
    "summary": "<short summary of main issues and tips>"
  }
Only return JSON.
`.trim();

    let response;
    try {
      response = await generateText({
        model: openai("gpt-5.2-2025-12-11"),
        system: WEB_PROMPTS.CHECK_JOURNAL_PROMPT,
        prompt: userPrompt,
        temperature: 0.2,
      });
    } catch (err: any) {
      console.error("[check_journal] generateText error:", err.message || err);
      return NextResponse.json({
        error: "AI service error: " + (err.message || String(err)),
      }, { status: 502 });
    }

    const candidateText =
      (response as any)?.text ??
      (response as any)?.choices?.[0]?.message?.content ??
      (response as any)?.choices?.[0]?.text ??
      (typeof response === "string" ? response : JSON.stringify(response));

    let parsed = extractJson(candidateText);

    if (!parsed) {
      try {
        parsed = JSON.parse(candidateText);
      } catch {
        parsed = null;
      }
    }

    if (!parsed) {
      console.warn("[check_journal] could not parse JSON from model response. Returning original text.");
      return NextResponse.json({
        result: {
          language: "unknown",
          corrected_markdown: text,
          corrections: [],
          summary: "Could not parse model output. Returned original text."
        }
      });
    }

    return NextResponse.json({ result: parsed });
  } catch (err) {
    console.error("[check_journal] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
