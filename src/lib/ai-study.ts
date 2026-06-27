import {
  formatStructuredSummary,
  type AiLesson,
  type ConceptGraphNode,
  type DocumentAnalysis,
  type LessonBlockType,
  type LessonDifficulty,
  type LessonModule,
  type LessonModuleStatus,
  type QuizDifficulty,
  type QuizQuestion,
  type StudySummary,
  type StudyTopic,
  type StructuredQuizQuestion,
} from "@/lib/study-engine";

type StudyPack = {
  summary: string;
  keywords: string[];
  quiz: QuizQuestion[];
  topics?: StudyTopic[];
  structuredSummary?: StudySummary;
  structuredQuiz?: StructuredQuizQuestion[];
  lesson?: AiLesson;
  documentAnalysis?: DocumentAnalysis;
  conceptGraph?: ConceptGraphNode[];
};

export type AiStudyDebug = {
  attempted: boolean;
  failureReason?: "missing-key" | "request-failed" | "parse-error";
  jsonParseError: boolean;
};

export type AiStudyResult = {
  pack: StudyPack | null;
  debug: AiStudyDebug;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

type RawTopic = Partial<StudyTopic>;
type RawSummary = Partial<StudySummary>;
type RawQuizQuestion = Partial<StructuredQuizQuestion> & Partial<QuizQuestion>;
type RawLesson = Partial<AiLesson>;
type RawDocumentAnalysis = Partial<DocumentAnalysis>;
type RawConceptGraphNode = Partial<ConceptGraphNode>;

const openAiEndpoint = "https://api.openai.com/v1/responses";
const defaultModel = "gpt-4.1";

export async function generateAiStudyPack({
  courseName,
  documentName,
  text,
}: {
  courseName: string;
  documentName: string;
  text: string;
}): Promise<StudyPack | null> {
  const result = await generateAiStudyPackWithDebug({
    courseName,
    documentName,
    text,
  });

  return result.pack;
}

export async function generateAiStudyPackWithDebug({
  courseName,
  documentName,
  text,
}: {
  courseName: string;
  documentName: string;
  text: string;
}): Promise<AiStudyResult> {
  if (!hasOpenAiKey()) {
    return {
      pack: null,
      debug: {
        attempted: false,
        failureReason: "missing-key",
        jsonParseError: false,
      },
    };
  }

  const prompt = `
Sen ÜniKEY'in çok aşamalı AI Tutor analiz katmanısın.
Bu aşamada ders anlatımı üretmeyeceksin.
Görevin PDF'i anlamak, kavramları ilişkilendirmek ve ayrı ayrı öğretilecek modül planını çıkarmak.
Module lecture, quiz ve yanlış analizi sonraki ajanlarda üretilecek.

Ders: ${courseName}
PDF adı: ${documentName}

PDF metni:
${limitText(text)}

Yalnızca parse edilebilir JSON döndür. Markdown, açıklama, kod bloğu veya JSON dışı metin yazma.
JSON şeması tam olarak şu yapıda olsun:
{
  "documentAnalysis": {
    "documentTitle": "PDF'in doğal Türkçe başlığı",
    "mainSubject": "PDF'in ana konusu",
    "coreProblem": "PDF'in çözmeye çalıştığı ana problem",
    "importantConcepts": ["Önemli kavramlar"],
    "irrelevantOrLowPriorityParts": ["Sınav açısından düşük öncelikli kısımlar"],
    "examRelevantParts": ["Sınavda sorulabilecek kısımlar"],
    "sourcePageMap": [
      {
        "page": 1,
        "concepts": ["Bu sayfada geçen kavramlar"]
      }
    ]
  },
  "conceptGraph": [
    {
      "concept": "Kavram adı",
      "dependsOn": ["Ön koşul kavramlar"],
      "relatedTo": ["İlgili kavramlar"],
      "whyItMatters": "Bu kavram neden önemli?"
    }
  ],
  "lesson": {
    "lessonTitle": "PDF'ten çıkarılan Türkçe ders planı başlığı",
    "courseTitle": "${courseName}",
    "moduleCountReason": "Neden bu sayıda modül seçildi?",
    "estimatedTotalMinutes": 45,
    "difficulty": "beginner | intermediate | advanced",
    "modules": [
      {
        "id": "modul-1-kisa-id",
        "title": "Öğretilebilir Türkçe modül başlığı",
        "goal": "Bu modülün öğrenme hedefi",
        "whyThisModuleExists": "Bu modül plana neden dahil edildi?",
        "dependsOn": ["Bu modül için önce bilinmesi gereken modüller/kavramlar"],
        "examAngle": "Bu modül sınavda nasıl sorulabilir?",
        "estimatedMinutes": 8,
        "learningGoals": ["Bu modül sonunda öğrenci neyi anlayacak?"],
        "prerequisites": ["Gerekli ön bilgi yoksa boş bırakma, kısa yaz"],
        "sourcePages": [1],
        "status": "active | locked | completed",
        "lectureTranscript": "",
        "blocks": []
      }
    ],
    "finalQuiz": {
      "availableAfterModulesCompleted": true,
      "questionCount": 5
    }
  },
  "topics": [
    {
      "title": "Doğal, öğretilebilir Türkçe konu başlığı",
      "shortDescription": "Bu konunun 1 cümlelik Türkçe açıklaması",
      "whyImportant": "Sınav veya ders açısından neden önemli olduğu",
      "examLikelihood": "low | medium | high",
      "sourcePages": [1]
    }
  ],
  "summary": {
    "shortOverview": "Bu PDF ne anlatıyor? 2-3 cümlelik Türkçe cevap",
    "mustKnow": ["Mutlaka bilinmesi gereken 3 madde"],
    "keyConcepts": [
      {
        "term": "Kavram adı",
        "explanation": "Öğrenciye anlatır gibi Türkçe açıklama",
        "sourcePage": 1
      }
    ],
    "examStyleQuestions": ["Vize/final tarzı doğal soru"],
    "commonConfusions": ["Karıştırılan nokta"],
    "flashcards": [
      {
        "front": "Kısa kart sorusu",
        "back": "Kısa Türkçe cevap"
      }
    ]
  },
  "quiz": [
    {
      "question": "Gerçek vize/final sorusu gibi doğal çoktan seçmeli soru",
      "options": ["4 seçenek"],
      "correctAnswer": "options içindeki doğru cevabın aynısı",
      "explanation": "Doğru cevabı öğretici biçimde açıkla; sadece doğru cevap budur deme",
      "topic": "Sorunun bağlı olduğu konu başlığı",
      "difficulty": "easy | medium | hard",
      "sourcePage": 1
    }
  ]
}

Zorunlu kurallar:
- Bütün çıktı Türkçe olacak. PDF İngilizce olsa bile analiz ve plan Türkçe olacak.
- Teknik terimler gerektiğinde korunabilir: socket, TCP, working directory, NFS gibi.
- "File Systems", "Unix File", "Other", "Command", "Chapter Fifteen", "Konusu", "Each Line" gibi ham veya yapay başlıklar üretme.
- Anahtar kelime çıkarma; konu çıkar. Örnek: "UNIX Dosya Sistemi Temelleri", "Working Directory ve Path Mantığı", "UNIX'te Everything is a File Yaklaşımı".
- PDF'ten ham satır, kod bloğu, shell script, "[Sayfa 1] Chapter..." gibi metinleri cevap olarak kopyalama.
- Summary tek uzun paragraf olmasın; alanları doldur.
- mustKnow tam 3 madde olsun.
- keyConcepts 4-6 madde olsun.
- examStyleQuestions 3 madde olsun.
- commonConfusions 2-3 madde olsun.
- flashcards 4-6 kart olsun.
- quiz 4-5 soru olsun.
- Quiz soruları "X konusu neden önemlidir?" gibi jenerik olmasın. Kavramı ölçen doğal soru yaz.
- Quiz açıklaması öğrencinin yanlışını düzeltecek kadar öğretici olsun.
- sourcePages ve sourcePage sadece sayı olsun. Sayfa bilinmiyorsa 1 yaz.
- PDF'te olmayan bilgiyi uydurma.
- Bu aşamada lectureTranscript üretme; boş string dön.
- Modül sayısı 4-10 arasında olsun. Rastgele seçme; moduleCountReason ile gerekçelendir.
- Her modül ayrı bir öğrenme basamağı olsun. Aynı başlığın yeniden adlandırılmış hali gibi modül üretme.
- Her modülün sourcePages alanı dolu olsun.
- İlk module status "active", diğerleri "locked" olsun.
- Quiz sorularında mümkünse moduleId alanını ilgili modül id'siyle eşleştir.
- Quiz bu aşamada kabaca üretilebilir ama asıl kalite modül tamamlandıktan sonra değerlendirilecek.
`;

  const output = await safeCallOpenAi(prompt);
  if (!output) {
    return {
      pack: null,
      debug: {
        attempted: true,
        failureReason: "request-failed",
        jsonParseError: false,
      },
    };
  }

  const pack = parseStudyPack(output);

  return {
    pack,
    debug: {
      attempted: true,
      failureReason: pack ? undefined : "parse-error",
      jsonParseError: !pack,
    },
  };
}

export async function generateAiAnswer({
  text,
  question,
}: {
  text: string;
  question: string;
}) {
  if (!hasOpenAiKey()) return null;

  const prompt = `
Sen ÜniKEY uygulamasının PDF'e bağlı soru-cevap asistanısın.
Öğrencinin sorusunu sadece aşağıdaki PDF metnine göre cevapla.
PDF'te cevap yoksa açıkça "Bu bilgi PDF içinde net görünmüyor" de.
PDF hangi dilde olursa olsun cevabı Türkçe ver. Teknik terimler hariç bütün kelimeleri Türkçe kullan.

Öğrencinin sorusu:
${question}

PDF metni:
${limitText(text)}

Cevabı Türkçe, kısa ve anlaşılır ver.
Ham PDF satırı, kod bloğu veya İngilizce paragraf kopyalama.
Gerekirse şu yapıdan birini kullan:
- Kısa cevap
- Neden önemli?
- Sınavda nasıl sorulabilir?
Sonuna mümkünse "Kaynak: PDF sayfa X" satırı ekle.
`;

  return safeCallOpenAi(prompt);
}

export async function generateAiModuleLecture({
  courseName,
  documentName,
  text,
  lesson,
  module,
  previousModuleSummaries,
  mode = "default",
}: {
  courseName: string;
  documentName: string;
  text: string;
  lesson: AiLesson;
  module: LessonModule;
  previousModuleSummaries: string[];
  mode?: "default" | "repeat" | "simple" | "example";
}) {
  if (!hasOpenAiKey()) return null;

  const modeInstruction =
    mode === "simple"
      ? "Bu anlatımı daha basit cümlelerle yeniden kur. Kavramı küçültmeden sadeleştir."
      : mode === "example"
        ? "Bu anlatımda PDF bağlamından daha belirgin ve somut bir örnek kullan."
        : mode === "repeat"
          ? "Aynı modülü farklı cümlelerle, daha toparlanmış şekilde yeniden anlat."
          : "Bu modülü ilk kez anlat.";

  const prompt = `
Sen ÜniKEY'in Module Teacher ajanısın.
Bu aşamada yalnızca aktif modülü anlatacaksın.
Tüm ders planını anlatma. Diğer modüllerin lecture metnini üretme.

Ton:
- Ciddi, net, öğretici ve sınav odaklı.
- Aşırı samimi ifadeler yok.
- Robotik liste dili yok.
- "hoş geldin", "harika", "çayını al" gibi ifadeler yok.

Ders: ${courseName}
PDF adı: ${documentName}
Ders planı: ${lesson.lessonTitle}
Aktif modül:
${JSON.stringify({
  id: module.id,
  title: module.title,
  goal: module.goal,
  whyThisModuleExists: module.whyThisModuleExists,
  dependsOn: module.dependsOn,
  sourcePages: module.sourcePages,
  examAngle: module.examAngle,
})}

Önceki modüllerin kısa bağlamı:
${previousModuleSummaries.join("\n") || "Önceki modül yok."}

İlgili PDF metni:
${limitText(text, 9000)}

Mod:
${modeInstruction}

Yalnızca parse edilebilir JSON döndür:
{
  "moduleId": "${module.id}",
  "lecture": "600-1000 kelimelik tek parça doğal Türkçe ders anlatımı",
  "checkpointQuestion": "Buraya kadar kafana yatmayan veya tekrar etmemi istediğin bir yer var mı?",
  "readyToContinueLabel": "Anladım, sonraki modüle geç"
}

Kurallar:
- lecture içinde başlık, markdown, madde listesi veya bölüm etiketi kullanma.
- Şu ifadeleri üretme: "Giriş", "Kavramın mantığı", "Teknik açıklama", "PDF'yi okurken", "Mini özet", "Kontrol noktası".
- Şu kalıp cümleleri ve benzerlerini üretme: "tanım ilk durak değil", "PDF kelimeleri kopuk görünür", "hoca uzun metin beklemez", "önce problem sonra mantık sonra örnek".
- İlk cümle aktif modülün kendi problemine özel olsun. Genel motivasyon cümlesiyle başlama.
- PDF bağlamından en az bir somut örnek kullan.
- Sınavda nasıl sorulabileceğini doğal biçimde anlat.
- Modül dışına çıkma. Sadece sourcePages ve aktif modül bağlamını kullan.
- Son cümle tam olarak şu olsun: "Buraya kadar kafana yatmayan veya tekrar etmemi istediğin bir yer var mı?"
`;

  const output = await safeCallOpenAi(prompt);
  if (!output) return null;

  return parseModuleLecture(output, module.id);
}

function hasOpenAiKey() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

async function callOpenAi(prompt: string) {
  const response = await fetch(openAiEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || defaultModel,
      input: prompt,
      temperature: 0.15,
    }),
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as OpenAIResponse;
  return extractOutputText(payload);
}

