import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {
  categoryMeta,
  defaultOutputPath,
  escapeHtml,
  primaryBriefingSection,
  publicationSectionMeta,
  publicationSectionOrder,
  readEdition,
  validateEdition
} from "./briefing-lib.mjs";

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
const roleLabel = role => ({in_window: "窗口内", background: "背景", preannouncement: "预告"}[role] || role);
const pointFor = (item, section) => item.sectionPoints?.[section] || item.point;
const profileText = value => Array.isArray(value) ? value.join(" · ") : value || "未披露";

const sourceLinks = items => {
  const seen = new Set();
  const links = [];
  for (const item of items) for (const source of item.sources || []) {
    if (source?.display === false) continue;
    if (!source?.url || seen.has(source.url)) continue;
    seen.add(source.url);
    links.push(`<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(source.label || source.publisher || "来源")} ↗</a>`);
  }
  return links.length ? `<div class="sources">${links.join("")}</div>` : "";
};

const renderArchitectureFigure = profile => {
  const figure = profile?.architectureFigure;
  if (!figure) return profile?.architectureFigureUnavailable
    ? `<p class="figure-unavailable">${escapeHtml(profile.architectureFigureUnavailable)}</p>`
    : "";
  return `<figure class="official-figure"><a href="${escapeHtml(figure.sourceUrl)}" target="_blank" rel="noreferrer"><img src="${escapeHtml(figure.url)}" alt="${escapeHtml(figure.alt || "")}" loading="lazy"></a><figcaption><strong>官方架构图</strong> · ${escapeHtml(figure.caption || "")} · <a href="${escapeHtml(figure.sourceUrl)}" target="_blank" rel="noreferrer">${escapeHtml(figure.sourceLabel || "一手来源")} ↗</a></figcaption></figure>`;
};

const renderGenerationDelta = deltas => `<div class="generation-panel"><div class="panel-label">相比上一代</div>${(deltas || []).map(delta => `<div class="generation-row"><strong>${escapeHtml(delta.label)}</strong><span class="generation-before">${escapeHtml(delta.before)}</span><b class="generation-arrow">→</b><span>${escapeHtml(delta.after)}</span>${delta.impact ? `<small>${escapeHtml(delta.impact)}</small>` : ""}</div>`).join("")}</div>`;

const renderRepositoryDigest = digest => {
  if (!digest) return `<div class="empty-state">本期没有可发布的仓库总结。</div>`;
  const themes = (digest.themes || []).map(theme => {
    const signals = (theme.signals || []).map(signal => `<li><strong>${escapeHtml(signal.name)}</strong><span>${escapeHtml(signal.change)}</span></li>`).join("");
    return `<article class="repo-theme"><h3>${escapeHtml(theme.title)}</h3><p>${escapeHtml(theme.point)}</p><p class="repo-reader-value"><strong>为什么值得看</strong>${escapeHtml(theme.readerValue)}</p>${signals ? `<ul class="repo-signals">${signals}</ul>` : ""}</article>`;
  }).join("");
  const links = (digest.recommendedLinks || []).map(link => `<a class="recommended-link" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(link.label)} ↗</strong><span>${escapeHtml(link.why)}</span></a>`).join("");
  return `<div class="repository-digest"><p class="repo-summary">${escapeHtml(digest.summary)}</p><div class="repo-themes">${themes}</div><div class="recommended-heading">建议优先看</div><div class="recommended-links">${links}</div></div>`;
};

const renderArchitectureTrend = trend => {
  if (!trend) return "";
  const observations = (trend.observations || []).map(item => `<article class="observation"><strong>${escapeHtml(item.label)}</strong><span>${escapeHtml(item.point)}</span></article>`).join("");
  const rows = (trend.rows || []).map(row => `<tr><th>${escapeHtml(row.model)}</th><td>${escapeHtml(row.linearAttention)}</td><td>${escapeHtml(row.sparseAttention)}</td><td>${escapeHtml(row.residual)}</td></tr>`).join("");
  const muon = trend.muonTrend ? `<div class="muon-trend"><strong>${escapeHtml(trend.muonTrend.title)}</strong><span>${escapeHtml(trend.muonTrend.point)}</span>${trend.muonTrend.boundary ? `<small>${escapeHtml(trend.muonTrend.boundary)}</small>` : ""}</div>` : "";
  return `<aside class="architecture-trend"><h3>${escapeHtml(trend.title || "国内模型架构收敛")}</h3><div class="observation-grid">${observations}</div>${muon}${rows ? `<div class="comparison-wrap"><table class="comparison-table"><thead><tr><th>模型</th><th>Linear attention</th><th>Sparse attention</th><th>Fancy residuals</th></tr></thead><tbody>${rows}</tbody></table></div>` : ""}</aside>`;
};

