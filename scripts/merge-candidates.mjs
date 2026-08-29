#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {mergeScoutResults, readJson} from "./scout-lib.mjs";

const args = process.argv.slice(2);
let out;
let allowConflicts = false;
const inputs = [];
for (let index = 0; index < args.length; index += 1) {
  if (args[index] === "--out") out = args[++index];
  else if (args[index] === "--allow-conflicts") allowConflicts = true;
  else inputs.push(args[index]);
}
if (!inputs.length || (args.includes("--out") && !out)) {
  console.error("Usage: node scripts/merge-candidates.mjs [--out merged.json] [--allow-conflicts] scout-result.json [...]");
  process.exit(1);
}
try {
  const result = mergeScoutResults(inputs.map(readJson));
  const payload = JSON.stringify({schemaVersion: "1.0", generatedAt: new Date().toISOString(), ...result}, null, 2) + "\n";
  if (out) {
    fs.mkdirSync(path.dirname(path.resolve(out)), {recursive: true});
    fs.writeFileSync(out, payload, "utf8");
  } else process.stdout.write(payload);
  if (result.errors.length) process.exitCode = 1;
  else if (result.conflicts.length && !allowConflicts) process.exitCode = 2;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