async function safeCallOpenAi(prompt: string) {
  try {
    return await callOpenAi(prompt);
  } catch {
    return null;
  }
}

function extractOutputText(payload: OpenAIResponse) {
  if (payload.output_text) return payload.output_text.trim();

  const text = payload.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text)
    .filter(Boolean)
    .join("\n");

  return text?.trim() || null;
}

function parseStudyPack(output: string): StudyPack | null {
  const jsonText = output
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(jsonText) as {
      documentAnalysis?: RawDocumentAnalysis;
      conceptGraph?: RawConceptGraphNode[];
      lesson?: RawLesson;
      topics?: RawTopic[];
      summary?: RawSummary | string;
      keywords?: string[];
      quiz?: RawQuizQuestion[];
    };
    const documentAnalysis = normalizeDocumentAnalysis(parsed.documentAnalysis);
    const conceptGraph = normalizeConceptGraph(parsed.conceptGraph);
    const lesson = normalizeLesson(parsed.lesson);
    const topics = normalizeTopics(parsed.topics);
    const structuredSummary =
      typeof parsed.summary === "object"
        ? normalizeSummary(parsed.summary)
        : null;
    const structuredQuiz = normalizeStructuredQuiz(parsed.quiz);

    if (structuredSummary && structuredQuiz.length > 0) {
      return {
        summary: formatStructuredSummary(structuredSummary),
        keywords: topics.length > 0 ? topics.map((topic) => topic.title) : inferKeywords(structuredQuiz),
        quiz: structuredQuiz.map(toLegacyQuizQuestion),
        topics,
        structuredSummary,
        structuredQuiz,
        lesson: lesson
          ? {
              ...lesson,
              documentAnalysis: documentAnalysis ?? lesson.documentAnalysis,
              conceptGraph: conceptGraph.length ? conceptGraph : lesson.conceptGraph,
            }
          : undefined,
        documentAnalysis: documentAnalysis ?? undefined,
        conceptGraph,
      };
    }

    if (
      typeof parsed.summary === "string" &&
      Array.isArray(parsed.keywords) &&
      Array.isArray(parsed.quiz)
    ) {
      const legacyQuiz = parsed.quiz.filter(isLegacyQuizQuestion).map((question) => ({
        question: sanitizeText(question.question ?? ""),
        options: normalizeOptions(question.options ?? []),
        answer: sanitizeText(question.answer ?? ""),
        source: sanitizeText(question.source ?? question.explanation ?? ""),
      }));

      if (legacyQuiz.length === 0) return null;

      return {
        summary: sanitizeText(parsed.summary),
        keywords: parsed.keywords.filter((keyword) => typeof keyword === "string").map(sanitizeText),
        quiz: legacyQuiz,
        lesson: lesson ?? undefined,
        documentAnalysis: documentAnalysis ?? undefined,
        conceptGraph,
      };
    }

    return null;
  } catch {
    return null;
  }
}

