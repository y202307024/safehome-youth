"use client";

import { useState } from "react";
import { Check, Clipboard, FileSearch, Home } from "lucide-react";
import type { AnalyzeResponse, RiskLevel } from "@/types";

type ContractReportProps = {
  summary: AnalyzeResponse["summary"];
  clauses: AnalyzeResponse["clauses"];
};

const riskStyles: Record<
  RiskLevel,
  { badge: string; card: string; label: string }
> = {
  DANGER: {
    badge: "bg-red-100 text-red-700",
    card: "border-red-200",
    label: "위험",
  },
  WARNING: {
    badge: "bg-amber-100 text-amber-800",
    card: "border-amber-200",
    label: "주의",
  },
  SAFE: {
    badge: "bg-emerald-100 text-emerald-700",
    card: "border-emerald-200",
    label: "통상 조항",
  },
};

function formatMoney(value: number) {
  return `${value.toLocaleString("ko-KR")}만원`;
}

export default function ContractReport({ summary, clauses }: ContractReportProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copyFailedIndex, setCopyFailedIndex] = useState<number | null>(null);

  async function copyDefense(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setCopyFailedIndex(null);
      window.setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      setCopyFailedIndex(index);
      setCopiedIndex(null);
    }
  }

  const summaryRows = [
    ["주택 유형", `${summary.houseType} · ${summary.area}㎡`],
    ["보증금", formatMoney(summary.deposit)],
    ["월세", formatMoney(summary.monthlyRent)],
    ["관리비", formatMoney(summary.maintenanceFee)],
    ["계약 기간", summary.contractPeriod],
    ["임대인", summary.landlordName],
    ["중개사무소", summary.brokerOffice],
  ];

  return (
    <section className="space-y-6" aria-labelledby="contract-report-title">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
            <Home aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-indigo-600">계약서에서 읽은 정보</p>
            <h2 id="contract-report-title" className="mt-0.5 text-xl font-bold text-slate-950">
              계약 요약
            </h2>
            <p className="mt-2 break-words text-sm leading-6 text-slate-600">{summary.address}</p>
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-1 gap-x-6 sm:grid-cols-2">
          {summaryRows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 border-t border-slate-100 py-3 text-sm">
              <dt className="shrink-0 text-slate-500">{label}</dt>
              <dd className="break-words text-right font-semibold text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
      </article>

      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileSearch aria-hidden="true" className="size-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-slate-950">특약 진단</h2>
          </div>
          <span className="text-sm text-slate-500">총 {clauses.length}개</span>
        </div>

        {clauses.length > 0 ? (
          <div className="space-y-4">
            {clauses.map((clause, index) => {
              const style = riskStyles[clause.riskLevel];
              const copied = copiedIndex === index;
              const copyFailed = copyFailedIndex === index;

              return (
                <article key={`${clause.originalText}-${index}`} className={`rounded-2xl border bg-white p-5 shadow-sm ${style.card}`}>
                  <div className="flex items-start justify-between gap-3">
                    <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${style.badge}`}>
                      {clause.riskLevel} · {style.label}
                    </span>
                    <span className="text-xs font-medium text-slate-400">특약 {index + 1}</span>
                  </div>

                  <blockquote className="mt-4 border-l-2 border-slate-300 pl-3 text-sm font-medium leading-6 text-slate-900">
                    “{clause.originalText}”
                  </blockquote>

                  <div className="mt-4 space-y-3 text-sm leading-6">
                    <div>
                      <h3 className="font-bold text-slate-950">왜 확인해야 하나요?</h3>
                      <p className="mt-1 text-slate-600">{clause.reason}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-950">근거</h3>
                      <p className="mt-1 text-slate-600">{clause.legalBasis}</p>
                    </div>
                    <div className="rounded-xl bg-indigo-50 p-4">
                      <h3 className="font-bold text-indigo-950">방어 특약 제안</h3>
                      <p className="mt-1 text-indigo-900">{clause.recommendedDefense}</p>
                      <button
                        type="button"
                        onClick={() => copyDefense(clause.recommendedDefense, index)}
                        className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-indigo-700 shadow-sm ring-1 ring-inset ring-indigo-200 transition hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                      >
                        {copied ? <Check aria-hidden="true" className="size-4" /> : <Clipboard aria-hidden="true" className="size-4" />}
                        {copied ? "복사 완료" : "방어 특약 복사하기"}
                      </button>
                      {copyFailed && (
                        <p role="alert" className="mt-2 text-xs font-medium text-red-700">
                          복사하지 못했어요. 문구를 직접 선택해 주세요.
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
            분석된 특약이 없어요.
          </div>
        )}
      </div>
    </section>
  );
}
