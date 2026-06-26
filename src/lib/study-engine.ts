export type ExamLikelihood = "low" | "medium" | "high";

export type QuizDifficulty = "easy" | "medium" | "hard";

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  source: string;
  explanation?: string;
  topic?: string;
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

export type StructuredQuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: QuizDifficulty;
  sourcePage: number;
};

export type QuizResultAnalysis = {
  score: number;
  strongTopics: string[];
  weakTopics: string[];
  recommendedReviewMinutes: number;
  nextActions: string[];
  shortFeedback: string;
};

const stopWords = new Set([
  "acaba",
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
  "ders",
  "dersi",
  "diye",
  "doküman",
  "dokümanı",
  "dokumani",
  "en",
  "fakat",
  "final",
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

  const fallbackTopics = extractKeywords(text, limit * 2)
    .map((keyword) => buildFallbackTopic(keyword, pages))
    .filter((topic) => topic.title.length > 4 && !isWeakTopicTitle(topic.title));

  const topics = [...curated, ...fallbackTopics].filter(
    (topic, index, array) =>
      array.findIndex((candidate) => candidate.title === topic.title) === index,
  );

  if (topics.length > 0) return topics.slice(0, limit);

  return [
    {
      title: "PDF'in Ana Konusu",
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
    difficulty: question.difficulty,
    sourcePage: question.sourcePage,
  }));
}

export function buildQuizResultAnalysis(
  quiz: QuizQuestion[],
  selectedAnswers: Record<number, string>,
): QuizResultAnalysis {
  const answered = quiz
    .map((question, index) => ({
      question,
      selected: selectedAnswers[index],
    }))
    .filter((item) => item.selected);
  const correctItems = answered.filter(
    (item) => item.selected === item.question.answer,
  );
  const wrongItems = answered.filter(
    (item) => item.selected !== item.question.answer,
  );
  const score = quiz.length > 0 ? Math.round((correctItems.length / quiz.length) * 100) : 0;
  const strongTopics = uniqueStrings(
    correctItems.map((item) => item.question.topic ?? item.question.question),
  ).slice(0, 4);
  const weakTopics = uniqueStrings(
    wrongItems.map((item) => item.question.topic ?? item.question.question),
  ).slice(0, 4);

  return {
    score,
    strongTopics,
    weakTopics,
    recommendedReviewMinutes: Math.max(8, weakTopics.length * 6 + wrongItems.length * 2),
    nextActions:
      weakTopics.length > 0
        ? [
            "Yanlış yaptığın konuları kısa özetten tekrar oku.",
            "PDF Asistanı'na bu konuları çocuk gibi anlatmasını iste.",
            "Benzer 5 soru daha çöz.",
          ]
        : [
            "Aynı PDF'ten daha zor sorular çöz.",
            "Özetteki karıştırılan noktaları hızlıca tekrar et.",
            "Yeni PDF ekleyerek konu kapsamını genişlet.",
          ],
    shortFeedback:
      weakTopics.length > 0
        ? `${weakTopics.join(", ")} başlıkları tekrar ister. Kısa tekrar sonrası skorun hızlı yükselebilir.`
        : "Bu quizde belirgin zayıf konu görünmüyor. Şimdi daha zor sorularla pekiştirmek mantıklı.",
  };
}

function buildFallbackTopic(keyword: string, pages: PageChunk[]): StudyTopic {
  const title = topicTitleFromKeyword(keyword);
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
    question: `${title} konusunu sınavda açıklarken hangi ifade en doğrudur?`,
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
  const readable = titleCase(humanizeTerm(keyword));
  if (/sistem|system/i.test(readable)) return `${readable} Temelleri`;
  if (/directory|dizin/i.test(readable)) return `${readable} Mantığı`;
  if (/connection|bağlantı/i.test(readable)) return `${readable} Nasıl Çalışır?`;
  if (/port|adres|address/i.test(readable)) return `${readable} ve Kullanımı`;
  return `${readable} Konusu`;
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
  return /^(Other|Command|File|Unix|Chapter|Notes?|PDF|Sayfa|The|And|For)\b/i.test(title);
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
