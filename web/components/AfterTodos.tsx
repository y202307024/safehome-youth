import { CalendarCheck2 } from "lucide-react";
import type { AnalyzeResponse } from "@/types";

type AfterTodosProps = {
  todos: AnalyzeResponse["afterContractTodos"];
};

export default function AfterTodos({ todos }: AfterTodosProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="after-todos-title">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-indigo-50 text-indigo-600">
          <CalendarCheck2 aria-hidden="true" className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-indigo-600">계약이 끝이 아니에요</p>
          <h2 id="after-todos-title" className="text-xl font-bold text-slate-950">계약 후 할 일</h2>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {todos.map((todo, index) => (
          <li key={todo}>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700 transition hover:bg-slate-100">
              <input
                type="checkbox"
                className="mt-1 size-4 shrink-0 accent-indigo-600"
                aria-label={`${index + 1}번 할 일 완료`}
              />
              <span>
                <strong className="mr-2 text-indigo-600">{index + 1}</strong>
                {todo}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
