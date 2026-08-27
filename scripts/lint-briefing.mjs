import fs from "node:fs";
import path from "node:path";
import {readEdition, validateEdition} from "./briefing-lib.mjs";

const input = path.resolve(process.argv[2] || "edition.json");
const edition = readEdition(input);
const result = validateEdition(edition);
const forbidden = ["对团队的建议", "下一窗口观察清单", "来源与核验", "技术趋势"];
for (const item of edition.items || []) {
  const text = [item.point,item.evidence,item.boundary,item.use].join(" ");
  for (const phrase of forbidden) if (text.includes(phrase)) result.errors.push(`${item.id} 含默认禁用表述：${phrase}`);
}
for (const warning of result.warnings) console.warn(`warning: ${warning}`);
if (result.errors.length) {
  for (const error of result.errors) console.error(`error: ${error}`);
  process.exit(1);
}
console.log(`ok: ${edition.items.length} items, ${fs.statSync(input).size} bytes`);
