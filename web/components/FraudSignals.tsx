import { AlertOctagon, AlertTriangle } from "lucide-react";
import type { AnalyzeResponse } from "@/types";

type FraudSignalsProps = {
  signals: AnalyzeResponse["fraudSignals"];
};

export default function FraudSignals({ signals }: FraudSignalsProps) {
  if (signals.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">사기 의심 신호</h2>
        <p className="mt-3 text-sm text-slate-600">계약서에서 별도의 사기 의심 신호를 찾지 못했어요.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="fraud-signals-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="fraud-signals-title" className="text-xl font-bold text-slate-950">
          사기 의심 신호
        </h2>
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
          {signals.length}건 발견
        </span>
      </div>

      <div className="space-y-3">
        {signals.map((signal, index) => {
          const isHigh = signal.severity === "HIGH";
          const Icon = isHigh ? AlertOctagon : AlertTriangle;

          return (
            <article
              key={`${signal.type}-${index}`}
              className={`rounded-2xl border p-5 shadow-sm ${
                isHigh
                  ? "border-red-200 bg-red-50"
                  : "border-orange-200 bg-orange-50"
              }`}
            >
              <div className="flex gap-3">
                <Icon
                  aria-hidden="true"
                  className={`mt-0.5 size-5 shrink-0 ${isHigh ? "text-red-600" : "text-orange-600"}`}
                />
                <div className="min-w-0">
                  <span
                    className={`text-xs font-extrabold tracking-wide ${
                      isHigh ? "text-red-700" : "text-orange-700"
                    }`}
                  >
                    {signal.severity === "HIGH" ? "높은 위험" : "주의 필요"}
                  </span>
                  <p className="mt-1 font-semibold leading-6 text-slate-950">{signal.message}</p>
                  <div className="mt-3 rounded-xl bg-white/80 p-3 text-sm leading-6 text-slate-700">
                    <strong className="text-slate-950">지금 할 일</strong>
                    <p>{signal.action}</p>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
