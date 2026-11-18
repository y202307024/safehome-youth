import brokerData from "@/data/brokers.json";
import type { BrokerCheck } from "@/types";

interface BrokerRecord {
  name: string;
  regNo: string;
  status: string;
  sanctionStart: string | null;
  sanctionEnd: string | null;
}

const brokers = brokerData as BrokerRecord[];

function normalizeOfficeName(name: string): string {
  return name.replace(/\s+/g, "");
}

export function checkBroker(officeName: string): BrokerCheck {
  const normalizedInput = normalizeOfficeName(officeName);

  if (normalizedInput === "") {
    return {
      officeName,
      registered: false,
      status: "미등록",
      sanctioned: false,
    };
  }

  const exactMatch = brokers.find(
    (broker) => normalizeOfficeName(broker.name) === normalizedInput,
  );
  const broker =
    exactMatch ??
    brokers.find((candidate) => {
      const normalizedCandidate = normalizeOfficeName(candidate.name);
      return (
        normalizedCandidate.includes(normalizedInput) ||
        normalizedInput.includes(normalizedCandidate)
      );
    });

  if (!broker) {
    return {
      officeName,
      registered: false,
      status: "미등록",
      sanctioned: false,
    };
  }

  return {
    officeName: broker.name,
    registered: true,
    status: broker.status,
    sanctioned:
      broker.status === "업무정지" ||
      broker.sanctionStart !== null ||
      broker.sanctionEnd !== null,
  };
}
