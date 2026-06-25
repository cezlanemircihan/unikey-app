"use client";

import { useEffect, useMemo, useState } from "react";
import {
  commonDepartments,
  turkeyUniversities,
} from "@/lib/turkey-universities";
import type { QuizQuestion as StudyQuizQuestion } from "@/lib/study-engine";

type Screen =
  | "auth"
  | "verify"
  | "dashboard"
  | "course-info"
  | "document-upload"
  | "summary-process"
  | "course-ready"
  | "study-chat"
  | "quiz"
  | "quiz-result"
  | "summary-review";

type DocumentItem = {
  id: number;
  name: string;
  pageCount: number;
  text: string;
  summary: string;
  keywords: string[];
  quiz: StudyQuizQuestion[];
};

type AnalyzeResponse = {
  name: string;
  pageCount: number;
  text: string;
  summary: string;
  keywords: string[];
  quiz: StudyQuizQuestion[];
  error?: string;
};

type PdfTextItem = {
  str?: string;
};

type UniversityOption = {
  id?: number;
  name: string;
};

type DepartmentOption = {
  id?: number | string;
  name: string;
  scoreType?: string;
};

const wizardSteps = ["Ders Bilgileri", "Doküman Ekle", "Özet Çıkar", "Hazır!"];

const sampleCourses = [
  {
    title: "Veri Yapıları ve Algoritmalar",
    pdfs: 12,
    quizzes: 34,
    success: 82,
    lastStudy: "dün",
    weakTopic: "Bağlı listeler",
    accent: "orange",
  },
  {
    title: "Makine Öğrenmesi",
    pdfs: 7,
    quizzes: 18,
    success: 64,
    lastStudy: "2 gün önce",
    weakTopic: "Model doğrulama",
    accent: "purple",
  },
  {
    title: "Elektrik Devreleri",
    pdfs: 5,
    quizzes: 11,
    success: 58,
    lastStudy: "geçen hafta",
    weakTopic: "Thevenin eşdeğeri",
    accent: "blue",
  },
];

const fallbackTopics = [
  "Veri Yapıları Temelleri",
  "Diziler",
  "Bağlı Listeler",
  "Stack ve Queue",
  "Ağaç Yapıları",
  "Grafikler",
  "Sıralama Algoritmaları",
  "Arama Algoritmaları",
];

