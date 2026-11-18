import { CircleCheckBig, CircleHelp, CircleX, ListChecks } from "lucide-react";
import type { AnalyzeResponse, ChecklistItem } from "@/types";

type ChecklistProps = {
  items: AnalyzeResponse["checklist"];
};

const statusConfig: Record<
  ChecklistItem["status"],
  { icon: typeof CircleCheckBig; label: string; iconColor: string; row: string }
> = {
  PASS: {
    icon: CircleCheckBig,
    label: "통과",
    iconColor: "text-emerald-600",
    row: "border-emerald-100 bg-emerald-50/60",
  },
  FAIL: {
    icon: CircleX,
    label: "확인 필요",
    iconColor: "text-red-600",
    row: "border-red-100 bg-red-50/60",
  },
  UNKNOWN: {
    icon: CircleHelp,
    label: "모름",
    iconColor: "text-amber-600",
    row: "border-amber-100 bg-amber-50/60",
  },
};

function ChecklistGroup({ title, items }: { title: string; items: ChecklistItem[] }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-bold text-slate-950">{title}</h3>
        <span className="text-xs text-slate-500">{items.length}개 항목</span>
      </div>
      <ul className="space-y-2">
        {items.map((item) => {
          const config = statusConfig[item.status];
          const Icon = config.icon;

          return (
            <li key={item.id} className={`rounded-xl border p-3 ${config.row}`}>
              <div className="flex items-start gap-3">
                <Icon aria-hidden="true" className={`mt-0.5 size-5 shrink-0 ${config.iconColor}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-5 text-slate-900">{item.label}</p>
                    <span className={`text-xs font-bold ${config.iconColor}`}>{config.label}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{item.tip}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Checklist({ items }: ChecklistProps) {
  const requiredItems = items.filter((item) => item.required);
  const recommendedItems = items.filter((item) => !item.required);
  const passedRequired = requiredItems.filter((item) => item.status === "PASS").length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="checklist-title">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-600">계약 전 마지막 점검</p>
          <h2 id="checklist-title" className="mt-1 text-xl font-bold text-slate-950">안심 체크리스트</h2>
        </div>
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          <ListChecks aria-hidden="true" className="size-5" />
        </span>
      </div>

      <div className="mt-4 rounded-xl bg-slate-900 p-4 text-white">
        <p className="text-sm text-slate-300">필수 항목 통과</p>
        <p className="mt-1 text-2xl font-bold">
          {passedRequired}<span className="text-base font-medium text-slate-400"> / {requiredItems.length}</span>
        </p>
      </div>

      <div className="mt-6 space-y-7">
        <ChecklistGroup title="필수 확인" items={requiredItems} />
        <ChecklistGroup title="권장 확인" items={recommendedItems} />
      </div>
    </section>
  );
}