function parseModuleLecture(output: string, expectedModuleId: string) {
  const jsonText = output
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(jsonText) as {
      moduleId?: string;
      lecture?: string;
      checkpointQuestion?: string;
      readyToContinueLabel?: string;
    };
    const lecture = sanitizeLectureTranscript(parsed.lecture);

    if (!isStrongLectureTranscript(lecture, [1])) return null;

    return {
      moduleId: sanitizeText(parsed.moduleId) || expectedModuleId,
      lecture,
      checkpointQuestion:
        sanitizeText(parsed.checkpointQuestion) ||
        "Buraya kadar kafana yatmayan veya tekrar etmemi istediğin bir yer var mı?",
      readyToContinueLabel:
        sanitizeText(parsed.readyToContinueLabel) || "Anladım, sonraki modüle geç",
    };
  } catch {
    return null;
  }
}

function normalizeTopics(topics: RawTopic[] | undefined): StudyTopic[] {
  if (!Array.isArray(topics)) return [];

  return topics
    .map((topic) => ({
      title: cleanTeachingTitle(sanitizeText(topic.title)),
      shortDescription: sanitizeText(topic.shortDescription),
      whyImportant: sanitizeText(topic.whyImportant),
      examLikelihood: normalizeExamLikelihood(topic.examLikelihood),
      sourcePages: normalizeSourcePages(topic.sourcePages),
    }))
    .filter(
      (topic) =>
        topic.title.length > 4 &&
        topic.shortDescription.length > 12 &&
        !looksLikeRawPdfDump(topic.title),
    )
    .slice(0, 10);
}

