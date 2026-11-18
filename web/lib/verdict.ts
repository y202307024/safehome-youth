import type {
  AnalyzeResponse,
  BrokerCheck,
  ChecklistItem,
  Clause,
  FraudSignal,
  PriceCheck,
} from "@/types";

export function judge(
  clauses: Clause[],
  signals: FraudSignal[],
  checklist: ChecklistItem[],
  price: PriceCheck,
  broker: BrokerCheck,
): AnalyzeResponse["verdict"] {
  const dangerClauses = clauses.filter(
    (clause) => clause.riskLevel === "DANGER",
  );
  const highSignals = signals.filter((signal) => signal.severity === "HIGH");
  const failedRequired = checklist.filter(
    (item) => item.required && item.status === "FAIL",
  );
  const redReasons: string[] = [];

  if (dangerClauses.length > 0) {
    redReasons.push(
      `임차인에게 큰 손해가 될 수 있는 위험 특약이 ${dangerClauses.length}개 있어요.`,
    );
  }
  if (highSignals.length > 0) {
    redReasons.push(
      `중대한 사기 의심 신호가 확인됐어요: ${highSignals.map((signal) => signal.type).join(" · ")}`,
    );
  }
  if (failedRequired.length > 0) {
    redReasons.push(
      `필수 확인 항목을 통과하지 못했어요: ${failedRequired.map((item) => item.label).join(" · ")}`,
    );
  }
  if (!broker.registered) {
    redReasons.push("등록 자료에서 중개사무소를 확인하지 못했어요.");
  } else if (broker.sanctioned) {
    redReasons.push("중개사무소에 행정처분 이력이 있거나 처분이 진행 중이에요.");
  }

  if (redReasons.length > 0) {
    return {
      level: "RED",
      title: "이 상태로는 계약을 보류하세요",
      reasons: redReasons,
    };
  }

  const warningClauses = clauses.filter(
    (clause) => clause.riskLevel === "WARNING",
  );
  const mediumSignals = signals.filter(
    (signal) => signal.severity === "MEDIUM",
  );
  const unknownRequired = checklist.filter(
    (item) => item.required && item.status === "UNKNOWN",
  );
  const yellowReasons: string[] = [];

  if (warningClauses.length > 0) {
    yellowReasons.push(
      `계약 전에 조정할 경고 특약이 ${warningClauses.length}개 있어요.`,
    );
  }
  if (mediumSignals.length > 0) {
    yellowReasons.push(
      `추가 확인이 필요한 신호가 있어요: ${mediumSignals.map((signal) => signal.type).join(" · ")}`,
    );
  }
  if (price.level === "EXPENSIVE") {
    yellowReasons.push("월세가 주변의 비슷한 조건보다 15% 이상 높아요.");
  } else if (price.level === "SUSPICIOUSLY_CHEAP") {
    yellowReasons.push("월세가 주변 평균보다 25% 이상 낮아 미끼 매물 여부를 확인해야 해요.");
  }
  if (unknownRequired.length > 0) {
    yellowReasons.push(
      `아직 확인하지 못한 필수 항목이 있어요: ${unknownRequired.map((item) => item.label).join(" · ")}`,
    );
  }

  if (yellowReasons.length > 0) {
    return {
      level: "YELLOW",
      title: "진행은 가능하지만 아래 항목을 먼저 해결하세요",
      reasons: yellowReasons,
    };
  }

  return {
    level: "GREEN",
    title: "필수 확인 항목을 모두 통과했어요 · 안심 계약 준비 완료",
    reasons: [
      "위험·경고 특약과 중대한 사기 의심 신호가 발견되지 않았어요.",
      "필수 확인 항목에서 실패하거나 미확인된 항목이 없어요.",
    ],
  };
}
