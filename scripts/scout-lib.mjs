import fs from "node:fs";

export const COVERAGE_STATUSES = new Set(["checked_with_hits", "checked_empty", "access_failed"]);

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  return value;
}

function unique(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = JSON.stringify(stableValue(value));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeEvidence(left, right) {
  if (left === undefined) return structuredClone(right);
  if (right === undefined) return structuredClone(left);
  if (Array.isArray(left) && Array.isArray(right)) return unique([...left, ...right]);
  if (left && right && typeof left === "object" && typeof right === "object" && !Array.isArray(left) && !Array.isArray(right)) {
    const merged = structuredClone(left);
    for (const [key, value] of Object.entries(right)) merged[key] = mergeEvidence(merged[key], value);
    return merged;
  }
  return Object.is(left, right) ? left : unique([left, right]);
}

function scoutId(result) {
  return typeof result.scout === "string" ? result.scout : result.scout?.id;
}

export function validateScoutResult(result, label = "scout result") {
  if (!result || typeof result !== "object") return [`${label}: root must be an object`];
  const errors = [];
  if (!scoutId(result)) errors.push(`${label}: scout.id is required`);
  if (!Array.isArray(result.recallModes)) errors.push(`${label}: recallModes must be an array`);
  else {
    for (const mode of ["known_ecosystem", "open_world"]) {
      if (!result.recallModes.includes(mode)) errors.push(`${label}: recallModes must include ${mode}`);
    }
  }
  if (!result.window?.start || !result.window?.end) errors.push(`${label}: window.start/end are required`);
  if (!Array.isArray(result.coverage)) errors.push(`${label}: coverage must be an array`);
  if (!Array.isArray(result.candidates)) errors.push(`${label}: candidates must be an array`);
  const slots = new Set();
  for (const [index, cell] of (result.coverage || []).entries()) {
    if (!cell?.slot) errors.push(`${label}: coverage[${index}].slot is required`);
    if (!COVERAGE_STATUSES.has(cell?.status)) errors.push(`${label}: coverage[${index}].status is invalid`);
    if (cell?.slot && slots.has(cell.slot)) errors.push(`${label}: duplicate coverage slot ${cell.slot}`);
    slots.add(cell?.slot);
  }
  for (const [index, candidate] of (result.candidates || []).entries()) {
    if (!candidate?.id) errors.push(`${label}: candidates[${index}].id is required`);
    if (!candidate?.title) errors.push(`${label}: candidates[${index}].title is required`);
  }
  return errors;
}

const identityFields = ["title", "organization", "eventDate", "event_date", "eventType", "event_type", "artifactIdentity", "artifact_identity", "releaseMaturity", "release_maturity", "maturity"];
const unionFields = ["topics", "sources", "systemLayers", "system_layers", "aliases"];

export function mergeScoutResults(results) {
  const errors = results.flatMap((result, index) => validateScoutResult(result, `result[${index}]`));
  if (errors.length) return {candidates: [], conflicts: [], errors};
  const byId = new Map();
  const conflicts = [];
  for (const result of results) {
    const owner = scoutId(result);
    for (const candidate of result.candidates) {
      if (!byId.has(candidate.id)) {
        byId.set(candidate.id, {...structuredClone(candidate), scoutIds: [owner]});
        continue;
      }
      const merged = byId.get(candidate.id);
      merged.scoutIds = unique([...merged.scoutIds, owner]);
      for (const field of unionFields) {
        if (merged[field] !== undefined || candidate[field] !== undefined) merged[field] = unique([...(merged[field] || []), ...(candidate[field] || [])]);
      }
      merged.evidence = mergeEvidence(merged.evidence, candidate.evidence);
      for (const field of identityFields) {
        if (merged[field] !== undefined && candidate[field] !== undefined && merged[field] !== candidate[field]) {
          conflicts.push({id: candidate.id, field, values: unique([merged[field], candidate[field]]), scouts: unique([...merged.scoutIds, owner])});
        } else if (merged[field] === undefined && candidate[field] !== undefined) merged[field] = structuredClone(candidate[field]);
      }
      for (const [key, value] of Object.entries(candidate)) {
        if (["id", "evidence", ...unionFields, ...identityFields].includes(key)) continue;
        if (merged[key] === undefined) merged[key] = structuredClone(value);
      }
    }
  }
  return {candidates: [...byId.values()], conflicts: unique(conflicts), errors: []};
}

export function auditCoverage(results, requirements) {
  const errors = results.flatMap((result, index) => validateScoutResult(result, `result[${index}]`));
  const requiredScouts = unique(requirements?.requiredScouts || []);
  const requiredSlots = unique(requirements?.requiredSlots || []);
  if (!requiredScouts.length) errors.push("requirements.requiredScouts must not be empty");
  if (!requiredSlots.length) errors.push("requirements.requiredSlots must not be empty");
  const indexed = new Map();
  for (const result of results) {
    const owner = scoutId(result);
    for (const cell of result.coverage || []) indexed.set(`${owner}\u0000${cell.slot}`, cell);
  }
  const cells = [];
  const missing = [];
  const failed = [];
  for (const scout of requiredScouts) {
    for (const slot of requiredSlots) {
      const cell = indexed.get(`${scout}\u0000${slot}`);
      const entry = {scout, slot, status: cell?.status || "missing", ...(cell?.note ? {note: cell.note} : {})};
      cells.push(entry);
      if (!cell) missing.push(entry);
      if (cell?.status === "access_failed") failed.push(entry);
    }
  }
  const closingRequired = missing.length > 0 || failed.length > 0;
  return {
    ok: errors.length === 0 && !closingRequired,
    closingRequired,
    summary: {required: cells.length, complete: cells.length - missing.length, missing: missing.length, accessFailed: failed.length},
    cells,
    gaps: [...missing, ...failed],
    errors,
  };
}
