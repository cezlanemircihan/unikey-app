export type ExamLikelihood = "low" | "medium" | "high";

export type QuizDifficulty = "easy" | "medium" | "hard";

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  source: string;
  explanation?: string;
  topic?: string;
  moduleId?: string;
  difficulty?: QuizDifficulty;
  sourcePage?: number;
};

export type StudyTopic = {
  title: string;
  shortDescription: string;
  whyImportant: string;
  examLikelihood: ExamLikelihood;
  sourcePages: number[];
};

export type StudySummary = {
  shortOverview: string;
  mustKnow: string[];
  keyConcepts: Array<{
    term: string;
    explanation: string;
    sourcePage: number;
  }>;
  examStyleQuestions: string[];
  commonConfusions: string[];
  flashcards: Array<{
    front: string;
    back: string;
  }>;
};

export type DocumentAnalysis = {
  documentTitle: string;
  mainSubject: string;
  coreProblem: string;
  importantConcepts: string[];
  irrelevantOrLowPriorityParts: string[];
  examRelevantParts: string[];
  sourcePageMap: Array<{
    page: number;
    concepts: string[];
  }>;
};

export type ConceptGraphNode = {
  concept: string;
  dependsOn: string[];
  relatedTo: string[];
  whyItMatters: string;
};

export type StructuredQuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  moduleId?: string;
  difficulty: QuizDifficulty;
  sourcePage: number;
};

export type LessonDifficulty = "beginner" | "intermediate" | "advanced";

export type LessonModuleStatus = "locked" | "active" | "completed";

export type LessonBlockType =
  | "intro"
  | "analogy"
  | "core_explanation"
  | "example"
  | "formula"
  | "mini_summary"
  | "checkpoint";

export type LessonBlock = {
  type: LessonBlockType;
  title: string;
  content: string;
  question: string | null;
  options: string[] | null;
  correctAnswer: string | null;
  explanation: string | null;
};

export type LessonModule = {
  id: string;
  title: string;
  goal: string;
  whyThisModuleExists: string;
  dependsOn: string[];
  examAngle: string;
  estimatedMinutes: number;
  learningGoals: string[];
  prerequisites: string[];
  sourcePages: number[];
  status: LessonModuleStatus;
  lectureTranscript: string;
  lessonText?: string;
  blocks: LessonBlock[];
};

export type AiLesson = {
  lessonTitle: string;
  courseTitle: string;
  moduleCountReason: string;
  estimatedTotalMinutes: number;
  difficulty: LessonDifficulty;
  documentAnalysis?: DocumentAnalysis;
  conceptGraph?: ConceptGraphNode[];
  modules: LessonModule[];
  finalQuiz: {
    availableAfterModulesCompleted: true;
    questionCount: number;
  };
};

export type QuizResultAnalysis = {
  score: number;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  strongTopics: string[];
  weakTopics: string[];
  mistakePatterns: string[];
  recommendedReviewMinutes: number;
  nextActions: string[];
  coachMessage: string;
  wrongAnswers: WrongAnswerAnalysis[];
  shortFeedback: string;
};

export type WrongAnswerAnalysis = {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  topic: string;
  whyWrong: string;
  miniExplanation: string;
  reviewHint: string;
  sourcePage: number;
};

export type OutputQualityReport = {
  score: number;
  checks: {
    naturalTopicTitles: boolean;
    topicDescriptionsComplete: boolean;
    summaryMustKnowComplete: boolean;
    summaryFieldsComplete: boolean;
    quizExplanationsComplete: boolean;
    quizTopicsComplete: boolean;
    quizSourcePagesComplete: boolean;
    weakTopicsReady: boolean;
    lessonModulesReady: boolean;
    lectureTranscriptDeepEnough: boolean;
    lectureTranscriptNaturalFlow: boolean;
    lectureTranscriptProblemFirst: boolean;
    lectureTranscriptExamplePresent: boolean;
    lectureTranscriptExamAnglePresent: boolean;
    lectureTranscriptNoBannedLabels: boolean;
    lectureTranscriptNoRepeatedSentences: boolean;
    lectureTranscriptEndsWithQuestion: boolean;
    lessonTitlesClean: boolean;
    lessonSourcePagesComplete: boolean;
    quizModuleLinksComplete: boolean;
  };
  warnings: string[];
};

const stopWords = new Set([
  "acaba",
  "access",
  "accessed",
  "ama",
  "ancak",
  "anlamaya",
  "aynı",
  "bazı",
  "beri",
  "bile",
  "bir",
  "biri",
  "birkaç",
  "böyle",
  "adım",
  "adımları",
  "adimlari",
  "bu",
  "buna",
  "bunda",
  "bundan",
  "bunu",
  "icin",
  "çok",
  "cok",
  "çalışma",
  "calisma",
  "daha",
  "de",
  "defa",
  "distinguish",
  "ders",
  "dersi",
  "diye",
  "doküman",
  "dokümanı",
  "dokumani",
  "en",
  "exam",
  "exams",
  "fakat",
  "files",
  "final",
  "from",
  "gibi",
  "genellikle",
  "hem",
  "hep",
  "her",
  "için",
  "ile",
  "ise",
  "kadar",
  "kullanımını",
  "kullanimini",
  "ki",
  "mı",
  "mu",
  "mü",
  "nasıl",
  "ne",
  "neden",
  "nerede",
  "o",
  "onemlidir",
  "pdf",
  "olarak",
  "olan",
  "oldu",
  "olur",
  "often",
  "occur",
  "over",
  "problems",
  "remote",
  "yarar",
  "önce",
  "sonra",
  "sürecinde",
  "surecinde",
  "süresini",
  "suresini",
  "sınavda",
  "sinavda",
  "test",
  "students",
  "useful",
  "şey",
  "sey",
  "şu",
  "su",
  "ve",
  "veya",
  "ya",
]);

type PageChunk = {
  page: number;
  text: string;
};

type TopicTemplate = {
  title: string;
  shortDescription: string;
  whyImportant: string;
  examLikelihood: ExamLikelihood;
  pattern: RegExp;
};

const topicTemplates: TopicTemplate[] = [
  {
    title: "UNIX Dosya Sistemi Temelleri",
    shortDescription:
      "UNIX'in dosyaları ve dizinleri hiyerarşik bir yapı içinde nasıl düzenlediğini açıklar.",
    whyImportant:
      "Dosya sistemi mantığı anlaşılmadan path, dizin, yetki ve dosya işlemleri soruları sağlıklı çözülemez.",
    examLikelihood: "high",
    pattern: /file systems?|unix file|filesystem|dosya sistemi/i,
  },
  {
    title: "Working Directory ve Path Mantığı",
    shortDescription:
      "Komutların hangi dizinde çalıştığını ve göreli yolların nasıl yorumlandığını anlatır.",
    whyImportant:
      "Sınavlarda komut çıktısı yorumlama ve dosya yolu takip etme soruları sıkça bu mantığa dayanır.",
    examLikelihood: "high",
    pattern: /working directory|current directory|path|pathname|çalışma dizini|dizin yolu/i,
  },
  {
    title: "UNIX'te Everything is a File Yaklaşımı",
    shortDescription:
      "UNIX'te sıradan dosyaların, dizinlerin ve bazı aygıtların ortak dosya arayüzüyle ele alınmasını açıklar.",
    whyImportant:
      "Bu yaklaşım UNIX felsefesinin temelidir ve sistem kaynaklarının neden dosya gibi yönetildiğini açıklar.",
    examLikelihood: "high",
    pattern: /everything.*file|regular file|device file|special file|her şey dosya/i,
  },
  {
    title: "Dosya Türleri ve Dizin Yapısı",
    shortDescription:
      "Sıradan dosya, dizin, bağlantı ve aygıt dosyası gibi yapıların farklarını özetler.",
    whyImportant:
      "Dosya türlerini ayırt etmek hem komut yorumlama hem de sistem programlama sorularında kritik olur.",
    examLikelihood: "medium",
    pattern: /file types?|regular file|directory|symbolic link|hard link|dosya tür/i,
  },
  {
    title: "NFS ve Ağ Dosya Sistemleri",
    shortDescription:
      "Uzak makinelerdeki dosyaların yerel dosya sistemi gibi kullanılmasını sağlayan yaklaşımı anlatır.",
    whyImportant:
      "Yerel ve uzak dosya erişimi farkı, dağıtık sistemler ve işletim sistemi sınavlarında ayırt edici bir konudur.",
    examLikelihood: "medium",
    pattern: /\bnfs\b|network file|ağ dosya|remote file/i,
  },
  {
    title: "Socket Programlamaya Giriş",
    shortDescription:
      "İki programın ağ üzerinden haberleşmesi için kullanılan socket kavramını açıklar.",
    whyImportant:
      "Client-server yapısı, ağ iletişimi ve sistem programlama soruları genellikle socket mantığına bağlanır.",
    examLikelihood: "high",
    pattern: /socket|sockaddr|client|server/i,
  },
  {
    title: "TCP Bağlantısı ve Güvenilir İletim",
    shortDescription:
      "TCP'nin iki uç arasında sıralı ve güvenilir veri aktarımı kurmasını anlatır.",
    whyImportant:
      "Bağlantı kurma, veri iletimi ve hata kontrolü soruları TCP'nin temel rolünü bilmeyi gerektirir.",
    examLikelihood: "high",
    pattern: /tcp connection|\btcp\b|reliable|connection/i,
  },
  {
    title: "Portlar, IP Adresleri ve Uygulamaya Yönlendirme",
    shortDescription:
      "Ağdan gelen verinin doğru makineye ve doğru uygulamaya nasıl ulaştığını açıklar.",
    whyImportant:
      "Port ve adres ayrımı karıştırılırsa client-server sorularında yanlış yorum yapılır.",
    examLikelihood: "medium",
    pattern: /port|ip address|address|adres/i,
  },
  {
    title: "Byte Order ve Veri Temsili",
    shortDescription:
      "Farklı makinelerin çok baytlı sayıları bellekte hangi sırayla tuttuğunu açıklar.",
    whyImportant:
      "Ağ programlamada verinin iki makine arasında yanlış yorumlanmaması için byte order bilinmelidir.",
    examLikelihood: "medium",
    pattern: /byte order|endianness|network byte/i,
  },
  {
    title: "İşlem ve Zamanlama Mantığı",
    shortDescription:
      "Programların işlem olarak nasıl çalıştırıldığını ve CPU zamanının nasıl paylaştırıldığını anlatır.",
    whyImportant:
      "İşletim sistemi sınavlarında süreç, thread ve scheduling ayrımı temel kazanımdır.",
    examLikelihood: "medium",
    pattern: /process|thread|scheduling|işlem|süreç/i,
  },
  {
    title: "Bellek Yönetimi Temelleri",
    shortDescription:
      "Programların belleği nasıl kullandığını ve işletim sisteminin bunu nasıl yönettiğini açıklar.",
    whyImportant:
      "Paging, sanal bellek ve bellek koruması gibi konuların ortak temelini oluşturur.",
    examLikelihood: "medium",
    pattern: /memory|paging|virtual memory|bellek/i,
  },
];

