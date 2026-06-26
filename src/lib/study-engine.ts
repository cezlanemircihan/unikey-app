export type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  source: string;
};

export type StudyTopic = {
  title: string;
  source: string;
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
    .slice(0, limit - phrases.length)
    .map((word) => word);

  return [...phrases, ...singles].slice(0, limit);
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

export function buildTopics(text: string, limit = 8) {
  const sentences = splitSentences(text);
  const lowerText = text.toLocaleLowerCase("tr");
  const curated: StudyTopic[] = [];

  const addTopic = (needle: RegExp, title: string) => {
    if (!needle.test(lowerText)) return;
    const source =
      sentences.find((sentence) => needle.test(sentence.toLocaleLowerCase("tr"))) ??
      sentences[0] ??
      title;
    if (!curated.some((topic) => topic.title === title)) {
      curated.push({ title, source: cleanPdfArtifact(source) });
    }
  };

  addTopic(/file systems?|unix file|dosya sistemi|filesystem/i, "UNIX Dosya Sistemi Nedir?");
  addTopic(/working directory|current directory|çalışma dizini/i, "Working Directory Mantığı");
  addTopic(/everything.*file|regular file|directory|device file|her şey dosya/i, "UNIX'te Her Şey Dosyadır");
  addTopic(/file types?|directory|symbolic link|regular file|dosya tür/i, "Dosya Türleri");
  addTopic(/\bnfs\b|network file|ağ dosya/i, "NFS ve Ağ Dosya Sistemleri");
  addTopic(/socket|sockaddr|tcp|port|byte order/i, "Socket Programlamaya Giriş");
  addTopic(/tcp connection|connection|bağlantı/i, "TCP Bağlantısı");
  addTopic(/port|adres|address/i, "Portlar ve Adresleme");
  addTopic(/process|thread|scheduling|işlem|süreç/i, "İşlem ve Zamanlama Mantığı");
  addTopic(/memory|paging|virtual memory|bellek/i, "Bellek Yönetimi");

  const fallbackTopics = extractKeywords(text, limit * 2)
    .map((keyword) => ({
      title: topicTitleFromKeyword(keyword),
      source: cleanPdfArtifact(findSentenceForKeyword(sentences, keyword)),
    }))
    .filter((topic) => topic.title.length > 4 && !isWeakTopicTitle(topic.title));

  return [...curated, ...fallbackTopics]
    .filter(
      (topic, index, array) =>
        array.findIndex((candidate) => candidate.title === topic.title) === index,
    )
    .slice(0, limit);
}

export function buildSummary(text: string, courseName: string) {
  const sentences = splitSentences(text);

  if (sentences.length === 0) {
    return "Bu PDF'ten özet çıkarabilecek kadar okunabilir metin alınamadı. PDF taranmış görsel olabilir; sonraki adımda OCR desteği eklenebilir.";
  }

  const topics = buildTopics(text, 8);
  const topicTitles = topics.map((topic) => topic.title);
  const keywords = extractKeywords(text, 14);
  const importantSentences = rankSentences(sentences, [...topicTitles, ...keywords]).slice(0, 10);
  const overview = keepOriginalOrder(sentences, importantSentences.slice(0, 3));
  const likelyQuestions = buildLikelyExamQuestions(topicTitles);

  return [
    `${courseName} - Sınav Özeti`,
    "",
    "Bu PDF ne anlatıyor?",
    ...overview.slice(0, 2).map((sentence) => `• ${polishSentence(cleanPdfArtifact(sentence))}`),
    "",
    "Mutlaka bil",
    ...topics.slice(0, 3).map((topic, index) => `${index + 1}. ${topic.title}: ${shortExplain(topic.source)}`),
    "",
    "Sınavda çıkabilecek sorular",
    ...likelyQuestions.slice(0, 3).map((question) => `• ${question}`),
    "",
    "Hoca nereden sorabilir?",
    ...topics.slice(0, 2).map((topic) => `• ${topic.title} konusunun tanımı, amacı ve örnek kullanımını sorabilir.`),
    "",
    "Karıştırılan noktalar",
    ...topics.slice(2, 4).map((topic) => `• ${topic.title} ile ilişkili benzer kavramların farkını netleştir.`),
  ].join("\n");
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
    ...matches.map((match) => `• ${match.sentence}`),
    "Kaynak: PDF'teki ilgili ifade",
  ].join("\n");
}

