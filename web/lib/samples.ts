import type { AnalyzeResponse, PrecheckAnswers, SampleId } from "@/types";

export const SAMPLE_MONTHLY_RENTS = {
  green: 46.8,
  yellow: 61.5,
  red: 32.7,
} as const satisfies Record<SampleId, number>;

const AFTER_CONTRACT_TODOS = [
  "잔금 지급 직전 등기사항증명서를 다시 확인하세요.",
  "주택 인도와 전입신고를 마친 뒤 확정일자를 받으세요.",
  "계약서, 이체확인증, 중개대상물 확인·설명서를 보관하세요.",
];

const answers: Record<SampleId, PrecheckAnswers> = {
  green: {
    ownerMatches: true,
    hasTrustOrSeizure: false,
    mortgage: 0,
    housePrice: 22000,
    payToOwnerAccount: true,
    isAgentContract: false,
    taxCertChecked: true,
    buildingIsResidential: true,
  },
  yellow: {
    ownerMatches: true,
    hasTrustOrSeizure: false,
    mortgage: 3000,
    housePrice: 22000,
    payToOwnerAccount: true,
    isAgentContract: false,
    taxCertChecked: null,
    buildingIsResidential: true,
  },
  red: {
    ownerMatches: false,
    hasTrustOrSeizure: true,
    mortgage: 30000,
    housePrice: 35000,
    payToOwnerAccount: false,
    isAgentContract: true,
    taxCertChecked: null,
    buildingIsResidential: true,
  },
};

export const SAMPLES: Record<
  SampleId,
  { text: string; answers: PrecheckAnswers; fallback: AnalyzeResponse }
