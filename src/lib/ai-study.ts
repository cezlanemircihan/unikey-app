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
Özet kalitesi, öğrencinin PDF'i doğrudan ChatGPT'ye gönderdiğinde bekleyeceği seviyede olmalı: kopya cümle yığını değil, düzenlenmiş ders notu gibi.
PDF hangi dilde olursa olsun öğrenciye her zaman Türkçe anlat. İngilizce, Almanca veya başka dildeki terimleri gerekiyorsa Türkçe karşılığıyla açıkla.

Ders: ${courseName}
PDF adı: ${documentName}

PDF metni:
${limitText(text)}

Yalnızca geçerli JSON döndür. Markdown kullanma.
JSON şeması:
{
  "summary": "Türkçe, başlıklı, sınava yönelik detaylı özet.",
  "keywords": ["en fazla 10 önemli kavram"],
  "quiz": [
    {
      "question": "PDF'e göre çoktan seçmeli soru",
      "options": ["4 seçenek"],
      "answer": "options içindeki doğru cevabın aynısı",
      "source": "Sorunun dayandığı kısa PDF ifadesi"
    }
  ]
}

Kurallar:
- Summary alanını şu başlıklarla yaz:
  1. Genel Çerçeve
  2. Vize/Final İçin Bilmen Gerekenler
  3. Temel Kavramlar
  4. Muhtemel Soru Tarzları
  5. Kısa Tekrar
- PDF'teki dağınık metni toparla, benzer noktaları birleştir, kavramları öğrenciye anlatır gibi açıkla.
- Özet ne çok yüzeysel ne de gereksiz uzun olsun; sınav öncesi tekrar notu gibi işe yarasın.
- En fazla 5 quiz sorusu üret.
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
PDF hangi dilde olursa olsun cevabı Türkçe ver. Yabancı terimi gerektiğinde parantez içinde koruyup Türkçe açıkla.

Öğrencinin sorusu:
${question}

PDF metni:
${limitText(text)}

Cevabı Türkçe, kısa ve anlaşılır ver. Gerekirse maddeler kullan.
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
