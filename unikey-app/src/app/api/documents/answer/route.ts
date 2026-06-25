import { NextResponse } from "next/server";
import { answerFromText } from "@/lib/study-engine";
import { generateAiAnswer } from "@/lib/ai-study";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      text?: string;
      question?: string;
    };

    if (!body.text?.trim() || !body.question?.trim()) {
      return NextResponse.json(
        { error: "Cevap için PDF metni ve soru gerekli." },
        { status: 400 },
      );
    }

    const aiAnswer = await generateAiAnswer({
      text: body.text,
      question: body.question,
    });

    return NextResponse.json({
      answer: aiAnswer ?? answerFromText(body.text, body.question),
      engine: aiAnswer ? "ai" : "local",
    });
  } catch {
    return NextResponse.json(
      { error: "Soru cevaplanırken bir sorun oluştu." },
      { status: 500 },
    );
  }
}