function normalizeSummary(summary: RawSummary): StudySummary | null {
  if (!summary || typeof summary !== "object") return null;
  const shortOverview = sanitizeText(summary.shortOverview);
  const mustKnow = normalizeStringArray(summary.mustKnow, 3);
  const keyConcepts = Array.isArray(summary.keyConcepts)
    ? summary.keyConcepts
        .map((concept) => ({
          term: sanitizeText(concept?.term),
          explanation: sanitizeText(concept?.explanation),
          sourcePage: normalizePage(concept?.sourcePage),
        }))
        .filter(
          (concept) =>
            concept.term.length > 2 &&
            concept.explanation.length > 12 &&
            !looksLikeRawPdfDump(concept.explanation),
        )
        .slice(0, 6)
    : [];
  const examStyleQuestions = normalizeStringArray(summary.examStyleQuestions, 3);
  const commonConfusions = normalizeStringArray(summary.commonConfusions, 3);
  const flashcards = Array.isArray(summary.flashcards)
    ? summary.flashcards
        .map((card) => ({
          front: sanitizeText(card?.front),
          back: sanitizeText(card?.back),
        }))
        .filter((card) => card.front.length > 4 && card.back.length > 8)
        .slice(0, 6)
    : [];

  if (
    shortOverview.length < 20 ||
    mustKnow.length === 0 ||
    keyConcepts.length === 0 ||
    examStyleQuestions.length === 0
  ) {
    return null;
  }

  return {
    shortOverview,
    mustKnow,
    keyConcepts,
    examStyleQuestions,
    commonConfusions,
    flashcards,
  };
}