export default function Home() {
  const [screen, setScreen] = useState<Screen>("auth");
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userUniversity, setUserUniversity] = useState("");
  const [userDepartment, setUserDepartment] = useState("");
  const [userYear, setUserYear] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [authError, setAuthError] = useState("");
  const [courseName, setCourseName] = useState("Veri Yapıları ve Algoritmalar");
  const [courseCode, setCourseCode] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizScope, setQuizScope] = useState<"all" | "latest">("all");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  const currentDocument = documents[documents.length - 1];
  const currentQuiz = useMemo(
    () =>
      (quizScope === "latest"
        ? (currentDocument?.quiz ?? [])
        : documents.flatMap((document) => document.quiz)
      ).slice(0, 10),
    [currentDocument, documents, quizScope],
  );
  const topics = useMemo(() => {
    const keywords = currentDocument?.keywords ?? [];
    return keywords.length > 0
      ? keywords.slice(0, 8).map((keyword) => titleCase(keyword))
      : fallbackTopics;
  }, [currentDocument]);
  const correctCount = currentQuiz.reduce((count, item, index) => {
    return selectedAnswers[index] === item.answer ? count + 1 : count;
  }, 0);

  function submitRegister() {
    if (
      !userEmail.trim() ||
      !userPassword.trim() ||
      !userUniversity.trim() ||
      !userDepartment.trim() ||
      !userYear.trim()
    ) {
      setAuthError("Hesabı senkronize edebilmek için tüm alanları doldurmalısın.");
      return;
    }

    if (!userEmail.includes("@") || userPassword.length < 6) {
      setAuthError("Geçerli bir e-posta ve en az 6 karakterli şifre gir.");
      return;
    }

    setAuthError("");
    setVerificationCode("");
    setScreen("verify");
  }

  function submitLogin() {
    if (!userEmail.trim() || !userPassword.trim()) {
      setAuthError("Giriş yapmak için e-posta ve şifreni yazmalısın.");
      return;
    }

    if (!userEmail.includes("@")) {
      setAuthError("Geçerli bir e-posta adresi gir.");
      return;
    }

    setAuthError("");
    setScreen("dashboard");
  }

  function verifyAccount() {
    if (verificationCode.trim() !== "123456") {
      setAuthError("Doğrulama kodu hatalı. Demo için kod: 123456");
      return;
    }

    setAuthError("");
    setScreen("dashboard");
  }

  async function analyzeSelectedFile() {
    if (!selectedFile) return;

    setIsUploading(true);
    setErrorMessage("");
    setScreen("summary-process");

    try {
      if (!selectedFile.name.toLocaleLowerCase("tr").endsWith(".pdf")) {
        throw new Error("Şimdilik yalnızca PDF dosyası destekleniyor.");
      }

      const extracted = await extractPdfTextFromFile(selectedFile);
      const textForAnalysis = extracted.text.slice(0, 180000);

      if (textForAnalysis.trim().length < 80) {
        throw new Error(
          "PDF metni okunamadı. Dosya taranmış görsel olabilir; şimdilik metin seçilebilen PDF yükle.",
        );
      }

      const response = await fetch("/api/documents/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName,
          documentName: selectedFile.name,
          pageCount: extracted.pageCount,
          text: textForAnalysis,
        }),
      });
      const payload = await readJsonResponse<AnalyzeResponse>(response);

      if (!response.ok || payload.error) {
        throw new Error(payload.error || "PDF analiz edilemedi.");
      }

      setDocuments((items) => [
        ...items,
        {
          id: Date.now(),
          name: payload.name,
          pageCount: payload.pageCount,
          text: payload.text,
          summary: payload.summary,
          keywords: payload.keywords,
          quiz: payload.quiz,
        },
      ]);
      setSelectedFile(null);
      setQuizIndex(0);
      setSelectedAnswers({});
      setScreen("course-ready");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Doküman analiz edilirken beklenmeyen bir sorun oluştu.",
      );
      setScreen("document-upload");
    } finally {
      setIsUploading(false);
    }
  }

  async function askQuestion() {
    if (!question.trim() || !currentDocument) return;

    setIsAnswering(true);
    setErrorMessage("");
    setAnswer("");

    try {
      const response = await fetch("/api/documents/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: currentDocument.text,
          question,
        }),
      });
      const payload = await readJsonResponse<{
        answer?: string;
        error?: string;
      }>(response);

      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Soru cevaplanamadı.");
      }

      setAnswer(payload.answer ?? "");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Soru cevaplanırken beklenmeyen bir sorun oluştu.",
      );
    } finally {
      setIsAnswering(false);
    }
  }

  function startNewCourse() {
    setCourseName("");
    setCourseCode("");
    setCourseDescription("");
    setSelectedFile(null);
    setDocuments([]);
    setQuestion("");
    setAnswer("");
    setErrorMessage("");
    setQuizIndex(0);
    setQuizScope("all");
    setSelectedAnswers({});
    setScreen("course-info");
  }

  function goDashboard() {
    setScreen("dashboard");
  }

  if (screen === "auth" || screen === "verify") {
    return (
      <AuthScreen
        mode={screen}
        authMode={authMode}
        email={userEmail}
        password={userPassword}
        university={userUniversity}
        department={userDepartment}
        year={userYear}
        verificationCode={verificationCode}
        errorMessage={authError}
        setEmail={setUserEmail}
        setPassword={setUserPassword}
        setUniversity={setUserUniversity}
        setDepartment={setUserDepartment}
        setYear={setUserYear}
        setVerificationCode={setVerificationCode}
        onRegister={submitRegister}
        onLogin={submitLogin}
        onVerify={verifyAccount}
        onSwitchAuthMode={() => {
          setAuthError("");
          setAuthMode((current) => (current === "register" ? "login" : "register"));
        }}
        onBack={() => {
          setAuthError("");
          setScreen("auth");
        }}
      />
    );
  }

  return (
    <main className="app-shell">
      <AppSidebar
        screen={screen}
        email={userEmail}
        hasDocuments={documents.length > 0}
        onDashboard={goDashboard}
        onNewCourse={startNewCourse}
        onNavigate={(target) => setScreen(target)}
      />

      <section className="app-main">
        {screen === "dashboard" && (
          <Dashboard
            courseName={courseName}
            documents={documents}
            university={userUniversity}
            department={userDepartment}
            onContinue={() =>
              documents.length > 0 ? setScreen("course-ready") : setScreen("document-upload")
            }
            onNewCourse={startNewCourse}
          />
        )}

        {screen === "course-info" && (
          <WizardFrame title="Yeni Ders Oluştur" activeStep={0} onBack={goDashboard}>
            <CourseInfoStep
              courseName={courseName}
              courseCode={courseCode}
              courseDescription={courseDescription}
              setCourseName={setCourseName}
              setCourseCode={setCourseCode}
              setCourseDescription={setCourseDescription}
              onContinue={() => setScreen("document-upload")}
            />
          </WizardFrame>
        )}

        {screen === "document-upload" && (
          <WizardFrame title={courseName || "Yeni Ders"} activeStep={1} onBack={() => setScreen("course-info")}>
            <DocumentUploadStep
              selectedFile={selectedFile}
              documents={documents}
              errorMessage={errorMessage}
              setSelectedFile={setSelectedFile}
              onAnalyze={analyzeSelectedFile}
            />
          </WizardFrame>
        )}

        {screen === "summary-process" && (
          <WizardFrame title={courseName || "Yeni Ders"} activeStep={2} onBack={() => setScreen("document-upload")}>
            <SummaryProcessStep isUploading={isUploading} />
          </WizardFrame>
        )}

        {screen === "course-ready" && (
          <WizardFrame title={courseName || "Yeni Ders"} activeStep={3} onBack={() => setScreen("document-upload")}>
            <CourseReadyStep
              topics={topics}
              summary={currentDocument?.summary}
              documentsCount={documents.length}
              onStudy={() => setScreen("study-chat")}
              onQuiz={(scope) => {
                setQuizScope(scope);
                setQuizIndex(0);
                setSelectedAnswers({});
                setScreen("quiz");
              }}
              onAddDocument={() => setScreen("document-upload")}
              onFinish={goDashboard}
            />
          </WizardFrame>
        )}

        {screen === "study-chat" && (
          <StudyChat
            courseName={courseName}
            topics={topics}
            question={question}
            answer={answer}
            errorMessage={errorMessage}
            isAnswering={isAnswering}
            setQuestion={setQuestion}
            askQuestion={askQuestion}
            onBack={() => setScreen("course-ready")}
            onQuiz={() => {
              setQuizScope("all");
              setQuizIndex(0);
              setSelectedAnswers({});
              setScreen("quiz");
            }}
          />
        )}

        {screen === "quiz" && (
          <QuizScreen
            courseName={courseName}
            topics={topics}
            quiz={currentQuiz}
            quizIndex={quizIndex}
            selectedAnswers={selectedAnswers}
            setQuizIndex={setQuizIndex}
            setSelectedAnswers={setSelectedAnswers}
            onBack={() => setScreen("course-ready")}
            onFinish={() => setScreen("quiz-result")}
          />
        )}

        {screen === "quiz-result" && (
          <QuizResult
            correctCount={correctCount}
            total={currentQuiz.length}
            topics={topics}
            onMoreQuiz={() => {
              setQuizIndex(0);
              setSelectedAnswers({});
              setScreen("quiz");
            }}
            onReview={() => setScreen("summary-review")}
            onDashboard={goDashboard}
          />
        )}

        {screen === "summary-review" && (
          <SummaryReview
            courseName={courseName}
            currentDocument={currentDocument}
            topics={topics}
            onBack={() => setScreen("quiz-result")}
            onNext={() => setScreen("course-ready")}
          />
        )}
      </section>
    </main>
  );
}

