"use client";

import { useState, type ReactNode } from "react";
import {
  Building2,
  FileArchive,
  FileCheck2,
  Gavel,
  House,
  Landmark,
  Phone,
  ShieldAlert,
  type LucideIcon,
} from "lucide-react";

const SITUATIONS = [
  {
    id: "unreachable",
    label: "집주인 연락 두절",
    firstAction:
      "계약서·연락 기록·이체 내역을 저장하고 최신 등기부등본을 발급하세요.",
  },
  {
    id: "deposit-not-returned",
    label: "계약 끝났는데 보증금 미반환",
    firstAction: "내용증명으로 보증금 반환을 요구하세요.",
  },
  {
    id: "auction",
    label: "집이 경매에 넘어감",
    firstAction:
      "최신 등기부등본을 발급하고 시·도 전세피해지원센터에 상담하세요.",
  },
  {
    id: "must-move",
    label: "이사 가야 하는데 보증금 못 받음",
    firstAction: "이사 전에 임차권등기명령을 신청하세요.",
  },
] as const;

interface GuideStep {
  title: string;
  icon: LucideIcon;
  content: ReactNode;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: "증거 확보",
    icon: FileArchive,
    content: (
      <>
        계약서, 문자·카톡, 이체 내역을 저장하고 최신 등기부등본을 다시
        발급하세요.
      </>
    ),
  },
  {
    title: "무료 상담",
    icon: Phone,
    content: (
      <ul className="space-y-2">
        <li>HUG 주택도시보증공사 1566-9009</li>
        <li>대한법률구조공단 132</li>
        <li>시·도 전세피해지원센터</li>
      </ul>
    ),
  },
  {
    title: "보증금 지키기",
    icon: Landmark,
    content: (
      <ul className="space-y-2">
        <li>
          이사 전 임차권등기명령을 신청하세요. 이사 후에도 대항력과
          우선변제권을 유지할 수 있어요.
        </li>
        <li>내용증명으로 보증금 반환을 요구하세요.</li>
      </ul>
    ),
  },
  {
    title: "피해자 결정 신청",
    icon: FileCheck2,
    content: (
      <>
        주택 소재지 관할 시·도 전세사기 피해지원센터에 신청서와
        임대차계약서를 제출하세요. 국토교통부 심의 후 지원받을 수 있어요.
        전세사기피해자법은 2027년 5월 31일까지 연장됐어요.
      </>
    ),
  },
  {
    title: "형사 고소",
    icon: Gavel,
    content: <>사기가 의심되면 경찰에 고소하세요.</>,
  },
];

export default function GuidePage() {
  const [selectedSituation, setSelectedSituation] = useState(0);
  const situation = SITUATIONS[selectedSituation];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-8 text-center sm:mb-10">
          <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <ShieldAlert className="size-7" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            전월세 사기 피해 대처 가이드
          </h1>
        </header>

        <section aria-labelledby="situation-heading" className="mb-8">
          <h2
            id="situation-heading"
            className="mb-3 text-sm font-semibold text-slate-700"
          >
            상황 선택
          </h2>
          <div
            className="grid grid-cols-1 gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:grid-cols-2 lg:grid-cols-4"
            role="tablist"
            aria-label="피해 상황 선택"
          >
            {SITUATIONS.map((item, index) => {
              const selected = index === selectedSituation;

              return (
                <button
                  key={item.id}
                  id={`tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="situation-panel"
                  onClick={() => setSelectedSituation(index)}
                  className={`rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 ${
                    selected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>

        <section
          id="situation-panel"
          role="tabpanel"
          aria-labelledby={`tab-${situation.id}`}
          className="mb-8 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 sm:p-6"
        >
          <div className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <House className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-indigo-700">
                지금 가장 먼저 할 일
              </p>
              <p className="mt-1 text-lg font-bold leading-7 text-slate-950">
                {situation.firstAction}
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="steps-heading">
          <h2 id="steps-heading" className="sr-only">
            피해 대처 단계
          </h2>
          <div className="space-y-4">
            {GUIDE_STEPS.map((step, index) => {
              const Icon = step.icon;

              return (
                <article
                  key={step.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex gap-4 sm:gap-5">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-indigo-600">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <h3 className="text-lg font-bold text-slate-950">
                          {step.title}
                        </h3>
                      </div>
                      <div className="mt-3 text-[15px] leading-7 text-slate-600 sm:text-base">
                        {step.content}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <footer className="mt-10 rounded-2xl border border-slate-200 bg-slate-100 px-5 py-6 text-center text-sm leading-6 text-slate-600 sm:px-8">
          <div className="mb-3 flex items-center justify-center gap-2 font-semibold text-slate-700">
            <Building2 className="size-4" aria-hidden="true" />
            참고용 정보이며 법률 자문이 아닙니다 · 2026년 11월 기준
          </div>
          <p>
            2026년 11월 기준, 지원 내용은 바뀔 수 있으니 기관에서 최신
            정보를 확인하세요.
          </p>
        </footer>
      </div>
    </main>
  );
}