function normalizeStructuredQuiz(
  quiz: RawQuizQuestion[] | undefined,
): StructuredQuizQuestion[] {
  if (!Array.isArray(quiz)) return [];

  return quiz
    .map((question) => {
      const options = normalizeOptions(question.options ?? []);
      const correctAnswer = sanitizeText(question.correctAnswer ?? question.answer);

      return {
        question: sanitizeText(question.question),
        options,
        correctAnswer,
        explanation: sanitizeText(question.explanation ?? question.source),
        topic: sanitizeText(question.topic),
        moduleId: sanitizeText(question.moduleId),
        difficulty: normalizeDifficulty(question.difficulty),
        sourcePage: normalizePage(question.sourcePage),
      };
    })
    .filter(
      (question) =>
        question.question.length > 12 &&
        question.options.length >= 4 &&
        question.options.includes(question.correctAnswer) &&
        question.explanation.length > 20 &&
        question.topic.length > 3 &&
        !looksLikeRawPdfDump(question.question) &&
        !looksLikeRawPdfDump(question.correctAnswer),
    )
    .slice(0, 5);
}

function normalizeDocumentAnalysis(
  analysis: RawDocumentAnalysis | undefined,
): DocumentAnalysis | null {
  if (!analysis || typeof analysis !== "object") return null;
  const documentTitle = sanitizeText(analysis.documentTitle);
  const mainSubject = sanitizeText(analysis.mainSubject);
  const coreProblem = sanitizeText(analysis.coreProblem);
  const importantConcepts = normalizeStringArray(analysis.importantConcepts, 10);
  const examRelevantParts = normalizeStringArray(analysis.examRelevantParts, 8);

  if (mainSubject.length < 4 || coreProblem.length < 12 || importantConcepts.length === 0) {
    return null;
  }

  return {
    documentTitle: documentTitle || mainSubject,
    mainSubject,
    coreProblem,
    importantConcepts,
    irrelevantOrLowPriorityParts: normalizeStringArray(
      analysis.irrelevantOrLowPriorityParts,
      6,
    ),
    examRelevantParts,
    sourcePageMap: Array.isArray(analysis.sourcePageMap)
      ? analysis.sourcePageMap
          .map((item) => ({
            page: normalizePage(item?.page),
            concepts: normalizeStringArray(item?.concepts, 6),
          }))
          .filter((item) => item.concepts.length > 0)
          .slice(0, 12)
      : [],
  };
}

