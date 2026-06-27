import { NextResponse } from "next/server";
import {
  buildModuleLecture,
  cleanText,
  type AiLesson,
  type LessonModule,
} from "@/lib/study-engine";
import { generateAiModuleLecture } from "@/lib/ai-study";

export const runtime = "nodejs";

type TeachMode = "default" | "repeat" | "simple" | "example";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      courseName?: string;
      documentName?: string;
      text?: string;
      lesson?: AiLesson;
      moduleId?: string;
      mode?: TeachMode;
      completedModuleIds?: string[];
    };

    if (!body.text?.trim() || !body.lesson || !body.moduleId) {
      return NextResponse.json(
        { error: "Modül anlatımı için PDF metni, ders planı ve moduleId gerekli." },
        { status: 400 },
      );
    }

    const text = cleanText(body.text);
    const lesson = body.lesson;
    const lessonModule = lesson.modules.find((item) => item.id === body.moduleId);

    if (!lessonModule) {
      return NextResponse.json(
        { error: "İstenen modül ders planında bulunamadı." },
        { status: 404 },
      );
    }

    const mode = normalizeTeachMode(body.mode);
    const previousModuleSummaries = buildPreviousModuleSummaries(
      lesson.modules,
      body.completedModuleIds ?? [],
      lessonModule.id,
    );
    const sourceText = extractSourcePagesForModule(text, lessonModule);
    const aiLecture = await generateAiModuleLecture({
      courseName: body.courseName?.trim() || lesson.courseTitle,
      documentName: body.documentName?.trim() || "Doküman.pdf",
      text: sourceText,
      lesson,
      module: lessonModule,
      previousModuleSummaries,
      mode,
    });
    const fallbackLecture = buildModuleLecture({
      module: lessonModule,
      lesson,
      text,
      mode,
    });
    const lecture = aiLecture?.lecture ?? fallbackLecture;

    return NextResponse.json({
      moduleId: lessonModule.id,
      lecture,
      checkpointQuestion:
        aiLecture?.checkpointQuestion ??
        "Buraya kadar kafana yatmayan veya tekrar etmemi istediğin bir yer var mı?",
      readyToContinueLabel:
        aiLecture?.readyToContinueLabel ?? "Anladım, sonraki modüle geç",
      engine: aiLecture ? "ai" : "local",
      cached: false,
    });
  } catch {
    return NextResponse.json(
      { error: "Modül anlatımı hazırlanırken bir sorun oluştu." },
      { status: 500 },
    );
  }
}

function normalizeTeachMode(mode: TeachMode | undefined): TeachMode {
  return mode === "repeat" || mode === "simple" || mode === "example"
    ? mode
    : "default";
}

function buildPreviousModuleSummaries(
  modules: LessonModule[],
  completedModuleIds: string[],
  activeModuleId: string,
) {
  return modules
    .filter((module) => module.id !== activeModuleId)
    .filter((module) => completedModuleIds.includes(module.id))
    .map((module) => `${module.title}: ${module.goal}`)
    .slice(0, 4);
}

function extractSourcePagesForModule(text: string, module: LessonModule) {
  const pageMatches = [...text.matchAll(/\[Sayfa\s+(\d+)\]\s*/gi)];
  if (pageMatches.length === 0) return text.slice(0, 12000);

  const chunks = pageMatches.map((match, index) => {
    const next = pageMatches[index + 1];
    return {
      page: Number(match[1]),
      text: text.slice(match.index ?? 0, next?.index ?? text.length),
    };
  });
  const selectedChunks = chunks.filter((chunk) => module.sourcePages.includes(chunk.page));
  const selectedText = (selectedChunks.length ? selectedChunks : chunks.slice(0, 2))
    .map((chunk) => chunk.text)
    .join(" ");

  return selectedText.slice(0, 12000);
}
