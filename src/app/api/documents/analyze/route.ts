import { NextResponse } from "next/server";
import {
  attachQuizToLesson,
  buildLesson,
  buildQuiz,
  buildSummary,
  buildTopics,
  buildStructuredQuiz,
  buildStructuredSummary,
  calculateOutputQuality,
  cleanText,
} from "@/lib/study-engine";
import { generateAiStudyPackWithDebug } from "@/lib/ai-study";

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
    const localLesson = buildLesson(text, courseName);
    const localPack = {
      summary: buildSummary(text, courseName),
      keywords: localTopics.map((topic) => topic.title),
      quiz: attachQuizToLesson(buildQuiz(text, courseName), localLesson),
      topics: localTopics,
      structuredSummary: localStructuredSummary,
      structuredQuiz: localStructuredQuiz,
      lesson: localLesson,
    };
    const aiResult = await generateAiStudyPackWithDebug({
      courseName,
      documentName: document.name,
      text,
    });
    const aiPack = aiResult.pack;
    const pack = {
      ...localPack,
      ...aiPack,
      topics: aiPack?.topics?.length ? aiPack.topics : localPack.topics,
      structuredSummary: aiPack?.structuredSummary ?? localPack.structuredSummary,
      structuredQuiz: aiPack?.structuredQuiz?.length
        ? aiPack.structuredQuiz
        : localPack.structuredQuiz,
      lesson: aiPack?.lesson?.modules.length ? aiPack.lesson : localPack.lesson,
    };
    pack.quiz = attachQuizToLesson(pack.quiz, pack.lesson);

    if (pack.quiz.length === 0) {
      return NextResponse.json(
        {
          error:
            "Quiz oluşturulamadı. PDF metni çok kısa olabilir veya konu çıkarımı için yeterince okunabilir içerik içermiyor olabilir.",
        },
        { status: 422 },
      );
    }

    const quality = calculateOutputQuality({
      topics: pack.topics,
      summary: pack.structuredSummary,
      quiz: pack.quiz,
      lesson: pack.lesson,
    });
    const missingTopicCount = pack.quiz.filter((question) => !question.topic).length;
    const missingSourcePageCount = pack.quiz.filter(
      (question) => typeof question.sourcePage !== "number",
    ).length;
    const missingQuizModuleLinkCount = pack.quiz.filter(
      (question) => !question.moduleId,
    ).length;
    const lessonModuleCount = pack.lesson.modules.length;
    const shortLectureTranscriptCount = pack.lesson.modules.filter(
      (module) =>
        (module.lectureTranscript || module.lessonText || "")
          .split(/\s+/)
          .filter(Boolean).length < 500,
    ).length;
    const bannedLectureLabelCount = pack.lesson.modules.filter((module) =>
      /(^|\n)\s*(Giriş|Kavramın mantığı|Teknik açıklama|PDF'?i okurken|PDF’yi okurken|Mini özet|Neden önemli|Günlük hayat analojisi|Kontrol noktası)\s*:?\s*(\n|$)/i.test(
        module.lectureTranscript || module.lessonText || "",
      ),
    ).length;
    const missingModuleSourcePageCount = pack.lesson.modules.filter(
      (module) => module.sourcePages.length === 0,
    ).length;
    const debug = {
      topicCount: pack.topics.length,
      summaryFields: {
        shortOverview: Boolean(pack.structuredSummary.shortOverview?.trim()),
        mustKnow: pack.structuredSummary.mustKnow.length,
        keyConcepts: pack.structuredSummary.keyConcepts.length,
        examStyleQuestions: pack.structuredSummary.examStyleQuestions.length,
        commonConfusions: pack.structuredSummary.commonConfusions.length,
        flashcards: pack.structuredSummary.flashcards.length,
      },
      quizQuestionCount: pack.quiz.length,
      missingTopicCount,
      missingSourcePageCount,
      lessonModuleCount,
      shortLectureTranscriptCount,
      bannedLectureLabelCount,
      missingModuleSourcePageCount,
      missingQuizModuleLinkCount,
      lessonQualityScore: quality.score,
      fallbackUsed: !aiPack,
      jsonParseError: aiResult.debug.jsonParseError,
      aiAttempted: aiResult.debug.attempted,
      aiFailureReason: aiResult.debug.failureReason,
      qualityScore: quality.score,
      warnings: quality.warnings,
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
      lesson: pack.lesson,
      engine: aiPack ? "ai" : "local",
      quality,
      debug,
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
      throw new Error(
        "PDF metni bulunamadı. Bu PDF görsel/taranmış olabilir veya tarayıcı metin çıkaramamış olabilir.",
      );
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
