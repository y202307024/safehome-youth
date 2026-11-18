import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import iconv from "iconv-lite";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(SCRIPT_DIR, "..");
const SOURCE_NAME = "서울특별시_전월세가_2025.csv";
const INPUT_PATH = path.join(SCRIPT_DIR, "raw", SOURCE_NAME);
const OUTPUT_PATH = path.join(PROJECT_DIR, "data", "rent_gwanak.json");
const ENCODING = "euc-kr";
const AREA_BAND_SIZE = 2;

function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      fields.push(field);
      field = "";
    } else {
      field += character;
    }
  }

  if (quoted) {
    throw new Error("닫히지 않은 CSV 따옴표가 있습니다.");
  }

  fields.push(field);
  return fields;
}

function requireColumns(header, columnNames) {
  const indexes = Object.fromEntries(
    columnNames.map((name) => [name, header.indexOf(name)]),
  );
  const missing = columnNames.filter((name) => indexes[name] === -1);

  if (missing.length > 0) {
    throw new Error(`필수 컬럼이 없습니다: ${missing.join(", ")}`);
  }

  return indexes;
}

function roundToOneDecimal(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

async function buildRentData() {
  const decodedInput = fs
    .createReadStream(INPUT_PATH)
    .pipe(iconv.decodeStream(ENCODING));
  const lines = readline.createInterface({
    input: decodedInput,
    crlfDelay: Infinity,
  });

  let columns;
  let lineNumber = 0;
  const groups = new Map();

  for await (const line of lines) {
    lineNumber += 1;

    if (lineNumber === 1) {
      const header = parseCsvLine(line).map((name) =>
        name.replace(/^\uFEFF/, "").trim(),
      );
      columns = requireColumns(header, [
        "자치구명",
        "법정동명",
        "전월세구분",
        "임대면적",
        "보증금(만원)",
        "임대료(만원)",
        "건물용도",
      ]);
      continue;
    }

    if (line.trim() === "") continue;

    const row = parseCsvLine(line);
    if (
      row[columns["자치구명"]] !== "관악구" ||
      row[columns["전월세구분"]] !== "월세"
    ) {
      continue;
    }

    const area = Number(row[columns["임대면적"]]);
    const deposit = Number(row[columns["보증금(만원)"]]);
    const rent = Number(row[columns["임대료(만원)"]]);

    if (
      !Number.isFinite(area) ||
      !Number.isFinite(deposit) ||
      !Number.isFinite(rent) ||
      deposit <= 0
    ) {
      continue;
    }

    const dong = row[columns["법정동명"]];
    const housingType = row[columns["건물용도"]];
    const areaMin = Math.floor(area / AREA_BAND_SIZE) * AREA_BAND_SIZE;
    const areaMax = areaMin + AREA_BAND_SIZE;
    const key = JSON.stringify([dong, housingType, areaMin]);
    const group = groups.get(key) ?? {
      dong,
      housingType,
      areaMin,
      areaMax,
      count: 0,
      rentSum: 0,
      depositSum: 0,
    };

    group.count += 1;
    group.rentSum += rent;
    group.depositSum += deposit;
    groups.set(key, group);
  }

  const data = [...groups.values()]
    .sort(
      (left, right) =>
        left.dong.localeCompare(right.dong, "ko") ||
        left.housingType.localeCompare(right.housingType, "ko") ||
        left.areaMin - right.areaMin,
    )
    .map(({ rentSum, depositSum, ...group }) => ({
      dong: group.dong,
      housingType: group.housingType,
      areaBand: `${group.areaMin}-${group.areaMax}㎡`,
      areaMin: group.areaMin,
      areaMax: group.areaMax,
      count: group.count,
      avgRent: roundToOneDecimal(rentSum / group.count),
      avgDeposit: roundToOneDecimal(depositSum / group.count),
    }));

  return {
    source: SOURCE_NAME.replace(/\.csv$/i, ""),
    builtAt: new Date().toISOString(),
    data,
  };
}

const result = await buildRentData();
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(`${OUTPUT_PATH} 생성 완료: ${result.data.length}개 집계 구간`);
