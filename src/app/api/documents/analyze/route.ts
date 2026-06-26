import { NextResponse } from "next/server";
import {
  buildQuiz,
  buildSummary,
  buildTopics,
  buildStructuredQuiz,
  buildStructuredSummary,
  cleanText,
} from "@/lib/study-engine";
import { generateAiStudyPack } from "@/lib/ai-study";

export const runtime = "nodejs";

type AnalyzeInput = {
  name: string;
  pageCount?: number;
  text: string;
};

export async function POST(request: Request) {
  try {
    const { courseName, document } = await readAnalyzeInput(request);
    const text = cleanText(document.text);

    if (text.length < 80) {
      return NextResponse.json(
        {
          error:
            "PDF metni okunamadı. Dosya taranmış görsel olabilir; şimdilik metin seçilebilen PDF yükle.",
        },
        { status: 400 },
      );
    }

    const localTopics = buildTopics(text, 10);
    const localStructuredSummary = buildStructuredSummary(text, courseName);
    const localStructuredQuiz = buildStructuredQuiz(text, courseName);
    const localPack = {
      summary: buildSummary(text, courseName),
      keywords: localTopics.map((topic) => topic.title),
      quiz: buildQuiz(text, courseName),
      topics: localTopics,
      structuredSummary: localStructuredSummary,
      structuredQuiz: localStructuredQuiz,
    };
    const aiPack = await generateAiStudyPack({
      courseName,
      documentName: document.name,
      text,
    });
    const pack = {
      ...localPack,
      ...aiPack,
      topics: aiPack?.topics?.length ? aiPack.topics : localPack.topics,
      structuredSummary: aiPack?.structuredSummary ?? localPack.structuredSummary,
      structuredQuiz: aiPack?.structuredQuiz?.length
        ? aiPack.structuredQuiz
        : localPack.structuredQuiz,
    };

    return NextResponse.json({
      name: document.name,
      pageCount: document.pageCount ?? 0,
      text,
      summary: pack.summary,
      keywords: pack.keywords,
      quiz: pack.quiz,
      topics: pack.topics,
      structuredSummary: pack.structuredSummary,
      structuredQuiz: pack.structuredQuiz,
      engine: aiPack ? "ai" : "local",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "PDF okunurken bir sorun oluştu. Dosya taranmış görsel olabilir veya PDF yapısı desteklenmiyor olabilir.",
      },
      { status: 500 },
    );
  }
}

async function readAnalyzeInput(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      courseName?: string;
      documentName?: string;
      pageCount?: number;
      text?: string;
    };

    if (!body.text?.trim()) {
      throw new Error("PDF metni bulunamadı.");
    }

    return {
      courseName: body.courseName?.trim() || "Bu ders",
      document: {
        name: body.documentName?.trim() || "Doküman.pdf",
        pageCount: body.pageCount,
        text: body.text,
      } satisfies AnalyzeInput,
    };
  }

  throw new Error(
    "PDF dosyası sunucuya doğrudan gönderilemedi. Sayfayı yenileyip tekrar yükle.",
  );
}