function AppSidebar({
  screen,
  email,
  hasDocuments,
  onDashboard,
  onNewCourse,
  onNavigate,
}: {
  screen: Screen;
  email: string;
  hasDocuments: boolean;
  onDashboard: () => void;
  onNewCourse: () => void;
  onNavigate: (screen: Screen) => void;
}) {
  const nav = [
    ["Ana Sayfa", "⌂", "dashboard"],
    ["Derslerim", "□", "course-ready"],
    ["Çalışma Alanı", "◈", "study-chat"],
    ["Quizlerim", "?", "quiz"],
    ["Notlarım", "✓", "summary-review"],
  ] as const;

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">Ü</div>
        <strong>ÜniKEY</strong>
      </div>
      <nav className="sidebar-nav">
        {nav.map(([label, icon, target]) => (
          <button
            key={label}
            className={screen === target ? "active" : ""}
            onClick={() => {
              if (target === "dashboard") {
                onDashboard();
                return;
              }

              if (hasDocuments) onNavigate(target);
              else onNavigate("document-upload");
            }}
          >
            <span aria-hidden="true">{icon}</span>
            {label}
          </button>
        ))}
      </nav>
      <button className="new-course-button" onClick={onNewCourse}>
        Yeni Ders Ekle
      </button>
      <div className="sidebar-user">
        <div className="avatar">A</div>
        <div>
          <strong>{email ? email.split("@")[0] : "Öğrenci"}</strong>
          <small>{email || "senkronize hesap"}</small>
        </div>
      </div>
    </aside>
  );
}

