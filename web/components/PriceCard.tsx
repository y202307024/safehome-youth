import { BarChart3, CircleAlert } from "lucide-react";
import type { AnalyzeResponse } from "@/types";

type PriceCardProps = {
  monthlyRent: number;
  priceCheck: AnalyzeResponse["priceCheck"];
};

const levelLabels: Record<AnalyzeResponse["priceCheck"]["level"], string> = {
  SUSPICIOUSLY_CHEAP: "주변보다 지나치게 저렴해요",
  FAIR: "주변 시세와 비슷해요",
  EXPENSIVE: "주변보다 비싸요",
  NO_DATA: "비교할 거래가 부족해요",
};

function formatMoney(value: number) {
  return `${value.toLocaleString("ko-KR")}만원`;
}

export default function PriceCard({ monthlyRent, priceCheck }: PriceCardProps) {
  const maxRent = Math.max(monthlyRent, priceCheck.avgRent, 1);
  const mineWidth = Math.max((monthlyRent / maxRent) * 100, monthlyRent > 0 ? 8 : 0);
  const averageWidth = Math.max((priceCheck.avgRent / maxRent) * 100, priceCheck.avgRent > 0 ? 8 : 0);
  const hasData = priceCheck.level !== "NO_DATA";
  const diffLabel = `${priceCheck.diffPercent > 0 ? "+" : ""}${priceCheck.diffPercent.toFixed(1)}%`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="price-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">실거래가 비교</p>
          <h2 id="price-title" className="mt-1 text-xl font-bold text-slate-950">월세 시세</h2>
        </div>
        <BarChart3 aria-hidden="true" className="size-6 text-indigo-500" />
      </div>

      {hasData ? (
        <>
          <div className="mt-6 space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">내 월세</span>
                <strong className="text-slate-950">{formatMoney(monthlyRent)}</strong>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${mineWidth}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">주변 평균</span>
                <strong className="text-slate-950">{formatMoney(priceCheck.avgRent)}</strong>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-slate-400" style={{ width: `${averageWidth}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">
              평균 대비 {diffLabel}
            </span>
            <span className="text-sm font-medium text-slate-700">{levelLabels[priceCheck.level]}</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            보증금 평균 {formatMoney(priceCheck.avgDeposit)} · 같은 조건 표본 {priceCheck.sampleCount}건
          </p>
        </>
      ) : (
        <div className="mt-5 flex gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <CircleAlert aria-hidden="true" className="size-5 shrink-0 text-slate-500" />
          <p>같은 조건의 거래 표본이 {priceCheck.sampleCount}건이라 시세를 판단하기 어려워요.</p>
        </div>
      )}
    </section>
  );
}
