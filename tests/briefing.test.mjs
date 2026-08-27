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

test('validator reports malformed windows instead of throwing', () => {
  const edition = readEdition(fixture);
  delete edition.window;
  assert.match(validateEdition(edition).errors.join('\n'), /window\.start\/end/);

  edition.window = {start: '2026-02-30', end: '2026-02-28'};
  assert.match(validateEdition(edition).errors.join('\n'), /window\.start\/end/);

  edition.window = {start: '2026-08-28', end: '2026-08-27'};
  assert.match(validateEdition(edition).errors.join('\n'), /不能晚于/);
});

test('renderer escapes top-level presentation fields', () => {
  const edition = readEdition(fixture);
  edition.edition = '</title><script>edition()</script>';
  edition.dek = '<img src=x onerror=dek()>';
  edition.presentation.quickTitle = '<em>quick</em>';
  edition.presentation.fullTitle = '<em>full</em>';
  const input = path.join(os.tmpdir(), 'briefing-input-' + process.pid + '.json');
  const output = path.join(os.tmpdir(), 'briefing-escaped-' + process.pid + '.html');
  fs.writeFileSync(input, JSON.stringify(edition), 'utf8');
  try {
    const run = spawnSync(process.execPath, [path.join(root, 'scripts', 'render-briefing.mjs'), input, output], {encoding:'utf8'});
    assert.equal(run.status, 0, run.stderr);
    const html = fs.readFileSync(output, 'utf8');
    assert.doesNotMatch(html, /<script>edition\(\)<\/script>|<img src=x onerror=dek\(\)>|<em>(quick|full)<\/em>/);
    assert.match(html, /&lt;script&gt;edition\(\)&lt;\/script&gt;/);
    assert.match(html, /&lt;img src=x onerror=dek\(\)&gt;/);
  } finally {
    fs.rmSync(input, {force:true});
    fs.rmSync(output, {force:true});
  }
});