function AuthScreen({
  mode,
  authMode,
  email,
  password,
  university,
  department,
  year,
  verificationCode,
  errorMessage,
  setEmail,
  setPassword,
  setUniversity,
  setDepartment,
  setYear,
  setVerificationCode,
  onRegister,
  onLogin,
  onVerify,
  onSwitchAuthMode,
  onBack,
}: {
  mode: "auth" | "verify";
  authMode: "register" | "login";
  email: string;
  password: string;
  university: string;
  department: string;
  year: string;
  verificationCode: string;
  errorMessage: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  setUniversity: (value: string) => void;
  setDepartment: (value: string) => void;
  setYear: (value: string) => void;
  setVerificationCode: (value: string) => void;
  onRegister: () => void;
  onLogin: () => void;
  onVerify: () => void;
  onSwitchAuthMode: () => void;
  onBack: () => void;
}) {
  const [universityOptions, setUniversityOptions] = useState<UniversityOption[]>(
    () => turkeyUniversities.map((name) => ({ name })),
  );
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>(
    () => commonDepartments.map((name) => ({ name })),
  );
  const selectedUniversity = useMemo(
    () =>
      universityOptions.find(
        (option) =>
          option.name.toLocaleLowerCase("tr") ===
          university.toLocaleLowerCase("tr"),
      ),
    [university, universityOptions],
  );

  useEffect(() => {
    let isMounted = true;

    fetch("/api/yok-atlas?type=universities")
      .then((response) => {
        if (!response.ok) throw new Error("Üniversite listesi alınamadı.");
        return response.json() as Promise<{ universities: UniversityOption[] }>;
      })
      .then((payload) => {
        if (isMounted && payload.universities.length > 0) {
          setUniversityOptions(payload.universities);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUniversityOptions(turkeyUniversities.map((name) => ({ name })));
        }
      })

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!selectedUniversity?.id) {
      return () => {
        isMounted = false;
      };
    }

    fetch(`/api/yok-atlas?type=departments&universityId=${selectedUniversity.id}`)
      .then((response) => {
        if (!response.ok) throw new Error("Bölüm listesi alınamadı.");
        return response.json() as Promise<{ departments: DepartmentOption[] }>;
      })
      .then((payload) => {
        if (isMounted && payload.departments.length > 0) {
          setDepartmentOptions(payload.departments);
        }
      })
      .catch(() => {
        if (isMounted) {
          setDepartmentOptions(commonDepartments.map((name) => ({ name })));
        }
      })

    return () => {
      isMounted = false;
    };
  }, [selectedUniversity?.id]);

  return (
    <main className="auth-shell">
      <section className="auth-hero">
        <div className="sidebar-brand">
          <div className="brand-mark">Ü</div>
          <strong>ÜniKEY</strong>
        </div>
        <h1>PDF’lerini yükle. 5 dakikada sınava hazırlan.</h1>
        <p>
          ÜniKEY yüklediğin ders notlarını analiz eder, özet çıkarır,
          eksiklerini bulur ve aynı materyalden sana quiz hazırlar.
        </p>
        <div className="auth-preview">
          <span>1</span>
          <strong>PDF yükle</strong>
          <span>2</span>
          <strong>AI özet çıkarsın</strong>
          <span>3</span>
          <strong>Quiz çöz</strong>
        </div>
      </section>

      <section className="auth-card">
        {mode === "auth" ? (
          <>
            <small>{authMode === "register" ? "Hesap oluştur" : "Giriş yap"}</small>
            <h2>
              {authMode === "register"
                ? "Senkronizasyon için basit kayıt"
                : "Hesabına geri dön"}
            </h2>
            <p className="auth-note">
              {authMode === "register"
                ? "Kayıt şimdilik sadece derslerini ve doküman akışını aynı hesapta tutmak için var."
                : "Daha önce kayıt olduysan derslerine ve dokümanlarına buradan devam edebilirsin."}
            </p>
            {errorMessage && <div className="error-banner">{errorMessage}</div>}
            <Field label="E-posta">
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ornek@gmail.com"
                className="input"
              />
            </Field>
            <Field label="Şifre">
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="En az 6 karakter"
                type="password"
                className="input"
              />
            </Field>
            {authMode === "register" && (
              <>
                <Field label="Üniversite">
                  <input
                    value={university}
                    onChange={(event) => {
                      setUniversity(event.target.value);
                      setDepartment("");
                    }}
                    placeholder="Üniversiten"
                    list="university-options"
                    className="input"
                  />
                  <datalist id="university-options">
                    {universityOptions.map((item) => (
                      <option key={`${item.id ?? item.name}`} value={item.name} />
                    ))}
                  </datalist>
                  <small className="field-hint">
                    Üniversiteni yazmaya başla ve YÖK Atlas listesinden seç.
                  </small>
                </Field>
                <div className="auth-two-col">
                  <Field label="Bölüm">
                    <input
                      value={department}
                      onChange={(event) => setDepartment(event.target.value)}
                      placeholder="Bölümün"
                      list="department-options"
                      className="input"
                    />
                    <datalist id="department-options">
                      {departmentOptions.map((item) => (
                        <option
                          key={`${item.id ?? item.name}`}
                          value={item.name}
                          label={item.scoreType ? `${item.name} · ${item.scoreType}` : item.name}
                        />
                      ))}
                    </datalist>
                    <small className="field-hint">
                      {selectedUniversity?.id
                        ? "Bölümler seçtiğin üniversiteye göre YÖK Atlas'tan gelir."
                        : "Önce üniversiteyi listeden seç."}
                    </small>
                  </Field>
                  <Field label="Kaçıncı sene">
                    <input
                      value={year}
                      onChange={(event) => setYear(event.target.value)}
                      placeholder="2. sınıf"
                      className="input"
                    />
                  </Field>
                </div>
              </>
            )}
            <button
              className="primary-button"
              onClick={authMode === "register" ? onRegister : onLogin}
            >
              {authMode === "register" ? "Doğrulama Kodunu Gönder" : "Giriş Yap"}
            </button>
            <button className="auth-switch" onClick={onSwitchAuthMode}>
              {authMode === "register"
                ? "veya giriş yap"
                : "veya yeni hesap oluştur"}
            </button>
          </>
        ) : (
          <>
            <button className="back-link" onClick={onBack}>
              ← Bilgileri düzenle
            </button>
            <small>E-posta doğrulama</small>
            <h2>Gelen kodu gir</h2>
            <p className="auth-note">
              Demo sürümünde gerçek e-posta gönderimi yerine doğrulama kodu
              123456 olarak çalışıyor.
            </p>
            {errorMessage && <div className="error-banner">{errorMessage}</div>}
            <Field label={`${email} adresine gelen kod`}>
              <input
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                placeholder="123456"
                className="input code-input"
              />
            </Field>
            <button className="primary-button" onClick={onVerify}>
              Hesabı Aktifleştir
            </button>
          </>
        )}
      </section>
    </main>
  );
}

