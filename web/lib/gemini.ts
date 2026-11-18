import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { z } from "zod";

import type { Clause, ContractSummary, FraudSignal } from "@/types";

const analysisSchema = z.object({
  summary: z.object({
    address: z.string().min(1),
    dong: z.string().min(1),
    houseType: z.enum(["다세대", "다가구", "오피스텔", "원룸", "기타"]),
    area: z.number().nonnegative(),
    deposit: z.number().nonnegative(),
    monthlyRent: z.number().nonnegative(),
    maintenanceFee: z.number().nonnegative(),
    contractPeriod: z.string().min(1),
    landlordName: z.string().min(1),
    brokerOffice: z.string().min(1),
  }),
  clauses: z.array(
    z.object({
      originalText: z.string().min(1),
      riskLevel: z.enum(["DANGER", "WARNING", "SAFE"]),
      reason: z.string().min(1),
      legalBasis: z.string().min(1),
      recommendedDefense: z.string().min(1),
    }),
  ),
  fraudSignals: z.array(
    z.object({
      type: z.string().min(1),
      severity: z.enum(["HIGH", "MEDIUM"]),
      message: z.string().min(1),
      action: z.string().min(1),
    }),
  ),
});

const PROMPT = `당신은 대한민국 주택 임대차계약서를 임차인 관점에서 점검하는 분석기입니다.
입력된 계약서 이미지 또는 텍스트에서 확인되는 내용만 사용하고 JSON 하나만 반환하세요.

summary 작성 규칙:
- 금액 단위는 만원, 면적 단위는 ㎡로 통일합니다.
- 주소에서 동 이름을 dong에 분리합니다.
- 읽을 수 없는 문자열은 "확인 불가", 읽을 수 없는 숫자는 0으로 씁니다.

clauses 작성 규칙:
- 한국 민법과 주택임대차보호법을 기준으로 임차인에게 불리한 특약을 찾습니다.
- 특히 수선의무 전가, 원상복구 범위의 모호함, 보증금 반환 지연, 과다한 위약금,
  보증보험 관련 책임 전가, 잔금 전 소유권·근저당 등 권리 변동 허용을 점검합니다.
- originalText에는 계약서 문구를 그대로 인용하고, riskLevel은 DANGER/WARNING/SAFE 중 하나로 씁니다.
- reason에는 임차인에게 생기는 위험, legalBasis에는 근거 조문, recommendedDefense에는
  계약서에 바로 추가하거나 교체할 수 있는 구체적인 방어 특약 문구를 씁니다.
- 조문 번호나 적용 여부가 확실하지 않으면 절대 지어내지 말고 legalBasis를
  "관련 법리 확인 필요"라고 씁니다.

fraudSignals 작성 규칙:
- 계약서에 실제로 보이는 사기 의심 신호만 작성합니다.
- 대리 계약 문구, 신탁등기·신탁회사, 소유자와 임대인 불일치, 제3자 명의 입금 계좌,
  권리관계 확인을 막는 문구 등을 점검합니다.
- severity는 HIGH 또는 MEDIUM이며, action에는 계약 전 확인 행동을 구체적으로 씁니다.

반환 JSON 구조:
{
  "summary": {
    "address": "문자열", "dong": "문자열",
    "houseType": "다세대|다가구|오피스텔|원룸|기타",
    "area": 0, "deposit": 0, "monthlyRent": 0, "maintenanceFee": 0,
    "contractPeriod": "문자열", "landlordName": "문자열", "brokerOffice": "문자열"
  },
  "clauses": [{
    "originalText": "문자열", "riskLevel": "DANGER|WARNING|SAFE",
    "reason": "문자열", "legalBasis": "문자열", "recommendedDefense": "문자열"
  }],
  "fraudSignals": [{
    "type": "문자열", "severity": "HIGH|MEDIUM", "message": "문자열", "action": "문자열"
  }]
}`;

type AnalyzeContractInput = {
  imageBase64?: string;
  mimeType?: string;
  text?: string;
};

type ContractAnalysis = {
  summary: ContractSummary;
  clauses: Clause[];
  fraudSignals: FraudSignal[];
};

export async function analyzeContract(
  input: AnalyzeContractInput,
): Promise<ContractAnalysis> {
  const text = input.text?.trim();
  const imageBase64 = input.imageBase64?.trim();

  if (!text && !imageBase64) {
    throw new Error("분석할 계약서 이미지 또는 텍스트가 필요합니다.");
  }
  if (imageBase64 && (!input.mimeType || !input.mimeType.startsWith("image/"))) {
    throw new Error("계약서 이미지의 올바른 MIME 타입이 필요합니다.");
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경 변수를 확인하세요.");
  }

  const modelNames = [
    process.env.GEMINI_MODEL?.trim(),
    process.env.GEMINI_FALLBACK_MODEL?.trim(),
    "gemini-3.5-flash",
  ].filter((name, index, names): name is string => Boolean(name) && names.indexOf(name) === index);

  const parts: Part[] = [{ text: PROMPT }];
  if (text) parts.push({ text: `계약서 텍스트:\n${text}` });
  if (imageBase64 && input.mimeType) {
    parts.push({ inlineData: { data: imageBase64, mimeType: input.mimeType } });
  }

  let lastError: unknown;
  for (const modelName of modelNames) {
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const requestParts =
        attempt === 0
          ? parts
          : [...parts, { text: "이전 응답 형식이 잘못되었습니다. 위 JSON 구조를 정확히 지키세요." }];

      let responseText: string;
      try {
        const result = await model.generateContent(requestParts);
        responseText = result.response.text();
      } catch (error) {
        lastError = error;
        break;
      }

      try {
        const parsed = analysisSchema.safeParse(JSON.parse(responseText));
        if (parsed.success) return parsed.data;
        lastError = parsed.error;
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw new Error("사용 가능한 Gemini 모델에서 계약서 분석에 실패했습니다.", {
    cause: lastError,
  });
}
