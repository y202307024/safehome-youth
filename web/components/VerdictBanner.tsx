import { AlertTriangle, CheckCircle2, OctagonAlert } from "lucide-react";
import type { AnalyzeResponse, Verdict } from "@/types";

type VerdictBannerProps = {
  verdict: AnalyzeResponse["verdict"];
};

const styles: Record<
  Verdict,
  { panel: string; light: string; text: string; label: string }
> = {
  GREEN: {
    panel: "border-emerald-200 bg-emerald-50",
    light: "bg-emerald-500 shadow-emerald-200",
    text: "text-emerald-900",
    label: "계약 신호 초록",
  },
  YELLOW: {
    panel: "border-amber-200 bg-amber-50",
    light: "bg-amber-400 shadow-amber-200",
    text: "text-amber-950",
    label: "계약 신호 노랑",
  },
  RED: {
    panel: "border-red-200 bg-red-50",
    light: "bg-red-500 shadow-red-200",
    text: "text-red-950",
    label: "계약 신호 빨강",
  },
};

const icons = {
  GREEN: CheckCircle2,
  YELLOW: AlertTriangle,
  RED: OctagonAlert,
} satisfies Record<Verdict, typeof CheckCircle2>;

export default function VerdictBanner({ verdict }: VerdictBannerProps) {
  const style = styles[verdict.level];
  const Icon = icons[verdict.level];

  return (
    <section
      aria-labelledby="verdict-title"
      className={`overflow-hidden rounded-3xl border p-6 shadow-sm sm:p-8 ${style.panel}`}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex shrink-0 items-center gap-4 sm:flex-col">
          <span
            aria-hidden="true"
            className={`block size-20 rounded-full border-4 border-white shadow-[0_0_0_10px] sm:size-24 ${style.light}`}
          />
          <span className={`text-sm font-bold ${style.text}`}>{style.label}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className={`flex items-start gap-3 ${style.text}`}>
            <Icon aria-hidden="true" className="mt-1 size-6 shrink-0" />
            <h2 id="verdict-title" className="text-2xl font-bold tracking-tight sm:text-3xl">
              {verdict.title}
            </h2>
          </div>
          <ul className={`mt-5 space-y-2 text-sm leading-6 sm:text-base ${style.text}`}>
            {verdict.reasons.map((reason) => (
              <li key={reason} className="flex gap-2">
                <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-current" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
