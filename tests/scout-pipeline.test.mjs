import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {auditCoverage, mergeScoutResults, validateScoutResult} from "../scripts/scout-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function result(scout, status = "checked_with_hits", candidate = {}) {
  return {
    schemaVersion: "1.0",
    scout: {id: scout},
    recallModes: ["known_ecosystem", "open_world"],
    window: {start: "2026-08-15", end: "2026-08-29"},
    coverage: [{slot: "model_or_api_release", status}, {slot: "paper_or_technical_report", status: "checked_empty"}],
    candidates: status === "checked_with_hits" ? [{id: "shared-event", title: "Shared event", ...candidate}] : [],
  };
}

test("merge keeps cross-scout intersections and unions topics, sources and evidence", () => {
  const first = result("model_architecture_and_artifacts", "checked_with_hits", {
    eventDate: "2026-08-20",
    topics: ["model_architecture"],
    systemLayers: ["models_and_architecture"],
    aliases: ["shared-model"],
    sources: [{url: "https://example.com/model"}],
    evidence: {technicalDelta: ["new architecture"]},
  });
  const second = result("kernels_compilers_and_operators", "checked_with_hits", {
    eventDate: "2026-08-20",
    topics: ["kernels"],
    systemLayers: ["kernels_compilers_and_operators"],
    aliases: ["shared-kernel"],
    sources: [{url: "https://example.com/kernel"}],
    evidence: {technicalDelta: ["fused operator"], reportedMetrics: ["1.2x"]},
  });
  const merged = mergeScoutResults([first, second]);
  assert.deepEqual(merged.errors, []);
  assert.deepEqual(merged.conflicts, []);
  assert.equal(merged.candidates.length, 1);
  assert.deepEqual(merged.candidates[0].scoutIds, ["model_architecture_and_artifacts", "kernels_compilers_and_operators"]);
  assert.deepEqual(merged.candidates[0].topics, ["model_architecture", "kernels"]);
  assert.deepEqual(merged.candidates[0].systemLayers, ["models_and_architecture", "kernels_compilers_and_operators"]);
  assert.deepEqual(merged.candidates[0].aliases, ["shared-model", "shared-kernel"]);
  assert.equal(merged.candidates[0].sources.length, 2);
  assert.deepEqual(merged.candidates[0].evidence.technicalDelta, ["new architecture", "fused operator"]);
});

test("merge surfaces identity conflicts without discarding either scout", () => {
  const merged = mergeScoutResults([
    result("model_architecture_and_artifacts", "checked_with_hits", {eventDate: "2026-08-20", artifactIdentity: "repo@v1", releaseMaturity: "preview"}),
    result("runtime_serving_and_scheduling", "checked_with_hits", {eventDate: "2026-08-21", title: "Different title", artifactIdentity: "repo@v2", releaseMaturity: "ga"}),
  ]);
  assert.deepEqual(merged.conflicts.map(({field}) => field).sort(), ["artifactIdentity", "eventDate", "releaseMaturity", "title"]);
  assert.deepEqual(merged.candidates[0].scoutIds, ["model_architecture_and_artifacts", "runtime_serving_and_scheduling"]);
});

test("coverage audit fails missing and access-failed cells but accepts checked_empty", () => {
  const requirements = {requiredScouts: ["model_architecture_and_artifacts", "kernels_compilers_and_operators"], requiredSlots: ["model_or_api_release", "paper_or_technical_report"]};
  const models = result("model_architecture_and_artifacts", "checked_empty");
  models.coverage[1].status = "access_failed";
  const audit = auditCoverage([models], requirements);
  assert.equal(audit.ok, false);
  assert.equal(audit.closingRequired, true);
  assert.equal(audit.summary.missing, 2);
  assert.equal(audit.summary.accessFailed, 1);
  const clean = auditCoverage([result("model_architecture_and_artifacts", "checked_empty"), result("kernels_compilers_and_operators", "checked_empty")], requirements);
  assert.equal(clean.ok, true);
  assert.equal(clean.closingRequired, false);
});

test("validator requires both recall modes", () => {
  const missingOpenWorld = result("model_architecture_and_artifacts");
  missingOpenWorld.recallModes = ["known_ecosystem"];
  assert.match(validateScoutResult(missingOpenWorld).join("\n"), /must include open_world/);

  const missingArray = result("model_architecture_and_artifacts");
  delete missingArray.recallModes;
  assert.match(validateScoutResult(missingArray).join("\n"), /recallModes must be an array/);
});

test("validator rejects duplicate and unknown coverage states", () => {
  const invalid = result("model_architecture_and_artifacts");
  invalid.coverage.push({slot: "model_or_api_release", status: "smoke_checked"});
  assert.match(validateScoutResult(invalid).join("\n"), /invalid|duplicate/);
});

test("merge CLI writes output and returns 2 for unresolved conflicts", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "scout-pipeline-"));
  const one = path.join(dir, "one.json");
  const two = path.join(dir, "two.json");
  const out = path.join(dir, "merged.json");
  fs.writeFileSync(one, JSON.stringify(result("model_architecture_and_artifacts", "checked_with_hits", {eventDate: "2026-08-20"})), "utf8");
  fs.writeFileSync(two, JSON.stringify(result("runtime_serving_and_scheduling", "checked_with_hits", {eventDate: "2026-08-21"})), "utf8");
  try {
    const run = spawnSync(process.execPath, [path.join(root, "scripts", "merge-candidates.mjs"), "--out", out, one, two], {encoding: "utf8"});
    assert.equal(run.status, 2, run.stderr);
    assert.equal(JSON.parse(fs.readFileSync(out, "utf8")).conflicts.length, 1);
  } finally {
    fs.rmSync(dir, {recursive: true, force: true});
  }
});