const renderSectionSpotlights = (section, collections, itemsById) => {
  const spotlights = collections?.[section] || [];
  if (!spotlights.length) return String();
  const cards = spotlights.map(spotlight => {
    const evidence = (spotlight.itemIds || []).map(itemId => itemsById.get(itemId)).filter(Boolean).map(item =>
      `<a href=#item-${escapeHtml(item.id)}><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(roleLabel(item.windowRole))} · ${escapeHtml(item.eventDate)}</span></a>`
    ).join(String());
    return `<article class=section-spotlight><div class=spotlight-kicker>${escapeHtml(spotlight.eyebrow || `方向观察`)}</div><h3>${escapeHtml(spotlight.title)}</h3><p class=spotlight-thesis>${escapeHtml(spotlight.thesis)}</p><div class=spotlight-grid><div><strong>为什么值得看</strong><p>${escapeHtml(spotlight.readerValue)}</p></div><div><strong>工程判断</strong><p>${escapeHtml(spotlight.use)}</p></div><div><strong>时间与证据边界</strong><p>${escapeHtml(spotlight.boundary)}</p></div></div>${evidence ? `<div class=spotlight-evidence>${evidence}</div>` : String()}</article>`;
  }).join(String());
  return `<aside class=section-spotlights>${cards}</aside>`;
};

const renderModelTimeline = items => {
  const chronological = [...items].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  if (!chronological.length) return `<div class="empty-state">本期未发现经一手来源核验的新模型发布。</div>`;
  return `<div class="model-timeline">${chronological.map(item => {
    const profile = item.modelProfile || {};
    return `<article class="model-release" id="item-${escapeHtml(item.id)}">
      <div class="timeline-date">${escapeHtml(item.eventDate.slice(5).replace("-", "."))}</div>
      <div class="timeline-marker" aria-hidden="true"></div>
      <div class="model-card">
        <div class="model-copy">
          <div class="model-org">${escapeHtml(profile.organization || item.organization || "未标注组织")}</div>
          <h3>${escapeHtml(profile.version || item.title)}</h3>
          <p class="model-point">${escapeHtml(pointFor(item, "model_progress"))}</p>
          <dl><dt>架构</dt><dd>${escapeHtml(profileText(profile.architecture))}</dd><dt>注意力</dt><dd>${escapeHtml(profileText(profile.attentionPattern))}</dd><dt>量化</dt><dd>${escapeHtml(profileText(profile.quantization))}</dd>${profile.availability ? `<dt>可用性</dt><dd>${escapeHtml(profileText(profile.availability))}</dd>` : ""}</dl>
          ${renderGenerationDelta(profile.generationDelta)}
          ${sourceLinks([item])}
        </div>
        ${renderArchitectureFigure(profile)}
      </div>
    </article>`;
  }).join("")}</div>`;
};

const expandedRoles = new Set(["headline", "recommended", "risk"]);