function normalizeConceptGraph(
  graph: RawConceptGraphNode[] | undefined,
): ConceptGraphNode[] {
  if (!Array.isArray(graph)) return [];

  return graph
    .map((node) => ({
      concept: cleanTeachingTitle(sanitizeText(node.concept)),
      dependsOn: normalizeStringArray(node.dependsOn, 5).map(cleanTeachingTitle),
      relatedTo: normalizeStringArray(node.relatedTo, 5).map(cleanTeachingTitle),
      whyItMatters: sanitizeText(node.whyItMatters),
    }))
    .filter(
      (node) =>
        node.concept.length > 4 &&
        node.whyItMatters.length > 12 &&
        !isWeakTeachingTitle(node.concept),
    )
    .slice(0, 12);
}

function normalizeLesson(lesson: RawLesson | undefined): AiLesson | null {
  if (!lesson || typeof lesson !== "object" || !Array.isArray(lesson.modules)) {
    return null;
  }

  const modules = lesson.modules
    .map((module, index) => {
      const blocks = Array.isArray(module?.blocks)
        ? module.blocks
            .map((block) => ({
              type: normalizeBlockType(block?.type),
              title: sanitizeText(block?.title),
              content: sanitizeText(block?.content),
              question:
                typeof block?.question === "string"
                  ? sanitizeText(block.question)
                  : null,
              options: Array.isArray(block?.options)
                ? normalizeOptions(block.options)
                : null,
              correctAnswer:
                typeof block?.correctAnswer === "string"
                  ? sanitizeText(block.correctAnswer)
                  : null,
              explanation:
                typeof block?.explanation === "string"
                  ? sanitizeText(block.explanation)
                  : null,
            }))
            .filter(
              (block) =>
                block.title.length > 2 &&
                block.content.length > 12 &&
                !looksLikeRawPdfDump(block.content),
            )
        : [];
      const lectureTranscript = sanitizeLectureTranscript(
        module?.lectureTranscript ?? module?.lessonText,
      );
      const fallbackLectureTranscript = composeTranscriptFromBlocks(
        cleanTeachingTitle(sanitizeText(module?.title)),
        blocks,
      );

      return {
        id: sanitizeText(module?.id) || `modul-${index + 1}`,
        title: cleanTeachingTitle(sanitizeText(module?.title)),
        goal:
          sanitizeText(module?.goal) ||
          `${cleanTeachingTitle(sanitizeText(module?.title))} kavramını sınavda açıklamak.`,
        whyThisModuleExists:
          sanitizeText(module?.whyThisModuleExists) ||
          "Bu modül PDF'teki ana öğrenme basamaklarından birini ayırır.",
        dependsOn: normalizeStringArray(module?.dependsOn, 5).map(cleanTeachingTitle),
        examAngle:
          sanitizeText(module?.examAngle) ||
          "Bu başlık sınavda kavramın amacı ve örneği üzerinden sorulabilir.",
        estimatedMinutes: normalizePositiveNumber(module?.estimatedMinutes, 8),
        learningGoals: normalizeStringArray(module?.learningGoals, 4),
        prerequisites: normalizeStringArray(module?.prerequisites, 3),
        sourcePages: normalizeSourcePages(module?.sourcePages),
        status: normalizeModuleStatus(module?.status, index),
        lectureTranscript: lectureTranscript || fallbackLectureTranscript,
        lessonText: lectureTranscript || fallbackLectureTranscript,
        blocks,
      };
    })
    .filter(
      (module) =>
        module.title.length > 5 &&
        !isWeakTeachingTitle(module.title) &&
        module.learningGoals.length > 0 &&
        module.goal.length > 12 &&
        module.whyThisModuleExists.length > 12 &&
        module.examAngle.length > 12 &&
        module.sourcePages.length > 0,
    )
    .slice(0, 6);

  if (modules.length === 0) return null;

  return {
    lessonTitle: sanitizeText(lesson.lessonTitle) || "AI Ders",
    courseTitle: sanitizeText(lesson.courseTitle) || "Bu ders",
    moduleCountReason:
      sanitizeText(lesson.moduleCountReason) ||
      "Modül sayısı PDF'teki kavram ayrımlarına göre belirlendi.",
    estimatedTotalMinutes: normalizePositiveNumber(
      lesson.estimatedTotalMinutes,
      modules.reduce((total, module) => total + module.estimatedMinutes, 0),
    ),
    difficulty: normalizeLessonDifficulty(lesson.difficulty),
    modules: modules.map((module, index) => ({
      ...module,
      status: index === 0 ? "active" : module.status === "completed" ? "completed" : "locked",
    })),
    finalQuiz: {
      availableAfterModulesCompleted: true,
      questionCount: normalizePositiveNumber(
        lesson.finalQuiz?.questionCount,
        Math.max(4, modules.length + 1),
      ),
    },
  };
}

