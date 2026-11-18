"use client";

import { ChangeEvent, DragEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileImage,
  FileSearch,
  Home,
  LoaderCircle,
  MapPinCheck,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import AfterTodos from "@/components/AfterTodos";
import BrokerCard from "@/components/BrokerCard";
import Checklist from "@/components/Checklist";
import ContractReport from "@/components/ContractReport";
import Disclaimer from "@/components/Disclaimer";
import FraudSignals from "@/components/FraudSignals";
import GrantList from "@/components/GrantList";
import PriceCard from "@/components/PriceCard";
import VerdictBanner from "@/components/VerdictBanner";
import mockResponse from "@/lib/mockResponse";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  PrecheckAnswers,
  SampleId,
  UserInput,
} from "@/types";

const USE_MOCK = false;

const DEFAULT_USER: UserInput = {
  age: 26,
  income: 2600,
  region: "서울",
  job: "직장인",
};

const EMPTY_ANSWERS: PrecheckAnswers = {
  ownerMatches: null,
  hasTrustOrSeizure: null,
  mortgage: null,
  housePrice: null,
  payToOwnerAccount: null,
  isAgentContract: null,
  taxCertChecked: null,
  buildingIsResidential: null,
};

type BooleanAnswerKey =
  | "ownerMatches"
  | "hasTrustOrSeizure"
  | "payToOwnerAccount"
  | "isAgentContract"
  | "taxCertChecked"
  | "buildingIsResidential";

type MoneyAnswerKey = "mortgage" | "housePrice";

type UploadData = {
  name: string;
  base64: string;
  mimeType: string;
};

const BOOLEAN_QUESTIONS: Array<{
  key: BooleanAnswerKey;
  label: string;
  help: string;
}> = [
  {
    key: "ownerMatches",
    label: "등기부 소유자와 계약 상대방이 일치하나요?",
    help: "인터넷등기소에서 최신 등기부등본을 발급하고 갑구의 소유자와 임대인 신분증을 대조하세요.",
  },
  {
    key: "hasTrustOrSeizure",
    label: "등기부에 신탁·압류·가압류·경매 기록이 있나요?",
    help: "등기부등본 갑구와 을구를 확인하세요. 신탁 표기가 있으면 신탁원부도 발급해야 해요.",
  },
  {
    key: "payToOwnerAccount",
    label: "보증금을 소유자 명의 계좌로 입금하나요?",
    help: "중개사에게 계좌 사본을 요청하고 송금 직전에 예금주와 등기부 소유자를 비교하세요.",
  },
  {
    key: "isAgentContract",
    label: "소유자가 아닌 대리인과 계약하나요?",
    help: "대리 계약이면 위임장과 인감증명서를 받고 소유자에게 직접 전화해 위임 사실을 확인하세요.",
  },
  {
    key: "taxCertChecked",
    label: "임대인의 국세·지방세 완납증명서를 확인했나요?",
    help: "계약 전에 임대인 또는 중개사에게 최근 발급한 완납증명서를 요청하세요.",
  },
  {
    key: "buildingIsResidential",
    label: "건축물대장상 주택이고 위반건축물이 아닌가요?",
    help: "정부24에서 건축물대장을 발급해 주용도와 위반건축물 표시를 확인하세요.",
  },
];

const MONEY_QUESTIONS: Array<{
  key: MoneyAnswerKey;
  label: string;
  placeholder: string;
  help: string;
}> = [
  {
    key: "mortgage",
    label: "근저당 채권최고액 합계는 얼마인가요?",
    placeholder: "예: 30000",
    help: "등기부등본 을구에서 근저당권의 채권최고액을 모두 더하세요. 금액은 만원 단위로 입력해요.",
  },
  {
    key: "housePrice",
    label: "이 집의 매매 시세 또는 공시가격은 얼마인가요?",
    placeholder: "예: 35000",
    help: "국토교통부 실거래가 공개시스템의 최근 거래나 부동산공시가격 알리미에서 확인하세요.",
  },
];

const SAMPLES: Array<{
  id: SampleId;
  emoji: string;
  label: string;
  style: string;
}> = [
  {
    id: "green",
    emoji: "🟢",
    label: "안전한 집",
    style: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
  },
  {
    id: "yellow",
    emoji: "🟡",
    label: "애매한 집",
    style: "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100",
  },
  {
    id: "red",
    emoji: "🔴",
    label: "위험한 집",
    style: "border-red-200 bg-red-50 text-red-800 hover:bg-red-100",
  },
];

