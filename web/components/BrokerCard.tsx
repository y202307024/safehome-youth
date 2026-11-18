import { BadgeCheck, BadgeX, Building2, ShieldAlert } from "lucide-react";
import type { AnalyzeResponse } from "@/types";

type BrokerCardProps = {
  broker: AnalyzeResponse["brokerCheck"];
};

export default function BrokerCard({ broker }: BrokerCardProps) {
  const isClear = broker.registered && !broker.sanctioned && broker.status === "영업중";
  const Icon = isClear ? BadgeCheck : BadgeX;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="broker-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">중개사 조회</p>
          <h2 id="broker-title" className="mt-1 text-xl font-bold text-slate-950">중개사무소 등록 상태</h2>
        </div>
        <Building2 aria-hidden="true" className="size-6 text-indigo-500" />
      </div>

      <div className={`mt-5 flex items-start gap-3 rounded-xl border p-4 ${isClear ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}>
        <Icon aria-hidden="true" className={`mt-0.5 size-6 shrink-0 ${isClear ? "text-emerald-600" : "text-red-600"}`} />
        <div className="min-w-0">
          <p className="break-words font-bold text-slate-950">{broker.officeName}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
            <span className={`rounded-full px-2.5 py-1 ${broker.registered ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {broker.registered ? "등록 확인" : "등록 확인 안 됨"}
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-slate-700">상태: {broker.status}</span>
          </div>
        </div>
      </div>

      {broker.sanctioned && (
        <p className="mt-3 flex gap-2 text-sm font-medium text-red-700">
          <ShieldAlert aria-hidden="true" className="size-5 shrink-0" />
          행정처분 이력이 확인됐어요. 관할 구청에서 현재 상태를 다시 확인하세요.
        </p>
      )}
    </section>
  );
}
