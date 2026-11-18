import { Info } from "lucide-react";

export default function Disclaimer() {
  return (
    <aside className="flex items-start justify-center gap-2 border-t border-slate-200 py-6 text-center text-xs leading-5 text-slate-500">
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p>참고용 정보이며 법률 자문이 아닙니다 · 2026년 11월 기준</p>
    </aside>
  );
}
