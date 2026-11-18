import type {
  BrokerCheck,
  ChecklistItem,
  Clause,
  ContractSummary,
  FraudSignal,
  PrecheckAnswers,
  PriceCheck,
} from "@/types";

function booleanStatus(
  value: boolean | null,
  passWhen: boolean,
): ChecklistItem["status"] {
  if (value === null) return "UNKNOWN";
  return value === passWhen ? "PASS" : "FAIL";
}

function calculateDebtRatio(
  answers: PrecheckAnswers,
  deposit: number,
): number | null {
  if (
    answers.mortgage === null ||
    answers.housePrice === null ||
    answers.housePrice <= 0
  ) {
    return null;
  }

  return (answers.mortgage + deposit) / answers.housePrice;
}

export function buildChecklist(
  a: PrecheckAnswers,
  s: ContractSummary,
  clauses: Clause[],
  price: PriceCheck,
  broker: BrokerCheck,
): ChecklistItem[] {
  const debtRatio = calculateDebtRatio(a, s.deposit);
  const debtRatioStatus: ChecklistItem["status"] =
    debtRatio === null ? "UNKNOWN" : debtRatio <= 0.7 ? "PASS" : "FAIL";
  const brokerIsActive =
    broker.registered && broker.status === "영업중" && !broker.sanctioned;
  const hasDangerClause = clauses.some(
    (clause) => clause.riskLevel === "DANGER",
  );
  const priceStatus: ChecklistItem["status"] =
    price.level === "FAIR"
      ? "PASS"
      : price.level === "NO_DATA"
        ? "UNKNOWN"
        : "FAIL";

  return [
    {
      id: "owner-matches",
      label: "등기부 소유자와 계약 상대방이 일치해요",
      required: true,
      status: booleanStatus(a.ownerMatches, true),
      tip: "등기부등본의 소유자 이름과 상대방 신분증을 직접 대조하세요.",
    },
    {
      id: "no-trust-or-seizure",
      label: "등기부에 신탁·압류·가압류·경매 기록이 없어요",
      required: true,
      status: booleanStatus(a.hasTrustOrSeizure, false),
      tip: "계약 직전에 발급한 등기부등본의 갑구와 을구를 모두 확인하세요.",
    },
    {
      id: "safe-debt-ratio",
      label: "근저당과 보증금의 합계가 집값의 70% 이하여요",
      required: true,
      status: debtRatioStatus,
      tip:
        debtRatio === null
          ? "근저당 채권최고액과 신뢰할 수 있는 집값을 확인해 비율을 계산하세요."
          : `현재 계산 비율은 ${(debtRatio * 100).toFixed(1)}%예요.`,
    },
    {
      id: "owner-account",
      label: "보증금과 월세를 소유자 명의 계좌로 입금해요",
      required: true,
      status: booleanStatus(a.payToOwnerAccount, true),
      tip: "계좌 예금주가 등기부 소유자와 같은지 송금 전에 확인하세요.",
    },
    {
      id: "residential-building",
      label: "건축물 용도가 주택이고 위반건축물이 아니에요",
      required: true,
      status: booleanStatus(a.buildingIsResidential, true),
      tip: "건축물대장의 용도와 위반건축물 표시를 확인하세요.",
    },
    {
      id: "registered-broker",
      label: "등록된 중개사무소가 정상 영업 중이에요",
      required: true,
      status: brokerIsActive ? "PASS" : "FAIL",
      tip: "중개업등록번호와 영업·행정처분 상태를 관할 구청에 확인하세요.",
    },
    {
      id: "no-danger-clause",
      label: "계약서에 DANGER 조항이 없어요",
      required: true,
      status: hasDangerClause ? "FAIL" : "PASS",
      tip: "임차인에게 과도한 책임을 지우거나 권리를 포기시키는 특약은 수정하세요.",
    },
    {
      id: "tax-clearance",
      label: "임대인의 국세·지방세 완납 여부를 확인했어요",
      required: false,
      status: booleanStatus(a.taxCertChecked, true),
      tip: "납세증명서를 요청하고 체납이 있으면 선순위 위험을 확인하세요.",
    },
    {
      id: "fair-price",
      label: "주변 같은 조건의 거래와 비교해 시세가 적정해요",
      required: false,
      status: priceStatus,
      tip: "같은 동·주택유형과 비슷한 면적의 실거래 평균을 함께 비교하세요.",
    },
    {
      id: "direct-contract",
      label: "소유자 본인과 직접 계약해요",
      required: false,
      status: booleanStatus(a.isAgentContract, false),
      tip: "대리 계약이면 소유자 의사를 직접 확인하고 위임장·인감증명서를 대조하세요.",
    },
  ];
}

