import { ArrowUpRight, Gift, WalletCards } from "lucide-react";
import type { AnalyzeResponse, MatchedGrant } from "@/types";

type GrantListProps = {
  grants: AnalyzeResponse["grants"];
};

const REFERENCE_DATE_UTC = Date.UTC(2026, 10, 18);

function getDday(deadline: string) {
  if (deadline === "상시") return "상시 접수";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return deadline;

  const [year, month, day] = deadline.split("-").map(Number);
  const days = Math.ceil((Date.UTC(year, month - 1, day) - REFERENCE_DATE_UTC) / 86_400_000);

  if (days > 0) return `D-${days}`;
  if (days === 0) return "D-Day";
  return "접수 마감";
}

function GrantCard({ grant }: { grant: MatchedGrant }) {
  const dday = getDday(grant.deadline);

  return (
    <article className={`rounded-2xl border p-5 ${grant.eligible ? "border-indigo-200 bg-white shadow-sm" : "border-slate-200 bg-slate-100 text-slate-500"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${grant.eligible ? "bg-indigo-100 text-indigo-700" : "bg-slate-200 text-slate-600"}`}>
              {grant.category}
            </span>
            <span className={`text-xs font-bold ${grant.eligible ? "text-emerald-700" : "text-slate-500"}`}>
              {grant.eligible ? "신청 가능" : "조건 불충족"}
            </span>
          </div>
          <h3 className={`mt-3 font-bold leading-6 ${grant.eligible ? "text-slate-950" : "text-slate-600"}`}>
            {grant.name}
          </h3>
        </div>
        <span className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-extrabold ${grant.eligible ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"}`}>
          {dday}
        </span>
      </div>

      <p className={`mt-3 text-sm leading-6 ${grant.eligible ? "font-medium text-indigo-700" : "text-slate-500"}`}>
        {grant.benefit}
      </p>

      {!grant.eligible && grant.reasons.length > 0 && (
        <div className="mt-3 rounded-xl bg-white/70 p-3">
          <p className="text-xs font-bold text-slate-600">신청이 어려운 이유</p>
          <ul className="mt-1 space-y-1 text-xs leading-5 text-slate-500">
            {grant.reasons.map((reason) => (
              <li key={reason}>· {reason}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-slate-200 pt-4">
        <div className="text-xs leading-5 text-slate-500">
          <p>{grant.source}</p>
          <p>확인일: {grant.checkedAt}</p>
        </div>
        <a
          href={grant.url}
          target="_blank"
          rel="noreferrer"
          className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${grant.eligible ? "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600" : "bg-white text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:outline-slate-500"}`}
        >
          신청 페이지 이동
          <ArrowUpRight aria-hidden="true" className="size-4" />
        </a>
      </div>
    </article>
  );
}

export default function GrantList({ grants }: GrantListProps) {
  const sortedGrants = [...grants].sort((a, b) => Number(b.eligible) - Number(a.eligible));
  const eligibleGrants = grants.filter((grant) => grant.eligible);
  const maxBenefit = eligibleGrants.reduce((sum, grant) => sum + grant.maxBenefit, 0);

  return (
    <section aria-labelledby="grant-list-title">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          <Gift aria-hidden="true" className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-indigo-600">김새봄 님에게 맞춘 결과</p>
          <h2 id="grant-list-title" className="text-xl font-bold text-slate-950">주거 지원금</h2>
        </div>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 p-5 text-white shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-100">신청 가능 정책</p>
            <p className="mt-1 text-3xl font-extrabold">{eligibleGrants.length}개</p>
          </div>
          <WalletCards aria-hidden="true" className="size-7 text-indigo-100" />
        </div>
        <p className="mt-4 border-t border-white/20 pt-4 text-sm text-indigo-100">
          최대 혜택 합계 <strong className="ml-1 text-lg text-white">{maxBenefit.toLocaleString("ko-KR")}만원</strong>
        </p>
        <p className="mt-1 text-xs text-indigo-200">대출 한도는 혜택 합계에서 제외했어요.</p>
      </div>

      <div className="mt-4 space-y-3">
        {sortedGrants.map((grant) => (
          <GrantCard key={grant.id} grant={grant} />
        ))}
      </div>
    </section>
  );
}