export function buildQuiz(text: string, courseName: string): QuizQuestion[] {
  const sentences = splitSentences(text);
  const topics = buildTopics(text, 6);

  if (sentences.length === 0) {
    return [
      {
        question: "Bu PDF için neden quiz üretilemedi?",
        options: [
          "PDF'ten okunabilir metin çıkarılamadığı için",
          "Ders adı çok uzun olduğu için",
          "Kayıt ekranı tamamlanmadığı için",
          "Quiz sadece final haftasında üretildiği için",
        ],
        answer: "PDF'ten okunabilir metin çıkarılamadığı için",
        source: "PDF metin çıkarma",
      },
    ];
  }

  const firstTopic = topics[0] ?? {
    title: courseName,
    source: sentences[0],
  };
  const secondTopic = topics[1] ?? {
    title: "Temel kavramlar",
    source: sentences[1] ?? sentences[0],
  };
  const thirdTopic = topics[2] ?? {
    title: "Uygulama mantığı",
    source: sentences[2] ?? sentences[0],
  };
  const firstAnswer = answerFromTopic(firstTopic);
  const secondAnswer = answerFromTopic(secondTopic);

  return [
    {
      question: `${firstTopic.title} konusu bu derste neden önemlidir?`,
      options: shuffleOptions([
        firstAnswer,
        "Sadece dosya adını düzenlemek için kullanılır.",
        "Kayıt ekranındaki kullanıcı bilgilerini saklamak için vardır.",
        "PDF dışındaki rastgele konuları tahmin etmek için kullanılır.",
      ]),
      answer: firstAnswer,
      source: `Doğru cevap "${firstTopic.title}" konusunun ana fikrine dayanıyor. Çünkü PDF bu kavramı dersin temel yapı taşlarından biri olarak ele alıyor. Kaynak: PDF'teki ilgili bölüm`,
    },
    {
      question: `${secondTopic.title} ile ilgili doğru ifade hangisidir?`,
      options: shuffleOptions([
        secondAnswer,
        "Bu konu yalnızca ders kodunu belirlemek için kullanılır.",
        "Bu kavramın sınavla ilişkisi yoktur.",
        "Sadece PDF yükleme ekranının bir ayarıdır.",
      ]),
      answer: secondAnswer,
      source: `Doğru cevap "${secondTopic.title}" başlığının PDF'teki açıklamasına dayanıyor. Kaynak: PDF'teki ilgili ifade`,
    },
    {
      question: "Sınav öncesi tekrar yaparken hangi başlığı özellikle bilmelisin?",
      options: shuffleOptions([
        firstTopic.title,
        secondTopic.title,
        thirdTopic.title,
        "e-posta doğrulama kodu",
      ]),
      answer: firstTopic.title,
      source: `Doğru cevap PDF'in ana konularından biridir. Çünkü bu başlık, dokümanın sınavda sorulabilecek temel fikrini taşır.`,
    },
  ];
}

function findSentenceForKeyword(sentences: string[], keyword: string) {
  const lowerKeyword = keyword.toLocaleLowerCase("tr");
  return (
    sentences.find((sentence) =>
      sentence.toLocaleLowerCase("tr").includes(lowerKeyword),
    ) ?? sentences[0]
  );
}

function rankSentences(sentences: string[], keywords: string[]) {
  return sentences
    .map((sentence, index) => {
      const lower = sentence.toLocaleLowerCase("tr");
      const keywordScore = keywords.reduce(
        (score, keyword, keywordIndex) =>
          score +
          (lower.includes(keyword)
            ? Math.max(1, 4 - Math.floor(keywordIndex / 3))
            : 0),
        0,
      );
      const examScore =
        /önemli|tanım|amaç|sonuç|örnek|soru|problem|model|algoritma|veri|analiz|yöntem|süreç|adım|avantaj|dezavantaj|kullanılır|hesaplanır/i.test(
          sentence,
        )
          ? 4
          : 0;
      const structureScore =
        /nedir|ne işe yarar|nasıl|neden|hangisi|temel|özellik|fark|karşılaştır/i.test(
          sentence,
        )
          ? 2
          : 0;
      const earlyScore = Math.max(0, 3 - index * 0.03);

      return {
        sentence,
        score: keywordScore + examScore + structureScore + earlyScore,
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.sentence)
    .filter(uniqueSentence);
}

function keepOriginalOrder(allSentences: string[], selected: string[]) {
  const selectedSet = new Set(selected);
  return allSentences.filter((sentence) => selectedSet.has(sentence));
}

function uniqueSentence(sentence: string, index: number, sentences: string[]) {
  const normalized = sentence.toLocaleLowerCase("tr").slice(0, 90);
  return (
    sentences.findIndex(
      (candidate) =>
        candidate.toLocaleLowerCase("tr").slice(0, 90) === normalized,
    ) === index
  );
}

function buildLikelyExamQuestions(topics: string[]) {
  const questions = topics.slice(0, 4).map((topic) => {
    return `${topic} nedir, hangi amaçla kullanılır ve bir örnek üzerinden nasıl açıklanır?`;
  });

  if (topics.length >= 2) {
    questions.push(`${topics[0]} ile ${topics[1]} arasındaki ilişki veya fark nasıl yorumlanır?`);
  }

  return questions.slice(0, 5);
}

function topicTitleFromKeyword(keyword: string) {
  const readable = titleCase(humanizeTerm(keyword));
  if (/sistem|system/i.test(readable)) return `${readable} Nedir?`;
  if (/directory|dizin/i.test(readable)) return `${readable} Mantığı`;
  if (/connection|bağlantı/i.test(readable)) return `${readable} Nasıl Çalışır?`;
  if (/port|adres|address/i.test(readable)) return `${readable} ve Kullanımı`;
  return `${readable} Konusu`;
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

function shortExplain(sentence: string) {
  const clean = cleanPdfArtifact(sentence);
  if (!clean) return "Bu konu PDF'in ana sınav başlıklarından biri olarak görünüyor.";
  return trimOption(polishSentence(clean), 180);
}

function answerFromTopic(topic: StudyTopic) {
  const explanation = shortExplain(topic.source);
  if (explanation.length < 40) {
    return `${topic.title} dersin ana fikrini anlamak için kullanılan temel başlıklardan biridir.`;
  }

  return explanation;
}

function humanizeTerm(term: string) {
  const normalized = term.toLocaleLowerCase("tr").trim();
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

function titleCase(value: string) {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toLocaleUpperCase("tr") + word.slice(1))
    .join(" ");
}

function trimOption(text: string, limit = 150) {
  return text.length > limit ? `${text.slice(0, limit - 3).trim()}...` : text;
}

function shuffleOptions(options: string[]) {
  return [...new Set(options)].sort((a, b) => a.localeCompare(b, "tr"));
}
