import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {categoryMeta, defaultOutputPath, escapeHtml, readEdition, validateEdition} from "./briefing-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const input = path.resolve(process.argv[2] || "edition.json");
const output = path.resolve(process.argv[3] || defaultOutputPath(input));
const edition = readEdition(input);
const {errors, warnings} = validateEdition(edition);
for (const warning of warnings) console.warn(`warning: ${warning}`);
if (errors.length) {
  for (const error of errors) console.error(`error: ${error}`);
  process.exit(1);
}

const windowText = `${edition.window.start} — ${edition.window.end}`;
const quickItems = edition.items.filter(item => item.quick);
const categories = [...new Set(edition.items.map(item => item.category))]
  .sort((a, b) => Object.keys(categoryMeta).indexOf(a) - Object.keys(categoryMeta).indexOf(b));

const roleLabel = role => ({in_window:"窗口内",background:"背景",preannouncement:"预告"}[role] || role);
const sources = item => `<div class="sources">${(item.sources || []).map(source => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.label)} ↗</a>`).join("")}</div>`;

const quickContent = quickItems.map((item, index) => `
<article class="quick-row" id="quick-${escapeHtml(item.id)}">
  <div class="quick-label"><span>${String(index + 1).padStart(2,"0")} · ${escapeHtml(roleLabel(item.windowRole))}</span>${escapeHtml(categoryMeta[item.category][1])}</div>
  <div class="quick-body"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.point)} ${escapeHtml(item.evidence)}</p>${item.boundary ? `<p class="boundary"><strong>边界：</strong>${escapeHtml(item.boundary)}</p>` : ""}${sources(item)}</div>
</article>`).join("");

const fullContent = categories.map(category => {
  const [number, label] = categoryMeta[category];
  const articles = edition.items.filter(item => item.category === category).map(item => `
  <article id="item-${escapeHtml(item.id)}">
    <div class="meta"><span class="badge">${escapeHtml(roleLabel(item.windowRole))} · ${escapeHtml(item.eventDate)}</span><span class="badge secondary">${escapeHtml(item.maturity)}</span>${(item.topics || []).map(topic => `<span class="badge secondary">${escapeHtml(topic)}</span>`).join("")}</div>
    <h4>${escapeHtml(item.title)}</h4>
    <div class="block"><strong>要点</strong><p>${escapeHtml(item.point)}</p></div>
    <div class="block"><strong>证据</strong><p>${escapeHtml(item.evidence)}</p></div>
    ${item.boundary ? `<div class="block"><strong>边界</strong><p>${escapeHtml(item.boundary)}</p></div>` : ""}
    <div class="block"><strong>用途</strong><p>${escapeHtml(item.use)}</p></div>
    ${(item.facts || []).length ? `<ul class="facts">${item.facts.map(fact => `<li>${escapeHtml(fact)}</li>`).join("")}</ul>` : ""}
    ${sources(item)}
  </article>`).join("");
  return `<div class="category" id="category-${category}"><div class="category-head"><span class="category-no">${number}</span><h3>${escapeHtml(label)}</h3></div>${articles}</div>`;
}).join("");

const navigation = [
  `<a href="#overview">日期与摘要</a>`,
  `<a href="#quick">${escapeHtml(edition.presentation?.quickTitle || "3 分钟直觉版")}</a>`,
  ...quickItems.map(item => `<a class="sub" href="#quick-${escapeHtml(item.id)}">${escapeHtml(item.title)}</a>`),
  `<a href="#full">${escapeHtml(edition.presentation?.fullTitle || "全量版")}</a>`,
  ...categories.map(category => `<a class="sub" href="#category-${category}">${categoryMeta[category][0]} ${escapeHtml(categoryMeta[category][1])}</a>`)
].join("");

const template = fs.readFileSync(path.join(root, "templates", "briefing.html"), "utf8");
const replacements = {
  DOCUMENT_TITLE: `${edition.edition} · LLM Infra Briefing`, WINDOW: windowText,
  DATE_TITLE: windowText.replaceAll("-", "."), DEK: edition.dek || "",
  QUICK_TITLE: edition.presentation?.quickTitle || "3 分钟直觉版",
  FULL_TITLE: edition.presentation?.fullTitle || "全量版",
  NAVIGATION: navigation, QUICK_CONTENT: quickContent, FULL_CONTENT: fullContent,
  GENERATED_AT: new Date().toISOString()
};
let html = template;
for (const [key, value] of Object.entries(replacements)) html = html.replaceAll(`{{${key}}}`, value);
fs.mkdirSync(path.dirname(output), {recursive:true});
fs.writeFileSync(output, html, "utf8");
console.log(output);