function Dashboard({
  courseName,
  documents,
  university,
  department,
  onContinue,
  onNewCourse,
}: {
  courseName: string;
  documents: DocumentItem[];
  university: string;
  department: string;
  onContinue: () => void;
  onNewCourse: () => void;
}) {
  const hasDocuments = documents.length > 0;
  const uploadedPdfCount = hasDocuments ? documents.length : 12;
  const quizCount = hasDocuments
    ? documents.reduce((total, document) => total + document.quiz.length, 0)
    : 48;
  const successRate = hasDocuments ? 74 : 68;

  return (
    <div className="dashboard-page">
      <header className="page-heading">
        <div>
          <h1>Bugün ne çalışmak istiyorsun?</h1>
          <p>
            {university || "Üniversite"} · {department || "Bölüm"} için PDF’lerini
            yükle, özet çıkar ve vize/final tarzı quiz çöz.
          </p>
        </div>
        <button className="secondary-button" onClick={onContinue}>
          Son Çalışmaya Devam Et
        </button>
      </header>

      <section className="dashboard-hero">
        <button className="pdf-cta-card" onClick={onNewCourse}>
          <span className="cta-kicker">PDF → Özet → Quiz</span>
          <strong>PDF yükle ve sınav modunu başlat</strong>
          <small>
            Ders notunu seç; ÜniKEY önemli konuları çıkarır, anlaşılmayan yerleri
            cevaplar ve quiz hazırlar.
          </small>
          <em>PDF YÜKLE</em>
        </button>
        <div className="ai-insight-card">
          <span>ÜniKEY Analizi</span>
          <strong>{courseName || "Veri Yapıları ve Algoritmalar"}</strong>
          <ul>
            <li>Bağlı liste konusu zayıf görünüyor.</li>
            <li>Ağaç yapılarında hata oranı %42.</li>
            <li>Final öncesi quiz tekrarları öneriliyor.</li>
          </ul>
        </div>
      </section>

      <section className="study-metric-grid">
        <div>
          <strong>{uploadedPdfCount}</strong>
          <span>PDF işlendi</span>
        </div>
        <div>
          <strong>{quizCount}</strong>
          <span>Quiz sorusu</span>
        </div>
        <div>
          <strong>%{successRate}</strong>
          <span>Ortalama başarı</span>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-title">
          <h2>Ders bazlı çalışma</h2>
          <button>Tümünü gör</button>
        </div>
        <div className="course-grid">
          {sampleCourses.map((course) => (
            <div key={course.title} className={`course-card ${course.accent}`}>
              <span>{course.title.slice(0, 2)}</span>
              <strong>{course.title}</strong>
              <div className="course-stats">
                <small>{course.pdfs} PDF</small>
                <small>{course.quizzes} Quiz</small>
                <small>%{course.success} başarı</small>
              </div>
              <p>Zayıf konu: {course.weakTopic}</p>
              <em>Son çalışma: {course.lastStudy}</em>
            </div>
          ))}
          <button className="add-course-card" onClick={onNewCourse}>
            <span>+</span>
            Yeni PDF / Ders Ekle
          </button>
        </div>
      </section>

      <section className="quick-flow-card">
        <h2>Ürün nasıl çalışıyor?</h2>
        <div>
          <span>1. PDF yükle</span>
          <span>2. AI özet çıkarsın</span>
          <span>3. Quiz çöz</span>
        </div>
      </section>
    </div>
  );
}

