import type { QuizQuestion } from "@/lib/study-engine";

type StudyPack = {
  summary: string;
  keywords: string[];
  quiz: QuizQuestion[];
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
  if (!hasOpenAiKey()) return null;

  const prompt = `
Sen ÜniKEY uygulamasının vize/final odaklı ders asistanısın.
Amaç uzun vadeli çalışma planı yapmak değil. Sadece öğrencinin yüklediği PDF'e göre güçlü bir çalışma özeti ve quiz üret.
Özet kalitesi, öğrencinin PDF'i doğrudan iyi bir öğretmene verdiğinde bekleyeceği seviyede olmalı: kopya cümle yığını değil, düzenlenmiş sınav notu gibi.
PDF hangi dilde olursa olsun öğrenciye her zaman Türkçe anlat. Teknik terimler hariç bütün anlatım Türkçe olsun. İngilizce terimi gerekiyorsa Türkçe açıklamayla birlikte kullan: "socket (ağ iletişim kapısı)" gibi.

Ders: ${courseName}
PDF adı: ${documentName}

PDF metni:
${limitText(text)}

Yalnızca geçerli JSON döndür. Markdown kullanma.
JSON şeması:
{
  "summary": "Türkçe, başlıklı, sınava yönelik özet.",
  "keywords": ["anahtar kelime değil, 6-8 adet Türkçe konu başlığı"],
  "quiz": [
    {
      "question": "Doğal ve sınav tarzı çoktan seçmeli soru",
      "options": ["4 seçenek"],
      "answer": "options içindeki doğru cevabın aynısı",
      "source": "Doğru cevap açıklaması. Ham PDF cümlesi yazma. Sonunda mümkünse Kaynak: PDF sayfa X"
    }
  ]
}

Kurallar:
- Summary alanını mutlaka şu başlıklarla yaz:
  1. Bu PDF ne anlatıyor?
  2. Mutlaka bil
  3. Sınavda çıkabilecek sorular
  4. Hoca nereden sorabilir?
  5. Karıştırılan noktalar
- "Bu PDF ne anlatıyor?" bölümü 2-3 cümle olsun.
- "Mutlaka bil" bölümü tam 3 madde olsun.
- "Sınavda çıkabilecek sorular" bölümü 3 madde olsun.
- "Hoca nereden sorabilir?" bölümü 2 madde olsun.
- "Karıştırılan noktalar" bölümü 2 madde olsun.
- "Chapter Fifteen", "Fifteen Sockets", "Struct Sockaddr" gibi ham başlıkları aynen taşıma. Bunları "Socket Programlamaya Giriş", "Portlar ve Adresleme", "Adres Yapıları" gibi öğrenciye anlamlı Türkçe konu başlıklarına dönüştür.
- keywords alanına asla "File Systems", "Unix File", "Working Directory", "Other", "Command" gibi ham anahtar kelimeler yazma. Anahtar kelime çıkarma; konu çıkar. Örnek: "UNIX Dosya Sistemi Nedir?", "Working Directory Mantığı", "UNIX'te Her Şey Dosyadır", "Dosya Türleri", "NFS ve Ağ Dosya Sistemleri".
- PDF'teki dağınık metni toparla, benzer noktaları birleştir, kavramları öğrenciye anlatır gibi açıkla.
- Özet ne çok yüzeysel ne de gereksiz uzun olsun; sınav öncesi tekrar notu gibi işe yarasın.
- En fazla 5 quiz sorusu üret.
- Quiz soruları "X kavramı PDF içinde hangi bağlamda geçiyor?" gibi robotik olmasın. Doğal sınav sorusu yaz: "TCP bağlantısının temel amacı nedir?" gibi.
- Her quiz source alanında "Doğru cevap ... Çünkü ..." diye kısa açıklama ver.
- Quiz answer/options alanlarına "[Sayfa 1] Chapter..." gibi ham PDF cümlesi koyma.
- Sadece PDF metnine dayan.
- Bilgi PDF'te yoksa uydurma.
- Türkçe karakter kullan.
- Sorular vize/final mantığına yakın olsun.
`;

  const output = await safeCallOpenAi(prompt);
  if (!output) return null;

  return parseStudyPack(output);
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
Uzun vadeli çalışma planı önerme.
PDF hangi dilde olursa olsun cevabı Türkçe ver. Teknik terimler hariç bütün kelimeleri Türkçe kullan. Yabancı terimi gerektiğinde parantez içinde koruyup Türkçe açıkla.

Öğrencinin sorusu:
${question}

PDF metni:
${limitText(text)}

Cevabı Türkçe, kısa ve anlaşılır ver. Gerekirse maddeler kullan.
Sonuna mümkünse "Kaynak: PDF sayfa X" veya "Kaynak: PDF'teki ilgili ifade" satırı ekle.
`;

  return safeCallOpenAi(prompt);
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
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI request failed:", response.status, errorText);
    return null;
  }

  const payload = (await response.json()) as OpenAIResponse;
  return extractOutputText(payload);
}

async function safeCallOpenAi(prompt: string) {
  try {
    return await callOpenAi(prompt);
  } catch (error) {
    console.error("OpenAI request error:", error);
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
    const parsed = JSON.parse(jsonText) as Partial<StudyPack>;
    if (
      typeof parsed.summary !== "string" ||
      !Array.isArray(parsed.keywords) ||
      !Array.isArray(parsed.quiz)
    ) {
      return null;
    }

    return {
      summary: parsed.summary,
      keywords: parsed.keywords.filter((keyword) => typeof keyword === "string"),
      quiz: parsed.quiz
        .filter(isQuizQuestion)
        .map((question) => ({
          question: question.question,
          options: question.options.slice(0, 4),
          answer: question.answer,
          source: question.source,
        })),
    };
  } catch {
    return null;
  }
}

function isQuizQuestion(value: unknown): value is QuizQuestion {
  if (!value || typeof value !== "object") return false;

  const question = value as Partial<QuizQuestion>;
  return (
    typeof question.question === "string" &&
    Array.isArray(question.options) &&
    question.options.every((option) => typeof option === "string") &&
    question.options.length >= 2 &&
    typeof question.answer === "string" &&
    typeof question.source === "string"
  );
}

function limitText(text: string) {
  return text.length > 14000 ? `${text.slice(0, 14000)}\n[Metin kısaltıldı]` : text;
}