const SITE_CHECKS = [
  "수압이 충분하고 싱크대·세면대 배수가 잘돼요",
  "벽지와 창가에 곰팡이·누수 흔적이 없어요",
  "보일러와 온수가 정상 작동해요",
  "채광과 환기가 충분해요",
  "창문을 닫았을 때 외부·이웃 소음이 크지 않아요",
  "현관문·창문 잠금장치와 주변 방범 상태가 괜찮아요",
  "집 안에서 휴대폰 통화와 데이터가 잘돼요",
  "관리비 포함 항목을 계약서와 대조했어요",
];

const MANAGEMENT_ITEMS = ["수도", "인터넷", "공용 전기", "청소비", "주차비"];

function HelpTip({ children }: { children: string }) {
  return (
    <details className="group mt-3 text-sm">
      <summary className="w-fit cursor-pointer list-none font-semibold text-indigo-600 outline-none hover:text-indigo-700 focus-visible:rounded focus-visible:outline-2 focus-visible:outline-indigo-600">
        어디서 확인하나요?
      </summary>
      <p className="mt-2 rounded-xl bg-indigo-50 p-3 leading-6 text-slate-600">{children}</p>
    </details>
  );
}

function AnswerButtons({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}) {
  const choices: Array<{ label: string; value: boolean | null }> = [
    { label: "예", value: true },
    { label: "아니오", value: false },
    { label: "모름", value: null },
  ];

  return (
    <div className="mt-4 grid grid-cols-3 gap-2" role="group" aria-label="답변 선택">
      {choices.map((choice) => {
        const selected = value === choice.value;
        return (
          <button
            key={choice.label}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(choice.value)}
            className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
              selected
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 hover:bg-indigo-50"
            }`}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("이미지를 읽지 못했어요."));
    reader.readAsDataURL(blob);
  });
}

function resizeImage(file: File): Promise<UploadData> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
      const scale = Math.min(1, 1600 / longestSide);
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");

      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("이 브라우저에서는 이미지를 처리할 수 없어요."));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
      canvas.toBlob(
        async (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error("이미지를 변환하지 못했어요."));
            return;
          }

          try {
            resolve({
              name: file.name,
              base64: await blobToBase64(blob),
              mimeType: outputType,
            });
          } catch (error) {
            reject(error);
          }
        },
        outputType,
        0.88,
      );
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("지원하지 않거나 손상된 이미지예요."));
    };
    image.src = objectUrl;
  });
}

function SiteChecklist() {
  const [checks, setChecks] = useState<boolean[]>(() => SITE_CHECKS.map(() => false));
  const [includedItems, setIncludedItems] = useState<string[]>([]);
  const checkedCount = checks.filter(Boolean).length + includedItems.length;
  const totalCheckCount = SITE_CHECKS.length + MANAGEMENT_ITEMS.length;
  const score = Math.round((checkedCount / totalCheckCount) * 100);

  function toggleIncludedItem(item: string) {
    setIncludedItems((current) =>
      current.includes(item)
        ? current.filter((currentItem) => currentItem !== item)
        : [...current, item],
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-6 text-white sm:p-8">
          <div className="flex items-center gap-3">
            <MapPinCheck aria-hidden="true" className="size-7" />
            <h1 className="text-2xl font-bold sm:text-3xl">집 보러 간 날, 바로 확인하세요</h1>
          </div>
          <p className="mt-3 max-w-2xl leading-7 text-indigo-100">
            직접 확인한 항목을 체크하면 예상 생활 만족도 점수를 볼 수 있어요.
          </p>
        </div>

        <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[1fr_240px]">
          <div>
            <h2 className="text-lg font-bold text-slate-950">현장 체크리스트</h2>
            <ul className="mt-4 space-y-3">
              {SITE_CHECKS.map((item, index) => (
                <li key={item}>
                  <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${checks[index] ? "border-indigo-200 bg-indigo-50" : "border-slate-200 hover:border-indigo-200"}`}>
                    <input
                      type="checkbox"
                      checked={checks[index]}
                      onChange={() =>
                        setChecks((current) =>
                          current.map((checked, checkIndex) =>
                            checkIndex === index ? !checked : checked,
                          ),
                        )
                      }
                      className="mt-0.5 size-5 shrink-0 accent-indigo-600"
                    />
                    <span className="text-sm font-medium leading-6 text-slate-700">{item}</span>
                  </label>
                </li>
              ))}
            </ul>

            <div className="mt-7 rounded-2xl bg-slate-50 p-5">
              <h3 className="font-bold text-slate-950">관리비에 포함된 항목</h3>
              <p className="mt-1 text-sm text-slate-500">중개사에게 확인한 항목을 모두 선택하세요.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {MANAGEMENT_ITEMS.map((item) => {
                  const selected = includedItems.includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleIncludedItem(item)}
                      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-bold transition ${selected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"}`}
                    >
                      {selected && <Check aria-hidden="true" className="size-4" />}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <aside className="h-fit rounded-2xl bg-slate-950 p-6 text-white lg:sticky lg:top-24">
            <p className="text-sm font-semibold text-indigo-300">생활 만족도 점수</p>
            <p className="mt-2 text-5xl font-extrabold">
              {score}<span className="text-xl text-slate-400">점</span>
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-700">
              <div className="h-full rounded-full bg-indigo-400 transition-all" style={{ width: `${score}%` }} />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              {checkedCount}/{totalCheckCount}개 항목을 확인했어요. 점수는 현장 비교를 돕는 참고값이에요.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}

export default function HomePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"analyze" | "site">("analyze");
  const [user, setUser] = useState<UserInput>(DEFAULT_USER);
  const [answers, setAnswers] = useState<PrecheckAnswers>(EMPTY_ANSWERS);
  const [upload, setUpload] = useState<UploadData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const answeredCount = useMemo(
    () => Object.values(answers).filter((answer) => answer !== null).length,
    [answers],
  );

  async function handleImage(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("JPG, PNG 등 이미지 파일만 올려 주세요.");
      return;
    }

    setError(null);
    setIsResizing(true);
    try {
      setUpload(await resizeImage(file));
    } catch (uploadError) {
      setUpload(null);
      setError(uploadError instanceof Error ? uploadError.message : "이미지를 처리하지 못했어요.");
    } finally {
      setIsResizing(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    void handleImage(event.target.files?.[0]);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    void handleImage(event.dataTransfer.files?.[0]);
  }

  async function analyze(sampleId?: SampleId) {
    if (!sampleId && !upload) {
      setError("분석할 계약서 이미지를 올리거나 시연용 샘플을 선택해 주세요.");
      return;
    }

    const request: AnalyzeRequest = {
      user,
      answers,
      ...(sampleId
        ? { sampleId }
        : { imageBase64: upload?.base64, mimeType: upload?.mimeType }),
    };

    setError(null);
    setIsLoading(true);
    try {
      let responseData: AnalyzeResponse;
      if (USE_MOCK) {
        await new Promise((resolve) => window.setTimeout(resolve, 900));
        responseData = mockResponse;
      } else {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error("분석 요청을 처리하지 못했어요.");
        }
        responseData = (await response.json()) as AnalyzeResponse;
      }

      setResult(responseData);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? `${analysisError.message} 잠시 후 다시 시도해 주세요.`
          : "분석 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function resetAnalysis() {
    setResult(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("analyze");
              setResult(null);
            }}
            className="flex items-center gap-2 rounded-lg font-extrabold tracking-tight text-slate-950 focus-visible:outline-2 focus-visible:outline-indigo-600"
            aria-label="SafeHome 청년 비서 홈"
          >
            <span className="grid size-9 place-items-center rounded-xl bg-indigo-600 text-white">
              <ShieldCheck aria-hidden="true" className="size-5" />
            </span>
            <span className="hidden sm:inline">SafeHome 청년 비서</span>
          </button>

          <nav className="flex rounded-xl bg-slate-100 p-1" aria-label="주요 기능">
            <button
              type="button"
              onClick={() => setActiveTab("analyze")}
              className={`min-h-10 rounded-lg px-3 py-2 text-sm font-bold transition ${activeTab === "analyze" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              계약 분석
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("site")}
              className={`min-h-10 rounded-lg px-3 py-2 text-sm font-bold transition ${activeTab === "site" ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              현장 체크
            </button>
          </nav>
        </div>
      </header>

      {activeTab === "site" ? (
        <SiteChecklist />
      ) : result ? (
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          {result.usedFallback && (
            <p className="mb-3 text-right text-xs font-medium text-slate-500">예시 분석 결과를 표시 중</p>
          )}
          <VerdictBanner verdict={result.verdict} />

          <div className="mt-8 grid items-start gap-8 lg:grid-cols-2">
            <div className="space-y-8">
              <ContractReport summary={result.summary} clauses={result.clauses} />
              <FraudSignals signals={result.fraudSignals} />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <PriceCard monthlyRent={result.summary.monthlyRent} priceCheck={result.priceCheck} />
                <BrokerCard broker={result.brokerCheck} />
              </div>
            </div>
            <div className="space-y-8">
              <Checklist items={result.checklist} />
              <GrantList grants={result.grants} />
              <AfterTodos todos={result.afterContractTodos} />
            </div>
          </div>

          <section className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 sm:flex-row">
            <div>
              <p className="font-bold text-slate-950">계약 후 문제가 생겼나요?</p>
              <Link href="/guide" className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-indigo-700 hover:text-indigo-900">
                대처 가이드 보기
                <ChevronRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
            <button
              type="button"
              onClick={resetAnalysis}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 transition hover:bg-slate-50 sm:w-auto"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              다시 분석하기
            </button>
          </section>
          <Disclaimer />
        </main>
      ) : (
        <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
          <section className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1.5 text-sm font-bold text-indigo-700">
              <Sparkles aria-hidden="true" className="size-4" />
              첫 월세 계약을 위한 사전 점검
            </span>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              계약서 한 장으로 위험 신호를 확인하세요
            </h1>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
              계약서와 등기부 확인 내용을 함께 분석해 독소조항, 사기 의심 신호, 시세와 지원금을 알려드려요.
            </p>
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="user-info-title">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Home aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-indigo-600">1단계</p>
                  <h2 id="user-info-title" className="text-xl font-bold">사용자 정보</h2>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-bold text-slate-700">
                  만 나이
                  <div className="relative mt-2">
                    <input
                      type="number"
                      min={0}
                      value={user.age}
                      onChange={(event) => setUser((current) => ({ ...current, age: Number(event.target.value) }))}
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 pr-12 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                    <span className="absolute right-4 top-3.5 font-medium text-slate-400">세</span>
                  </div>
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  연소득
                  <div className="relative mt-2">
                    <input
                      type="number"
                      min={0}
                      value={user.income}
                      onChange={(event) => setUser((current) => ({ ...current, income: Number(event.target.value) }))}
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 pr-16 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                    />
                    <span className="absolute right-4 top-3.5 font-medium text-slate-400">만원</span>
                  </div>
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  지역
                  <select
                    value={user.region}
                    onChange={(event) => setUser((current) => ({ ...current, region: event.target.value as UserInput["region"] }))}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="서울">서울</option>
                    <option value="경기">경기</option>
                    <option value="인천">인천</option>
                    <option value="기타">기타</option>
                  </select>
                </label>
                <label className="block text-sm font-bold text-slate-700">
                  직업
                  <select
                    value={user.job}
                    onChange={(event) => setUser((current) => ({ ...current, job: event.target.value as UserInput["job"] }))}
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="직장인">직장인</option>
                    <option value="취업준비생">취업준비생</option>
                    <option value="학생">학생</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="precheck-title">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                    <ClipboardCheck aria-hidden="true" className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-indigo-600">2단계</p>
                    <h2 id="precheck-title" className="text-xl font-bold">계약 전 확인 질문</h2>
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                  입력 {answeredCount}/8
                </span>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-500">모르는 항목은 그대로 두어도 돼요. 결과에서 확인 방법을 다시 안내해 드려요.</p>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {BOOLEAN_QUESTIONS.map((question, index) => (
                  <article key={question.key} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                    <p className="text-xs font-bold text-slate-400">질문 {index + 1}</p>
                    <h3 className="mt-2 font-bold leading-6 text-slate-900">{question.label}</h3>
                    <AnswerButtons
                      value={answers[question.key]}
                      onChange={(value) => setAnswers((current) => ({ ...current, [question.key]: value }))}
                    />
                    <HelpTip>{question.help}</HelpTip>
                  </article>
                ))}

                {MONEY_QUESTIONS.map((question, index) => (
                  <article key={question.key} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                    <p className="text-xs font-bold text-slate-400">질문 {BOOLEAN_QUESTIONS.length + index + 1}</p>
                    <h3 className="mt-2 font-bold leading-6 text-slate-900">{question.label}</h3>
                    <div className="relative mt-4">
                      <input
                        type="number"
                        min={0}
                        value={answers[question.key] ?? ""}
                        placeholder={question.placeholder}
                        onChange={(event) =>
                          setAnswers((current) => ({
                            ...current,
                            [question.key]: event.target.value === "" ? null : Number(event.target.value),
                          }))
                        }
                        className="h-11 w-full rounded-xl border border-slate-200 px-4 pr-16 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                      />
                      <span className="absolute right-4 top-3 text-sm font-medium text-slate-400">만원</span>
                    </div>
                    <HelpTip>{question.help}</HelpTip>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-labelledby="upload-title">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FileSearch aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-indigo-600">3단계</p>
                  <h2 id="upload-title" className="text-xl font-bold">계약서 이미지</h2>
                </div>
              </div>

              <div
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                  event.preventDefault();
                  if (event.currentTarget === event.target) setIsDragging(false);
                }}
                onDrop={handleDrop}
                className={`mt-6 rounded-2xl border-2 border-dashed p-7 text-center transition sm:p-10 ${isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-slate-50"}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                  id="contract-image"
                />
                {isResizing ? (
                  <div className="flex flex-col items-center">
                    <LoaderCircle aria-hidden="true" className="size-9 animate-spin text-indigo-600" />
                    <p className="mt-3 font-bold text-slate-800">이미지 크기를 줄이는 중…</p>
                  </div>
                ) : upload ? (
                  <div className="flex flex-col items-center">
                    <span className="grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                      <FileImage aria-hidden="true" className="size-6" />
                    </span>
                    <p className="mt-3 max-w-full truncate font-bold text-slate-900">{upload.name}</p>
                    <p className="mt-1 text-sm text-emerald-700">분석할 준비가 됐어요 · 긴 변 최대 1600px</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="min-h-10 rounded-lg bg-white px-3 py-2 text-sm font-bold text-indigo-700 ring-1 ring-inset ring-slate-200"
                      >
                        다른 이미지 선택
                      </button>
                      <button
                        type="button"
                        onClick={() => setUpload(null)}
                        className="inline-flex min-h-10 items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100"
                      >
                        <X aria-hidden="true" className="size-4" />
                        삭제
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <UploadCloud aria-hidden="true" className="size-10 text-indigo-500" />
                    <p className="mt-3 font-bold text-slate-800">계약서 사진을 여기에 끌어 놓으세요</p>
                    <p className="mt-1 text-sm text-slate-500">JPG, PNG 등 이미지 파일</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-4 min-h-11 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-200 hover:bg-indigo-50"
                    >
                      파일 선택
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {error}
                </p>
              )}

              <button
                type="button"
                disabled={isLoading || isResizing}
                onClick={() => void analyze()}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
                    계약서를 꼼꼼히 읽는 중…
                  </>
                ) : (
                  <>
                    <ShieldCheck aria-hidden="true" className="size-5" />
                    계약서 분석하기
                  </>
                )}
              </button>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-slate-900 p-5 text-white shadow-sm sm:p-7" aria-labelledby="sample-title">
              <div className="flex items-center gap-3">
                <Building aria-hidden="true" className="size-6 text-indigo-300" />
                <div>
                  <h2 id="sample-title" className="text-lg font-bold">계약서가 없다면 샘플로 확인하세요</h2>
                  <p className="mt-1 text-sm text-slate-400">시연용 계약서와 확인 답변으로 바로 분석해요.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {SAMPLES.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    disabled={isLoading}
                    onClick={() => void analyze(sample.id)}
                    className={`min-h-14 rounded-xl border px-4 py-3 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50 ${sample.style}`}
                  >
                    <span aria-hidden="true" className="mr-2">{sample.emoji}</span>
                    {sample.label}
                  </button>
                ))}
              </div>
              {isLoading && (
                <p className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-indigo-200" aria-live="polite">
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  계약서를 꼼꼼히 읽는 중…
                </p>
              )}
            </section>
          </div>
        </main>
      )}
    </div>
  );
}