function WizardFrame({
  title,
  activeStep,
  onBack,
  children,
}: {
  title: string;
  activeStep: number;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="wizard-page">
      <header className="wizard-header">
        <button onClick={onBack}>←</button>
        <strong>{title}</strong>
      </header>
      <div className="wizard-steps">
        {wizardSteps.map((step, index) => (
          <div key={step} className={index <= activeStep ? "active" : ""}>
            <span>{index + 1}</span>
            <small>{step}</small>
          </div>
        ))}
      </div>
      {children}
    </div>
  );
}

function CourseInfoStep({
  courseName,
  courseCode,
  courseDescription,
  setCourseName,
  setCourseCode,
  setCourseDescription,
  onContinue,
}: {
  courseName: string;
  courseCode: string;
  courseDescription: string;
  setCourseName: (value: string) => void;
  setCourseCode: (value: string) => void;
  setCourseDescription: (value: string) => void;
  onContinue: () => void;
}) {
  return (
    <section className="wizard-form">
      <Field label="Ders Adı">
        <input
          value={courseName}
          onChange={(event) => setCourseName(event.target.value)}
          placeholder="Ders adını girin"
          className="input"
        />
      </Field>
      <Field label="Ders Kodu">
        <input
          value={courseCode}
          onChange={(event) => setCourseCode(event.target.value)}
          placeholder="Örn: CSE 102"
          className="input"
        />
      </Field>
      <Field label="Ders Hakkında">
        <textarea
          value={courseDescription}
          onChange={(event) => setCourseDescription(event.target.value)}
          placeholder="Ders hakkında kısa bilgi"
          className="input textarea"
        />
      </Field>
      <button disabled={!courseName.trim()} onClick={onContinue} className="primary-button">
        Doküman Ekle →
      </button>
    </section>
  );
}

function DocumentUploadStep({
  selectedFile,
  documents,
  errorMessage,
  setSelectedFile,
  onAnalyze,
}: {
  selectedFile: File | null;
  documents: DocumentItem[];
  errorMessage: string;
  setSelectedFile: (file: File | null) => void;
  onAnalyze: () => void;
}) {
  return (
    <section className="upload-page">
      {errorMessage && <div className="error-banner">{errorMessage}</div>}
      <label className="upload-dropzone">
        <span>☁</span>
        <strong>Dokümanlarını Yükle</strong>
        <small>PDF dosyanı seç. Özet ve quiz bu dokümandan hazırlanır.</small>
        <input
          type="file"
          accept=".pdf"
          className="sr-only"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <div className="uploaded-list">
        <h3>Yüklenen Dosyalar</h3>
        {documents.map((document) => (
          <div key={document.id} className="uploaded-item">
            <span>PDF</span>
            <p>{document.name}</p>
            <small>{document.pageCount} sayfa</small>
          </div>
        ))}
        {selectedFile && (
          <div className="uploaded-item pending">
            <span>PDF</span>
            <p>{selectedFile.name}</p>
            <small>Hazır</small>
          </div>
        )}
      </div>
      <button disabled={!selectedFile} onClick={onAnalyze} className="primary-button">
        Özeti Çıkar →
      </button>
    </section>
  );
}

function SummaryProcessStep({ isUploading }: { isUploading: boolean }) {
  const steps = [
    "Dokümanlar analiz ediliyor...",
    "Önemli konular belirleniyor...",
    "Özet oluşturuluyor...",
    "Anahtar noktalar çıkarılıyor...",
    "Quiz soruları hazırlanıyor...",
  ];

  return (
    <section className="process-panel">
      <h2>Akıllı Özet</h2>
      <p>Yapay zeka dokümanlarını analiz ederek en önemli noktaları çıkarıyor.</p>
      <div className="process-list">
        {steps.map((step, index) => (
          <div key={step} className={index < 3 || !isUploading ? "done" : ""}>
            <span>{index < 3 || !isUploading ? "✓" : "○"}</span>
            <p>{step}</p>
            {index === 2 && isUploading && <small>%75</small>}
          </div>
        ))}
      </div>
      <div className="hint-box">
        İpucu: Daha iyi sonuçlar için kaliteli ve düzenli dokümanlar yüklemeye özen göster.
      </div>
    </section>
  );
}