export function ruleFraudSignals(
  a: PrecheckAnswers,
  s: ContractSummary,
  price: PriceCheck,
  broker: BrokerCheck,
): FraudSignal[] {
  const signals: FraudSignal[] = [];
  const debtRatio = calculateDebtRatio(a, s.deposit);

  if (debtRatio !== null && debtRatio > 0.7) {
    const severity: FraudSignal["severity"] =
      debtRatio > 0.8 ? "HIGH" : "MEDIUM";
    signals.push({
      type: "깡통 위험",
      severity,
      message: `근저당과 보증금의 합계가 집값의 ${(debtRatio * 100).toFixed(1)}%예요.`,
      action:
        severity === "HIGH"
          ? "계약을 멈추고 근저당 감액 또는 보증금 조정을 요구하세요."
          : "등기부와 시세 근거를 다시 확인하고 보증금 조정을 요구하세요.",
    });
  }

  if (a.ownerMatches === false) {
    signals.push({
      type: "소유자 불일치",
      severity: "HIGH",
      message: "등기부 소유자와 계약 상대방이 일치하지 않아요.",
      action: "계약을 중단하고 등기부 소유자 본인이 신분증을 제시하도록 요청하세요.",
    });
  }

  if (a.hasTrustOrSeizure === true) {
    signals.push({
      type: "신탁·압류",
      severity: "HIGH",
      message: "등기부에 신탁·압류·가압류·경매 관련 기록이 있어요.",
      action: "계약을 중단하고 해당 권리관계가 말소된 뒤 최신 등기부를 다시 확인하세요.",
    });
  }

  if (a.payToOwnerAccount === false) {
    signals.push({
      type: "비소유자 계좌",
      severity: "HIGH",
      message: "입금 계좌의 명의가 등기부 소유자와 달라요.",
      action: "송금을 멈추고 등기부 소유자 명의 계좌를 다시 확인하세요.",
    });
  }

  if (a.isAgentContract === true) {
    signals.push({
      type: "대리 계약",
      severity: "MEDIUM",
      message: "소유자 본인이 아닌 대리인과 계약하는 상황이에요.",
      action: "계약 전에 소유자 의사를 직접 확인하고 위임장과 인감증명서를 대조하세요.",
    });
  }

  if (price.level === "SUSPICIOUSLY_CHEAP") {
    signals.push({
      type: "미끼 의심 시세",
      severity: "MEDIUM",
      message: "월세가 주변 평균보다 25% 이상 낮아 미끼 매물 여부를 확인해야 해요.",
      action: "계약금을 보내지 말고 같은 조건의 실거래가와 매물 상태를 현장에서 다시 확인하세요.",
    });
  }

  if (!broker.registered) {
    signals.push({
      type: "미등록 중개사",
      severity: "HIGH",
      message: "입력한 중개사무소를 등록 자료에서 찾지 못했어요.",
      action: "계약을 중단하고 관할 구청에 중개사무소의 등록 상태를 직접 확인하세요.",
    });
  }

  return signals;
}

export const AFTER_CONTRACT_TODOS: string[] = [
  "잔금일에 등기부등본을 다시 확인하기",
  "이사 당일 전입신고를 하고 확정일자 받기",
  "전세보증금반환보증 가입 검토하기",
  "계약 후 임대인 미납국세 열람하기",
  "받을 수 있는 주거 지원금 신청하기",
];
