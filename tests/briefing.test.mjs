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

test("renderer creates one unified HTML publication", () => {
  const output = path.join(os.tmpdir(), `briefing-${process.pid}.html`);
  const run = spawnSync(process.execPath, [path.join(root, "scripts", "render-briefing.mjs"), fixture, output], {encoding:"utf8"});
  assert.equal(run.status, 0, run.stderr);
  const html = fs.readFileSync(output, "utf8");
  assert.match(html, /id="briefing"/);
  assert.match(html, /id="section-model_progress"/);
  assert.doesNotMatch(html, /id="quick"|id="full"/);
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

test('renderer escapes top-level publication fields', () => {
  const edition = readEdition(fixture);
  edition.edition = '</title><script>edition()</script>';
  edition.dek = '<img src=x onerror=dek()>';
  const input = path.join(os.tmpdir(), 'briefing-input-' + process.pid + '.json');
  const output = path.join(os.tmpdir(), 'briefing-escaped-' + process.pid + '.html');
  fs.writeFileSync(input, JSON.stringify(edition), 'utf8');
  try {
    const run = spawnSync(process.execPath, [path.join(root, 'scripts', 'render-briefing.mjs'), input, output], {encoding:'utf8'});
    assert.equal(run.status, 0, run.stderr);
    const html = fs.readFileSync(output, 'utf8');
    assert.doesNotMatch(html, /<script>edition\(\)<\/script>|<img src=x onerror=dek\(\)>/);
    assert.match(html, /&lt;script&gt;edition\(\)&lt;\/script&gt;/);
    assert.match(html, /&lt;img src=x onerror=dek\(\)&gt;/);
  } finally {
    fs.rmSync(input, {force:true});
    fs.rmSync(output, {force:true});
  }
});


test("renderer uses fixed desk sections and a model release timeline", () => {
  const edition = readEdition(fixture);
  const base = edition.items[0];
  const makeItem = (id, title, category, systemLayer, briefingSections) => ({
    ...base,
    id,
    title,
    category,
    systemLayer,
    briefingSections,
    primaryBriefingSection: briefingSections[0],
    point: `${title} point`,
    evidence: `${title} evidence`
  });
  edition.items = [
    makeItem("hardware-point", "Hardware Point", "hardware", "hardware_interconnect_and_platforms", ["hardware_platforms"]),
    {
      ...makeItem("repo-point", "Repo Point", "repositories", "serving_runtime_and_systems", ["repository_progress", "quantization_low_bit"]),
      sectionPoints: {repository_progress: "Repository release angle", quantization_low_bit: "Low-bit angle"}
    },
    makeItem("model-point", "Model Point", "models", "models_and_architecture", ["model_progress"])
  ];
  edition.repositoryDigest = {
    summary: "Runtime support and low-bit kernels moved together.",
    themes: [{title: "Runtime follows architecture", point: "Model-specific execution paths entered mainline.", readerValue: "Know whether the model is deployable.", signals: [
      {name: "Runtime A", change: "Added the model-specific attention backend."},
      {name: "Runtime B", change: "Added the matching cache layout."}
    ]}],
    recommendedLinks: [{label: "Official release", url: "https://example.com/release", why: "Read the compatibility notes."}]
  };
  edition.storylines = [];

  const input = path.join(os.tmpdir(), `briefing-layer-input-${process.pid}.json`);
  const output = path.join(os.tmpdir(), `briefing-layer-output-${process.pid}.html`);
  fs.writeFileSync(input, JSON.stringify(edition), "utf8");
  try {
    const run = spawnSync(process.execPath, [path.join(root, "scripts", "render-briefing.mjs"), input, output], {encoding:"utf8"});
    assert.equal(run.status, 0, run.stderr);
    const html = fs.readFileSync(output, "utf8");

    assert.ok(html.indexOf('id="section-model_progress"') < html.indexOf('id="section-repository_progress"'));
    assert.ok(html.indexOf('id="section-repository_progress"') < html.indexOf('id="section-quantization_low_bit"'));
    assert.ok(html.indexOf('id="section-quantization_low_bit"') < html.indexOf('id="section-hardware_platforms"'));
    assert.match(html, /model-timeline/);
    assert.match(html, /official-figure/);
    assert.match(html, /3:1 linear:sparse/);
    assert.match(html, /相比上一代/);
    assert.match(html, /320B total \/ 18B active/);
    assert.match(html, /not disclosed/);
    assert.match(html, /Runtime support and low-bit kernels moved together/);
    assert.match(html, /Read the compatibility notes/);
    assert.match(html, /Added the model-specific attention backend/);
    assert.match(html, /Know whether the model is deployable/);
    assert.doesNotMatch(html, /Low-bit angle/);
    assert.doesNotMatch(html, /Repository release angle/);
  } finally {
    fs.rmSync(input, {force:true});
    fs.rmSync(output, {force:true});
  }
});

test("briefingSections validation rejects unknown sections and incomplete model cards", () => {
  const edition = readEdition(fixture);
  edition.items[0].briefingSections = ["unknown_section"];
  assert.match(validateEdition(edition).errors.join("\\n"), /briefingSections 未知/);

  edition.items[0].briefingSections = ["model_progress"];
  delete edition.items[0].modelProfile.quantization;
  assert.match(validateEdition(edition).errors.join("\\n"), /modelProfile 缺少 quantization/);
});

test("sectionSpotlights validate linked items and render inside a fixed section", () => {
  const edition = readEdition(fixture);
  const second = {...structuredClone(edition.items[0]), id: "second-model", title: "Second model"};
  edition.items.push(second);
  edition.sectionSpotlights = {
    model_progress: [{
      title: "Agentic kernel direction",
      thesis: "Two verified events form one engineering direction.",
      readerValue: "Know why the direction matters.",
      use: "Evaluate correctness and integration.",
      boundary: "One item is contextual.",
      itemIds: [edition.items[0].id, second.id]
    }]
  };
  assert.deepEqual(validateEdition(edition).errors, []);

  const input = path.join(os.tmpdir(), "briefing-spotlight-input-" + process.pid + ".json");
  const output = path.join(os.tmpdir(), "briefing-spotlight-output-" + process.pid + ".html");
  fs.writeFileSync(input, JSON.stringify(edition), "utf8");
  try {
    const run = spawnSync(process.execPath, [path.join(root, "scripts", "render-briefing.mjs"), input, output], {encoding:"utf8"});
    assert.equal(run.status, 0, run.stderr);
    const html = fs.readFileSync(output, "utf8");
    assert.match(html, /section-spotlight/);
    assert.match(html, /Agentic kernel direction/);
    assert.match(html, /Know why the direction matters/);
  } finally {
    fs.rmSync(input, {force:true});
    fs.rmSync(output, {force:true});
  }

  edition.sectionSpotlights.model_progress[0].itemIds.push("unknown-item");
  assert.match(validateEdition(edition).errors.join("\n"), /引用了未知条目/);
});

test("systemLayer validation rejects unknown values and documents legacy fallback", () => {
  const edition = readEdition(fixture);
  edition.items[0].systemLayer = "unknown_layer";
  assert.match(validateEdition(edition).errors.join("\n"), /systemLayer 未知/);

  delete edition.items[0].systemLayer;
  const result = validateEdition(edition);
  assert.deepEqual(result.errors, []);
  assert.match(result.warnings.join("\n"), /回退到 models_and_architecture/);
});


test("canonical verification notes and hidden sources stay out of HTML", () => {
  const edition = readEdition(fixture);
  const item = edition.items[0];
  item.verificationNotes = ["PyPI 于 8 月 21 日发布候选包。"];
  item.sources.push({label: "internal verification detail", url: "https://example.com/hidden-detail", role: "primary", display: false});
  assert.deepEqual(validateEdition(edition).errors, []);

  const input = path.join(os.tmpdir(), "briefing-hidden-source-input-" + process.pid + ".json");
  const output = path.join(os.tmpdir(), "briefing-hidden-source-output-" + process.pid + ".html");
  fs.writeFileSync(input, JSON.stringify(edition), "utf8");
  try {
    const run = spawnSync(process.execPath, [path.join(root, "scripts", "render-briefing.mjs"), input, output], {encoding:"utf8"});
    assert.equal(run.status, 0, run.stderr);
    const html = fs.readFileSync(output, "utf8");
    assert.doesNotMatch(html, /hidden-detail|internal verification detail|PyPI 于 8 月 21 日/);
  } finally {
    fs.rmSync(input, {force:true});
    fs.rmSync(output, {force:true});
  }

  item.sources.at(-1).display = "no";
  assert.match(validateEdition(edition).errors.join("\n"), /source\.display/);
  item.sources.at(-1).display = false;
  item.verificationNotes = [42];
  assert.match(validateEdition(edition).errors.join("\n"), /verificationNotes/);
});

test("reader-facing lint warns on verification logs and dense acronyms", () => {
  const edition = readEdition(fixture);
  edition.items[0].evidence = "PyPI 于 8 月 21 日发布候选包，共合并 12 个 PR。CUDA VMM、RBLN、MUSA 均已接入。";
  const result = validateEdition(edition);
  assert.deepEqual(result.errors, []);
  assert.match(result.warnings.join("\n"), /核验日志/);
  assert.match(result.warnings.join("\n"), /不透明术语|密集缩写/);
});
