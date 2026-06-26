import { NextResponse } from "next/server";
import {
  buildQuiz,
  buildSummary,
  buildTopics,
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

    const localPack = {
      summary: buildSummary(text, courseName),
      keywords: buildTopics(text, 10).map((topic) => topic.title),
      quiz: buildQuiz(text, courseName),
    };
    const aiPack = await generateAiStudyPack({
      courseName,
      documentName: document.name,
      text,
    });
    const pack = aiPack ?? localPack;

    return NextResponse.json({
      name: document.name,
      pageCount: document.pageCount ?? 0,
      text,
      summary: pack.summary,
      keywords: pack.keywords,
      quiz: pack.quiz,
      engine: aiPack ? "ai" : "local",
    });
  } catch (error) {
    console.error(error);
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
