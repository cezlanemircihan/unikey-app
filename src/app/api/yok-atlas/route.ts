import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 86400;

type YokUniversity = {
  universiteAdi: string;
  universiteId: number;
};

type YokProgram = {
  birimAdi?: string;
  birimGrupAdi?: string;
  birimGrupId?: number;
  puanTuru?: string;
  universiteId?: number;
};

const baseUrl = "https://yokatlas.yok.gov.tr/api";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");

  try {
    if (type === "universities") {
      const universities = await fetchYok<YokUniversity[]>(
        "/tercih-kilavuz/universiteler",
      );

      return NextResponse.json({
        universities: universities
          .map((university) => ({
            id: university.universiteId,
            name: normalizeUniversityName(university.universiteAdi),
            rawName: university.universiteAdi,
          }))
          .sort((a, b) => a.name.localeCompare(b.name, "tr")),
      });
    }

    if (type === "departments") {
      const universityId = Number(url.searchParams.get("universityId"));

      if (!Number.isFinite(universityId)) {
        return NextResponse.json(
          { error: "Geçerli üniversite ID'si bulunamadı." },
          { status: 400 },
        );
      }

      const firstPage = await searchPrograms(universityId, 0);
      const totalPages = Math.min(
        Math.ceil((firstPage.totalElements ?? 0) / 500),
        4,
      );
      const remainingPages = await Promise.all(
        Array.from({ length: Math.max(totalPages - 1, 0) }, (_, index) =>
          searchPrograms(universityId, index + 1),
        ),
      );
      const programs = [firstPage, ...remainingPages].flatMap(
        (page) => page.content ?? [],
      );

      return NextResponse.json({
        departments: normalizeDepartments(programs),
      });
    }

    return NextResponse.json(
      { error: "Geçersiz YÖK Atlas veri tipi." },
      { status: 400 },
    );
  } catch (error) {
    console.error("YÖK Atlas veri hatası:", error);
    return NextResponse.json(
      { error: "YÖK Atlas verisi alınamadı." },
      { status: 502 },
    );
  }
}

async function fetchYok<T>(path: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    next: { revalidate },
  });

  if (!response.ok) {
    throw new Error(`YÖK Atlas isteği başarısız: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function searchPrograms(universityId: number, page: number) {
  const response = await fetch(`${baseUrl}/tercih-kilavuz/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    next: { revalidate },
    body: JSON.stringify({
      filters: {
        puanTuru: null,
        universiteId: [universityId],
        birimGrupId: [],
        ilKodu: [],
        birimTuruId: null,
        universiteTuru: null,
        bursOraniId: null,
        ogrenimTuruId: null,
        kilavuzKodu: null,
        minBasariSirasi: null,
        maxBasariSirasi: null,
      },
      page,
      size: 500,
      sortBy: "birimAdi",
      direction: "ASC",
    }),
  });

  if (!response.ok) {
    throw new Error(`YÖK Atlas program araması başarısız: ${response.status}`);
  }

  return response.json() as Promise<{
    content?: YokProgram[];
    totalElements?: number;
  }>;
}

function normalizeUniversityName(name: string) {
  const normalized = name
    .toLocaleLowerCase("tr")
    .split(" ")
    .map((word) =>
      word
        .split("-")
        .map(
          (part) =>
            part.charAt(0).toLocaleUpperCase("tr") +
            part.slice(1).toLocaleLowerCase("tr"),
        )
        .join("-"),
    )
    .join(" ")
    .replace("Kktc", "KKTC");

  return normalized.replace(/\(([^)]+)\)/g, (_, city: string) => {
    return `(${city
      .split("-")
      .map(
        (part) =>
          part.charAt(0).toLocaleUpperCase("tr") +
          part.slice(1).toLocaleLowerCase("tr"),
      )
      .join("-")
      .replace("Kktc", "KKTC")})`;
  });
}

function normalizeDepartments(programs: YokProgram[]) {
  const seen = new Set<string>();

  return programs
    .map((program) => ({
      id: program.birimGrupId ?? program.birimAdi ?? program.birimGrupAdi,
      name: program.birimGrupAdi || program.birimAdi || "",
      scoreType: program.puanTuru ?? "",
    }))
    .filter((program) => program.name)
    .filter((program) => {
      const key = program.name.toLocaleLowerCase("tr");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name, "tr"));
}