export function cleanText(text: string) {
  return text
    .replace(/\s+/g, " ")
    .replace(/([.!?])\s+/g, "$1 ")
    .trim();
}

export function splitSentences(text: string) {
  return cleanText(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 45 && sentence.length < 420);
}

export function extractKeywords(text: string, limit = 10) {
  const counts = new Map<string, number>();
  const phraseCounts = new Map<string, number>();
  const words = cleanText(text)
    .toLocaleLowerCase("tr")
    .match(/[a-zçğıöşü0-9]{2,}/gi);

  for (const word of words ?? []) {
    const normalized = word.toLocaleLowerCase("tr");
    if (normalized.length < 4 || stopWords.has(normalized)) continue;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  const normalizedWords = (words ?? [])
    .map((word) => word.toLocaleLowerCase("tr"))
    .map((word) => word.replace(/^[^a-zçğıöşü0-9]+|[^a-zçğıöşü0-9]+$/gi, ""));

  for (let index = 0; index < normalizedWords.length - 1; index += 1) {
    const current = normalizedWords[index];
    const next = normalizedWords[index + 1];

    if (current === "on" && next === "isleme") {
      phraseCounts.set("on isleme", (phraseCounts.get("on isleme") ?? 0) + 1);
      continue;
    }

    if (!isMeaningfulTerm(current) || !isMeaningfulTerm(next)) continue;
    if (isLikelyBadPhrase(current, next)) continue;

    const phrase = `${current} ${next}`;
    if (current === next) continue;
    phraseCounts.set(phrase, (phraseCounts.get(phrase) ?? 0) + 1);
  }

  const phrases = [...phraseCounts.entries()]
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "tr"))
    .slice(0, Math.ceil(limit / 2))
    .map(([phrase]) => phrase);

  const singles = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .filter(
      (word) =>
        !phrases.some((phrase) => phrase.split(" ").includes(word)) &&
        !/^(bilimi|algoritmalari|temelleri)$/i.test(word),
    )
    .slice(0, limit - phrases.length);

  return [...phrases, ...singles].slice(0, limit);
}