function CourseReadyStep({
  topics,
  summary,
  documentsCount,
  onStudy,
  onQuiz,
  onAddDocument,
  onFinish,
}: {
  topics: string[];
  summary?: string;
  documentsCount: number;
  onStudy: () => void;
  onQuiz: (scope: "all" | "latest") => void;
  onAddDocument: () => void;
  onFinish: () => void;
}) {
  return (
    <section className="ready-panel">
      <h2>Özet Hazır!</h2>
      <p>Dokümanların başarıyla analiz edildi. Bu derste öne çıkan konular:</p>
      {summary && (
        <article className="summary-preview">
          <h3>Akıllı Özet</h3>
          <p>{summary}</p>
        </article>
      )}
      <div className="topic-grid">
        {topics.map((topic, index) => (
          <div key={topic}>
            <span>{index + 1}</span>
            {topic}
          </div>
        ))}
      </div>
      <h3>Ne yapmak istersin?</h3>
      <div className="ready-actions">
        <button className="green-button" onClick={onStudy}>
          Anlamadığım Noktaları Sor
        </button>
        <button className="primary-button" onClick={() => onQuiz("all")}>
          Evet, Quizi Hazırla
        </button>
        <button className="blue-button" onClick={onAddDocument}>
          Hayır, Daha Fazla Doküman Ekle
        </button>
        {documentsCount > 1 && (
          <button className="secondary-button" onClick={() => onQuiz("latest")}>
            Sadece Bu PDF İçin Quiz Üret
          </button>
        )}
        <button className="secondary-button" onClick={onFinish}>
          Çalışmayı Bitir
        </button>
      </div>
    </section>
  );
}

function StudyChat({
  courseName,
  topics,
  question,
  answer,
  errorMessage,
  isAnswering,
  setQuestion,
  askQuestion,
  onBack,
  onQuiz,
}: {
  courseName: string;
  topics: string[];
  question: string;
  answer: string;
  errorMessage: string;
  isAnswering: boolean;
  setQuestion: (value: string) => void;
  askQuestion: () => void;
  onBack: () => void;
  onQuiz: () => void;
}) {
  return (
    <div className="chat-page">
      <header className="wizard-header">
        <button onClick={onBack}>←</button>
        <strong>{courseName}</strong>
        <button onClick={onQuiz}>Quiz</button>
      </header>
      <aside className="topic-sidebar">
        <h3>Konular</h3>
        {topics.map((topic, index) => (
          <button key={topic} className={index === 2 ? "active" : ""}>
            {index + 1}. {topic}
          </button>
        ))}
        <div className="progress-card">
          <strong>3/8 konu</strong>
          <span>%37</span>
        </div>
      </aside>
      <section className="chat-window">
        <div className="chat-bubble user">
          Bağlı listelerde bir elemanı nasıl silinir?
        </div>
        <div className="chat-bubble">
          Bağlı listede eleman silmek için önce silinecek eleman bulunur,
          önceki elemanın next pointer’ı güncellenir ve bağlantı korunur.
        </div>
        {answer && <div className="chat-bubble">{answer}</div>}
        {errorMessage && <div className="error-banner">{errorMessage}</div>}
        <div className="chat-input">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Mesajınızı yazın..."
            className="input"
          />
          <button onClick={askQuestion} disabled={!question.trim() || isAnswering}>
            {isAnswering ? "..." : "➤"}
          </button>
        </div>
      </section>
    </div>
  );
}

