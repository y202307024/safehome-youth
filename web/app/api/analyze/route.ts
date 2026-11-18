import { z } from "zod";

import { analyzeContract } from "@/lib/gemini";
import { checkBroker } from "@/lib/broker";
import {
  AFTER_CONTRACT_TODOS,
  buildChecklist,
  ruleFraudSignals,
} from "@/lib/checklist";
import { matchGrants } from "@/lib/grants";
import { checkPrice } from "@/lib/price";
import { SAMPLES } from "@/lib/samples";
import { judge } from "@/lib/verdict";
import type { AnalyzeRequest, AnalyzeResponse, FraudSignal } from "@/types";

const nullableBoolean = z.boolean().nullable();
const nullableAmount = z.number().nonnegative().nullable();
const requestSchema = z
  .object({
    user: z.object({
      age: z.number().int().nonnegative(),
      income: z.number().nonnegative(),
      region: z.enum(["서울", "경기", "인천", "기타"]),
      job: z.enum(["직장인", "취업준비생", "학생"]),
    }),
    answers: z.object({
      ownerMatches: nullableBoolean,
      hasTrustOrSeizure: nullableBoolean,
      mortgage: nullableAmount,
      housePrice: nullableAmount,
      payToOwnerAccount: nullableBoolean,
      isAgentContract: nullableBoolean,
      taxCertChecked: nullableBoolean,
      buildingIsResidential: nullableBoolean,
    }),
    sampleId: z.enum(["green", "yellow", "red"]).optional(),
    imageBase64: z.string().min(1).optional(),
    mimeType: z.string().startsWith("image/").optional(),
  })
  .refine(
    (input) =>
      input.sampleId !== undefined ||
      (input.imageBase64 !== undefined && input.mimeType !== undefined),
    { message: "sampleId 또는 계약서 이미지와 MIME 타입이 필요합니다." },
  );

function mergeSignals(
  aiSignals: FraudSignal[],
  ruleSignals: FraudSignal[],
): FraudSignal[] {
  const uniqueSignals = new Map<string, FraudSignal>();

  for (const signal of [...aiSignals, ...ruleSignals]) {
    if (!uniqueSignals.has(signal.type)) uniqueSignals.set(signal.type, signal);
  }

  return [...uniqueSignals.values()];
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "요청 본문이 올바른 JSON이 아닙니다." }, { status: 400 });
  }

  const validation = requestSchema.safeParse(body);
  if (!validation.success) {
    return Response.json(
      { error: "입력값을 확인하세요.", details: validation.error.flatten() },
      { status: 400 },
    );
  }

  const input: AnalyzeRequest = validation.data;
  const sample = input.sampleId ? SAMPLES[input.sampleId] : undefined;
  const activeAnswers = sample?.answers ?? input.answers;

  let analysis: Awaited<ReturnType<typeof analyzeContract>>;
  try {
    analysis = await analyzeContract(
      sample
        ? { text: sample.text }
        : { imageBase64: input.imageBase64, mimeType: input.mimeType },
    );
  } catch {
    if (sample) {
      return Response.json({ ...sample.fallback, usedFallback: true });
    }
    return Response.json(
      { error: "계약서 AI 분석에 실패했습니다. 잠시 후 다시 시도하세요." },
      { status: 502 },
    );
  }

  try {
    const priceCheck = checkPrice(analysis.summary);
    const brokerCheck = checkBroker(analysis.summary.brokerOffice);
    const grants = matchGrants(input.user, analysis.summary);
    const fraudSignals = mergeSignals(
      analysis.fraudSignals,
      ruleFraudSignals(
        activeAnswers,
        analysis.summary,
        priceCheck,
        brokerCheck,
      ),
    );
    const checklist = buildChecklist(
      activeAnswers,
      analysis.summary,
      analysis.clauses,
      priceCheck,
      brokerCheck,
    );
    const verdict = judge(
      analysis.clauses,
      fraudSignals,
      checklist,
      priceCheck,
      brokerCheck,
    );
    const response: AnalyzeResponse = {
      ...analysis,
      fraudSignals,
      priceCheck,
      brokerCheck,
      checklist,
      grants,
      verdict,
      afterContractTodos: [...AFTER_CONTRACT_TODOS],
      usedFallback: false,
    };

    return Response.json(response);
  } catch {
    return Response.json(
      { error: "계약서 분석 결과를 계산하는 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
