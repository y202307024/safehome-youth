export type RiskLevel = "DANGER" | "WARNING" | "SAFE";
export type Verdict = "GREEN" | "YELLOW" | "RED";
export type SampleId = "green" | "yellow" | "red";

export interface UserInput {
  age: number;
  income: number;
  region: "서울" | "경기" | "인천" | "기타";
  job: "직장인" | "취업준비생" | "학생";
}

export interface PrecheckAnswers {
  ownerMatches: boolean | null;
  hasTrustOrSeizure: boolean | null;
  mortgage: number | null;
  housePrice: number | null;
  payToOwnerAccount: boolean | null;
  isAgentContract: boolean | null;
  taxCertChecked: boolean | null;
  buildingIsResidential: boolean | null;
}

export interface AnalyzeRequest {
  user: UserInput;
  answers: PrecheckAnswers;
  sampleId?: SampleId;
  imageBase64?: string;
  mimeType?: string;
}

export interface ContractSummary {
  address: string;
  dong: string;
  houseType: "다세대" | "다가구" | "오피스텔" | "원룸" | "기타";
  area: number;
  deposit: number;
  monthlyRent: number;
  maintenanceFee: number;
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
  diffPercent: number;
  level: "SUSPICIOUSLY_CHEAP" | "FAIR" | "EXPENSIVE" | "NO_DATA";
}

export interface BrokerCheck {
  officeName: string;
  registered: boolean;
  status: string;
  sanctioned: boolean;
}

export interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
  status: "PASS" | "FAIL" | "UNKNOWN";
  tip: string;
}

export interface Grant {
  id: string;
  name: string;
  category: "월세지원" | "대출" | "이사비·중개보수" | "보증료지원" | "기타";
  benefit: string;
  maxBenefit: number;
  ageMin: number;
  ageMax: number;
  incomeMax: number | null;
  depositMax: number | null;
  rentMax: number | null;
  regions: string[];
  jobs: string[];
  deadline: string;
  url: string;
  source: string;
  checkedAt: string;
}

export interface MatchedGrant extends Grant {
  eligible: boolean;
  reasons: string[];
}

export interface AnalyzeResponse {
  summary: ContractSummary;
  clauses: Clause[];
  fraudSignals: FraudSignal[];
  priceCheck: PriceCheck;
  brokerCheck: BrokerCheck;
  checklist: ChecklistItem[];
  grants: MatchedGrant[];
  verdict: {
    level: Verdict;
    title: string;
    reasons: string[];
  };
  afterContractTodos: string[];
  usedFallback: boolean;
}
