---
inclusion: always
---
SafeHome 청년 비서 — 사회초년생 첫 자취방 안심계약 도우미
한 줄 설명

사회초년생이 월세 계약서 사진과 몇 가지 확인 답변을 넣으면 독소조항, 사기 의심 신호, 주변 시세, 중개사 등록 여부를 분석해 🟢/🟡/🔴 계약 신호등으로 보여주고, 받을 수 있는 주거 지원금과 문제 발생 시 대처 가이드까지 안내하는 웹 서비스. 3시간짜리 발표용 MVP.

기술 스택 (변경 금지)
Next.js App Router + TypeScript + Tailwind CSS + lucide-react
AI: @google/generative-ai, 모델은 process.env.GEMINI_MODEL, 키는 process.env.GEMINI_API_KEY
검증: zod / DB 없음, 데이터는 web/data/*.json
모든 코드는 web/ 폴더 안에 둔다. import alias는 "@/*"
파일과 담당 (다른 사람 파일은 수정하지 말 것)
A: types/index.ts, lib/gemini.ts, lib/samples.ts, lib/verdict.ts, app/api/analyze/route.ts
B: data/grants.json, data/rent_gwanak.json, data/brokers.json, scripts/*.mjs, lib/price.ts, lib/broker.ts, lib/grants.ts, lib/checklist.ts, app/guide/page.tsx
C: app/page.tsx, components/*.tsx, lib/mockResponse.ts
공통 타입 (web/types/index.ts, 임의 변경 금지)
ts
export type RiskLevel = "DANGER" | "WARNING" | "SAFE";
export type Verdict = "GREEN" | "YELLOW" | "RED";
export type SampleId = "green" | "yellow" | "red";

export interface UserInput {
  age: number;                 // 만 나이
  income: number;              // 연소득(만원)
  region: "서울" | "경기" | "인천" | "기타";
  job: "직장인" | "취업준비생" | "학생";
}

export interface PrecheckAnswers {   // 사용자가 등기부·건축물대장·현장에서 확인한 내용, 모르면 null
  ownerMatches: boolean | null;          // 등기부 소유자 = 계약 상대방
  hasTrustOrSeizure: boolean | null;     // 등기부에 신탁·압류·가압류·경매 기록 있음
  mortgage: number | null;               // 근저당 채권최고액 합계(만원)
  housePrice: number | null;             // 매매 시세 또는 공시가격(만원)
  payToOwnerAccount: boolean | null;     // 입금 계좌가 소유자 명의
  isAgentContract: boolean | null;       // 대리인과 계약
  taxCertChecked: boolean | null;        // 국세·지방세 완납증명서 확인
  buildingIsResidential: boolean | null; // 건축물대장 용도가 주택이고 위반건축물 아님
}

export interface AnalyzeRequest {
  user: UserInput;
  answers: PrecheckAnswers;
  sampleId?: SampleId;         // 있으면 시연용 샘플 계약서 사용
  imageBase64?: string;        // data: 접두어 없는 순수 base64
  mimeType?: string;
}

export interface ContractSummary {
  address: string;
  dong: string;                // 예: "봉천동"
  houseType: "다세대" | "다가구" | "오피스텔" | "원룸" | "기타";
  area: number;                // 전용면적(㎡)
  deposit: number;             // 보증금(만원)
  monthlyRent: number;         // 월세(만원)
  maintenanceFee: number;      // 관리비(만원)
  contractPeriod: string;
  landlordName: string;
  brokerOffice: string;
}

export interface Clause {
  originalText: string;
  riskLevel: RiskLevel;
  reason: string;
  legalBasis: string;
  recommendedDefense: string;
}

export interface FraudSignal {
  type: string;
  severity: "HIGH" | "MEDIUM";
  message: string;
  action: string;
}

export interface PriceCheck {
  avgRent: number;
  avgDeposit: number;
  sampleCount: number;
  diffPercent: number;         // (내 월세 - 평균) / 평균 * 100
  level: "SUSPICIOUSLY_CHEAP" | "FAIR" | "EXPENSIVE" | "NO_DATA";
}

export interface BrokerCheck {
  officeName: string;
  registered: boolean;
  status: string;              // 예: "영업중", "휴업", "업무정지", "미등록"
  sanctioned: boolean;         // 행정처분 이력 또는 진행 중
}

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;           // true: 필수, false: 권장
  status: "PASS" | "FAIL" | "UNKNOWN";
  tip: string;
}

export interface Grant {
  id: string;
  name: string;
  category: "월세지원" | "대출" | "이사비·중개보수" | "보증료지원" | "기타";
  benefit: string;
  maxBenefit: number;          // 최대 혜택(만원), 대출은 0
  ageMin: number;
  ageMax: number;
  incomeMax: number | null;    // 연소득 상한(만원), 없으면 null
  depositMax: number | null;
  rentMax: number | null;
  regions: string[];           // ["전국"] 또는 ["서울"]
  jobs: string[];              // ["전체"] 또는 ["직장인"]
  deadline: string;            // "YYYY-MM-DD" 또는 "상시"
  url: string;                 // 공식 기관 사이트만
  source: string;
  checkedAt: string;           // 공식 사이트에서 확인한 날짜, 못 했으면 "미확인"
}

export interface MatchedGrant extends Grant {
  eligible: boolean;
  reasons: string[];           // 불충족 사유. 예: "연소득 기준(○○만원 이하) 초과"
}

export interface AnalyzeResponse {
  summary: ContractSummary;
  clauses: Clause[];
  fraudSignals: FraudSignal[];
  priceCheck: PriceCheck;
  brokerCheck: BrokerCheck;
  checklist: ChecklistItem[];
  grants: MatchedGrant[];
  verdict: { level: Verdict; title: string; reasons: string[] };
  afterContractTodos: string[];
  usedFallback: boolean;       // AI 호출 실패로 사전 계산 결과를 썼는지
}
함수 약속 (이름·시그니처 고정)
lib/gemini.ts (A): analyzeContract(input: { imageBase64?: string; mimeType?: string; text?: string }) : Promise<{ summary: ContractSummary; clauses: Clause[]; fraudSignals: FraudSignal[] }>
lib/samples.ts (A): SAMPLES: Record<SampleId, { text: string; answers: PrecheckAnswers; fallback: AnalyzeResponse }>
lib/verdict.ts (A): judge(clauses, signals, checklist, price, broker): AnalyzeResponse["verdict"]
lib/price.ts (B): checkPrice(s: ContractSummary): PriceCheck
lib/broker.ts (B): checkBroker(officeName: string): BrokerCheck
lib/grants.ts (B): matchGrants(user: UserInput, s: ContractSummary): MatchedGrant[]
lib/checklist.ts (B): buildChecklist(a, s, clauses, price, broker): ChecklistItem[] ruleFraudSignals(a, s, price, broker): FraudSignal[] AFTER_CONTRACT_TODOS: string[]
판정 규칙
시세: diffPercent ≥ +15 → EXPENSIVE, ≤ -25 → SUSPICIOUSLY_CHEAP, 같은 조건 거래 5건 미만 → NO_DATA
깡통 위험: (mortgage + deposit) / housePrice > 0.8 → HIGH, > 0.7 → MEDIUM
RED: DANGER 조항 1개 이상 / HIGH 사기 신호 1개 이상 / 필수 체크 FAIL 1개 이상 / 미등록·행정처분 중개사
YELLOW: WARNING 조항 / MEDIUM 사기 신호 / 시세 EXPENSIVE 또는 SUSPICIOUSLY_CHEAP / 필수 체크 UNKNOWN
GREEN: 그 외
문구: GREEN "필수 확인 항목을 모두 통과했어요 · 안심 계약 준비 완료", YELLOW "진행은 가능하지만 아래 항목을 먼저 해결하세요", RED "이 상태로는 계약을 보류하세요"
"계약해도 됩니다", "안전합니다"처럼 보장하는 표현은 절대 쓰지 않는다.
시연 시나리오
사용자(가명 김새봄): 만 26세, 중소기업 신입 직장인, 연소득 2,600만원, 서울 → 지원금 중 최소 1개는 소득 조건 때문에 "불가 + 사유"로 표시되어야 신뢰감이 생긴다.
🟢 green: 관악구 신림동 다세대 20㎡, 보증금 1,000 / 월세 시세 수준, 관리비 5. 특약은 "반려동물 사육 금지, 실내 흡연 금지" 같은 통상 조항만. 등록 중개사. 확인 답변 모두 안전.
🟡 yellow: 관악구 봉천동 오피스텔 23㎡, 보증금 1,000 / 월세 시세 +18%. 특약: 원상복구 범위가 모호함(WARNING), 중도해지 위약금 월세 3개월분(WARNING). 세금 완납 미확인.
🔴 red: 관악구 봉천동 다가구 22㎡, 보증금 5,000 / 월세 시세 -30%(미끼 의심). 특약: 보일러·누수 포함 모든 수리비 임차인 부담(DANGER), 보증보험 거절돼도 계약금 반환 불가(DANGER), 임대인은 잔금 전 추가 근저당 설정 가능(DANGER). 답변: 소유자 불일치, 대리인 계약, 신탁 등기 있음, 대리인 명의 계좌, 근저당 3억 / 집값 3.5억. 중개사무소는 brokers.json에 없는 이름(미등록).
코딩 규칙
파일은 요청받은 것만 만든다. 테스트 코드, Storybook, CI 설정, README 수정 금지.
주석과 화면 문구는 한국어. 금액은 만원 단위로 표시.
디자인: 화이트/슬레이트 바탕, 블루/인디고 포인트, 카드형 UI, 모바일 대응.
모든 결과 화면 하단에 "참고용 정보이며 법률 자문이 아닙니다 · 2026년 11월 기준" 표시.
AI가 없는 사실(법 조항, 지원금 조건, URL)을 지어내지 않도록 데이터와 프롬프트에 근거를 넣는다.