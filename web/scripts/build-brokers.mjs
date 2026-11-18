import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import iconv from "iconv-lite";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.resolve(SCRIPT_DIR, "..");
const INPUT_PATH = path.join(
  SCRIPT_DIR,
  "raw",
  "서울시 부동산 중개업소 정보.csv",
);
const OUTPUT_PATH = path.join(PROJECT_DIR, "data", "brokers.json");
const ENCODING = "euc-kr";

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

async function buildBrokerData() {
  const decodedInput = fs
    .createReadStream(INPUT_PATH)
    .pipe(iconv.decodeStream(ENCODING));
  const lines = readline.createInterface({
    input: decodedInput,
    crlfDelay: Infinity,
  });

  let columns;
  let lineNumber = 0;
  const brokers = [];

  for await (const line of lines) {
    lineNumber += 1;

    if (lineNumber === 1) {
      const header = parseCsvLine(line).map((name) =>
        name.replace(/^\uFEFF/, "").trim(),
      );
      columns = requireColumns(header, [
        "자치구명",
        "중개업등록번호",
        "사업자상호",
        "상태구분",
      ]);
      continue;
    }

    if (line.trim() === "") continue;

    const row = parseCsvLine(line);
    if (row[columns["자치구명"]] !== "관악구") continue;

    brokers.push({
      name: row[columns["사업자상호"]],
      regNo: row[columns["중개업등록번호"]],
      status: row[columns["상태구분"]],
      // 원본 CSV에 행정처분 시작일과 종료일 컬럼이 없다.
      sanctionStart: null,
      sanctionEnd: null,
    });
  }

  return brokers;
}

const result = await buildBrokerData();
fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(`${OUTPUT_PATH} 생성 완료: ${result.length}개 중개업소`);