function QuizScreen({
  courseName,
  topics,
  quiz,
  quizIndex,
  selectedAnswers,
  setQuizIndex,
  setSelectedAnswers,
  onBack,
  onFinish,
}: {
  courseName: string;
  topics: string[];
  quiz: StudyQuizQuestion[];
  quizIndex: number;
  selectedAnswers: Record<number, string>;
  setQuizIndex: (index: number) => void;
  setSelectedAnswers: (answers: Record<number, string>) => void;
  onBack: () => void;
  onFinish: () => void;
}) {
  const question = quiz[quizIndex];

  if (!question) {
    return (
      <WizardFrame title={courseName} activeStep={3} onBack={onBack}>
        <CourseReadyStep
          topics={topics}
          summary={undefined}
          documentsCount={0}
          onStudy={onBack}
          onQuiz={() => onBack()}
          onAddDocument={onBack}
          onFinish={onBack}
        />
      </WizardFrame>
    );
  }

  const selected = selectedAnswers[quizIndex];

  return (
    <div className="quiz-page">
      <header className="wizard-header">
        <button onClick={onBack}>←</button>
        <strong>{courseName}</strong>
        <span>Puan: {Object.keys(selectedAnswers).length * 10}</span>
      </header>
      <section className="quiz-main">
        <p>Soru {quizIndex + 1}/{quiz.length}</p>
        <h2>{question.question}</h2>
        <div className="quiz-answer-list">
          {question.options.map((option, index) => (
            <button
              key={option}
              className={selected === option ? "selected" : ""}
              onClick={() =>
                setSelectedAnswers({ ...selectedAnswers, [quizIndex]: option })
              }
            >
              {String.fromCharCode(65 + index)}) {option}
            </button>
          ))}
        </div>
        {selected && (
          <div className="feedback-box">
            <strong>{selected === question.answer ? "Doğru!" : "Tekrar bak"}</strong>
            <p>{question.source}</p>
          </div>
        )}
        <button
          className="primary-button"
          onClick={() => {
            if (quizIndex + 1 >= quiz.length) onFinish();
            else setQuizIndex(quizIndex + 1);
          }}
        >
          {quizIndex + 1 >= quiz.length ? "Sonucu Gör" : "Sonraki Soru →"}
        </button>
      </section>
      <aside className="quiz-sidebar">
        <h3>Quiz İlerlemesi</h3>
        <div className="progress-line">
          <i style={{ width: `${((quizIndex + 1) / quiz.length) * 100}%` }} />
        </div>
        {topics.map((topic, index) => (
          <p key={topic}>
            {index + 1}. {topic} <span>{index < 3 ? "80%" : "0%"}</span>
          </p>
        ))}
      </aside>
    </div>
  );
}

function QuizResult({
  correctCount,
  total,
  topics,
  onMoreQuiz,
  onReview,
  onDashboard,
}: {
  correctCount: number;
  total: number;
  topics: string[];
  onMoreQuiz: () => void;
  onReview: () => void;
  onDashboard: () => void;
}) {
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  return (
    <div className="result-page">
      <section className="score-card">
        <div className="score-ring">{score}%</div>
        <h2>Harika!</h2>
        <p>{correctCount} doğru, {Math.max(total - correctCount, 0)} yanlış</p>
      </section>
      <section className="analysis-card">
        <h3>Performans Analizi</h3>
        {topics.slice(0, 5).map((topic, index) => (
          <p key={topic} className={index < 3 ? "good" : "weak"}>
            {topic}
          </p>
        ))}
      </section>
      <section className="next-card">
        <h3>Ne yapmak istersin?</h3>
        <button onClick={onMoreQuiz}>Daha Fazla Soru Çöz</button>
        <button onClick={onReview}>Konuyu Tekrar Çalış</button>
        <button onClick={onDashboard}>Ana Sayfaya Dön</button>
      </section>
    </div>
  );
}

function SummaryReview({
  courseName,
  currentDocument,
  topics,
  onBack,
  onNext,
}: {
  courseName: string;
  currentDocument?: DocumentItem;
  topics: string[];
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="review-page">
      <header className="wizard-header">
        <button onClick={onBack}>←</button>
        <strong>Artık Bunları Biliyorsun!</strong>
      </header>
      <aside className="review-topics">
        {topics.map((topic) => (
          <p key={topic}>✓ {topic}</p>
        ))}
      </aside>
      <section className="review-content">
        <small>{courseName} · Özet</small>
        <h2>{topics[0] || "Ders Özeti"}</h2>
        <p>{currentDocument?.summary || "Bu ders için özet henüz oluşturulmadı."}</p>
        <div className="action-row">
          <button onClick={onBack} className="secondary-button">← Önceki</button>
          <button onClick={onNext} className="primary-button">Sonraki →</button>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function titleCase(value: string) {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toLocaleUpperCase("tr") + word.slice(1))
    .join(" ");
}

async function extractPdfTextFromFile(file: File) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/legacy/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();

  const buffer = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    disableFontFace: true,
  });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = (content.items as PdfTextItem[])
      .map((item) => item.str)
      .filter(Boolean)
      .join(" ");

    pages.push(text);
  }

  return {
    pageCount: pdf.numPages,
    text: pages.join("\n\n"),
  };
}

async function readJsonResponse<T>(response: Response): Promise<T & { error?: string }> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await response.json()) as T & { error?: string };
  }

  const text = await response.text();
  const detail = text.includes("FUNCTION_PAYLOAD_TOO_LARGE")
    ? "PDF dosyası canlı site limitini aştı."
    : "Sunucu JSON yerine hata sayfası döndürdü.";

  return {
    error: `${detail} Sayfayı yenileyip tekrar dene; devam ederse daha küçük veya metin seçilebilen bir PDF yükle.`,
  } as T & { error?: string };
}
