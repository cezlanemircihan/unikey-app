import { NextResponse } from "next/server";
import { answerFromText, type LessonModule } from "@/lib/study-engine";
import { generateAiAnswer } from "@/lib/ai-study";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      text?: string;
      question?: string;
      activeModule?: LessonModule;
    };

    if (!body.text?.trim() || !body.question?.trim()) {
      return NextResponse.json(
        { error: "Cevap için PDF metni ve soru gerekli." },
        { status: 400 },
      );
    }

    const contextText = body.activeModule
      ? extractSourcePages(body.text, body.activeModule.sourcePages)
      : body.text;
    const question = body.activeModule
      ? `${body.question}\n\nAktif modül: ${body.activeModule.title}\nModül hedefi: ${body.activeModule.goal}`
      : body.question;
    const aiAnswer = await generateAiAnswer({
      text: contextText,
      question,
    });

    return NextResponse.json({
      answer: aiAnswer ?? answerFromText(contextText, question),
      engine: aiAnswer ? "ai" : "local",
    });
  } catch {
    return NextResponse.json(
      { error: "Soru cevaplanırken bir sorun oluştu." },
      { status: 500 },
    );
  }
}

function extractSourcePages(text: string, sourcePages: number[]) {
  const pageMatches = [...text.matchAll(/\[Sayfa\s+(\d+)\]\s*/gi)];
  if (pageMatches.length === 0) return text;

  const chunks = pageMatches.map((match, index) => {
    const next = pageMatches[index + 1];
    return {
      page: Number(match[1]),
      text: text.slice(match.index ?? 0, next?.index ?? text.length),
    };
  });
  const selectedChunks = chunks.filter((chunk) => sourcePages.includes(chunk.page));

  return (selectedChunks.length ? selectedChunks : chunks.slice(0, 2))
    .map((chunk) => chunk.text)
    .join(" ");
}