export function extractSingleKeywords(text: string, limit = 10) {
  const counts = new Map<string, number>();
  const words = cleanText(text)
    .toLocaleLowerCase("tr")
    .match(/[a-zçğıöşü0-9]{2,}/gi);

  for (const word of words ?? []) {
    const normalized = word.toLocaleLowerCase("tr");
    if (normalized.length < 4 || stopWords.has(normalized)) continue;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

export function buildTopics(text: string, limit = 8): StudyTopic[] {
  const pages = splitPages(text);
  const curated: StudyTopic[] = [];

  for (const template of topicTemplates) {
    const matchingPages = pages
      .filter((page) => template.pattern.test(page.text))
      .map((page) => page.page);

    if (matchingPages.length === 0) continue;

    curated.push({
      title: template.title,
      shortDescription: template.shortDescription,
      whyImportant: template.whyImportant,
      examLikelihood: template.examLikelihood,
      sourcePages: uniqueNumbers(matchingPages).slice(0, 3),
    });
  }

  if (curated.length >= Math.min(5, limit)) {
    return curated.slice(0, limit);
  }

  const fallbackTopics = extractKeywords(text, limit * 2)
    .map((keyword) => buildFallbackTopic(keyword, pages))
    .filter((topic) => topic.title.length > 4 && !isWeakTopicTitle(topic.title));

  const topics = [...curated, ...fallbackTopics].filter(
    (topic, index, array) =>
      array.findIndex((candidate) => candidate.title === topic.title) === index,
  );

  if (topics.length > 0) {
    const specificTopics =
      topics.length > 1
        ? topics.filter((topic) => topic.title !== "PDF'in Ana Mantığı")
        : topics;

    return specificTopics.slice(0, limit);
  }

  return [
    {
      title: "PDF'in Ana Mantığı",
      shortDescription:
        "Bu dokümanda geçen temel kavramları sınav öncesi anlaşılır başlıklara ayırır.",
      whyImportant:
        "PDF'ten net konu başlığı çıkarılamasa bile ana fikirleri düzenli çalışmak gerekir.",
      examLikelihood: "medium",
      sourcePages: [1],
    },
  ];
}

export function buildStructuredSummary(text: string, courseName: string): StudySummary {
  const sentences = splitSentences(text);

  if (sentences.length === 0) {
    return {
      shortOverview:
        "Bu PDF'ten özet çıkarabilecek kadar okunabilir metin alınamadı. PDF taranmış görsel olabilir; sonraki adımda OCR desteği gerekebilir.",
      mustKnow: [
        "PDF metni seçilebilir değilse yapay zeka içerikleri güvenilir biçimde analiz edemez.",
        "Daha iyi sonuç için metin seçilebilen bir PDF yüklemek gerekir.",
        "Taranmış dosyalar için OCR desteği ayrı bir geliştirme konusudur.",
      ],
      keyConcepts: [],
      examStyleQuestions: [
        "Bu PDF'ten neden sağlıklı özet çıkarılamadı?",
      ],
      commonConfusions: [
        "PDF'in açılması ile PDF içindeki metnin okunabilir olması aynı şey değildir.",
      ],
      flashcards: [
        {
          front: "PDF metni okunamıyorsa ne yapılmalı?",
          back: "Metin seçilebilen PDF yüklenmeli veya OCR ile metin çıkarılmalıdır.",
        },
      ],
    };
  }

  const topics = buildTopics(text, 8);
  const primaryTopics = topics.slice(0, 3);
  const topicNames = primaryTopics.map((topic) => topic.title).join(", ");

  return {
    shortOverview:
      `Bu PDF, ${courseName} dersi için özellikle ${topicNames} başlıklarını sınavda anlatılabilir hale getiriyor. ` +
      "Öğrenci açısından odak, ham PDF cümlelerini ezberlemek değil; kavramların ne işe yaradığını, nerede karıştırıldığını ve hocanın nasıl sorabileceğini anlamak.",
    mustKnow: topics.slice(0, 3).map(
      (topic) => `${topic.title}: ${topic.shortDescription}`,
    ),
    keyConcepts: topics.slice(0, 5).map((topic) => ({
      term: topic.title,
      explanation: explainTopic(topic.title, topic.shortDescription),
      sourcePage: firstSourcePage(topic),
    })),
    examStyleQuestions: buildLikelyExamQuestions(topics.map((topic) => topic.title)).slice(0, 3),
    commonConfusions: buildCommonConfusions(topics).slice(0, 3),
    flashcards: topics.slice(0, 5).map((topic) => ({
      front: `${topic.title} sınavda nasıl açıklanır?`,
      back: `${topic.shortDescription} ${topic.whyImportant}`,
    })),
  };
}

export function formatStructuredSummary(summary: StudySummary) {
  return [
    "Bu PDF ne anlatıyor?",
    summary.shortOverview,
    "",
    "Mutlaka bil",
    ...summary.mustKnow.slice(0, 3).map((item, index) => `${index + 1}. ${item}`),
    "",
    "Sınavda çıkabilecek sorular",
    ...summary.examStyleQuestions.slice(0, 3).map((question) => `• ${question}`),
    "",
    "Hoca nereden sorabilir?",
    ...summary.keyConcepts.slice(0, 2).map(
      (concept) =>
        `• ${concept.term} konusunun tanımını, amacını ve örnek kullanımını sorabilir. Kaynak: PDF sayfa ${concept.sourcePage}`,
    ),
    "",
    "Karıştırılan noktalar",
    ...summary.commonConfusions.slice(0, 3).map((item) => `• ${item}`),
  ].join("\n");
}

export function buildSummary(text: string, courseName: string) {
  return formatStructuredSummary(buildStructuredSummary(text, courseName));
}

export function buildDocumentAnalysis(
  text: string,
  courseName: string,
): DocumentAnalysis {
  const topics = buildTopics(text, 10);
  const pages = splitPages(text);
  const primaryTopic = topics[0];

  return {
    documentTitle: `${courseName} dokümanı`,
    mainSubject: primaryTopic?.title ?? "PDF'in ana konusu",
    coreProblem:
      primaryTopic?.whyImportant ??
      "Dokümandaki kavramların hangi problemi çözmek için anlatıldığını ayırmak gerekir.",
    importantConcepts: topics.map((topic) => topic.title).slice(0, 10),
    irrelevantOrLowPriorityParts: extractLowPriorityParts(text),
    examRelevantParts: topics
      .filter((topic) => topic.examLikelihood !== "low")
      .map((topic) => `${topic.title}: ${topic.whyImportant}`)
      .slice(0, 8),
    sourcePageMap: pages.slice(0, 12).map((page) => ({
      page: page.page,
      concepts: topics
        .filter((topic) =>
          topic.sourcePages.includes(page.page) ||
          topic.title
            .split(/\s+/)
            .some((part) => part.length > 4 && page.text.toLocaleLowerCase("tr").includes(part.toLocaleLowerCase("tr"))),
        )
        .map((topic) => topic.title)
        .slice(0, 5),
    })),
  };
}

export function buildConceptGraph(topics: StudyTopic[]): ConceptGraphNode[] {
  return topics.slice(0, 10).map((topic, index, list) => ({
    concept: topic.title,
    dependsOn: index === 0 ? [] : [list[index - 1].title],
    relatedTo: list
      .filter((candidate, candidateIndex) => candidateIndex !== index)
      .filter((candidate) => shareConceptWords(topic.title, candidate.title))
      .map((candidate) => candidate.title)
      .slice(0, 3),
    whyItMatters: topic.whyImportant,
  }));
}

export function buildLesson(text: string, courseName: string): AiLesson {
  const topics = buildTopics(text, 10);
  const usableTopics =
    topics.length > 0
      ? topics
      : [
          {
            title: "PDF'in Ana Mantığı",
            shortDescription:
              "Bu dokümandaki ana fikri parçalara ayırıp sınav öncesi anlaşılır hale getirir.",
            whyImportant:
              "Konu başlıkları net çıkmasa bile öğrenciye adım adım çalışma yolu vermek gerekir.",
            examLikelihood: "medium" as const,
            sourcePages: [1],
          },
        ];
  const moduleCount = decideModuleCount(usableTopics);
  const documentAnalysis = buildDocumentAnalysis(text, courseName);
  const conceptGraph = buildConceptGraph(usableTopics);
  const modules = usableTopics.slice(0, moduleCount).map((topic, index) =>
    buildLessonModule(topic, courseName, index, usableTopics, conceptGraph),
  );

  return {
    lessonTitle: `${courseName} AI Dersi`,
    courseTitle: courseName,
    moduleCountReason: buildModuleCountReason(moduleCount, usableTopics),
    estimatedTotalMinutes: modules.reduce(
      (total, module) => total + module.estimatedMinutes,
      0,
    ),
    difficulty: inferLessonDifficulty(usableTopics),
    documentAnalysis,
    conceptGraph,
    modules,
    finalQuiz: {
      availableAfterModulesCompleted: true,
      questionCount: Math.max(4, Math.min(10, modules.length + 2)),
    },
  };
}

export function buildModuleLecture({
  module,
  lesson,
  text,
  mode = "default",
}: {
  module: LessonModule;
  lesson?: AiLesson;
  text: string;
  mode?: "default" | "repeat" | "simple" | "example";
}) {
  const sourceText = extractModuleSourceText(text, module.sourcePages);
  const contextTopics =
    lesson?.modules
      .filter((candidate) => candidate.id !== module.id)
      .map((candidate) => candidate.title)
      .slice(0, 4) ?? [];
  const hook = buildSpecificProblemHook(module.title);
  const conceptExplanation = explainTopic(module.title, module.goal);
  const example = buildContextualExample(module.title, sourceText, mode);
  const examAngle = module.examAngle || buildExamAngle(module.title, module.sourcePages);
  const commonMistake = buildModuleCommonMistake(module.title);
  const answerShape = buildModuleAnswerShape(module.title);
  const pageContext = buildSourcePageContext(sourceText, module.sourcePages);
  const tonePrefix =
    mode === "simple"
      ? "Bunu daha sade kurarsak, "
      : mode === "example"
        ? "Bu kez konuyu örnek üzerinden ilerletelim: "
        : mode === "repeat"
          ? "Aynı modülü bir kez daha ama daha toparlı biçimde düşünelim: "
          : "";
  const relatedText = contextTopics.length
    ? `Bu modül, özellikle ${contextTopics.join(", ")} başlıklarıyla karıştırılmamalı; onlar yakın dursa da burada odak ${module.title} için çözülen problem.`
    : "Bu modülde tek hedef, kavramı kendi problemi içinde netleştirmek.";

  return [
    `${tonePrefix}${hook} ${module.whyThisModuleExists} Bu yüzden ${module.title} başlığını bir isim gibi değil, belirli bir ihtiyaca verilen cevap gibi ele alacağız.`,
    `${conceptExplanation} Bu noktada kavramı sadece tanım gibi okumak zayıf kalır. Sistemin neyi ayırt etmeye çalıştığını, bu ayrımı hangi kuralla yaptığını ve bu kuralın kullanıcıya nasıl göründüğünü birlikte düşünmek gerekir. ${relatedText} Özellikle teknik derslerde hoca çoğu zaman kavramın adını değil, o kavramın bir durumda nasıl davrandığını ölçer. Bu yüzden burada önemli olan, ${module.title} ifadesinin arkasındaki mekanizmayı kendi cümlenle kurabilmen.`,
    `${pageContext} Bu parçadan çıkarılacak ana fikir şu: PDF'te geçen komut, yapı veya terim tek başına değerli değil; hangi davranışı görünür yaptığı için değerli. Bir sınav cevabında kaynak sayfadaki ifadeyi birebir kopyalamak yerine, onu kısa bir durumla ilişkilendirmen gerekir. Böyle yaptığında hem tanımı hem de çalışma mantığını aynı anda göstermiş olursun.`,
    `${example} Bu örnek küçük görünebilir ama sınavda çoğu hata tam burada çıkar: öğrenci kavramın adını biliyor, fakat hangi durumda devreye girdiğini anlatamıyor. Örneği doğru kullanmanın yolu, önce verilen durumda sistemin hangi kararı verdiğini söylemek, sonra ${module.title} kavramının bu kararı nasıl mümkün kıldığını açıklamaktır. Bu bağlantıyı kurduğunda cevap “ezber tanım” olmaktan çıkar ve hocanın beklediği yorum seviyesine yaklaşır.`,
    `${commonMistake} Bu karışıklığı önlemek için kavramı üç soruyla kontrol edebilirsin: burada hangi nesne veya işlem var, sistem bu nesneye nasıl ulaşıyor, sonuç kullanıcıya nasıl yansıyor? Bu üç soruya cevap verebiliyorsan modülün ana omurgası yerine oturmuş demektir. Veremiyorsan genellikle sorun kavramı bilmemek değil, kavramın hangi bağlamda çalıştığını kaçırmaktır.`,
    `${examAngle} ${answerShape} Böyle bir soru geldiğinde cevabı ezber cümlesiyle başlatmak yerine verilen durumun ne olduğunu kurmak daha güvenli olur. Ardından bu modüldeki kavramın o durumda hangi rolü üstlendiğini söylersin. Son cümlede de küçük bir örnek verirsen cevap sınav diliyle tamamlanmış olur.`,
    `Bu modülde özellikle şunu netleştir: ${module.goal} Kaynak sayfalar: ${module.sourcePages.join(", ")}. Bu hedefe ulaşmak için kavramın tanımını, hangi problemi çözdüğünü, PDF'teki örnekte nasıl göründüğünü ve sınavda hangi açıdan sorulabileceğini birlikte tutman gerekiyor. Kendini kontrol etmek için bu başlığı bir arkadaşına iki dakikada anlatmaya çalış: verilen durumu açıkla, kavramın rolünü belirt ve küçük bir örnekle sonucu görünür hale getir. Bunu yapabiliyorsan modül işlevini yerine getirmiştir. Buraya kadar kafana yatmayan veya tekrar etmemi istediğin bir yer var mı?`,
  ].join("\n\n");
}

export function attachQuizToLesson(
  quiz: QuizQuestion[],
  lesson: AiLesson,
): QuizQuestion[] {
  if (lesson.modules.length === 0) return quiz;

  return quiz.map((question, index) => {
    const lessonModule = findModuleForTopic(lesson, question.topic, index);

    return {
      ...question,
      moduleId: question.moduleId ?? lessonModule.id,
      topic: question.topic ?? lessonModule.title,
    };
  });
}

export function answerFromText(text: string, question: string) {
  const sentences = splitSentences(text);
  const questionWords = new Set(extractKeywords(question, 8));

  if (sentences.length === 0 || questionWords.size === 0) {
    return "Bu soruya cevap verebilmem için PDF'ten yeterli metin veya soruda yeterli anahtar ifade bulunamadı.";
  }

  const matches = sentences
    .map((sentence) => {
      const lower = sentence.toLocaleLowerCase("tr");
      let score = 0;
      for (const word of questionWords) {
        if (lower.includes(word)) score += 1;
      }
      return { sentence, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  if (matches.length === 0) {
    return "Bu sorunun cevabını yüklenen PDF içinde net biçimde bulamadım. Soruyu PDF'teki kavram adını kullanarak biraz daha spesifik sorarsan daha iyi yakalayabilirim.";
  }

  return [
    "PDF Asistanı cevabı:",
    ...matches.map((match) => `• ${toTurkishTeachingSentence(match.sentence)}`),
    "Kaynak: PDF'teki ilgili ifade",
  ].join("\n");
}

export function buildStructuredQuiz(
  text: string,
  courseName: string,
): StructuredQuizQuestion[] {
  const sentences = splitSentences(text);
  const topics = buildTopics(text, 6);

  if (sentences.length === 0) {
    return [
      {
        question: "Bu PDF için neden güvenilir quiz üretilemedi?",
        options: [
          "PDF'ten okunabilir metin çıkarılamadığı için",
          "Ders adı çok uzun olduğu için",
          "Kayıt ekranı tamamlanmadığı için",
          "Quiz sadece final haftasında üretildiği için",
        ],
        correctAnswer: "PDF'ten okunabilir metin çıkarılamadığı için",
        explanation:
          "Doğru cevap budur; çünkü soru üretmek için PDF içeriğinin metin olarak okunabilmesi gerekir.",
        topic: "PDF Metin Okunabilirliği",
        difficulty: "easy",
        sourcePage: 1,
      },
    ];
  }

  const questions = topics.slice(0, 5).map((topic, index) => {
    return buildQuestionForTopic(topic, topics, index);
  });

  return questions.length > 0
    ? questions
    : [buildQuestionForTopic(buildTopics(courseName, 1)[0], topics, 0)];
}

export function buildQuiz(text: string, courseName: string): QuizQuestion[] {
  return buildStructuredQuiz(text, courseName).map((question) => ({
    question: question.question,
    options: question.options,
    answer: question.correctAnswer,
    source: question.explanation,
    explanation: question.explanation,
    topic: question.topic,
    moduleId: question.moduleId,
    difficulty: question.difficulty,
    sourcePage: question.sourcePage,
  }));
}

export function buildQuizResultAnalysis(
  quiz: QuizQuestion[],
  selectedAnswers: Record<number, string>,
  fallbackTopics: string[] = [],
): QuizResultAnalysis {
  const analyzed = quiz
    .map((question, index) => ({
      question,
      selected: selectedAnswers[index],
      index,
      topic: resolveQuestionTopic(question, fallbackTopics, index),
    }));
  const correctItems = analyzed.filter(
    (item) => item.selected === item.question.answer,
  );
  const wrongItems = analyzed.filter(
    (item) => item.selected !== item.question.answer,
  );
  const score = quiz.length > 0 ? Math.round((correctItems.length / quiz.length) * 100) : 0;
  const strongTopics = uniqueStrings(
    correctItems.map((item) => item.topic),
  ).slice(0, 4);
  const weakTopics = uniqueStrings(
    wrongItems.map((item) => item.topic),
  ).slice(0, 4);
  const wrongAnswers = wrongItems.map((item) =>
    buildWrongAnswerAnalysis(
      item.question,
      item.selected ?? "",
      item.topic,
      item.index,
      fallbackTopics,
    ),
  );
  const answeredCount = analyzed.filter((item) => item.selected).length;
  const mistakePatterns = buildMistakePatterns(wrongAnswers, quiz.length, answeredCount);
  const recommendedReviewMinutes = calculateReviewMinutes(wrongAnswers.length, weakTopics.length);
  const nextActions = buildNextActions(weakTopics, wrongAnswers.length);
  const coachMessage =
    wrongAnswers.length > 0
      ? `${weakTopics.join(", ")} konuları kısa bir tekrar istiyor. Önce yanlış açıklamalarını oku, sonra mini quiz ile tekrar dene.`
      : "Bu quizde belirgin zayıf konu görünmüyor. Aynı materyalden biraz daha zor sorular çözerek pekiştirebilirsin.";

  return {
    score,
    totalQuestions: quiz.length,
    correctCount: correctItems.length,
    wrongCount: wrongAnswers.length,
    strongTopics,
    weakTopics,
    mistakePatterns,
    recommendedReviewMinutes,
    nextActions,
    coachMessage,
    wrongAnswers,
    shortFeedback: coachMessage,
  };
}

export function buildWeakTopicMiniQuiz(
  quiz: QuizQuestion[],
  selectedAnswers: Record<number, string>,
  fallbackTopics: string[] = [],
): QuizQuestion[] {
  const analysis = buildQuizResultAnalysis(quiz, selectedAnswers, fallbackTopics);
  const weakTopicSet = new Set(analysis.weakTopics);
  const weakQuestions = quiz.filter((question, index) =>
    weakTopicSet.has(resolveQuestionTopic(question, fallbackTopics, index)),
  );
  const baseQuestions = weakQuestions.length > 0 ? weakQuestions : quiz.slice(0, 3);

  return baseQuestions.slice(0, 5).map((question, index) => {
    const topic = resolveQuestionTopic(question, fallbackTopics, index);
    const sourcePage = resolveSourcePage(question);
    const correctAnswer = question.answer || question.options[0] || "Doğru cevap";
    const options = shuffleOptions([
      correctAnswer,
      ...question.options.filter((option) => option !== correctAnswer),
      "Kavramın yalnızca adını ezberlemek yeterlidir",
      "Bu konu sınav sorularında yorum gerektirmez",
    ]).slice(0, 4);

    return {
      ...question,
      question: `${topic} için tekrar sorusu: Bu kavramı en doğru açıklayan ifade hangisidir?`,
      options: options.includes(correctAnswer)
        ? options
        : [correctAnswer, ...options].slice(0, 4),
      answer: correctAnswer,
      source:
        question.explanation ??
        question.source ??
        `${topic} konusu kısa tekrar gerektiriyor. Kaynak: PDF sayfa ${sourcePage}`,
      explanation:
        question.explanation ??
        `Bu soruda amaç ${topic} kavramının ne işe yaradığını tekrar netleştirmek. Kaynak: PDF sayfa ${sourcePage}`,
      topic,
      difficulty: question.difficulty ?? "medium",
      sourcePage,
    };
  });
}

export function calculateOutputQuality({
  topics,
  summary,
  quiz,
  lesson,
}: {
  topics: StudyTopic[];
  summary: StudySummary;
  quiz: QuizQuestion[];
  lesson?: AiLesson;
}): OutputQualityReport {
  const generatedLectureModules = (lesson?.modules ?? []).filter(
    (module) => readLectureTranscript(module).trim().length > 0,
  );
  const checks = {
    naturalTopicTitles:
      topics.length > 0 &&
      topics.every((topic) => isNaturalTopicTitle(topic.title)),
    topicDescriptionsComplete:
      topics.length > 0 &&
      topics.every(
        (topic) =>
          topic.shortDescription.trim().length > 20 &&
          topic.whyImportant.trim().length > 20,
      ),
    summaryMustKnowComplete: summary.mustKnow.length >= 3,
    summaryFieldsComplete:
      summary.shortOverview.trim().length > 40 &&
      summary.keyConcepts.length >= 3 &&
      summary.examStyleQuestions.length >= 3 &&
      summary.commonConfusions.length >= 1 &&
      summary.flashcards.length >= 3,
    quizExplanationsComplete:
      quiz.length > 0 &&
      quiz.every(
        (question) =>
          (question.explanation ?? question.source ?? "").trim().length > 20,
      ),
    quizTopicsComplete:
      quiz.length > 0 &&
      quiz.every((question) => sanitizeLearningText(question.topic).length > 3),
    quizSourcePagesComplete:
      quiz.length > 0 &&
      quiz.every((question) => resolveSourcePage(question) > 0),
    weakTopicsReady:
      quiz.length > 0 &&
      quiz.some((question) => sanitizeLearningText(question.topic).length > 3),
    lessonModulesReady:
      Boolean(lesson) && (lesson?.modules.length ?? 0) > 0,
    lectureTranscriptDeepEnough:
      generatedLectureModules.length === 0 ||
      generatedLectureModules.every(
        (module) => countWords(readLectureTranscript(module)) >= 600,
      ),
    lectureTranscriptNaturalFlow:
      generatedLectureModules.length === 0 ||
      generatedLectureModules.every((module) =>
        isNaturalLectureTranscript(readLectureTranscript(module)),
      ),
    lectureTranscriptProblemFirst:
      generatedLectureModules.length === 0 ||
      generatedLectureModules.every((module) =>
        startsWithProblemHook(readLectureTranscript(module)),
      ),
    lectureTranscriptExamplePresent:
      generatedLectureModules.length === 0 ||
      generatedLectureModules.every((module) =>
        hasLessonSignal(readLectureTranscript(module), ["örnek", "diyelim", "mesela"]),
      ),
    lectureTranscriptExamAnglePresent:
      generatedLectureModules.length === 0 ||
      generatedLectureModules.every((module) =>
        hasLessonSignal(readLectureTranscript(module), ["sınavda", "vize", "final", "hoca"]),
      ),
    lectureTranscriptNoBannedLabels:
      generatedLectureModules.length === 0 ||
      generatedLectureModules.every(
        (module) =>
          !hasBannedLectureLabel(readLectureTranscript(module)) &&
          !hasBannedGenericLecturePhrase(readLectureTranscript(module)),
      ),
    lectureTranscriptNoRepeatedSentences:
      generatedLectureModules.length === 0 ||
      generatedLectureModules.every(
        (module) => !hasRepeatedSentences(readLectureTranscript(module)),
      ),
    lectureTranscriptEndsWithQuestion:
      generatedLectureModules.length === 0 ||
      generatedLectureModules.every((module) =>
        /kafana yatmayan(?: veya tekrar etmemi istediğin)? bir yer var mı\??$/i.test(
          readLectureTranscript(module).trim(),
        ),
      ),
    lessonTitlesClean:
      Boolean(lesson) &&
      (lesson?.modules ?? []).every((module) => !isWeakTopicTitle(module.title)),
    lessonSourcePagesComplete:
      Boolean(lesson) &&
      (lesson?.modules ?? []).every((module) => module.sourcePages.length > 0),
    quizModuleLinksComplete:
      quiz.length > 0 &&
      quiz.every((question) => sanitizeLearningText(question.moduleId).length > 0),
  };
  const weights: Record<keyof OutputQualityReport["checks"], number> = {
    naturalTopicTitles: 8,
    topicDescriptionsComplete: 8,
    summaryMustKnowComplete: 7,
    summaryFieldsComplete: 7,
    quizExplanationsComplete: 8,
    quizTopicsComplete: 6,
    quizSourcePagesComplete: 6,
    weakTopicsReady: 4,
    lessonModulesReady: 6,
    lectureTranscriptDeepEnough: 8,
    lectureTranscriptNaturalFlow: 5,
    lectureTranscriptProblemFirst: 4,
    lectureTranscriptExamplePresent: 4,
    lectureTranscriptExamAnglePresent: 4,
    lectureTranscriptNoBannedLabels: 4,
    lectureTranscriptNoRepeatedSentences: 3,
    lectureTranscriptEndsWithQuestion: 3,
    lessonTitlesClean: 4,
    lessonSourcePagesComplete: 3,
    quizModuleLinksComplete: 2,
  };
  const rawScore = Object.entries(checks).reduce((total, [key, passed]) => {
    return total + (passed ? weights[key as keyof typeof checks] : 0);
  }, 0);
  const score = Math.min(100, rawScore);
  const warnings = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([key]) => qualityWarningFor(key as keyof typeof checks));

  return {
    score,
    checks,
    warnings,
  };
}

function buildFallbackTopic(keyword: string, pages: PageChunk[]): StudyTopic {
  const title = cleanTeachingTitle(topicTitleFromKeyword(keyword));
  const sourcePages = findPagesForKeyword(pages, keyword);

  return {
    title,
    shortDescription: `${title}, bu PDF'te geçen ve sınav öncesi ayrıca açıklanması gereken başlıklardan biridir.`,
    whyImportant:
      "Bu başlığın tanımı, amacı ve örnek kullanımı bilinirse ilgili sınav soruları daha rahat yorumlanır.",
    examLikelihood: "medium",
    sourcePages,
  };
}

function buildWrongAnswerAnalysis(
  question: QuizQuestion,
  userAnswer: string,
  topic: string,
  index: number,
  fallbackTopics: string[],
): WrongAnswerAnalysis {
  const safeTopic = topic || resolveQuestionTopic(question, fallbackTopics, index);
  const sourcePage = resolveSourcePage(question);
  const miniExplanation = sanitizeLearningText(
    question.explanation || question.source || `${safeTopic} konusunun ana fikri tekrar edilmeli.`,
  );

  return {
    question: question.question || "Soru metni bulunamadı.",
    userAnswer: userAnswer || "Cevap verilmedi",
    correctAnswer: question.answer || "Doğru cevap bilgisi eksik",
    topic: safeTopic,
    whyWrong:
      "Seçilen cevap, sorunun ölçtüğü ana kavramı tam karşılamıyor. Bu konu tanım ve amaç ilişkisiyle birlikte tekrar edilmeli.",
    miniExplanation,
    reviewHint: `${safeTopic} için önce kısa tanımı oku, sonra "ne işe yarar?" ve "sınavda nasıl sorulur?" sorularına cevap ver.`,
    sourcePage,
  };
}

function buildMistakePatterns(
  wrongAnswers: WrongAnswerAnalysis[],
  totalQuestions: number,
  answeredCount: number,
) {
  if (totalQuestions > 0 && answeredCount < totalQuestions) {
    return ["Bazı sorular boş bırakılmış; önce tüm soruları cevaplama ritmi oturtulmalı."];
  }

  if (wrongAnswers.length === 0) {
    return ["Belirgin hata örüntüsü yok; konu pekiştirme için daha zor sorular denenebilir."];
  }

  const patterns = [
    "Tanım ile kavramın kullanım amacı karışmış olabilir.",
  ];

  if (wrongAnswers.length >= Math.max(2, Math.ceil(totalQuestions / 2))) {
    patterns.push("Birden fazla temel başlık tekrar istiyor; kısa konu özetiyle başlamak iyi olur.");
  }

  if (wrongAnswers.some((answer) => answer.userAnswer.includes("aynı anlama gelir"))) {
    patterns.push("Benzer kavramlar arasındaki farkları ayırma pratiği yapılmalı.");
  }

  return patterns.slice(0, 3);
}

function buildNextActions(weakTopics: string[], wrongCount: number) {
  if (wrongCount === 0) {
    return [
      "Özetteki karıştırılan noktaları hızlıca gözden geçir.",
      "Aynı PDF'ten daha zor 3 soru çöz.",
      "Yeni doküman ekleyerek konu kapsamını genişlet.",
    ];
  }

  const firstWeakTopic = weakTopics[0] ?? "zayıf görünen konu";

  return [
    `${firstWeakTopic} başlığını 3 dakika kısa özetten tekrar et.`,
    "Yanlış açıklamalarını oku ve doğru cevabın neden doğru olduğunu kendine anlat.",
    "Yanlışları tekrar et mini quizini çöz.",
  ];
}

function calculateReviewMinutes(wrongCount: number, weakTopicCount: number) {
  if (wrongCount === 0) return 6;
  return Math.min(30, Math.max(8, wrongCount * 4 + weakTopicCount * 5));
}

function resolveQuestionTopic(
  question: QuizQuestion,
  fallbackTopics: string[],
  index: number,
) {
  return (
    sanitizeLearningText(question.topic) ||
    fallbackTopics[index % Math.max(fallbackTopics.length, 1)] ||
    "Genel tekrar konusu"
  );
}

function resolveSourcePage(question: QuizQuestion) {
  if (typeof question.sourcePage === "number" && Number.isFinite(question.sourcePage)) {
    return question.sourcePage;
  }

  const pageMatch = `${question.source ?? ""} ${question.explanation ?? ""}`.match(
    /PDF sayfa\s+(\d+)/i,
  );

  return pageMatch ? Number(pageMatch[1]) : 1;
}

function sanitizeLearningText(value?: string) {
  return (value ?? "")
    .replace(/\s+/g, " ")
    .replace(/\[Sayfa\s+\d+\]\s*/gi, "")
    .trim();
}

function isNaturalTopicTitle(title: string) {
  const cleanTitle = sanitizeLearningText(title);
  return (
    cleanTitle.length >= 8 &&
    cleanTitle.split(" ").length >= 2 &&
    !isWeakTopicTitle(cleanTitle) &&
    !/[$#{};=]|\\n|\becho\b|\bfor\s+.*\s+in\b|\bthen\b|\bfi\b|\bdone\b/i.test(cleanTitle)
  );
}

function qualityWarningFor(key: keyof OutputQualityReport["checks"]) {
  const warnings: Record<keyof OutputQualityReport["checks"], string> = {
    naturalTopicTitles: "Konu başlıkları yeterince doğal veya öğretilebilir görünmüyor.",
    topicDescriptionsComplete: "Bazı konu açıklamaları veya önem bilgileri eksik.",
    summaryMustKnowComplete: "Özetin 'Mutlaka bil' alanı yeterince dolu değil.",
    summaryFieldsComplete: "Özetin bazı yapılandırılmış alanları eksik.",
    quizExplanationsComplete: "Bazı quiz sorularında öğretici açıklama eksik.",
    quizTopicsComplete: "Bazı quiz sorularında topic bilgisi eksik.",
    quizSourcePagesComplete: "Bazı quiz sorularında kaynak sayfa bilgisi eksik.",
    weakTopicsReady: "Quiz sonucu zayıf konu analizi için yeterli topic verisi yok.",
    lessonModulesReady: "AI Ders modülleri oluşturulamadı.",
    lectureTranscriptDeepEnough: "Bazı ders konuşmaları yeterince derin anlatılmamış.",
    lectureTranscriptNaturalFlow: "Bazı ders konuşmaları ders notu gibi kalmış.",
    lectureTranscriptProblemFirst: "Bazı ders konuşmaları problemle veya merak uyandıran bir girişle başlamıyor.",
    lectureTranscriptExamplePresent: "Bazı ders konuşmalarında somut örnek eksik.",
    lectureTranscriptExamAnglePresent: "Bazı ders konuşmalarında sınav yorumu eksik.",
    lectureTranscriptNoBannedLabels: "Bazı ders konuşmalarında yasaklı ders-notu başlıkları var.",
    lectureTranscriptNoRepeatedSentences: "Bazı ders konuşmalarında tekrar eden cümleler var.",
    lectureTranscriptEndsWithQuestion: "Bazı ders konuşmaları doğal kontrol sorusuyla bitmiyor.",
    lessonTitlesClean: "Bazı ders modülü başlıkları doğal ders başlığı gibi görünmüyor.",
    lessonSourcePagesComplete: "Bazı ders modüllerinde kaynak sayfa bilgisi eksik.",
    quizModuleLinksComplete: "Bazı quiz soruları ders modüllerine bağlanmamış.",
  };

  return warnings[key];
}

function decideModuleCount(topics: StudyTopic[]) {
  const highPriorityCount = topics.filter((topic) => topic.examLikelihood === "high").length;
  const baseCount = Math.max(4, topics.length);
  const adjustedCount = highPriorityCount >= 4 ? Math.max(baseCount, highPriorityCount + 1) : baseCount;

  return Math.min(10, adjustedCount);
}

function buildModuleCountReason(moduleCount: number, topics: StudyTopic[]) {
  const highPriorityCount = topics.filter((topic) => topic.examLikelihood === "high").length;

  if (moduleCount <= 4) {
    return "PDF az sayıda temel kavrama yoğunlaştığı için plan dört ana öğrenme basamağına indirildi.";
  }

  if (highPriorityCount >= 4) {
    return "PDF sınav açısından yoğun başlıklar içerdiği için yüksek öncelikli konular ayrı modüllere bölündü.";
  }

  return "Modül sayısı, kavramların birbirinden ayrışma düzeyine ve kaynak sayfa dağılımına göre belirlendi.";
}

function extractLowPriorityParts(text: string) {
  const keywords = extractSingleKeywords(text, 12);

  return keywords
    .filter((keyword) => /chapter|figure|table|example|note|slide|page|copyright/i.test(keyword))
    .map((keyword) => `${humanizeTerm(keyword)} gibi sınav çekirdeğine doğrudan girmeyen destek ifadeleri`)
    .slice(0, 4);
}

function shareConceptWords(first: string, second: string) {
  const firstWords = new Set(
    normalizeTechLower(first)
      .split(/\s+/)
      .filter((word) => word.length > 4),
  );

  return normalizeTechLower(second)
    .split(/\s+/)
    .some((word) => firstWords.has(word));
}

function extractModuleSourceText(text: string, sourcePages: number[]) {
  const pages = splitPages(text);
  const selectedPages = pages.filter((page) => sourcePages.includes(page.page));
  const source = (selectedPages.length ? selectedPages : pages.slice(0, 2))
    .map((page) => page.text)
    .join(" ");

  return source.slice(0, 2800);
}

function buildSpecificProblemHook(title: string) {
  const normalized = normalizeTechLower(title);

  if (normalized.includes("unix dosya sistemi")) {
    return "Bir işletim sisteminde dosyaların yalnızca saklanması yetmez; asıl sorun, bu dosyaların karışmadan bulunması, dizinler arasında izlenmesi ve komutlarla tutarlı biçimde yönetilmesidir.";
  }

  if (normalized.includes("working directory") || normalized.includes("path")) {
    return "Aynı dosya adını iki farklı dizinde kullanabildiğinde sistemin hangi dosyayı kastettiğini anlaması gerekir; working directory problemi tam burada ortaya çıkar.";
  }

  if (normalized.includes("everything is a file")) {
    return "UNIX'in ilginç tarafı, farklı kaynakları bambaşka kurallarla yönetmek yerine onları ortak bir erişim mantığına yaklaştırmasıdır.";
  }

  if (normalized.includes("nfs") || normalized.includes("ağ dosya")) {
    return "Dosya başka bir makinedeyken onu yereldeymiş gibi kullanmak cazip görünür; zor kısım, bu uzaklığı kullanıcıya hissettirmeden güvenilir erişim sağlamaktır.";
  }

  if (normalized.includes("socket")) {
    return "İki programın ağ üzerinden konuşması için önce birbirlerini bulmaları ve veri alışverişi yapacakları uç noktayı netleştirmeleri gerekir.";
  }

  if (normalized.includes("tcp")) {
    return "Ağda veri göndermek tek başına yeterli değildir; parçaların sırayla, eksiksiz ve karşı tarafın anlayacağı biçimde ulaşması gerekir.";
  }

  if (normalized.includes("port") || normalized.includes("adres")) {
    return "Bir makineye veri gelmesi yeterli değildir; gelen verinin o makinedeki hangi uygulamaya gideceğinin de ayırt edilmesi gerekir.";
  }

  if (normalized.includes("zamanlama") || normalized.includes("scheduling")) {
    return "İşlemci aynı anda birçok iş beklerken hangisine sıra verileceği sistemin performansını doğrudan değiştirir.";
  }

  return `${title} başlığında temel problem, PDF'teki kavramın hangi durumda işe yaradığını ve hangi karışıklığı ortadan kaldırdığını ayırmaktır.`;
}

function buildContextualExample(
  title: string,
  sourceText: string,
  mode: "default" | "repeat" | "simple" | "example",
) {
  const normalized = normalizeTechLower(title);
  const sourceHint = splitSentences(sourceText)[0] ?? "";
  const prefix =
    mode === "example"
      ? "Örneği biraz büyütelim: "
      : mode === "simple"
        ? "Basit bir örnekle düşün: "
        : "";

  if (normalized.includes("working directory") || normalized.includes("path")) {
    return `${prefix}\`notes/week1.txt\` gibi göreli bir yol yazdığında sistem aramaya kök dizinden değil, o anda bulunduğun çalışma dizininden başlar. Bu yüzden aynı komut farklı dizinde farklı dosyaya ulaşabilir.`;
  }

  if (normalized.includes("nfs")) {
    return `${prefix}Laboratuvardaki ortak ders klasörü kendi bilgisayarında normal bir dizin gibi görünüyorsa, öğrenci dosyanın uzakta durduğunu çoğu zaman fark etmez; NFS mantığı bu yerelmiş gibi kullanım hissini sağlar.`;
  }

  if (normalized.includes("socket")) {
    return `${prefix}Tarayıcı bir sunucuya istek gönderdiğinde iki taraf arasında veri alışverişi yapılacak uç noktalar oluşur; socket bu uç noktanın programlama tarafındaki karşılığıdır.`;
  }

  if (normalized.includes("tcp")) {
    return `${prefix}Bir dosya indirirken paketlerden biri eksik gelirse sistem bunu fark edip yeniden isteyebilmelidir; TCP'nin güvenilirlik mantığı bu ihtiyaca cevap verir.`;
  }

  if (normalized.includes("port") || normalized.includes("adres")) {
    return `${prefix}IP adresi veriyi doğru makineye getirir, port ise aynı makinede web sunucusuna mı yoksa başka bir servise mi gideceğini belirler.`;
  }

  if (sourceHint) {
    return `${prefix}PDF'teki şu bağlamı düşün: ${sourceHint} Bu cümlede önemli olan kelimeyi ezberlemek değil, anlatılan düzenin hangi sonucu doğurduğunu görebilmektir.`;
  }

  return `${prefix}Küçük bir sınav sorusunda bu kavram genellikle kısa bir durum verilerek ölçülür; senden beklenen, kavramın o durumda hangi işi yaptığını açıklamandır.`;
}

function buildSourcePageContext(sourceText: string, sourcePages: number[]) {
  const sourceSentence = splitSentences(sourceText)
    .find((sentence) => sentence.trim().length > 50) ??
    splitSentences(sourceText)[0] ??
    "";

  if (!sourceSentence) {
    return `Bu modülün dayandığı kaynak sayfalar ${sourcePages.join(", ")}. Metin kısa olsa bile buradaki bilgiyi sınav açısından yorumlamak gerekir.`;
  }

  return `Kaynak sayfalarda öne çıkan bağlam şuna benziyor: ${toTurkishTeachingSentence(sourceSentence)} Burada dikkat etmen gereken şey, cümlenin içindeki teknik kelimeyi tek başına almak değil, o kelimenin hangi işlem akışında kullanıldığını görmektir.`;
}

function buildModuleCommonMistake(title: string) {
  const normalized = normalizeTechLower(title);

  if (normalized.includes("working directory") || normalized.includes("path")) {
    return "Bu konuda en sık karışan yer, mutlak yol ile göreli yolun aynı şey sanılmasıdır. Mutlak yol kök dizinden itibaren tam adres verir; göreli yol ise bulunduğun çalışma dizinine bağlıdır. Bu ayrımı kaçırırsan aynı komutun farklı dizinde neden farklı sonuç verdiğini açıklayamazsın.";
  }

  if (normalized.includes("everything is a file")) {
    return "Bu konuda yapılan yaygın hata, cümleyi gerçek anlamda her şeyin normal metin dosyası olduğu şeklinde yorumlamaktır. Buradaki fikir, sistem kaynaklarının ortak bir erişim arayüzüyle temsil edilmesidir; yani mesele dosya adı değil, okuma-yazma ve erişim modelinin tutarlı olmasıdır.";
  }

  if (normalized.includes("unix dosya sistemi")) {
    return "Bu konuda sık yapılan hata, dosya sistemini sadece klasör ağacı gibi görmek ve erişim mantığını gözden kaçırmaktır. UNIX tarafında önemli olan, kökten başlayan hiyerarşi sayesinde dosyanın nerede durduğunu, hangi yolla bulunduğunu ve komutların bu düzeni nasıl kullandığını birlikte düşünebilmektir.";
  }

  if (normalized.includes("nfs") || normalized.includes("ağ dosya")) {
    return "Bu konuda karışıklık genellikle dosyanın nerede durduğu ile kullanıcıya nasıl göründüğü arasındadır. NFS'de dosya fiziksel olarak başka makinede olabilir; fakat kullanıcı onu yerel dizin yapısının parçası gibi kullanır. Sınavda bu farkı belirtmek cevabı güçlendirir.";
  }

  if (normalized.includes("socket")) {
    return "Bu konuda en sık hata, socket'i doğrudan internet bağlantısının kendisi sanmaktır. Socket daha çok programın veri gönderip aldığı uç nokta gibi düşünülmelidir; bağlantının protokolü, adresi ve portu bu uç noktanın nasıl kullanılacağını belirler.";
  }

  if (normalized.includes("tcp")) {
    return "Bu konuda yaygın hata, TCP'yi sadece veri gönderen bir yol gibi anlatmaktır. TCP'nin asıl değeri, verinin sırası, bütünlüğü ve karşı tarafa güvenilir biçimde ulaşmasıyla ilgilidir. Bu yüzden cevapta güvenilirlik fikri mutlaka görünmelidir.";
  }

  if (normalized.includes("port") || normalized.includes("adres")) {
    return "Bu konuda karışan nokta, IP adresi ile portun aynı işi yaptığı sanılmasıdır. IP adresi makineyi bulmaya yardım eder; port ise o makinedeki doğru uygulamayı ayırır. İkisini ayırmadan client-server iletişimini açıklamak eksik kalır.";
  }

  return `Bu konuda yapılan temel hata, ${title} ifadesini PDF'teki bir kelime olarak ezberleyip onu bir sistem davranışıyla ilişkilendirmemektir. Oysa sınavda beklenen şey, kavramın hangi durumda ortaya çıktığını ve hangi sonucu değiştirdiğini gösterebilmendir.`;
}

function buildModuleAnswerShape(title: string) {
  const normalized = normalizeTechLower(title);

  if (normalized.includes("working directory") || normalized.includes("path")) {
    return "Cevabı kurarken mevcut dizini belirt, yolun göreli mi mutlak mı olduğunu söyle ve komutun hangi dosyaya ulaşacağını kısa bir örnekle göster.";
  }

  if (normalized.includes("nfs") || normalized.includes("ağ dosya")) {
    return "Cevabı kurarken uzak dosyanın nerede durduğunu, kullanıcının onu nasıl gördüğünü ve ağ bağımlılığının ne gibi sonuçlar doğurabileceğini birlikte yaz.";
  }

  if (normalized.includes("socket") || normalized.includes("tcp") || normalized.includes("port")) {
    return "Cevabı kurarken iletişimin iki ucunu, adresleme bilgisini ve verinin doğru uygulamaya nasıl ulaştığını birbirinden ayırarak anlat.";
  }

  if (normalized.includes("unix") || normalized.includes("dosya")) {
    return "Cevabı kurarken önce yapının hangi düzeni sağladığını söyle, sonra dosya-dizin ilişkisinin komutlarla nasıl kullanıldığını örnekle.";
  }

  return "Cevabı kurarken kavramın çözmeye çalıştığı durumu, çalışma mantığını ve küçük bir örneği aynı paragrafta birleştir.";
}

function buildLessonModule(
  topic: StudyTopic,
  courseName: string,
  index: number,
  allTopics: StudyTopic[],
  conceptGraph: ConceptGraphNode[],
): LessonModule {
  const sourcePages = topic.sourcePages.length > 0 ? topic.sourcePages : [1];
  const title = cleanTeachingTitle(topic.title);
  const graphNode = conceptGraph.find((node) => node.concept === title);
  const examAngle = buildExamAngle(title, sourcePages);
  const estimatedMinutes = topic.examLikelihood === "high" ? 10 : 8;

  return {
    id: slugifyLessonId(title, index),
    title,
    goal: `${title} kavramının hangi problemi çözdüğünü ve PDF bağlamında nasıl kullanıldığını açıklamak.`,
    whyThisModuleExists:
      index === 0
        ? `${title}, sonraki başlıkların anlaşılması için temel bağlamı kuruyor.`
        : `${title}, önceki modülde kurulan mantığın yeni bir kullanım alanını netleştiriyor.`,
    dependsOn: graphNode?.dependsOn ?? allTopics.slice(Math.max(0, index - 1), index).map((item) => item.title),
    examAngle,
    estimatedMinutes,
    learningGoals: [
      `${title} başlığının ne anlattığını açıklayabilmek`,
      "Bu konunun sınavda hangi soru tipine dönebileceğini görmek",
      "Tanım ezberi yerine neden-sonuç ilişkisini kurmak",
    ],
    prerequisites:
      index === 0
        ? ["PDF'teki temel kavramları takip etmeye hazır olmak"]
        : ["Önceki modülün ana fikrini anlamış olmak"],
    sourcePages,
    status: index === 0 ? "active" : "locked",
    lectureTranscript: "",
    blocks: [],
  };
}

function buildExamAngle(title: string, sourcePages: number[]) {
  const source = `Kaynak: PDF sayfa ${sourcePages.join(", ")}.`;

  if (/working directory|path|dizin|yol/i.test(title)) {
    return `Sınavda bu konu genellikle "göreli yol hangi dizine göre çözülür?" veya "working directory değişirse komutun sonucu neden değişir?" şeklinde gelir. Cevapta mevcut konumu, göreli yolu ve mutlak yolu birbirinden ayırman beklenir. ${source}`;
  }

  if (/nfs|ağ|network/i.test(title)) {
    return `Sınavda NFS veya ağ dosya sistemi sorusu geldiğinde ana beklenti, dosyanın fiziksel olarak başka makinede durmasına rağmen yerel dosya gibi kullanılabilmesini açıklamandır. Avantajı paylaşım ve merkezi yönetimdir; risk tarafında gecikme, erişim izni ve ağ bağımlılığı vardır. ${source}`;
  }

  if (/everything is a file|dosyadır|dosya sistemi/i.test(title)) {
    return `Sınavda bu başlık "UNIX neden birçok kaynağı dosya gibi temsil eder?" diye sorulabilir. İyi cevap, dosya, dizin ve aygıtların ortak bir arayüzle okunup yazılabildiğini, bunun sistemi sadeleştirdiğini söyler. ${source}`;
  }

  return `Sınavda bu başlık doğrudan tanım olarak değil, "hangi durumda kullanılır, hangi problemi çözer, örnekle açıklayın" formatında sorulabilir. Cevabında kısa tanım, çalışma mantığı ve küçük bir örnek mutlaka birlikte yer almalı. ${source}`;
}

function buildQuestionForTopic(
  topic: StudyTopic,
  allTopics: StudyTopic[],
  index: number,
): StructuredQuizQuestion {
  const title = topic.title;
  const explanation = `${topic.shortDescription} Bu yüzden doğru cevap, kavramın ne işe yaradığını açıklayan seçenektir. Kaynak: PDF sayfa ${firstSourcePage(topic)}`;
  const distractors = buildDistractors(title, allTopics);
  const difficulty: QuizDifficulty = index < 2 ? "medium" : index === 2 ? "hard" : "easy";

  if (title.includes("Everything is a File")) {
    return {
      question: "UNIX'te \"everything is a file\" yaklaşımı ne anlama gelir?",
      options: shuffleOptions([
        "Dosya, dizin ve bazı aygıtların ortak bir dosya arayüzüyle temsil edilmesi",
        ...distractors,
      ]).slice(0, 4),
      correctAnswer:
        "Dosya, dizin ve bazı aygıtların ortak bir dosya arayüzüyle temsil edilmesi",
      explanation:
        "Doğru cevap budur; çünkü UNIX mantığında birçok sistem kaynağı dosya gibi açılır, okunur veya yazılır. Bu, sistemi daha tutarlı ve yönetilebilir hale getirir. Kaynak: PDF sayfa " +
        firstSourcePage(topic),
      topic: title,
      difficulty,
      sourcePage: firstSourcePage(topic),
    };
  }

  if (title.includes("Working Directory")) {
    return {
      question: "Working directory kavramı komut çalıştırırken neden önemlidir?",
      options: shuffleOptions([
        "Göreli dosya yollarının hangi dizine göre çözüleceğini belirlediği için",
        ...distractors,
      ]).slice(0, 4),
      correctAnswer:
        "Göreli dosya yollarının hangi dizine göre çözüleceğini belirlediği için",
      explanation:
        "Doğru cevap budur; çünkü working directory mevcut çalışma konumudur. `./dosya` gibi göreli yollar bu konuma göre anlam kazanır. Kaynak: PDF sayfa " +
        firstSourcePage(topic),
      topic: title,
      difficulty,
      sourcePage: firstSourcePage(topic),
    };
  }

  if (title.includes("UNIX Dosya Sistemi")) {
    return {
      question: "UNIX dosya sisteminde hiyerarşik yapı temel olarak ne sağlar?",
      options: shuffleOptions([
        "Dosya ve dizinlerin kök dizinden başlayarak düzenli biçimde bulunmasını",
        ...distractors,
      ]).slice(0, 4),
      correctAnswer:
        "Dosya ve dizinlerin kök dizinden başlayarak düzenli biçimde bulunmasını",
      explanation:
        "Doğru cevap budur; çünkü UNIX dosya sistemi kök dizinden dallanan bir yapı kurar. Bu yapı dosya yolu, dizin ve erişim mantığını anlaşılır hale getirir. Kaynak: PDF sayfa " +
        firstSourcePage(topic),
      topic: title,
      difficulty,
      sourcePage: firstSourcePage(topic),
    };
  }

  if (title.includes("NFS")) {
    return {
      question: "NFS'nin temel amacı aşağıdakilerden hangisidir?",
      options: shuffleOptions([
        "Uzak bir dosya sistemini yerel dosyaymış gibi kullanılabilir hale getirmek",
        ...distractors,
      ]).slice(0, 4),
      correctAnswer:
        "Uzak bir dosya sistemini yerel dosyaymış gibi kullanılabilir hale getirmek",
      explanation:
        "Doğru cevap budur; çünkü NFS ağ üzerindeki dosyalara yerel dosya sistemi mantığıyla erişmeyi sağlar. Kaynak: PDF sayfa " +
        firstSourcePage(topic),
      topic: title,
      difficulty,
      sourcePage: firstSourcePage(topic),
    };
  }

  if (title.includes("Socket")) {
    return {
      question: "Socket kavramı client-server iletişiminde hangi rolü üstlenir?",
      options: shuffleOptions([
        "İki program arasında veri alışverişi yapılacak iletişim uç noktasını sağlar",
        ...distractors,
      ]).slice(0, 4),
      correctAnswer:
        "İki program arasında veri alışverişi yapılacak iletişim uç noktasını sağlar",
      explanation:
        "Doğru cevap budur; çünkü socket, ağ üzerinden konuşan iki programın veri gönderip almasını sağlayan uç noktadır. Kaynak: PDF sayfa " +
        firstSourcePage(topic),
      topic: title,
      difficulty,
      sourcePage: firstSourcePage(topic),
    };
  }

  if (title.includes("TCP")) {
    return {
      question: "TCP bağlantısının temel amacı nedir?",
      options: shuffleOptions([
        "İki uç arasında sıralı ve güvenilir veri aktarımı sağlamak",
        ...distractors,
      ]).slice(0, 4),
      correctAnswer: "İki uç arasında sıralı ve güvenilir veri aktarımı sağlamak",
      explanation:
        "Doğru cevap budur; çünkü TCP paketlerin sırasını, kayıpları ve bağlantı durumunu yöneterek güvenilir iletişim kurar. Kaynak: PDF sayfa " +
        firstSourcePage(topic),
      topic: title,
      difficulty,
      sourcePage: firstSourcePage(topic),
    };
  }

  if (title.includes("Portlar") || title.includes("Adres")) {
    return {
      question: "Port numarası ağ iletişiminde neyi belirlemek için kullanılır?",
      options: shuffleOptions([
        "Gelen verinin aynı makinedeki hangi uygulamaya iletileceğini",
        ...distractors,
      ]).slice(0, 4),
      correctAnswer: "Gelen verinin aynı makinedeki hangi uygulamaya iletileceğini",
      explanation:
        "Doğru cevap budur; çünkü IP adresi makineyi, port ise o makinedeki ilgili uygulama veya servisi işaret eder. Kaynak: PDF sayfa " +
        firstSourcePage(topic),
      topic: title,
      difficulty,
      sourcePage: firstSourcePage(topic),
    };
  }

  return {
    question: buildNaturalQuestion(title),
    options: shuffleOptions([
      explainTopic(title, topic.shortDescription),
      ...distractors,
    ]).slice(0, 4),
    correctAnswer: explainTopic(title, topic.shortDescription),
    explanation,
    topic: title,
    difficulty,
    sourcePage: firstSourcePage(topic),
  };
}

function buildNaturalQuestion(title: string) {
  if (/dosya|file/i.test(title)) {
    return `${title} anlatılırken dosya, dizin ve erişim mantığı arasındaki ilişki nasıl kurulmalıdır?`;
  }

  if (/işlem|process|zamanlama|scheduling/i.test(title)) {
    return `${title} içinde sistemin hangi işi önce çalıştıracağına karar vermesi hangi mantığa dayanır?`;
  }

  if (/port|ip|adres|socket|tcp|bağlantı/i.test(title)) {
    return `${title} ağ iletişiminde iki tarafın doğru şekilde haberleşmesini nasıl etkiler?`;
  }

  return `${title} sınavda sorulduğunda kavramın çalışma mantığını en iyi açıklayan ifade hangisidir?`;
}

function inferLessonDifficulty(topics: StudyTopic[]): LessonDifficulty {
  const highCount = topics.filter((topic) => topic.examLikelihood === "high").length;

  if (highCount >= 3) return "advanced";
  if (highCount >= 1 || topics.length >= 4) return "intermediate";
  return "beginner";
}

function findModuleForTopic(lesson: AiLesson, topic: string | undefined, index: number) {
  const normalizedTopic = normalizeTechLower(topic ?? "");
  const exactMatch = lesson.modules.find(
    (module) => normalizeTechLower(module.title) === normalizedTopic,
  );
  const looseMatch = lesson.modules.find((module) => {
    const normalizedTitle = normalizeTechLower(module.title);
    return (
      normalizedTopic.includes(normalizedTitle) ||
      normalizedTitle.includes(normalizedTopic) ||
      module.learningGoals.some((goal) =>
        normalizeTechLower(goal).includes(normalizedTopic),
      )
    );
  });

  return exactMatch ?? looseMatch ?? lesson.modules[index % lesson.modules.length];
}

function slugifyLessonId(title: string, index: number) {
  const slug = normalizeTechLower(title)
    .replace(/[^a-z0-9çğıöşü]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 42);

  return `modul-${index + 1}-${slug || "ders"}`;
}

function buildDistractors(title: string, allTopics: StudyTopic[]) {
  const otherTopic = allTopics.find((topic) => topic.title !== title);

  return [
    "Yalnızca ezberlenecek bağımsız bir terimdir; sistem davranışıyla ilişkili değildir",
    "Sadece dosya adlarının ekranda nasıl görüneceğini belirleyen biçimsel bir ayrıntıdır",
    otherTopic
      ? `${otherTopic.title} ile tamamen aynı anlama gelir`
      : "Sadece örneklerde geçen, sınavda yorum gerektirmeyen rastgele bir ifadedir",
  ];
}

function buildLikelyExamQuestions(topics: string[]) {
  const questions = topics.slice(0, 4).map((topic) => {
    return `${topic} nedir, hangi amaçla kullanılır ve kısa bir örnekle nasıl açıklanır?`;
  });

  if (topics.length >= 2) {
    questions.push(`${topics[0]} ile ${topics[1]} arasındaki ilişki veya fark nasıl yorumlanır?`);
  }

  return questions.slice(0, 5);
}

function buildCommonConfusions(topics: StudyTopic[]) {
  const titles = topics.map((topic) => topic.title);
  const confusions = [
    "Tanımı ezberlemek ile kavramın hangi problemi çözdüğünü anlamak aynı şey değildir.",
  ];

  if (titles.some((title) => title.includes("Working Directory"))) {
    confusions.push("Working directory ile dosyanın gerçek konumu karıştırılabilir.");
  }

  if (titles.some((title) => title.includes("Everything is a File"))) {
    confusions.push("\"Her şey dosyadır\" ifadesi, her şeyin metin dosyası olduğu anlamına gelmez.");
  }

  if (titles.some((title) => title.includes("Portlar"))) {
    confusions.push("IP adresi makineyi, port numarası ise o makinedeki uygulamayı belirtir.");
  }

  if (titles.some((title) => title.includes("NFS"))) {
    confusions.push("NFS yerel disk değildir; ağ üzerindeki dosyayı yerel gibi kullanma yöntemidir.");
  }

  return confusions;
}

function topicTitleFromKeyword(keyword: string) {
  const normalizedKeyword = normalizeTechLower(keyword);

  if (/decides which|scheduling|scheduler|ready queue/.test(normalizedKeyword)) {
    return "Zamanlayıcının Süreç Seçme Mantığı";
  }

  if (/bursts priority|priority scheduling|starvation/.test(normalizedKeyword)) {
    return "Priority Scheduling ve Starvation Riski";
  }

  if (/bursts ready|cpu burst|context switching/.test(normalizedKeyword)) {
    return "CPU Burst ve Ready Queue Mantığı";
  }

  if (/each process|round robin|time quantum/.test(normalizedKeyword)) {
    return "Round Robin ve Zaman Dilimi Mantığı";
  }

  const readable = titleCase(humanizeTerm(keyword));
  if (isWeakTopicTitle(readable)) return "PDF'in Ana Mantığı";
  if (/sistem|system/i.test(readable)) return `${readable} Temelleri`;
  if (/directory|dizin/i.test(readable)) return `${readable} Mantığı`;
  if (/connection|bağlantı/i.test(readable)) return `${readable} Nasıl Çalışır?`;
  if (/port|adres|address/i.test(readable)) return `${readable} ve Kullanımı`;
  return `${readable} Temelleri`;
}

function isMeaningfulTerm(word: string) {
  return word.length >= 4 && !stopWords.has(word);
}

function isLikelyBadPhrase(current: string, next: string) {
  if (current === "analizi") return true;
  if (current === "isleme" && next === "model") return true;
  if (current.endsWith("nin") || current.endsWith("nın")) return true;
  if (next === "bulunur" || next === "ister") return true;
  return false;
}

function isWeakTopicTitle(title: string) {
  const normalized = title.toLocaleLowerCase("tr").trim();
  if (normalized === "pdf'in ana mantığı") return false;

  return (
    /^(Other|Command|File|Chapter|Notes?|PDF|Sayfa|The|And|For)\b/i.test(title) ||
    /^Unix$/i.test(title) ||
    /\b(each line|konusu|other|command)\b/i.test(normalized) ||
    /^(each|decides|bursts)\b/i.test(normalized) ||
    normalized.split(/\s+/).length < 2
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

  if (!cleaned || isWeakTopicTitle(cleaned)) {
    return "PDF'in Ana Mantığı";
  }

  return cleaned;
}

function countWords(value: string) {
  return sanitizeLearningText(value)
    .split(/\s+/)
    .filter(Boolean).length;
}

function readLectureTranscript(module: LessonModule) {
  return module.lectureTranscript || module.lessonText || "";
}

function hasLessonSignal(value: string, signals: string[]) {
  const normalized = value.toLocaleLowerCase("tr");
  return signals.some((signal) => normalized.includes(signal.toLocaleLowerCase("tr")));
}

function hasBannedLectureLabel(value: string) {
  return /(^|\n)\s*(Giriş|Kavramın mantığı|Teknik açıklama|PDF'?i okurken|PDF’yi okurken|Mini özet|Neden önemli|Günlük hayat analojisi|Kontrol noktası)\s*:?\s*(\n|$)/i.test(
    value,
  );
}

function hasBannedGenericLecturePhrase(value: string) {
  return /tanım ilk durak değil|pdf kelimeleri kopuk görünür|hoca uzun metin beklemez|önce problem sonra mantık sonra örnek/i.test(
    value,
  );
}

function startsWithProblemHook(value: string) {
  const firstSentence = splitSentences(value)[0] ?? "";
  if (!firstSentence.trim()) return false;

  return (
    /\?/.test(firstSentence) ||
    /\b(hiç düşündün mü|ilk bakışta|asıl ilginç olan|zor kısım|var;|görünür;|neden)\b/i.test(
      firstSentence,
    )
  );
}

function isNaturalLectureTranscript(value: string) {
  const normalized = value.toLocaleLowerCase("tr");
  const banned = hasBannedLectureLabel(value) || hasBannedGenericLecturePhrase(value);
  const conversationalSignals = [
    "şimdi",
    "düşün",
    "diyelim",
    "bak",
    "burada",
    "aklında",
    "karşına",
  ].filter((signal) => normalized.includes(signal)).length;

  return !banned && conversationalSignals >= 3;
}

function hasRepeatedSentences(value: string) {
  const sentences = splitSentences(value)
    .map((sentence) => normalizeTechLower(sentence))
    .filter((sentence) => sentence.length > 30);
  const seen = new Set<string>();

  for (const sentence of sentences) {
    if (seen.has(sentence)) return true;
    seen.add(sentence);
  }

  return false;
}

function cleanPdfArtifact(value: string) {
  return value
    .replace(/\[Sayfa\s+\d+\]\s*/gi, "")
    .replace(/\bchapter\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|\d+)\b/gi, "")
    .replace(/\bfifteen\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function explainTopic(title: string, fallback?: string) {
  const normalized = normalizeTechLower(title);

  if (normalized.includes("unix dosya sistemi")) {
    return "UNIX dosya sistemi, verileri ve dizinleri kök dizinden başlayan düzenli bir ağaç yapısında yönetir.";
  }

  if (normalized.includes("working directory")) {
    return "Working directory, komutların çalıştığı mevcut dizindir; göreli dosya yolları bu konuma göre yorumlanır.";
  }

  if (normalized.includes("everything is a file")) {
    return "UNIX mantığında dosyalar, dizinler ve bazı aygıtlar ortak bir dosya arayüzüyle temsil edilir.";
  }

  if (normalized.includes("dosya tür")) {
    return "Dosya türleri, sıradan dosya, dizin, bağlantı veya aygıt dosyası gibi yapıların nasıl davranacağını belirler.";
  }

  if (normalized.includes("nfs")) {
    return "NFS, uzak bir makinedeki dosya sisteminin yerel dosyaymış gibi kullanılmasını sağlayan ağ dosya sistemi yaklaşımıdır.";
  }

  if (normalized.includes("socket")) {
    return "Socket, iki programın ağ üzerinden veri alışverişi yapmasını sağlayan iletişim uç noktasıdır.";
  }

  if (normalized.includes("tcp")) {
    return "TCP bağlantısı, iki taraf arasında sıralı ve güvenilir veri aktarımı kurmak için kullanılır.";
  }

  if (normalized.includes("port") || normalized.includes("adres")) {
    return "Port ve adresleme, ağdan gelen verinin doğru makineye ve doğru uygulamaya ulaşmasını sağlar.";
  }

  if (normalized.includes("bellek")) {
    return "Bellek yönetimi, programların belleği güvenli ve verimli kullanmasını sağlayan işletim sistemi mekanizmasıdır.";
  }

  if (normalized.includes("işlem")) {
    return "İşlem ve zamanlama, programların CPU üzerinde hangi sırayla ve ne kadar süreyle çalışacağını belirler.";
  }

  return fallback ?? `${title}, PDF'in sınavda açıklanabilecek ana başlıklarından biridir.`;
}

function toTurkishTeachingSentence(sentence: string) {
  const clean = cleanPdfArtifact(sentence);
  if (looksLikeCodeOrEnglishDump(clean)) {
    return "Bu bölümdeki ham komut satırları, konunun uygulamada nasıl kullanıldığını gösterir; sınav için asıl önemli olan komutun amacı ve hangi problemi çözdüğüdür.";
  }

  return polishSentence(clean);
}

function looksLikeCodeOrEnglishDump(value: string) {
  return (
    /[$#{};=]|\\n|echo|for\s+.*\s+in|then|fi|done|script|shell/i.test(value) ||
    value.split(" ").filter((word) => /^[a-z]+$/i.test(word)).length > 8
  );
}

function humanizeTerm(term: string) {
  const normalized = normalizeTechLower(term).trim();
  const replacements: Record<string, string> = {
    "chapter fifteen": "socket programlamaya giriş",
    "fifteen sockets": "socket programlama",
    sockets: "socket programlama",
    socket: "socket programlama",
    "struct sockaddr": "adres yapıları",
    sockaddr: "adres yapıları",
    "byte order": "byte sıralaması",
    port: "portlar ve adresleme",
    ports: "portlar ve adresleme",
    "tcp connection": "tcp bağlantısı",
    "operating system": "işletim sistemi",
    "file systems": "unix dosya sistemi",
    "unix file": "unix dosya sistemi",
    "working directory": "working directory",
  };

  if (replacements[normalized]) return replacements[normalized];

  return normalized
    .replace(/^chapter\s+\w+\s*/i, "")
    .replaceAll("algoritmalari", "algoritmaları")
    .replaceAll("degerlendirme", "değerlendirme")
    .replaceAll("siniflandirma", "sınıflandırma")
    .replaceAll("on isleme", "ön işleme")
    .replaceAll("sonuc", "sonuç")
    .replaceAll("ornek", "örnek")
    .replaceAll("tanimi", "tanımı")
    .replaceAll("sureci", "süreci")
    .replaceAll("veri", "veri");
}

function polishSentence(sentence: string) {
  const trimmed = sentence.trim();
  return trimmed.endsWith(".") || trimmed.endsWith("?") || trimmed.endsWith("!")
    ? trimmed
    : `${trimmed}.`;
}

function normalizeTechLower(value: string) {
  return value
    .toLocaleLowerCase("tr")
    .replaceAll("unıx", "unix")
    .replaceAll("ı/o", "i/o");
}

function splitPages(text: string): PageChunk[] {
  const pageMarker = /\[Sayfa\s+(\d+)\]\s*/gi;
  const matches = [...text.matchAll(pageMarker)];

  if (matches.length === 0) {
    return [{ page: 1, text }];
  }

  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? text.length;
    return {
      page: Number(match[1]) || index + 1,
      text: text.slice(start, end),
    };
  });
}

function findPagesForKeyword(pages: PageChunk[], keyword: string) {
  const lowerKeyword = keyword.toLocaleLowerCase("tr");
  const matchingPages = pages
    .filter((page) => page.text.toLocaleLowerCase("tr").includes(lowerKeyword))
    .map((page) => page.page);

  return uniqueNumbers(matchingPages).slice(0, 3).length > 0
    ? uniqueNumbers(matchingPages).slice(0, 3)
    : [pages[0]?.page ?? 1];
}

function firstSourcePage(topic: StudyTopic) {
  return topic.sourcePages[0] ?? 1;
}

function titleCase(value: string) {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toLocaleUpperCase("tr") + word.slice(1))
    .join(" ");
}

function shuffleOptions(options: string[]) {
  const unique = [...new Set(options)].filter(Boolean);
  return unique.sort((a, b) => a.localeCompare(b, "tr"));
}

function uniqueNumbers(values: number[]) {
  return [...new Set(values.filter((value) => Number.isFinite(value)))];
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}