function toLegacyQuizQuestion(question: StructuredQuizQuestion): QuizQuestion {
  return {
    question: question.question,
    options: question.options.slice(0, 4),
    answer: question.correctAnswer,
    source: `${question.explanation} Kaynak: PDF sayfa ${question.sourcePage}`,
    explanation: question.explanation,
    topic: question.topic,
    moduleId: question.moduleId,
    difficulty: question.difficulty,
    sourcePage: question.sourcePage,
  };
}

function isLegacyQuizQuestion(value: RawQuizQuestion): value is QuizQuestion {
  return (
    typeof value.question === "string" &&
    Array.isArray(value.options) &&
    value.options.every((option) => typeof option === "string") &&
    value.options.length >= 2 &&
    typeof value.answer === "string" &&
    typeof value.source === "string"
  );
}

function normalizeStringArray(value: unknown, limit: number) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => typeof item === "string")
    .map(sanitizeText)
    .filter((item) => item.length > 6 && !looksLikeRawPdfDump(item))
    .slice(0, limit);
}

function normalizeOptions(options: string[]) {
  return [...new Set(options.map(sanitizeText))]
    .filter((option) => option.length > 2 && !looksLikeRawPdfDump(option))
    .slice(0, 4);
}

function normalizeExamLikelihood(value: unknown): "low" | "medium" | "high" {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : "medium";
}

function normalizeDifficulty(value: unknown): QuizDifficulty {
  return value === "easy" || value === "medium" || value === "hard"
    ? value
    : "medium";
}

function normalizeLessonDifficulty(value: unknown): LessonDifficulty {
  return value === "beginner" || value === "intermediate" || value === "advanced"
    ? value
    : "intermediate";
}

function normalizeBlockType(value: unknown): LessonBlockType {
  const allowed: LessonBlockType[] = [
    "intro",
    "analogy",
    "core_explanation",
    "example",
    "formula",
    "mini_summary",
    "checkpoint",
  ];

  return allowed.includes(value as LessonBlockType)
    ? (value as LessonBlockType)
    : "core_explanation";
}

function normalizeModuleStatus(value: unknown, index: number): LessonModuleStatus {
  if (value === "completed" || value === "active" || value === "locked") {
    return value;
  }

  return index === 0 ? "active" : "locked";
}

function normalizePositiveNumber(value: unknown, fallback: number) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0
    ? Math.round(numberValue)
    : fallback;
}

function normalizeSourcePages(value: unknown) {
  if (!Array.isArray(value)) return [1];
  const pages = value
    .map((page) => Number(page))
    .filter((page) => Number.isFinite(page) && page > 0);

  return [...new Set(pages)].slice(0, 4).length > 0
    ? [...new Set(pages)].slice(0, 4)
    : [1];
}

function normalizePage(value: unknown) {
  const page = Number(value);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function inferKeywords(quiz: StructuredQuizQuestion[]) {
  return [...new Set(quiz.map((question) => question.topic))].slice(0, 8);
}

function sanitizeText(value: unknown) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").replace(/\[Sayfa\s+\d+\]\s*/gi, "").trim()
    : "";
}

function sanitizeLectureTranscript(value: unknown) {
  return typeof value === "string"
    ? value
        .replace(/\[Sayfa\s+\d+\]\s*/gi, "")
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()
    : "";
}

function composeTranscriptFromBlocks(
  title: string,
  blocks: Array<{
    type: LessonBlockType;
    title: string;
    content: string;
    question: string | null;
  }>,
) {
  const blockByType = blocks.reduce<Partial<Record<LessonBlockType, string>>>(
    (items, block) => {
      if (!items[block.type]) items[block.type] = block.content;
      return items;
    },
    {},
  );

  return [
    `Bu konuyu kaçırdıysan ilk bakışta ${title} sadece ezberlenecek bir başlık gibi görünebilir. Ama asıl mesele, PDF'te anlatılan düzenin hangi problemi çözdüğünü fark etmek.`,
    blockByType.core_explanation ?? "",
    blockByType.analogy ?? "",
    blockByType.example ?? "",
    blockByType.formula ?? "",
    blockByType.mini_summary ?? "",
    "Buraya kadar kafana yatmayan veya tekrar etmemi istediğin bir yer var mı?",
  ]
    .filter((section) => section.trim().length > 20)
    .join("\n\n");
}

