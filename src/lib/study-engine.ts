export type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
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

export function buildSummary(text: string, courseName: string) {
  const sentences = splitSentences(text);

  if (sentences.length === 0) {
    return "Bu PDF'ten özet çıkarabilecek kadar okunabilir metin alınamadı. PDF taranmış görsel olabilir; sonraki adımda OCR desteği eklenebilir.";
  }

  const keywords = extractKeywords(text, 14);
  const importantSentences = rankSentences(sentences, keywords).slice(0, 10);
  const overview = keepOriginalOrder(sentences, importantSentences.slice(0, 3));
  const examPoints = keepOriginalOrder(sentences, importantSentences.slice(0, 6));
  const concepts = keywords
    .slice(0, 7)
    .map((keyword) => ({
      keyword,
      sentence: findSentenceForKeyword(sentences, keyword),
    }))
    .filter(
      (item, index, array) =>
        array.findIndex((candidate) => candidate.sentence === item.sentence) ===
        index,
    )
    .slice(0, 5);
  const likelyQuestions = buildLikelyExamQuestions(keywords, concepts);

  return [
    `${courseName} - Sınav Özeti`,
    "",
    "Bu PDF ne anlatıyor?",
    ...overview.map((sentence) => `• ${polishSentence(sentence)}`),
    "",
    "Mutlaka bilmen gereken 3 şey",
    ...examPoints.slice(0, 3).map((sentence, index) => `${index + 1}. ${polishSentence(sentence)}`),
    "",
    "Kritik kavramlar",
    ...concepts.map(
      ({ keyword, sentence }) =>
        `• ${titleCase(humanizeTerm(keyword))}: ${polishSentence(sentence)}`,
    ),
    "",
    "Sınavda nasıl gelir?",
    ...likelyQuestions.map((question) => `• ${question}`),
    "",
    "Ezber kartları",
    `Bu PDF'te özellikle ${keywords
      .slice(0, 5)
      .map((keyword) => titleCase(humanizeTerm(keyword)))
      .join(", ")} kavramlarına odaklanmalısın. Sınav çalışırken sadece tanımı ezberleme; kavramın ne işe yaradığını, hangi adımlarla uygulandığını ve örnek üzerinden nasıl yorumlandığını kontrol et.`,
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
  const keywords = extractKeywords(text, 8);

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

  const firstKeyword = keywords[0] ?? courseName;
  const secondKeyword = keywords[1] ?? "temel kavram";
  const thirdKeyword = keywords[2] ?? "uygulama";
  const sourceSentence = findSentenceForKeyword(sentences, firstKeyword);
  const secondSentence = findSentenceForKeyword(sentences, secondKeyword);

  return [
    {
      question: `${titleCase(humanizeTerm(firstKeyword))} konusu bu derste neden önemlidir?`,
      options: shuffleOptions([
        trimOption(sourceSentence),
        "Kullanıcının hesap şifresini açıklamak",
        "PDF dışındaki rastgele konuları anlatmak",
        "PDF dosyasının yalnızca adını saklamak",
      ]),
      answer: trimOption(sourceSentence),
      source: `Doğru cevap PDF'teki ana açıklamaya dayanıyor. Kaynak: ${sourceSentence}`,
    },
    {
      question: `${titleCase(humanizeTerm(firstKeyword))} ile ilgili doğru ifade hangisidir?`,
      options: shuffleOptions([
        trimOption(sourceSentence),
        trimOption(secondSentence),
        `${courseName} dersinden bağımsız bir kayıt bilgisi olarak`,
        "Sadece uygulama ayarı olarak",
      ]),
      answer: trimOption(sourceSentence),
      source: `Doğru cevap bu kavramın PDF'teki kullanımını açıklar. Kaynak: ${sourceSentence}`,
    },
    {
      question: "Sınav öncesi tekrar yaparken hangi kavramı özellikle bilmelisin?",
      options: shuffleOptions([
        titleCase(humanizeTerm(firstKeyword)),
        titleCase(humanizeTerm(secondKeyword)),
        titleCase(humanizeTerm(thirdKeyword)),
        "e-posta doğrulama kodu",
      ]),
      answer: titleCase(humanizeTerm(firstKeyword)),
      source: `Doğru cevap PDF'te en sık ve merkezi görünen kavramlardan biridir. Kaynak: ${keywords
        .slice(0, 4)
        .map((keyword) => titleCase(humanizeTerm(keyword)))
        .join(", ")}`,
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

function buildLikelyExamQuestions(
  keywords: string[],
  concepts: Array<{ keyword: string; sentence: string }>,
) {
  const questions = concepts.slice(0, 4).map(({ keyword }) => {
    const concept = titleCase(humanizeTerm(keyword));
    return `${concept} nedir, hangi amaçla kullanılır ve PDF'teki örnek/bağlamla nasıl açıklanır?`;
  });

  if (keywords.length >= 2) {
    questions.push(
      `${titleCase(humanizeTerm(keywords[0]))} ile ${titleCase(
        humanizeTerm(keywords[1]),
      )} arasındaki ilişki veya fark nasıl yorumlanır?`,
    );
  }

  return questions.slice(0, 5);
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

function trimOption(text: string) {
  return text.length > 150 ? `${text.slice(0, 147).trim()}...` : text;
}

function shuffleOptions(options: string[]) {
  return [...new Set(options)].sort((a, b) => a.localeCompare(b, "tr"));
}
