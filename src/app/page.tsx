"use client";

import { useEffect, useMemo, useState } from "react";
import {
  commonDepartments,
  turkeyUniversities,
} from "@/lib/turkey-universities";
import {
  buildQuizResultAnalysis,
  buildWeakTopicMiniQuiz,
  type AiLesson,
  type LessonBlockType,
  type LessonModule,
  type OutputQualityReport,
  type QuizQuestion as StudyQuizQuestion,
  type StudySummary,
  type StudyTopic,
  type StructuredQuizQuestion,
  type WrongAnswerAnalysis,
} from "@/lib/study-engine";

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
  topics?: StudyTopic[];
  structuredSummary?: StudySummary;
  structuredQuiz?: StructuredQuizQuestion[];
  lesson?: AiLesson;
  quality?: OutputQualityReport;
  debug?: AnalysisDebug;
};

type AnalyzeResponse = {
  name: string;
  pageCount: number;
  text: string;
  summary: string;
  keywords: string[];
  quiz: StudyQuizQuestion[];
  topics?: StudyTopic[];
  structuredSummary?: StudySummary;
  structuredQuiz?: StructuredQuizQuestion[];
  lesson?: AiLesson;
  quality?: OutputQualityReport;
  debug?: AnalysisDebug;
  error?: string;
};