function isStrongLectureTranscript(text: string, sourcePages: number[]) {
  if (countWords(text) < 600) return false;
  if (sourcePages.length === 0) return false;
  if (looksLikeRawPdfDump(text)) return false;
  if (hasRepeatedSentences(text)) return false;
  if (hasBannedLectureLabel(text)) return false;
  if (hasBannedGenericLecturePhrase(text)) return false;
  if (!startsWithProblemHook(text)) return false;
  if (
    !/kafana yatmayan(?: veya tekrar etmemi istediğin)? bir yer var mı\??$/i.test(
      text.trim(),
    )
  ) {
    return false;
  }

  const normalized = text.toLocaleLowerCase("tr");
  const hasExample = /örnek|mesela|diyelim/.test(normalized);
  const hasExamAngle = /sınavda|vizede|finalde|hoca/.test(normalized);

  return hasExample && hasExamAngle;
}

function countWords(value: string) {
  return value.split(/\s+/).filter(Boolean).length;
}

function hasRepeatedSentences(value: string) {
  const sentences = value
    .split(/[.!?]\s+/)
    .map((sentence) => sentence.toLocaleLowerCase("tr").replace(/\s+/g, " ").trim())
    .filter((sentence) => sentence.length > 35);
  const seen = new Set<string>();

  for (const sentence of sentences) {
    if (seen.has(sentence)) return true;
    seen.add(sentence);
  }

  return false;
}

function hasBannedLectureLabel(value: string) {
  return /(^|\n)\s*(Giriş|Kavramın mantığı|Teknik açıklama|PDF'?i okurken|PDF’yi okurken|Mini özet|Neden önemli|Günlük hayat analojisi|Kontrol noktası)\s*:?\s*(\n|$)/i.test(
    value,
  );
}

function hasBannedGenericLecturePhrase(value: string) {
  return /tanım ilk durak değil|PDF kelimeleri kopuk görünür|hoca uzun metin beklemez|önce problem sonra mantık sonra örnek/i.test(
    value,
  );
}

function startsWithProblemHook(value: string) {
  const firstSentence = value.split(/[.!?]\s+/)[0] ?? "";
  if (!firstSentence.trim()) return false;

  return (
    /\?/.test(firstSentence) ||
    /\b(hiç düşündün mü|ilk bakışta|asıl ilginç olan|zor kısım|var;|görünür;|neden)\b/i.test(
      firstSentence,
    )
  );
}

function cleanTeachingTitle(title: string) {
  const cleaned = title
    .replace(/\s+başlığının\s+ne\s+anlattığını\s+açıklayabilmek\b/gi, "")
    .replace(/\s+konusunun\s+ne\s+anlattığını\s+açıklayabilmek\b/gi, "")
    .replace(/\s+konusunu\s+açıklayabilmek\b/gi, "")
    .replace(/\bKonusu\b/gi, "Temelleri")
    .replace(/\bEach Line\b/gi, "")
    .replace(/\bOther\b/gi, "")
    .replace(/\bCommand\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned || isWeakTeachingTitle(cleaned)) {
    return "PDF'in Ana Mantığı";
  }

  return cleaned;
}

function isWeakTeachingTitle(title: string) {
  const normalized = title.toLocaleLowerCase("tr").trim();
  if (normalized === "pdf'in ana mantığı") return false;

  return (
    normalized.split(/\s+/).length < 2 ||
    /^(other|command|file|chapter|notes?|sayfa|the|and|for)\b/i.test(normalized) ||
    /\b(each line|konusu|other|command)\b/i.test(normalized)
  );
}

function looksLikeRawPdfDump(value: string) {
  return (
    /\b(Chapter|File Systems|Unix File|Other|Command)\b/i.test(value) ||
    /[$#{};=]|\\n|echo|for\s+.*\s+in|then|fi|done/i.test(value)
  );
}

function limitText(text: string, maxLength = 18000) {
  return text.length > maxLength ? `${text.slice(0, maxLength)}\n[Metin kısaltıldı]` : text;
}