> = {
  green: {
    text: `주택임대차계약서
1. 소재지: 서울특별시 관악구 신림동 1421-18 새봄빌라 302호
2. 임대할 부분: 다세대주택 302호 전부, 전용면적 20.00㎡
3. 보증금: 금 일천만원정(₩10,000,000)
4. 월세: 금 ${SAMPLE_MONTHLY_RENTS.green}만원정, 매월 20일 임대인 명의 계좌로 지급
5. 관리비: 월 5만원(공용전기, 수도, 청소비 포함)
6. 임대차 기간: 2026년 11월 20일부터 2027년 11월 19일까지
7. 임대인: 김정우 / 임차인: 김새봄
8. 중개사무소: 신림안심공인중개사사무소 / 대표 공인중개사 이수진
9. 특약사항
  가. 임차인은 실내에서 흡연하지 않는다.
  나. 임차인은 임대인의 사전 서면 동의 없이 반려동물을 사육하지 않는다.
  다. 임대인은 계약 종료와 목적물 인도 후 확인을 거쳐 보증금을 반환한다.`,
    answers: answers.green,
    fallback: {
      summary: {
        address: "서울특별시 관악구 신림동 1421-18 새봄빌라 302호",
        dong: "신림동",
        houseType: "다세대",
        area: 20,
        deposit: 1000,
        monthlyRent: SAMPLE_MONTHLY_RENTS.green,
        maintenanceFee: 5,
        contractPeriod: "2026-11-20 ~ 2027-11-19",
        landlordName: "김정우",
        brokerOffice: "신림안심공인중개사사무소",
      },
      clauses: [
        {
          originalText: "임차인은 실내에서 흡연하지 않는다.",
          riskLevel: "SAFE",
          reason: "목적물의 통상적인 사용·관리 범위에서 정한 조항입니다.",
          legalBasis: "당사자 간 합의 사항",
          recommendedDefense: "흡연으로 발생한 실제 손해에 한해 책임 범위를 정할 수 있습니다.",
        },
        {
          originalText: "임대인의 사전 서면 동의 없이 반려동물을 사육하지 않는다.",
          riskLevel: "SAFE",
          reason: "계약 전에 공개된 통상적인 사용 제한 조항입니다.",
          legalBasis: "당사자 간 합의 사항",
          recommendedDefense: "위반 시 책임을 실제 발생한 손해 범위로 한정합니다.",
        },
      ],
      fraudSignals: [],
      priceCheck: {
        avgRent: 46.8,
        avgDeposit: 6659.4,
        sampleCount: 451,
        diffPercent: 0,
        level: "FAIR",
      },
      brokerCheck: {
        officeName: "신림안심공인중개사사무소",
        registered: true,
        status: "영업중",
        sanctioned: false,
      },
      checklist: [
        { id: "owner", label: "등기부 소유자와 임대인 일치", required: true, status: "PASS", tip: "잔금 직전 다시 확인하세요." },
        { id: "rights", label: "신탁·압류 등 권리 제한 없음", required: true, status: "PASS", tip: "최신 등기사항증명서를 보관하세요." },
        { id: "account", label: "소유자 명의 계좌로 지급", required: true, status: "PASS", tip: "이체확인증을 보관하세요." },
        { id: "building", label: "주택 용도와 위반건축물 여부 확인", required: true, status: "PASS", tip: "건축물대장을 보관하세요." },
      ],
      grants: [],
      verdict: {
        level: "GREEN",
        title: "필수 확인 항목을 모두 통과했어요 · 안심 계약 준비 완료",
        reasons: [
          "등기·계좌·건축물 필수 확인 항목을 통과했습니다.",
          "위험 특약과 사기 의심 신호가 발견되지 않았습니다.",
        ],
      },
      afterContractTodos: [...AFTER_CONTRACT_TODOS],
      usedFallback: true,
    },
  },
  yellow: {
    text: `주택임대차계약서
1. 소재지: 서울특별시 관악구 봉천동 1673-21 관악드림오피스텔 706호
2. 임대할 부분: 오피스텔 706호 전부, 전용면적 23.00㎡
3. 보증금: 금 일천만원정(₩10,000,000)
4. 월세: 금 ${SAMPLE_MONTHLY_RENTS.yellow}만원정, 매월 25일 임대인 명의 계좌로 지급
5. 관리비: 월 8만원(공용전기, 수도, 인터넷 포함)
6. 임대차 기간: 2026년 12월 1일부터 2027년 11월 30일까지
7. 임대인: 박영희 / 임차인: 김새봄
8. 중개사무소: 봉천우리공인중개사사무소 / 대표 공인중개사 정민호
9. 특약사항
  가. 계약 종료 시 임차인은 입주 당시 상태로 완전히 원상복구한다.
  나. 임차인이 계약기간 중 퇴거하면 월세 3개월분을 위약금으로 지급한다.
  다. 임차인은 잔금 전 임대인의 국세·지방세 완납증명서를 확인하기로 한다.`,
    answers: answers.yellow,
    fallback: {
      summary: {
        address: "서울특별시 관악구 봉천동 1673-21 관악드림오피스텔 706호",
        dong: "봉천동",
        houseType: "오피스텔",
        area: 23,
        deposit: 1000,
        monthlyRent: SAMPLE_MONTHLY_RENTS.yellow,
        maintenanceFee: 8,
        contractPeriod: "2026-12-01 ~ 2027-11-30",
        landlordName: "박영희",
        brokerOffice: "봉천우리공인중개사사무소",
      },
      clauses: [
        {
          originalText: "입주 당시 상태로 완전히 원상복구한다.",
          riskLevel: "WARNING",
          reason: "통상 손모까지 임차인이 부담하는지 범위가 모호합니다.",
          legalBasis: "민법 제654조에 따라 준용되는 제615조 및 통상 손모 관련 법리",
          recommendedDefense: "임차인의 고의·과실로 생긴 훼손만 원상복구하고 통상적인 노후·마모는 제외한다.",
        },
        {
          originalText: "계약기간 중 퇴거하면 월세 3개월분을 위약금으로 지급한다.",
          riskLevel: "WARNING",
          reason: "실제 손해와 무관하게 월세 3개월분을 부과해 과다한 위약금이 될 수 있습니다.",
          legalBasis: "민법 제398조 제2항(손해배상 예정액의 감액)",
          recommendedDefense: "중도해지 배상액은 새 임차인 입주 전까지의 실제 공실 손해와 중개보수 범위로 제한한다.",
        },
      ],
      fraudSignals: [],
      priceCheck: {
        avgRent: 52.1,
        avgDeposit: 5745,
        sampleCount: 1984,
        diffPercent: 18.1,
        level: "EXPENSIVE",
      },
      brokerCheck: {
        officeName: "봉천우리공인중개사사무소",
        registered: true,
        status: "영업중",
        sanctioned: false,
      },
      checklist: [
        { id: "owner", label: "등기부 소유자와 임대인 일치", required: true, status: "PASS", tip: "잔금 직전 다시 확인하세요." },
        { id: "tax", label: "국세·지방세 완납증명서 확인", required: true, status: "UNKNOWN", tip: "잔금 전에 최신 증명서를 직접 확인하세요." },
        { id: "account", label: "소유자 명의 계좌로 지급", required: true, status: "PASS", tip: "이체확인증을 보관하세요." },
        { id: "building", label: "주택 용도와 위반건축물 여부 확인", required: true, status: "PASS", tip: "건축물대장을 보관하세요." },
      ],
      grants: [],
      verdict: {
        level: "YELLOW",
        title: "진행은 가능하지만 아래 항목을 먼저 해결하세요",
        reasons: [
          "원상복구와 중도해지 위약금 특약을 조정해야 합니다.",
          "세금 완납 여부가 미확인이고 월세가 비교 시세보다 18.1% 높습니다.",
        ],
      },
      afterContractTodos: [...AFTER_CONTRACT_TODOS],
      usedFallback: true,
    },
  },
  red: {
    text: `주택임대차계약서
1. 소재지: 서울특별시 관악구 봉천동 923-7 한빛하우스 201호
2. 임대할 부분: 다가구주택 201호 전부, 전용면적 22.00㎡
3. 보증금: 금 오천만원정(₩50,000,000)
4. 월세: 금 ${SAMPLE_MONTHLY_RENTS.red}만원정, 매월 10일 대리인 이현수 명의 계좌로 지급
5. 관리비: 월 6만원(공용전기, 수도, 청소비 포함)
6. 임대차 기간: 2026년 11월 25일부터 2027년 11월 24일까지
7. 등기상 소유자: 대한신탁 주식회사(신탁등기 있음) / 임대인: 박도현 / 대리인: 이현수 / 임차인: 김새봄
8. 중개사무소: 새출발부동산 / 중개담당 강민석
9. 특약사항
  가. 보일러, 배관 누수, 전기시설을 포함한 모든 수리비는 원인과 관계없이 임차인이 부담한다.
  나. 전세보증금반환보증 가입이 거절되더라도 임차인은 계약을 해제할 수 없고 계약금은 반환하지 않는다.
  다. 임대인은 잔금 지급 전이라도 이 주택에 추가 근저당권을 설정할 수 있으며 임차인은 이의를 제기하지 않는다.
  라. 본 계약은 임대인 박도현의 대리인 이현수가 체결하며 신탁회사 동의서는 추후 제출한다.`,
    answers: answers.red,
    fallback: {
      summary: {
        address: "서울특별시 관악구 봉천동 923-7 한빛하우스 201호",
        dong: "봉천동",
        houseType: "다가구",
        area: 22,
        deposit: 5000,
        monthlyRent: SAMPLE_MONTHLY_RENTS.red,
        maintenanceFee: 6,
        contractPeriod: "2026-11-25 ~ 2027-11-24",
        landlordName: "박도현(대리인 이현수)",
        brokerOffice: "새출발부동산",
      },
      clauses: [
        {
          originalText: "보일러, 배관 누수, 전기시설을 포함한 모든 수리비는 원인과 관계없이 임차인이 부담한다.",
          riskLevel: "DANGER",
          reason: "임대인이 부담할 목적물 유지·수선 의무까지 전부 임차인에게 넘깁니다.",
          legalBasis: "민법 제623조(임대인의 목적물 유지 의무)",
          recommendedDefense: "임차인의 고의·과실로 생긴 소모품 및 경미한 수리를 제외한 주요 설비 수선은 임대인이 부담한다.",
        },
        {
          originalText: "보증 가입이 거절되더라도 계약을 해제할 수 없고 계약금은 반환하지 않는다.",
          riskLevel: "DANGER",
          reason: "보증 가입 불가 위험을 임차인에게만 전가하고 계약금 반환까지 차단합니다.",
          legalBasis: "보증 가입 거절 사유와 계약 해제의 관계는 관련 법리 확인 필요",
          recommendedDefense: "임차인의 귀책 없이 반환보증 가입이 거절되면 계약은 무효로 하고 지급한 금원을 즉시 전액 반환한다.",
        },
        {
          originalText: "임대인은 잔금 지급 전 추가 근저당권을 설정할 수 있다.",
          riskLevel: "DANGER",
          reason: "잔금 직전 담보권이 늘어나면 임차보증금 회수 순위와 가능성이 악화될 수 있습니다.",
          legalBasis: "주택임대차보호법 제3조(대항력), 구체적 우선순위는 관련 법리 확인 필요",
          recommendedDefense: "계약일부터 전입신고 다음 날까지 소유권 이전, 근저당권 등 새로운 권리 설정을 하지 않으며 위반 시 계약을 해제하고 지급금을 반환한다.",
        },
      ],
      fraudSignals: [
        { type: "OWNER_MISMATCH", severity: "HIGH", message: "등기상 소유자와 계약상 임대인이 일치하지 않습니다.", action: "신탁원부와 신탁회사 임대 동의서를 확인하기 전에는 지급하지 마세요." },
        { type: "TRUST_REGISTRATION", severity: "HIGH", message: "신탁등기가 있는데 신탁회사 동의서를 추후 제출한다고 적혀 있습니다.", action: "등기소에서 신탁원부를 발급받고 적법한 임대 권한을 확인하세요." },
        { type: "AGENT_ACCOUNT", severity: "HIGH", message: "대리 계약이며 지급 계좌도 소유자가 아닌 대리인 명의입니다.", action: "인감증명서가 첨부된 위임장과 본인 의사를 확인하고 적법한 계좌로만 지급하세요." },
      ],
      priceCheck: {
        avgRent: 46.7,
        avgDeposit: 2521.3,
        sampleCount: 5326,
        diffPercent: -30,
        level: "SUSPICIOUSLY_CHEAP",
      },
      brokerCheck: {
        officeName: "새출발부동산",
        registered: false,
        status: "미등록",
        sanctioned: false,
      },
      checklist: [
        { id: "owner", label: "등기부 소유자와 임대인 일치", required: true, status: "FAIL", tip: "적법한 임대 권한을 서류로 확인하세요." },
        { id: "rights", label: "신탁·압류 등 권리 제한 없음", required: true, status: "FAIL", tip: "신탁원부와 우선수익자 동의 여부를 확인하세요." },
        { id: "account", label: "소유자 명의 계좌로 지급", required: true, status: "FAIL", tip: "대리인 개인 계좌로 지급하지 마세요." },
        { id: "debt", label: "선순위 채권과 보증금 비율 확인", required: true, status: "FAIL", tip: "근저당과 보증금 합계가 집값의 100%입니다." },
      ],
      grants: [],
      verdict: {
        level: "RED",
        title: "이 상태로는 계약을 보류하세요",
        reasons: [
          "수선비 전가, 보증 가입 거절, 추가 근저당 허용 특약이 모두 위험합니다.",
          "소유자 불일치·신탁·대리인 계좌·미등록 중개사 신호가 확인됐습니다.",
          "근저당과 보증금 합계가 집값의 80%를 초과합니다.",
        ],
      },
      afterContractTodos: [...AFTER_CONTRACT_TODOS],
      usedFallback: true,
    },
  },
};
