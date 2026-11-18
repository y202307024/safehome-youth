import grantData from "@/data/grants.json";
import type {
  ContractSummary,
  Grant,
  MatchedGrant,
  UserInput,
} from "@/types";

const grants = grantData as Grant[];
const ELIGIBILITY_DATE = "2026-11-18";

export function matchGrants(
  user: UserInput,
  s: ContractSummary,
): MatchedGrant[] {
  return grants.map((grant) => {
    const reasons: string[] = [];

    if (user.age < grant.ageMin || user.age > grant.ageMax) {
      reasons.push(`나이 기준(만 ${grant.ageMin}~${grant.ageMax}세) 불충족`);
    }

    if (grant.incomeMax !== null && user.income > grant.incomeMax) {
      reasons.push(`연소득 기준(${grant.incomeMax}만원 이하) 초과`);
    }

    if (grant.depositMax !== null && s.deposit > grant.depositMax) {
      reasons.push(`보증금 기준(${grant.depositMax}만원 이하) 초과`);
    }

    if (grant.rentMax !== null && s.monthlyRent > grant.rentMax) {
      reasons.push(`월세 기준(${grant.rentMax}만원 이하) 초과`);
    }

    if (!grant.regions.includes("전국") && !grant.regions.includes(user.region)) {
      reasons.push(`지역 기준(${grant.regions.join("·")}) 불충족`);
    }

    if (!grant.jobs.includes("전체") && !grant.jobs.includes(user.job)) {
      reasons.push(`직업 기준(${grant.jobs.join("·")}) 불충족`);
    }

    if (grant.deadline !== "상시" && grant.deadline < ELIGIBILITY_DATE) {
      reasons.push(`신청 마감일(${grant.deadline}) 경과`);
    }

    return {
      ...grant,
      eligible: reasons.length === 0,
      reasons,
    };
  });
}
