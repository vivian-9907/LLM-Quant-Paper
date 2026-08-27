import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {spawnSync} from "node:child_process";
import test from "node:test";
import {fileURLToPath} from "node:url";
import {readEdition, validateEdition} from "../scripts/briefing-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixture = path.join(root, "tests", "fixtures", "edition.json");

test("GLM-5.3-Flash recall fixture passes editorial validation", () => {
  const result = validateEdition(readEdition(fixture));
  assert.deepEqual(result.errors, []);
});

test("renderer creates one HTML with quick and full sections", () => {
  const output = path.join(os.tmpdir(), `briefing-${process.pid}.html`);
  const run = spawnSync(process.execPath, [path.join(root, "scripts", "render-briefing.mjs"), fixture, output], {encoding:"utf8"});
  assert.equal(run.status, 0, run.stderr);
  const html = fs.readFileSync(output, "utf8");
  assert.match(html, /3 分钟直觉版/);
  assert.match(html, /全量版/);
  assert.match(html, /GLM-5\.3-Flash/);
  assert.match(html, /Z\.ai 官方技术博客/);
  fs.unlinkSync(output);
});
