import rentData from "@/data/rent_gwanak.json";
import type { ContractSummary, PriceCheck } from "@/types";

interface RentGroup {
  dong: string;
  housingType: string;
  areaMin: number;
  areaMax: number;
  count: number;
  avgRent: number;
  avgDeposit: number;
}

const AREA_TOLERANCE = 4;

const HOUSING_TYPE_MAP: Record<ContractSummary["houseType"], string[]> = {
  다세대: ["연립다세대"],
  다가구: ["단독다가구"],
  오피스텔: ["오피스텔"],
  원룸: ["단독다가구"],
  기타: ["기타"],
};

function roundToOneDecimal(value: number): number {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

export function checkPrice(s: ContractSummary): PriceCheck {
  const sourceTypes = HOUSING_TYPE_MAP[s.houseType];
  const groups = (rentData.data as RentGroup[]).filter((group) => {
    const areaMidpoint = (group.areaMin + group.areaMax) / 2;

    return (
      group.dong === s.dong &&
      sourceTypes.includes(group.housingType) &&
      Math.abs(areaMidpoint - s.area) <= AREA_TOLERANCE
    );
  });

  const sampleCount = groups.reduce((sum, group) => sum + group.count, 0);

  if (sampleCount === 0) {
    return {
      avgRent: 0,
      avgDeposit: 0,
      sampleCount: 0,
      diffPercent: 0,
      level: "NO_DATA",
    };
  }

  const avgRent =
    groups.reduce((sum, group) => sum + group.avgRent * group.count, 0) /
    sampleCount;
  const avgDeposit =
    groups.reduce((sum, group) => sum + group.avgDeposit * group.count, 0) /
    sampleCount;
  const diffPercent =
    avgRent > 0 ? ((s.monthlyRent - avgRent) / avgRent) * 100 : 0;

  let level: PriceCheck["level"] = "FAIR";

  if (sampleCount < 5 || avgRent <= 0) {
    level = "NO_DATA";
  } else if (diffPercent >= 15) {
    level = "EXPENSIVE";
  } else if (diffPercent <= -25) {
    level = "SUSPICIOUSLY_CHEAP";
  }

  return {
    avgRent: roundToOneDecimal(avgRent),
    avgDeposit: roundToOneDecimal(avgDeposit),
    sampleCount,
    diffPercent: roundToOneDecimal(diffPercent),
    level,
  };
}
