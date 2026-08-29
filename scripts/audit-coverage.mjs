#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {auditCoverage, readJson} from "./scout-lib.mjs";

const args = process.argv.slice(2);
let requirementsFile;
let scouts;
let slots;
let out;
const inputs = [];
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--requirements") requirementsFile = args[++index];
  else if (arg === "--scouts") scouts = args[++index]?.split(",").filter(Boolean);
  else if (arg === "--slots") slots = args[++index]?.split(",").filter(Boolean);
  else if (arg === "--out") out = args[++index];
  else inputs.push(arg);
}
if (!inputs.length || (!requirementsFile && (!scouts?.length || !slots?.length))) {
  console.error("Usage: node scripts/audit-coverage.mjs (--requirements requirements.json | --scouts a,b --slots x,y) [--out audit.json] scout-result.json [...]");
  process.exit(1);
}
try {
  const requirements = requirementsFile ? readJson(requirementsFile) : {requiredScouts: scouts, requiredSlots: slots};
  const result = auditCoverage(inputs.map(readJson), requirements);
  const payload = JSON.stringify({schemaVersion: "1.0", generatedAt: new Date().toISOString(), ...result}, null, 2) + "\n";
  if (out) {
    fs.mkdirSync(path.dirname(path.resolve(out)), {recursive: true});
    fs.writeFileSync(out, payload, "utf8");
  } else process.stdout.write(payload);
  if (!result.ok) process.exitCode = 2;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