const renderUnifiedItems = (section, items) => {
  if (!items.length) return `<div class="empty-state">本期没有足够重要且已核验的更新。</div>`;
  const expanded = items.filter(item => expandedRoles.has(item.editorialRole));
  const light = items.filter(item => !expandedRoles.has(item.editorialRole));
  const articles = expanded.map(item => `<article class="deep-item featured-item" id="item-${escapeHtml(item.id)}">
    <div class="meta"><span class="badge">${escapeHtml(roleLabel(item.windowRole))} · ${escapeHtml(item.eventDate)}</span><span class="badge secondary">${escapeHtml(item.maturity)}</span><span class="badge secondary">${escapeHtml(categoryMeta[item.category]?.[1] || item.category)}</span></div>
    <h3>${escapeHtml(item.title)}</h3>
    <div class="block"><strong>发生了什么</strong><p>${escapeHtml(pointFor(item, section))}</p></div>
    <div class="block"><strong>为什么这么说</strong><p>${escapeHtml(item.evidence)}</p></div>
    ${item.boundary ? `<div class="block boundary-block"><strong>需要注意</strong><p>${escapeHtml(item.boundary)}</p></div>` : ""}
    <div class="block"><strong>怎么理解</strong><p>${escapeHtml(item.use)}</p></div>
    ${(item.facts || []).length ? `<ul class="facts">${item.facts.map(fact => `<li>${escapeHtml(fact)}</li>`).join("")}</ul>` : ""}
    ${sourceLinks([item])}
  </article>`).join("");
  const lightSignals = light.length ? `<div class="light-signals"><div class="light-signals-label">其他信号</div>${light.map(item => {
    const source = (item.sources || []).find(candidate => candidate?.role === "primary") || item.sources?.[0];
    const title = source?.url ? `<a href="${escapeHtml(source.url)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)} ↗</a>` : escapeHtml(item.title);
    return `<article id="item-${escapeHtml(item.id)}"><time>${escapeHtml(item.eventDate.slice(5).replace("-", "."))}</time><div><h3>${title}</h3><p>${escapeHtml(pointFor(item, section))}</p></div></article>`;
  }).join("")}</div>` : "";
  return `${articles}${lightSignals}`;
};

const unifiedContent = publicationSectionOrder.map(section => {
  const [number, label, description] = publicationSectionMeta[section];
  const itemsById = new Map(edition.items.map(item => [item.id, item]));
  const spotlights = renderSectionSpotlights(section, edition.sectionSpotlights, itemsById);
  const items = edition.items.filter(item => primaryBriefingSection(item) === section)
    .sort((a, b) => (b.eventDate || "").localeCompare(a.eventDate || ""));
  const body = section === "model_progress"
    ? renderModelTimeline(items) + renderArchitectureTrend(edition.architectureTrend)
    : section === "repository_progress" ? renderRepositoryDigest(edition.repositoryDigest) : renderUnifiedItems(section, items);
  const summary = edition.sectionSummaries?.[section];
  return `<section class="brief-section unified-section ${section === "quantization_low_bit" ? "accent-section" : ""}" id="section-${escapeHtml(section)}">
    <div class="section-heading"><span>${number}</span><div><h2>${escapeHtml(label)}</h2><p>${escapeHtml(summary || description)}</p></div></div>
    ${spotlights}
    ${body}
  </section>`;
}).join("");

const navigation = [
  `<a class="outline-l1" href="#overview">本期概览</a>`,
  `<div class="nav-title">本期内容</div>`,
  ...publicationSectionOrder.map(section => `<a class="sub" href="#section-${section}">${publicationSectionMeta[section][0]} ${escapeHtml(publicationSectionMeta[section][1])}</a>`)
].join("");

const easterEgg = edition.presentation?.easterEgg;
const easterEggHtml = easterEgg?.image
  ? `<figure class="trend-break"><img src="${escapeHtml(easterEgg.image)}" alt="${escapeHtml(easterEgg.alt || "")}"></figure>`
  : "";

const template = fs.readFileSync(path.join(root, "templates", "briefing.html"), "utf8");
const replacements = {
  DOCUMENT_TITLE: `${edition.edition} · LLM Infra Briefing`,
  WINDOW: windowText,
  DATE_TITLE: windowText.replaceAll("-", "."),
  DEK: edition.dek || "",
  EASTER_EGG: easterEggHtml,
  NAVIGATION: navigation,
  CONTENT: unifiedContent,
  GENERATED_AT: new Date().toISOString()
};
for (const key of ["DOCUMENT_TITLE", "WINDOW", "DATE_TITLE", "DEK", "GENERATED_AT"]) replacements[key] = escapeHtml(replacements[key]);
let html = template;
for (const [key, value] of Object.entries(replacements)) html = html.replaceAll(`{{${key}}}`, value);
fs.mkdirSync(path.dirname(output), {recursive: true});
fs.writeFileSync(output, html, "utf8");
console.log(output);