type AnalysisDebug = {
  topicCount: number;
  summaryFields: {
    shortOverview: boolean;
    mustKnow: number;
    keyConcepts: number;
    examStyleQuestions: number;
    commonConfusions: number;
    flashcards: number;
  };
  quizQuestionCount: number;
  missingTopicCount: number;
  missingSourcePageCount: number;
  lessonModuleCount?: number;
  lessonBlockCount?: number;
  missingCheckpointCount?: number;
  missingModuleSourcePageCount?: number;
  missingQuizModuleLinkCount?: number;
  lessonQualityScore?: number;
  fallbackUsed: boolean;
  jsonParseError: boolean;
  aiAttempted: boolean;
  aiFailureReason?: string;
  qualityScore: number;
  warnings: string[];
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

const wizardSteps = ["PDF Yükle", "AI Analiz", "AI Ders", "Final Quiz"];
const isDevelopment = process.env.NODE_ENV === "development";

const demoPdfText = `
[Sayfa 1] Chapter Two UNIX File Systems. The UNIX file system organizes files and directories in a hierarchical tree starting from the root directory. A working directory determines how relative pathnames are interpreted. In UNIX, regular files, directories, and device files are accessed through a common file interface.

[Sayfa 2] Everything is a file does not mean everything is a text file. It means the operating system exposes many resources with file-like operations such as open, read, write, and close. This model simplifies system programming and command behavior.

[Sayfa 3] Network File System, or NFS, allows a remote file system to be mounted and used like a local directory. Students should distinguish local file access from network-based file access. Exams often ask why NFS is useful and what problems may occur when files are accessed over a network.
`;

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
  const [reviewQuiz, setReviewQuiz] = useState<StudyQuizQuestion[] | null>(null);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [completedModuleIds, setCompletedModuleIds] = useState<string[]>([]);
  const [moduleAssistMode, setModuleAssistMode] = useState<
    "repeat" | "simple" | "example" | null
  >(null);

  const currentDocument = documents[documents.length - 1];
  const baseQuiz = useMemo(
    () =>
      (quizScope === "latest"
        ? (currentDocument?.quiz ?? [])
        : documents.flatMap((document) => document.quiz)
      ).slice(0, 10),
    [currentDocument, documents, quizScope],
  );
  const currentQuiz = reviewQuiz ?? baseQuiz;
  const topics = useMemo(() => {
    const keywords = currentDocument?.keywords ?? [];
    return keywords.length > 0
      ? keywords.slice(0, 8).map((keyword) => humanizeTopic(keyword))
      : fallbackTopics;
  }, [currentDocument]);
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
      const analysisCourseName =
        courseName.trim() && courseName !== "Yeni Ders"
          ? courseName
          : inferCourseNameFromFile(selectedFile.name);
      setCourseName(analysisCourseName);

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
          courseName: analysisCourseName,
          documentName: selectedFile.name,
          pageCount: extracted.pageCount,
          text: textForAnalysis,
        }),
      });
      const payload = await readJsonResponse<AnalyzeResponse>(response);

      if (!response.ok || payload.error) {
        throw new Error(payload.error || "PDF analiz edilemedi.");
      }

      appendAnalyzedDocument(payload);
      setSelectedFile(null);
      setQuizIndex(0);
      setSelectedAnswers({});
      setReviewQuiz(null);
      setActiveModuleIndex(0);
      setCompletedModuleIds([]);
      setModuleAssistMode(null);
      setScreen("course-ready");
    } catch (error) {
      setErrorMessage(formatAnalysisError(error));
      setScreen("document-upload");
    } finally {
      setIsUploading(false);
    }
  }

  async function runDemoAnalysisFlow() {
    if (!isDevelopment) return;

    setIsUploading(true);
    setErrorMessage("");
    setCourseName("İşletim Sistemleri Demo");
    setScreen("summary-process");

    try {
      const response = await fetch("/api/documents/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseName: "İşletim Sistemleri Demo",
          documentName: "demo-unix-file-systems.pdf",
          pageCount: 3,
          text: demoPdfText,
        }),
      });
      const payload = await readJsonResponse<AnalyzeResponse>(response);

      if (!response.ok || payload.error) {
        throw new Error(payload.error || "Demo analiz akışı çalıştırılamadı.");
      }

      appendAnalyzedDocument(payload);
      setSelectedFile(null);
      setQuizScope("latest");
      setQuizIndex(0);
      setSelectedAnswers({});
      setReviewQuiz(null);
      setActiveModuleIndex(0);
      setCompletedModuleIds([]);
      setModuleAssistMode(null);
      setScreen("course-ready");
    } catch (error) {
      setErrorMessage(formatAnalysisError(error));
      setScreen("document-upload");
    } finally {
      setIsUploading(false);
    }
  }

  function appendAnalyzedDocument(payload: AnalyzeResponse) {
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
        topics: payload.topics,
        structuredSummary: payload.structuredSummary,
        structuredQuiz: payload.structuredQuiz,
        lesson: payload.lesson,
        quality: payload.quality,
        debug: payload.debug,
      },
    ]);
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
    setCourseName("Yeni Ders");
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
    setReviewQuiz(null);
    setActiveModuleIndex(0);
    setCompletedModuleIds([]);
    setModuleAssistMode(null);
    setScreen("document-upload");
  }

  function completeActiveModule() {
    const lesson = currentDocument?.lesson;
    const lessonModule = lesson?.modules[activeModuleIndex];
    if (!lesson || !lessonModule) return;

    setCompletedModuleIds((ids) =>
      ids.includes(lessonModule.id) ? ids : [...ids, lessonModule.id],
    );
    setModuleAssistMode(null);

    if (activeModuleIndex + 1 < lesson.modules.length) {
      setActiveModuleIndex(activeModuleIndex + 1);
    }
  }

  function restartModule(moduleId: string) {
    const lesson = currentDocument?.lesson;
    const moduleIndex = lesson?.modules.findIndex((module) => module.id === moduleId) ?? -1;

    if (moduleIndex >= 0) {
      setActiveModuleIndex(moduleIndex);
      setModuleAssistMode("repeat");
      setScreen("course-ready");
    }
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
            email={userEmail}
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
          <WizardFrame title={courseName || "PDF Yükle"} activeStep={0} onBack={goDashboard}>
            <DocumentUploadStep
              courseName={courseName}
              selectedFile={selectedFile}
              documents={documents}
              errorMessage={errorMessage}
              setSelectedFile={setSelectedFile}
              onEditCourse={() => setScreen("course-info")}
              onAnalyze={analyzeSelectedFile}
              onRunDemo={runDemoAnalysisFlow}
            />
          </WizardFrame>
        )}

        {screen === "summary-process" && (
          <WizardFrame title={courseName || "Yeni Ders"} activeStep={1} onBack={() => setScreen("document-upload")}>
            <SummaryProcessStep isUploading={isUploading} />
          </WizardFrame>
        )}

        {screen === "course-ready" && (
          <WizardFrame title={courseName || "Yeni Ders"} activeStep={3} onBack={() => setScreen("document-upload")}>
            <CourseReadyStep
              topics={topics}
              lesson={currentDocument?.lesson}
              activeModuleIndex={activeModuleIndex}
              completedModuleIds={completedModuleIds}
              moduleAssistMode={moduleAssistMode}
              summary={currentDocument?.summary}
              documentsCount={documents.length}
              onStudy={() => setScreen("study-chat")}
              onModuleAssist={setModuleAssistMode}
              onCompleteModule={completeActiveModule}
              onRestartModule={restartModule}
              onQuiz={(scope) => {
                const lesson = currentDocument?.lesson;
                const isLessonComplete =
                  !lesson ||
                  lesson.modules.every((module) => completedModuleIds.includes(module.id));
                if (!isLessonComplete) return;
                setQuizScope(scope);
                setReviewQuiz(null);
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
              setReviewQuiz(null);
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
            topics={topics}
            quiz={currentQuiz}
            selectedAnswers={selectedAnswers}
            onMoreQuiz={() => {
              setReviewQuiz(null);
              setQuizIndex(0);
              setSelectedAnswers({});
              setScreen("quiz");
            }}
            onRetryMistakes={() => {
              const miniQuiz = buildWeakTopicMiniQuiz(currentQuiz, selectedAnswers, topics);
              setReviewQuiz(miniQuiz);
              setQuizIndex(0);
              setSelectedAnswers({});
              setScreen("quiz");
            }}
            onReviewWeak={(weakTopics) => {
              setQuestion(
                `Yanlış yaptığım şu konuları tekrar anlat: ${weakTopics.join(", ")}. Önce basitçe açıkla, sonra sınavda nasıl sorulabileceğini göster.`,
              );
              setScreen("study-chat");
            }}
            onReviewMistake={(mistake) => {
              setQuestion(
                `${mistake.topic} konusunu kısa ve basit Türkçe anlat. Özellikle şu soruyu neden yanlış yaptığımı açıkla: ${mistake.question}`,
              );
              setScreen("study-chat");
            }}
            lesson={currentDocument?.lesson}
            onReviewModule={restartModule}
            onReview={() => setScreen("summary-review")}
            onNewDocument={() => setScreen("document-upload")}
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

        {isDevelopment && (
          <AiQualityDebugPanel
            document={currentDocument}
            isBusy={isUploading}
            onRunDemo={runDemoAnalysisFlow}
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
        {hasDocuments ? "Yeni Ders Ekle" : "İlk PDF’ini Yükle"}
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
        <h1>PDF’lerini yükle. Sınava nasıl çalışacağını UniKEY söylesin.</h1>
        <p>
          UniKEY ders notlarını analiz eder, önemli konuları çıkarır, quiz
          hazırlar ve yanlışlarına göre tekrar planı oluşturur.
        </p>
        <div className="auth-preview">
          <span>1</span>
          <strong>İlk PDF’imi yükle</strong>
          <span>2</span>
          <strong>Özetini incele</strong>
          <span>3</span>
          <strong>Yanlışlarını tekrar et</strong>
        </div>
        <div className="trust-list">
          <span>PDF’inden konu çıkarır</span>
          <span>Sınav tarzı quiz üretir</span>
          <span>Yanlışlarını analiz eder</span>
          <span>Tekrar planı önerir</span>
        </div>
        <span className="landing-cta-label">İlk PDF’imi Yükle</span>
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
  email,
  onContinue,
  onNewCourse,
}: {
  courseName: string;
  documents: DocumentItem[];
  university: string;
  department: string;
  email: string;
  onContinue: () => void;
  onNewCourse: () => void;
}) {
  const hasDocuments = documents.length > 0;
  const firstName = email.split("@")[0]?.split(/[._-]/)[0] || "Emir";
  const uploadedPdfCount = documents.length;
  const quizCount = documents.reduce((total, document) => total + document.quiz.length, 0);
  const averageQuality =
    documents.length > 0
      ? Math.round(
          documents.reduce((total, document) => total + (document.quality?.score ?? 74), 0) /
            documents.length,
        )
      : 0;
  const latestDocument = documents.at(-1);
  const latestWeakTopic = latestDocument?.keywords[0] ?? "Henüz konu analizi yok";
  const realCourses = hasDocuments
    ? [
        {
          title: courseName && courseName !== "Yeni Ders" ? courseName : "PDF Çalışma Dersi",
          pdfs: uploadedPdfCount,
          quizzes: quizCount,
          success: averageQuality,
          weakTopic: latestWeakTopic,
          lastStudy: "az önce",
          accent: "purple",
        },
      ]
    : [];

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
        <button className="secondary-button" onClick={hasDocuments ? onContinue : onNewCourse}>
          {hasDocuments ? "Son Çalışmaya Devam Et" : "İlk PDF’imi Yükle"}
        </button>
      </header>

      {!hasDocuments ? (
        <section className="first-run-card">
          <div>
            <span>İlk kullanım</span>
            <h2>İlk PDF’ini yükle</h2>
            <p>
              UniKEY senin için özet, quiz ve çalışma planı hazırlasın. İlk
              dokümanı eklediğinde derslerin ve analizlerin burada görünür.
            </p>
            <div className="flow-strip">
              <strong>PDF</strong>
              <span>→</span>
              <strong>Özet</strong>
              <span>→</span>
              <strong>Quiz</strong>
              <span>→</span>
              <strong>Yanlışlarını tekrar et</strong>
            </div>
          </div>
          <div className="first-run-actions">
            <button className="primary-button" onClick={onNewCourse}>
              İlk PDF’imi Yükle
            </button>
            <div className="trust-list compact">
              <span>PDF’inden konu çıkarır</span>
              <span>Sınav tarzı quiz üretir</span>
              <span>Yanlışlarını analiz eder</span>
              <span>Tekrar planı önerir</span>
            </div>
          </div>
        </section>
      ) : (
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
          <div className="coach-card">
            <span>ÜniKEY Koçu</span>
            <strong>Merhaba {titleCase(firstName)}. Sıradaki adım: özeti incele.</strong>
            <p>
              {latestDocument
                ? `${latestDocument.name} analiz edildi. Şimdi özetini kontrol edip quiz çözebilirsin.`
                : "Dokümanını analiz ettikten sonra sana sıradaki adımı göstereceğim."}
            </p>
            <ul>
              <li>{latestWeakTopic} konusu tekrar için öne çıkıyor.</li>
              <li>Quizden sonra yanlış cevapların ayrıca analiz edilecek.</li>
              <li>Yeni PDF ekledikçe ders resmi daha netleşir.</li>
            </ul>
            <button onClick={onContinue}>Özeti incele</button>
          </div>
        </section>
      )}

      <NextStepCard
        title="Sonraki adım"
        description={
          hasDocuments
            ? "PDF yüklendi. Şimdi özeti inceleyip quiz aşamasına geçebilirsin."
            : "İlk PDF’ini yükle; UniKEY önce konuları çıkarıp sana çalışma akışını hazırlasın."
        }
        actionLabel={hasDocuments ? "Özeti İncele" : "İlk PDF’imi Yükle"}
        onAction={hasDocuments ? onContinue : onNewCourse}
      />

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
          <strong>{hasDocuments ? `%${averageQuality}` : "—"}</strong>
          <span>Analiz kalite skoru</span>
        </div>
      </section>

      {hasDocuments && (
        <section className="today-plan-card">
          <div>
            <span>Bugünün planı</span>
            <strong>Özeti incele · Quiz çöz · Yanlışlarını tekrar et</strong>
          </div>
          <button onClick={onContinue}>Çalışmaya Başla</button>
        </section>
      )}

      <section className="dashboard-section">
        <div className="section-title">
          <h2>Ders bazlı çalışma</h2>
          {hasDocuments && <button>Tümünü gör</button>}
        </div>
        <div className="course-grid">
          {realCourses.map((course) => (
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
          {!hasDocuments && (
            <EmptyStateCard
              title="Henüz ders yok"
              description="İlk PDF’ini yüklediğinde UniKEY ders başlığını, konuları ve çalışma akışını burada oluşturur."
              actionLabel="PDF yükle"
              onAction={onNewCourse}
            />
          )}
          <button className="add-course-card" onClick={onNewCourse}>
            <span>+</span>
            Yeni PDF / Ders Ekle
          </button>
        </div>
      </section>

      <section className="recent-pdf-card">
        <div className="section-title">
          <h2>Son yüklenen PDF’ler</h2>
          <button onClick={onNewCourse}>PDF ekle</button>
        </div>
        {hasDocuments ? (
          <div>
            {documents.slice(-3).reverse().map((document) => (
              <p key={document.name}>
                <strong>{document.name}</strong>
                <span>{document.keywords.length || 1} konu çıkarıldı</span>
              </p>
            ))}
          </div>
        ) : (
          <EmptyStateCard
            title="Henüz PDF yok"
            description="PDF yüklediğinde dosya adı, çıkarılan konu sayısı ve quiz durumu burada listelenir."
            actionLabel="İlk PDF’imi Yükle"
            onAction={onNewCourse}
          />
        )}
      </section>

      <section className="quick-flow-card">
        <h2>UniKEY sadece özet çıkarmaz; sınava hazırlar.</h2>
        <div>
          <span>1. PDF yükle</span>
          <span>2. Eksiklerini bul</span>
          <span>3. Yanlışlarına göre tekrar et</span>
        </div>
      </section>
    </div>
  );
}

function NextStepCard({
  title,
  description,
  actionLabel,
  onAction,
  disabled = false,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
}) {
  return (
    <section className="next-step-card">
      <div>
        <span>{title}</span>
        <strong>{description}</strong>
      </div>
      <button onClick={onAction} disabled={disabled}>
        {actionLabel}
      </button>
    </section>
  );
}

function EmptyStateCard({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty-state-card">
      <strong>{title}</strong>
      <p>{description}</p>
      {actionLabel && onAction && <button onClick={onAction}>{actionLabel}</button>}
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
  courseName,
  selectedFile,
  documents,
  errorMessage,
  setSelectedFile,
  onEditCourse,
  onAnalyze,
  onRunDemo,
}: {
  courseName: string;
  selectedFile: File | null;
  documents: DocumentItem[];
  errorMessage: string;
  setSelectedFile: (file: File | null) => void;
  onEditCourse: () => void;
  onAnalyze: () => void;
  onRunDemo: () => void;
}) {
  const suggestedCourse = selectedFile ? inferCourseNameFromFile(selectedFile.name) : courseName;
  const estimatedPages = selectedFile
    ? Math.max(6, Math.round(selectedFile.size / 85000))
    : 0;
  const estimatedTopics = selectedFile
    ? Math.min(24, Math.max(6, Math.round(estimatedPages / 3)))
    : 0;
  const estimatedMinutes = selectedFile
    ? Math.max(18, estimatedTopics * 7)
    : 0;

  return (
    <section className="upload-page">
      {errorMessage && (
        <div className="error-banner">
          {errorMessage}
          <small>
            PDF taranmış/görsel olabilir ya da metin çıkarılamamış olabilir. Metni seçilebilen bir PDF ile tekrar dene.
          </small>
        </div>
      )}
      <div className="upload-context-card">
        <span>PDF-first akış</span>
        <strong>
          Önce dokümanı yükle; ders adını ve konuları ÜniKEY çıkarsın.
        </strong>
        <div className="upload-context-actions">
          <button onClick={onEditCourse}>Ders bilgilerini elle düzenle</button>
          {isDevelopment && (
            <button onClick={onRunDemo}>Demo PDF ile test et</button>
          )}
        </div>
      </div>
      <label className="upload-dropzone">
        <span>☁</span>
        <strong>Dokümanlarını Yükle</strong>
        <small>PDF dosyanı buraya sürükle veya seç. Özet, eksik analizi ve quiz bu dokümandan hazırlanır.</small>
        <input
          type="file"
          accept=".pdf"
          className="sr-only"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
        />
      </label>
      <div className="uploaded-list">
        <h3>Yüklenen Dosyalar</h3>
        {documents.length > 0 ? (
          documents.map((document) => (
            <div key={document.id} className="uploaded-item">
              <span>PDF</span>
              <p>{document.name}</p>
              <small>{document.pageCount} sayfa</small>
            </div>
          ))
        ) : (
          <EmptyStateCard
            title="Henüz PDF yok"
            description="İlk PDF’ini seçtiğinde dosya burada görünür; analiz tamamlanınca özet ve quiz hazırlanır."
          />
        )}
        {selectedFile && (
          <div className="uploaded-item pending">
            <span>PDF</span>
            <p>{selectedFile.name}</p>
            <small>Hazır</small>
          </div>
        )}
      </div>
      {selectedFile && (
        <div className="pdf-detection-card">
          <strong>ÜniKEY bu dokümanı analiz etmeye hazır.</strong>
          <p>Bu doküman {suggestedCourse} dersine ait gibi görünüyor.</p>
          <div>
            <span>✓ Yaklaşık {estimatedPages} sayfa bulundu</span>
            <span>✓ {estimatedTopics} konu tespit edilecek</span>
            <span>✓ Tahmini çalışma süresi: {estimatedMinutes} dakika</span>
          </div>
        </div>
      )}
      <NextStepCard
        title="Sonraki adım"
        description={
          selectedFile
            ? "PDF seçildi. Şimdi özeti çıkarıp quiz hazırlama akışını başlatabilirsin."
            : "Bir PDF seç; UniKEY önce metni okuyup konuları çıkaracak."
        }
        actionLabel={selectedFile ? "Özeti Çıkar" : "PDF bekleniyor"}
        onAction={selectedFile ? onAnalyze : () => undefined}
        disabled={!selectedFile}
      />
      <button disabled={!selectedFile} onClick={onAnalyze} className="primary-button">
        Özeti Çıkar →
      </button>
    </section>
  );
}

function SummaryProcessStep({ isUploading }: { isUploading: boolean }) {
  const steps = [
    "PDF okunuyor...",
    "Konular çıkarılıyor...",
    "Ders modülleri hazırlanıyor...",
    "Quiz oluşturuluyor...",
    "Çalışma planı hazırlanıyor...",
  ];

  return (
    <section className="process-panel">
      <h2>AI Ders hazırlanıyor</h2>
      <p>PDF okunuyor; ardından modüller, kontrol noktaları ve final quiz hazırlanıyor.</p>
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

function AiQualityDebugPanel({
  document,
  isBusy,
  onRunDemo,
}: {
  document?: DocumentItem;
  isBusy: boolean;
  onRunDemo: () => void;
}) {
  const debug = document?.debug;
  const quality = document?.quality;

  return (
    <aside className="ai-debug-panel">
      <div>
        <span>DEV kalite paneli</span>
        <strong>
          {quality ? `Output skoru: ${quality.score}/100` : "Analiz bekleniyor"}
        </strong>
      </div>
      <button onClick={onRunDemo} disabled={isBusy}>
        {isBusy ? "Demo çalışıyor..." : "Demo akışı çalıştır"}
      </button>
      {debug ? (
        <div className="ai-debug-grid">
          <span>Konu: {debug.topicCount}</span>
          <span>Quiz: {debug.quizQuestionCount}</span>
          <span>Eksik topic: {debug.missingTopicCount}</span>
          <span>Eksik sayfa: {debug.missingSourcePageCount}</span>
          <span>Modül: {debug.lessonModuleCount ?? 0}</span>
          <span>Blok: {debug.lessonBlockCount ?? 0}</span>
          <span>Checkpoint eksik: {debug.missingCheckpointCount ?? 0}</span>
          <span>Modül sayfası eksik: {debug.missingModuleSourcePageCount ?? 0}</span>
          <span>Quiz modül linki eksik: {debug.missingQuizModuleLinkCount ?? 0}</span>
          <span>Lesson skoru: {debug.lessonQualityScore ?? debug.qualityScore}</span>
          <span>Fallback: {debug.fallbackUsed ? "evet" : "hayır"}</span>
          <span>JSON parse: {debug.jsonParseError ? "hatalı" : "temiz"}</span>
          <span>AI denendi: {debug.aiAttempted ? "evet" : "hayır"}</span>
          <span>AI sebep: {debug.aiFailureReason ?? "yok"}</span>
          <span>mustKnow: {debug.summaryFields.mustKnow}</span>
          <span>kavram: {debug.summaryFields.keyConcepts}</span>
          <span>soru: {debug.summaryFields.examStyleQuestions}</span>
          <span>kart: {debug.summaryFields.flashcards}</span>
        </div>
      ) : (
        <p>Demo PDF veya gerçek PDF analizi çalıştırınca kalite sinyalleri burada görünür.</p>
      )}
      {quality?.warnings.length ? (
        <ul>
          {quality.warnings.slice(0, 4).map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}

function CourseReadyStep({
  topics,
  lesson,
  activeModuleIndex,
  completedModuleIds,
  moduleAssistMode,
  summary,
  documentsCount,
  onStudy,
  onModuleAssist,
  onCompleteModule,
  onRestartModule,
  onQuiz,
  onAddDocument,
  onFinish,
}: {
  topics: string[];
  lesson?: AiLesson;
  activeModuleIndex: number;
  completedModuleIds: string[];
  moduleAssistMode: "repeat" | "simple" | "example" | null;
  summary?: string;
  documentsCount: number;
  onStudy: () => void;
  onModuleAssist: (mode: "repeat" | "simple" | "example" | null) => void;
  onCompleteModule: () => void;
  onRestartModule: (moduleId: string) => void;
  onQuiz: (scope: "all" | "latest") => void;
  onAddDocument: () => void;
  onFinish: () => void;
}) {
  const modules = lesson?.modules ?? [];
  const activeModule = modules[activeModuleIndex];
  const isLessonComplete =
    modules.length === 0 ||
    modules.every((module) => completedModuleIds.includes(module.id));

  return (
    <section className="ready-panel">
      <h2>AI Ders Hazır!</h2>
      <p>PDF analiz edildi. UniKEY şimdi konuyu modül modül anlatacak.</p>
      <NextStepCard
        title="Sonraki adım"
        description={
          isLessonComplete
            ? "Tüm modüller tamamlandı. Şimdi final quiz ile konuyu ölçebilirsin."
            : activeModule
              ? `${activeModule.title} modülünü tamamla; sonra sıradaki modül açılacak.`
              : "Ders modülü üretilemedi. Özet fallback üzerinden çalışmaya devam edebilirsin."
        }
        actionLabel={isLessonComplete ? "Final Quiz Çöz" : "Derse Devam Et"}
        onAction={() => {
          if (isLessonComplete) onQuiz("all");
        }}
        disabled={!isLessonComplete}
      />
      {lesson ? (
        <LessonEnginePanel
          lesson={lesson}
          activeModuleIndex={activeModuleIndex}
          completedModuleIds={completedModuleIds}
          moduleAssistMode={moduleAssistMode}
          onModuleAssist={onModuleAssist}
          onCompleteModule={onCompleteModule}
          onRestartModule={onRestartModule}
        />
      ) : summary ? (
        <article className="summary-preview">
          <h3>AI Ders fallback özeti</h3>
          <SummaryCards summary={summary} />
        </article>
      ) : null}
      <h3>Ders planındaki konu başlıkları</h3>
      {modules.length > 0 ? (
        <div className="topic-grid">
          {modules.map((module, index) => (
            <div
              key={module.id}
              className={completedModuleIds.includes(module.id) ? "completed" : ""}
            >
              <span>{index + 1}</span>
              {module.title}
            </div>
          ))}
        </div>
      ) : topics.length > 0 ? (
        <div className="topic-grid">
          {topics.map((topic, index) => (
            <div key={topic}>
              <span>{index + 1}</span>
              {topic}
            </div>
          ))}
        </div>
      ) : (
        <EmptyStateCard
          title="Konu bulunamadı"
          description="PDF metni okunmuş olabilir ama öğretilebilir konu başlıkları çıkarılamadı. Farklı bir PDF ile tekrar deneyebilirsin."
        />
      )}
      <h3>{isLessonComplete ? "Ne yapmak istersin?" : "Ders dışı işlemler"}</h3>
      <div className="ready-actions">
        <button className="green-button" onClick={onStudy}>
          Anlamadığım Noktaları Sor
        </button>
        {isLessonComplete && (
          <button className="primary-button" onClick={() => onQuiz("all")}>
            Final Quizi Başlat
          </button>
        )}
        <button className="blue-button" onClick={onAddDocument}>
          Hayır, Daha Fazla Doküman Ekle
        </button>
        {documentsCount > 1 && isLessonComplete && (
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

function LessonEnginePanel({
  lesson,
  activeModuleIndex,
  completedModuleIds,
  moduleAssistMode,
  onModuleAssist,
  onCompleteModule,
  onRestartModule,
}: {
  lesson: AiLesson;
  activeModuleIndex: number;
  completedModuleIds: string[];
  moduleAssistMode: "repeat" | "simple" | "example" | null;
  onModuleAssist: (mode: "repeat" | "simple" | "example" | null) => void;
  onCompleteModule: () => void;
  onRestartModule: (moduleId: string) => void;
}) {
  const activeModule = lesson.modules[activeModuleIndex] ?? lesson.modules[0];
  const completedCount = lesson.modules.filter((module) =>
    completedModuleIds.includes(module.id),
  ).length;
  const isLastModule = activeModuleIndex >= lesson.modules.length - 1;

  return (
    <article className="lesson-engine-card">
      <header className="lesson-plan-header">
        <div>
          <small>AI Lesson Engine</small>
          <h3>{lesson.lessonTitle}</h3>
          <p>
            {lesson.modules.length} modül · yaklaşık {lesson.estimatedTotalMinutes} dakika ·{" "}
            {lessonDifficultyLabel(lesson.difficulty)}
          </p>
        </div>
        <strong>
          {completedCount}/{lesson.modules.length} modül tamamlandı
        </strong>
      </header>

      <div className="lesson-module-list">
        {lesson.modules.map((module, index) => {
          const isCompleted = completedModuleIds.includes(module.id);
          const isActive = module.id === activeModule.id;
          const isLocked = !isCompleted && !isActive && index > activeModuleIndex;

          return (
            <button
              key={module.id}
              className={isActive ? "active" : isCompleted ? "completed" : ""}
              onClick={() => {
                if (isCompleted || isActive) onRestartModule(module.id);
              }}
              disabled={isLocked}
            >
              <span>{isCompleted ? "✓" : isLocked ? "Kilitli" : "Aktif"}</span>
              <strong>{module.title}</strong>
              <small>{module.estimatedMinutes} dk · PDF sayfa {module.sourcePages.join(", ")}</small>
            </button>
          );
        })}
      </div>

      {activeModule ? (
        <section className="lesson-active-module">
          <div className="lesson-active-head">
            <div>
              <small>Aktif modül</small>
              <h3>{activeModule.title}</h3>
            </div>
            <span>{activeModule.estimatedMinutes} dk</span>
          </div>
          <div className="lesson-goals">
            {activeModule.learningGoals.slice(0, 3).map((goal) => (
              <span key={goal}>{goal}</span>
            ))}
          </div>
          {moduleAssistMode && (
            <div className="lesson-assist-note">
              <strong>{assistModeTitle(moduleAssistMode)}</strong>
              <p>{assistModeText(moduleAssistMode, activeModule)}</p>
            </div>
          )}
          <LessonNarrativeCard module={activeModule} />
          <div className="lesson-checkpoint-actions">
            <button onClick={() => onModuleAssist("repeat")}>Tekrar anlat</button>
            <button onClick={() => onModuleAssist("simple")}>Daha basit anlat</button>
            <button onClick={() => onModuleAssist("example")}>Örnek ver</button>
            <button className="primary-button" onClick={onCompleteModule}>
              {isLastModule ? "Anladım, dersi tamamla" : "Anladım, sonraki modüle geç"}
            </button>
          </div>
        </section>
      ) : (
        <EmptyStateCard
          title="Modül bulunamadı"
          description="AI Ders planı boş geldi. Eski özet ve quiz fallback akışıyla devam edebilirsin."
        />
      )}
    </article>
  );
}

function LessonNarrativeCard({ module }: { module: LessonModule }) {
  const blockMap = mapLessonBlocks(module);
  const checkpointQuestion =
    blockMap.checkpoint?.question ||
    "Buraya kadar kafana yatmayan, havada kalan veya tekrar etmemi istediğin bir yer var mı?";

  return (
    <section className="lesson-narrative-card">
      <h3>{module.title}</h3>
      <LessonNarrativeSection
        title="Bu modülde ne öğreneceğiz?"
        content={module.learningGoals.join(" ")}
      />
      <LessonNarrativeSection
        title="Ana anlatım"
        content={blockMap.core_explanation?.content}
      />
      <LessonNarrativeSection
        title="Günlük hayat analojisi"
        content={blockMap.analogy?.content}
      />
      <LessonNarrativeSection title="Örnek" content={blockMap.example?.content} />
      <LessonNarrativeSection
        title="Neden önemli?"
        content={blockMap.formula?.content}
      />
      <LessonNarrativeSection
        title="Mini özet"
        content={blockMap.mini_summary?.content}
      />
      <div className="lesson-single-checkpoint">
        <strong>{checkpointQuestion}</strong>
      </div>
    </section>
  );
}

function LessonNarrativeSection({
  title,
  content,
}: {
  title: string;
  content?: string;
}) {
  if (!content?.trim()) return null;

  return (
    <div>
      <h4>{title}</h4>
      <p>{stripRepeatedSectionLabel(content, title)}</p>
    </div>
  );
}

function mapLessonBlocks(module: LessonModule) {
  return module.blocks.reduce<Partial<Record<LessonBlockType, LessonModule["blocks"][number]>>>(
    (blocks, block) => {
      if (!blocks[block.type]) blocks[block.type] = block;
      return blocks;
    },
    {},
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
        <div className="assistant-toolbar">
          <strong>PDF Asistanı</strong>
          <div>
            {[
              "Bunu çocuk gibi anlat",
              "Bu konu neden önemli?",
              "Hoca bunu nasıl sorar?",
              "1 dakikada özetle",
              "Ön koşul konuları göster",
              "Benzer konu öner",
              "Sınavda nasıl gelir?",
              "Örnek soru çöz",
            ].map((prompt) => (
              <button key={prompt} onClick={() => setQuestion(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        </div>
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
        <EmptyStateCard
          title="Quiz henüz hazır değil"
          description="Quiz sorusu oluşmadıysa önce PDF analizini tamamla ya da yeni bir PDF yükle."
          actionLabel="PDF yüklemeye dön"
          onAction={onBack}
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
            <p>{question.explanation ?? question.source}</p>
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
  topics,
  quiz,
  selectedAnswers,
  lesson,
  onMoreQuiz,
  onRetryMistakes,
  onReviewWeak,
  onReviewMistake,
  onReviewModule,
  onReview,
  onNewDocument,
  onDashboard,
}: {
  topics: string[];
  quiz: StudyQuizQuestion[];
  selectedAnswers: Record<number, string>;
  lesson?: AiLesson;
  onMoreQuiz: () => void;
  onRetryMistakes: () => void;
  onReviewWeak: (weakTopics: string[]) => void;
  onReviewMistake: (mistake: WrongAnswerAnalysis) => void;
  onReviewModule: (moduleId: string) => void;
  onReview: () => void;
  onNewDocument: () => void;
  onDashboard: () => void;
}) {
  if (quiz.length === 0) {
    return (
      <div className="result-page">
        <EmptyStateCard
          title="Sonuç yok"
          description="Sonuç analizi için önce bir quiz çözmen gerekiyor."
          actionLabel="Ana sayfaya dön"
          onAction={onDashboard}
        />
      </div>
    );
  }

  const resultAnalysis = buildQuizResultAnalysis(quiz, selectedAnswers, topics);
  const score = resultAnalysis.score;
  const weakTopics = resultAnalysis.weakTopics;
  const strongTopics = resultAnalysis.strongTopics;
  const displayedTopics = [...strongTopics, ...weakTopics].slice(0, 4);
  const hasMistakes = resultAnalysis.wrongAnswers.length > 0;
  const weakModules = resolveWeakModules(lesson, quiz, resultAnalysis.wrongAnswers);

  return (
    <div className="result-page">
      <section className="score-card">
        <div className="score-ring">{score}%</div>
        <h2>{hasMistakes ? "Analiz Hazır" : "Harika!"}</h2>
        <p>{resultAnalysis.correctCount} doğru, {resultAnalysis.wrongCount} yanlış</p>
      </section>
      <section className="analysis-card">
        <h3>Bugünkü Performans</h3>
        <div className="result-breakdown">
          <span>Soru: {resultAnalysis.totalQuestions}</span>
          <span>Doğru: {resultAnalysis.correctCount}</span>
          <span>Yanlış: {resultAnalysis.wrongCount}</span>
          <span>Tahmini tekrar: {resultAnalysis.recommendedReviewMinutes} dakika</span>
        </div>
        <TopicList
          title="Güçlü konular"
          items={strongTopics}
          emptyText="Güçlü konu analizi için en az bir doğru cevap gerekiyor."
          tone="good"
        />
        <TopicList
          title="Tekrar edilecek konular"
          items={weakTopics}
          emptyText="Belirgin zayıf konu görünmüyor."
          tone="weak"
        />
        {displayedTopics.length === 0 &&
          topics.slice(0, 4).map((topic) => (
            <p key={topic} className="good">
              {topic}
            </p>
          ))}
        <div className="mistake-patterns">
          <strong>Hata örüntüsü</strong>
          {resultAnalysis.mistakePatterns.map((pattern) => (
            <span key={pattern}>{pattern}</span>
          ))}
        </div>
        <div className="wrong-topic-card">
          <strong>Yanlış cevap analizi</strong>
          {hasMistakes ? (
            resultAnalysis.wrongAnswers.map((mistake) => (
              <WrongAnswerCard
                key={`${mistake.topic}-${mistake.question}`}
                mistake={mistake}
                onReview={() => onReviewMistake(mistake)}
              />
            ))
          ) : (
            <span>Yanlış cevap yok. İstersen daha zor sorularla devam edebilirsin.</span>
          )}
        </div>
        {weakModules.length > 0 && (
          <div className="weak-module-card">
            <strong>Tekrar edilecek modüller</strong>
            {weakModules.map((module) => (
              <button key={module.id} onClick={() => onReviewModule(module.id)}>
                Şu modülü tekrar et: {module.title}
              </button>
            ))}
          </div>
        )}
        <div className="recommended-repeat">
          <strong>Önerilen tekrar</strong>
          <p>{resultAnalysis.coachMessage}</p>
          {resultAnalysis.nextActions.map((action, index) => (
            <span key={action}>{index + 1}. {action}</span>
          ))}
        </div>
      </section>
      <section className="next-card">
        <h3>Ne yapmak istersin?</h3>
        <NextStepCard
          title="Sonraki adım"
          description={
            hasMistakes
              ? "Quiz bitti. Şimdi yanlış yaptığın konuları tekrar ederek pekiştir."
              : "Quiz bitti. İstersen yeni PDF yükleyip çalışma setini genişlet."
          }
          actionLabel={hasMistakes ? "Yanlışları tekrar et" : "Yeni PDF yükle"}
          onAction={hasMistakes ? onRetryMistakes : onNewDocument}
        />
        <button onClick={onRetryMistakes} disabled={!hasMistakes}>
          Yanlışları Tekrar Et
        </button>
        <button onClick={() => onReviewWeak(weakTopics)} disabled={!hasMistakes}>
          Bu Konuları Tekrar Anlat
        </button>
        <button onClick={onMoreQuiz}>Daha Fazla Soru Çöz</button>
        <button onClick={onReview}>Konuyu Tekrar Çalış</button>
        <button onClick={onDashboard}>Ana Sayfaya Dön</button>
      </section>
    </div>
  );
}

function TopicList({
  title,
  items,
  emptyText,
  tone,
}: {
  title: string;
  items: string[];
  emptyText: string;
  tone: "good" | "weak";
}) {
  return (
    <div className="topic-result-group">
      <strong>{title}</strong>
      {items.length > 0 ? (
        items.map((item) => (
          <p key={item} className={tone}>
            {item}
          </p>
        ))
      ) : (
        <span>{emptyText}</span>
      )}
    </div>
  );
}

function WrongAnswerCard({
  mistake,
  onReview,
}: {
  mistake: WrongAnswerAnalysis;
  onReview: () => void;
}) {
  return (
    <article className="wrong-answer-card">
      <small>{mistake.topic} · PDF sayfa {mistake.sourcePage}</small>
      <strong>{mistake.question}</strong>
      <p>Senin cevabın: {mistake.userAnswer}</p>
      <p>Doğru cevap: {mistake.correctAnswer}</p>
      <p>{mistake.whyWrong}</p>
      <p>{mistake.miniExplanation}</p>
      <em>{mistake.reviewHint}</em>
      <button onClick={onReview}>Bu konuyu tekrar anlat</button>
    </article>
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
        {currentDocument?.summary ? (
          <SummaryCards summary={currentDocument.summary} />
        ) : (
          <p>Bu ders için özet henüz oluşturulmadı.</p>
        )}
        <div className="action-row">
          <button onClick={onBack} className="secondary-button">← Önceki</button>
          <button onClick={onNext} className="primary-button">Sonraki →</button>
        </div>
      </section>
    </div>
  );
}

function SummaryCards({ summary }: { summary: string }) {
  const cards = parseSummaryCards(summary);

  return (
    <div className="summary-card-grid">
      {cards.map((card) => (
        <section key={card.title} className="summary-card">
          <h4>{card.title}</h4>
          <p>{card.content}</p>
        </section>
      ))}
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
    .join(" ")
    .replaceAll("Unıx", "UNIX")
    .replaceAll("Nfs", "NFS")
    .replaceAll("Tcp", "TCP")
    .replaceAll("Pdf", "PDF")
    .replaceAll("Ai", "AI")
    .replaceAll(" İs ", " is ");
}

function lessonDifficultyLabel(difficulty: AiLesson["difficulty"]) {
  const labels: Record<AiLesson["difficulty"], string> = {
    beginner: "başlangıç",
    intermediate: "orta seviye",
    advanced: "ileri seviye",
  };

  return labels[difficulty];
}

function stripRepeatedSectionLabel(content: string, title: string) {
  const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const genericLabels =
    "Ana anlatım|Günlük hayat analojisi|Gerçek hayat analojisi|Örnek|Neden önemli|Mini özet|Kontrol noktası|Bu modülde öğreneceğiz";
  const repeatedLabelPattern = new RegExp(
    `^\\s*(?:${escapedTitle}|${genericLabels})\\s*[:：-]\\s*`,
    "i",
  );

  return content.replace(repeatedLabelPattern, "").trim();
}

function assistModeTitle(mode: "repeat" | "simple" | "example") {
  const titles = {
    repeat: "Aynı konuyu tekrar açalım",
    simple: "Daha basit anlatım",
    example: "Ek örnek",
  };

  return titles[mode];
}

function assistModeText(mode: "repeat" | "simple" | "example", module: LessonModule) {
  if (mode === "simple") {
    return `${module.title} için en kısa yol şu: önce bu kavramın hangi problemi çözdüğünü düşün. Sonra PDF'teki örneğe dönüp "burada neyi kolaylaştırıyor?" sorusunu sor.`;
  }

  if (mode === "example") {
    return `${module.title} sınavda genellikle "nedir, ne işe yarar, kısa örnek ver" şeklinde gelir. Cevabını önce tek cümle tanım, sonra küçük örnek şeklinde kur.`;
  }

  return `${module.title} modülünü tekrar ederken öğrenme hedeflerini sırayla kontrol et: ${module.learningGoals.slice(0, 2).join(" ")}.`;
}

function resolveWeakModules(
  lesson: AiLesson | undefined,
  quiz: StudyQuizQuestion[],
  wrongAnswers: WrongAnswerAnalysis[],
) {
  if (!lesson) return [];

  const wrongTopicSet = new Set(wrongAnswers.map((answer) => answer.topic));
  const moduleIds = new Set(
    quiz
      .filter((question) => question.topic && wrongTopicSet.has(question.topic))
      .map((question) => question.moduleId)
      .filter(Boolean),
  );
  const directModules = lesson.modules.filter((module) => moduleIds.has(module.id));

  if (directModules.length > 0) return directModules.slice(0, 3);

  return lesson.modules
    .filter((module) =>
      wrongAnswers.some((answer) => {
        const topic = answer.topic.toLocaleLowerCase("tr");
        const title = module.title.toLocaleLowerCase("tr");
        return topic.includes(title) || title.includes(topic);
      }),
    )
    .slice(0, 3);
}

function humanizeTopic(topic: string) {
  const rawTopic = topic.trim();
  if (
    rawTopic.includes("UNIX") ||
    rawTopic.includes("NFS") ||
    rawTopic.includes("TCP") ||
    rawTopic.includes("PDF")
  ) {
    return rawTopic;
  }

  const normalized = rawTopic.toLocaleLowerCase("tr").trim();
  const replacements: Record<string, string> = {
    "chapter fifteen": "Socket Programlamaya Giriş",
    "fifteen sockets": "Socket Programlama",
    sockets: "Socket Programlama",
    socket: "Socket Programlama",
    "struct sockaddr": "Adres Yapıları",
    sockaddr: "Adres Yapıları",
    "byte order": "Byte Sıralaması",
    port: "Portlar ve Adresleme",
    ports: "Portlar ve Adresleme",
    "tcp connection": "TCP Bağlantısı",
    "operating system": "İşletim Sistemi",
  };

  if (replacements[normalized]) return replacements[normalized];

  return titleCase(
    normalized
      .replace(/^chapter\s+\w+\s*/i, "")
      .replace(/\b(fifteen|chapter|lecture|notes?)\b/gi, "")
      .replace(/\s+/g, " ")
      .trim() || topic,
  );
}

function parseSummaryCards(summary: string) {
  const normalized = summary.replace(/\r/g, "").trim();
  const defaultTitles = [
    "Bu PDF ne anlatıyor?",
    "Mutlaka bil",
    "Sınavda çıkabilecek sorular",
    "Hoca nereden sorabilir?",
    "Karıştırılan noktalar",
  ];
  const headingPattern = new RegExp(
    `(?:^|\\n)\\s*(?:\\d+\\.\\s*)?(${defaultTitles
      .map((title) => title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")})\\s*\\n`,
    "gi",
  );
  const matches = [...normalized.matchAll(headingPattern)];

  if (matches.length === 0) {
    const chunks = normalized
      .split(/\n\s*\n/)
      .map((chunk) => chunk.trim())
      .filter(Boolean);

    return defaultTitles.map((title, index) => ({
      title,
      content:
        chunks[index] ||
        "Bu bölüm için AI çıktısı geldikçe daha net sınav notu oluşturulacak.",
    }));
  }

  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? normalized.length;
    return {
      title: match[1],
      content: normalized.slice(start, end).trim() || "Bu bölüm yakında doldurulacak.",
    };
  });
}

function inferCourseNameFromFile(fileName: string) {
  const cleanName = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b(chapter|hafta|week|lecture|ders|not|notes|pdf)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  const lowerName = cleanName.toLocaleLowerCase("tr");

  if (lowerName.includes("algorithm") || lowerName.includes("algoritma")) {
    return "Veri Yapıları ve Algoritmalar";
  }

  if (lowerName.includes("machine") || lowerName.includes("makine")) {
    return "Makine Öğrenmesi";
  }

  if (lowerName.includes("operating") || lowerName.includes("işletim")) {
    return "İşletim Sistemleri";
  }

  if (lowerName.includes("database") || lowerName.includes("veritaban")) {
    return "Veritabanı Sistemleri";
  }

  return cleanName.length > 3 ? titleCase(cleanName) : "Yeni Ders";
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

    pages.push(`[Sayfa ${pageNumber}] ${text}`);
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

function formatAnalysisError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Doküman analiz edilirken beklenmeyen bir sorun oluştu.";
  const normalized = message.toLocaleLowerCase("tr");

  if (normalized.includes("metni okunamadı") || normalized.includes("metni bulunamadı")) {
    return "PDF metni okunamadı. Bu dosya görsel/taranmış olabilir; metin seçilebilen bir PDF yüklemeyi dene.";
  }

  if (normalized.includes("quiz") && normalized.includes("oluştur")) {
    return "Quiz oluşturulamadı. PDF metni çok kısa veya konu çıkarımı için yeterince net olmayabilir.";
  }

  if (normalized.includes("json") || normalized.includes("hata sayfası")) {
    return "AI çıktısı okunabilir formatta üretilemedi. Sayfayı yenileyip tekrar dene; devam ederse PDF'i daha küçük bir parçayla yükle.";
  }

  if (normalized.includes("payload") || normalized.includes("limit")) {
    return "PDF canlı site limitini aşmış olabilir. Daha küçük veya daha az sayfalı bir PDF ile tekrar dene.";
  }

  if (normalized.includes("pdf") && normalized.includes("destek")) {
    return "Bu PDF yapısı desteklenmiyor olabilir. Metin seçilebilen, şifresiz bir PDF yükle.";
  }

  return message;
}
