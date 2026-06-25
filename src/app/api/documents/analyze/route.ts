import { NextResponse } from "next/server";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  getDocument,
  GlobalWorkerOptions,
  VerbosityLevel,
} from "pdfjs-dist/legacy/build/pdf.mjs";
import {
  buildQuiz,
  buildSummary,
  cleanText,
  extractKeywords,
} from "@/lib/study-engine";
import { generateAiStudyPack } from "@/lib/ai-study";

export const runtime = "nodejs";

type PdfTextItem = {
  str?: string;
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const courseName = String(formData.get("courseName") ?? "Bu ders");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "PDF dosyası bulunamadı." },
        { status: 400 },
      );
    }

    if (!file.name.toLocaleLowerCase("tr").endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Şimdilik yalnızca PDF dosyası destekleniyor." },
        { status: 400 },
      );
    }

    if (file.size > 18 * 1024 * 1024) {
      return NextResponse.json(
        { error: "PDF çok büyük. İlk sürüm için 18 MB altı dosya yükle." },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    const pages = await extractPdfPages(buffer);
    const text = cleanText(pages.map((page) => page.text).join("\n\n"));
    const localPack = {
      summary: buildSummary(text, courseName),
      keywords: extractKeywords(text, 10),
      quiz: buildQuiz(text, courseName),
    };
    const aiPack = await generateAiStudyPack({
      courseName,
      documentName: file.name,
      text,
    });
    const pack = aiPack ?? localPack;

    return NextResponse.json({
      name: file.name,
      pageCount: pages.length,
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
          "PDF okunurken bir sorun oluştu. Dosya taranmış görsel olabilir veya PDF yapısı desteklenmiyor olabilir.",
      },
      { status: 500 },
    );
  }
}

async function extractPdfPages(buffer: ArrayBuffer) {
  GlobalWorkerOptions.workerSrc = pathToFileURL(
    join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"),
  ).toString();

  const loadingTask = getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
    verbosity: VerbosityLevel.ERRORS,
  });
  const pdf = await loadingTask.promise;
  const pages: Array<{ pageNumber: number; text: string }> = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = (content.items as PdfTextItem[])
      .map((item) => item.str)
      .filter(Boolean)
      .join(" ");

    pages.push({ pageNumber, text });
  }

  return pages;
}
