import fs from "node:fs";
import path from "node:path";

export const categoryMeta = {
  models: ["01", "新模型"],
  repositories: ["02", "重要仓库"],
  quantization: ["03", "量化与低比特"],
  hardware: ["04", "硬件与互联"],
  systems: ["05", "System 与架构"],
  kernels: ["06", "Kernel 与编译"],
  technical_blogs: ["07", "技术博客"]
};

export const systemLayerMeta = {
  models_and_architecture: ["01", "模型与架构"],
  training_and_quantization: ["02", "训练、量化与低比特"],
  serving_runtime_and_systems: ["03", "Serving、Runtime 与系统"],
  kernels_compilers_and_operators: ["04", "算子、Kernel 与编译器"],
  hardware_interconnect_and_platforms: ["05", "硬件、互联与平台"]
};

export const systemLayerOrder = Object.keys(systemLayerMeta);

export const publicationSectionMeta = {
  model_progress: ["01", "新模型进展", "按发布时间跟踪各家最新版本、架构与量化状态"],
  repository_progress: ["02", "重要仓库进展", "只保留会改变部署、兼容或性能路径的版本更新"],
  quantization_low_bit: ["03", "量化与低比特", "模型方法、数值格式与运行时支持放在同一栏对照"],
  serving_runtime_systems: ["04", "Serving、Runtime 与系统", "关注 KV、调度、并行、容量与生产执行路径"],
  kernels_compilers_operators: ["05", "Kernel、Compiler 与 Operator", "关注算子实现、编译器后端、正确性与性能"],
  hardware_platforms: ["06", "硬件、互联与平台", "关注芯片、内存、互联、机架系统与部署成熟度"]
};

export const publicationSectionOrder = Object.keys(publicationSectionMeta);

const categoryLayerFallback = {
  models: "models_and_architecture",
  quantization: "training_and_quantization",
  repositories: "serving_runtime_and_systems",
  systems: "serving_runtime_and_systems",
  technical_blogs: "serving_runtime_and_systems",
  kernels: "kernels_compilers_and_operators",
  hardware: "hardware_interconnect_and_platforms"
};

const categorySectionFallback = {
  models: "model_progress",
  repositories: "repository_progress",
  quantization: "quantization_low_bit",
  systems: "serving_runtime_systems",
  kernels: "kernels_compilers_operators",
  hardware: "hardware_platforms"
};

export function resolveSystemLayer(value) {
  if (systemLayerMeta[value?.systemLayer]) return value.systemLayer;
  return categoryLayerFallback[value?.category] || "serving_runtime_and_systems";
}

export function systemLayerRank(value) {
  const rank = systemLayerOrder.indexOf(resolveSystemLayer(value));
  return rank === -1 ? systemLayerOrder.length : rank;
}

export function resolveBriefingSections(value) {
  const explicit = Array.isArray(value?.briefingSections) ? value.briefingSections : value?.briefingSection ? [value.briefingSection] : [];
  if (explicit.length) return [...new Set(explicit)];
  if (categorySectionFallback[value?.category]) return [categorySectionFallback[value.category]];
  const byLayer = {
    models_and_architecture: "model_progress",
    training_and_quantization: "quantization_low_bit",
    serving_runtime_and_systems: "serving_runtime_systems",
    kernels_compilers_and_operators: "kernels_compilers_operators",
    hardware_interconnect_and_platforms: "hardware_platforms"
  };
  return [byLayer[resolveSystemLayer(value)] || "serving_runtime_systems"];
}

export function primaryBriefingSection(value) {
  return value?.primaryBriefingSection || resolveBriefingSections(value)[0];
}

export function readEdition(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return false;
  const parsed = new Date(value + "T00:00:00.000Z");
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) return false;
  return true;
}


const verificationLogPattern = /(?:PyPI.{0,20}(?:发布|release)|(?:合并|包含|共)\s*\d+\s*(?:个|项)?\s*(?:PR|pull request)|完整(?:设备|硬件|适配)(?:清单|列表)|\b\d+\s+pull requests?\b)/i;
const familiarAcronyms = new Set(["AI", "API", "CPU", "GPU", "LLM", "PR", "RC", "AMD", "NVIDIA", "KV"]);
const opaqueTermPattern = /\bCUDA\s+VMM\b|\bRBLN\b|\bMUSA\b/i;

function addReaderFacingWarnings(item, where, warnings) {
  const evidence = typeof item.evidence === "string" ? item.evidence.trim() : "";
  if ([...evidence].length > 180) warnings.push(where + ".evidence 超过 180 字；群发版建议只保留一到两个决策相关事实");
  if (verificationLogPattern.test(evidence)) warnings.push(where + ".evidence 像核验日志；包时间、PR 数或完整适配清单应移入 verificationNotes");
  const prose = [item.point, item.evidence, item.use].filter(value => typeof value === "string").join(" ");
  const acronyms = [...new Set([...prose.matchAll(/\b[A-Z]{2,}\b/g)].map(match => match[0]).filter(token => !familiarAcronyms.has(token)))];
  const opaqueTermNeedsExplanation = opaqueTermPattern.test(prose) && !/CUDA\s+VMM[（(][^）)]{1,60}[）)]/i.test(prose);
  if (opaqueTermNeedsExplanation || acronyms.length >= 4) warnings.push(where + " 含不透明术语或密集缩写（" + acronyms.slice(0, 5).join("、") + "）；请确认首次出现已有白话解释");
}

export function validateEdition(edition) {
  const errors = [];
  const warnings = [];
  if (!edition || typeof edition !== "object" || Array.isArray(edition)) {
    return {errors: ["edition 必须是对象"], warnings};
  }
  const ids = new Set();
  const window = edition.window && typeof edition.window === "object" && !Array.isArray(edition.window) ? edition.window : {};
  const items = Array.isArray(edition.items) ? edition.items : [];
  if (edition.schemaVersion !== 1) errors.push("schemaVersion 必须为 1");
  if (!edition.edition) errors.push("缺少 edition");
  if (!isoDate(window.start) || !isoDate(window.end)) errors.push("window.start/end 必须是有效的 YYYY-MM-DD 日期");
  if (isoDate(window.start) && isoDate(window.end) && window.start > window.end) {
    errors.push("window.start 不能晚于 window.end");
  }
  if (items.length === 0) errors.push("items 不能为空");
  const requiredCoverage = ["official_model_blogs", "nvidia_technical", "repository_releases", "hardware_platforms", "independent_blogs", "emerging_official_domains"];
  const allowedCoverage = new Set(["checked_with_hits", "checked_empty", "access_failed"]);
  if (!edition.coverage?.closingSweepAt) errors.push("coverage.closingSweepAt 不能为空");
  for (const sourceClass of requiredCoverage) {
    const status = edition.coverage?.sourceClasses?.[sourceClass];
    if (!allowedCoverage.has(status)) errors.push(`coverage.sourceClasses.${sourceClass} 缺少有效检查状态`);
  }

  for (const [index, item] of items.entries()) {
    const where = `items[${index}]`;
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      errors.push(`${where} 必须是对象`);
      continue;
    }
    for (const field of ["id", "title", "eventDate", "windowRole", "maturity", "category", "point", "evidence", "use"]) {
      if (!item[field]) errors.push(`${where} 缺少 ${field}`);
    }
    if (item.verificationNotes !== undefined) {
      const notes = typeof item.verificationNotes === "string" ? [item.verificationNotes] : item.verificationNotes;
      if (!Array.isArray(notes) || notes.some(note => typeof note !== "string" || !note.trim())) errors.push(`${where}.verificationNotes 必须是非空字符串或非空字符串数组`);
    }
    addReaderFacingWarnings(item, where, warnings);
    if (ids.has(item.id)) errors.push(`${where} id 重复：${item.id}`);
    ids.add(item.id);
    if (!isoDate(item.eventDate)) errors.push(`${where}.eventDate 必须是 YYYY-MM-DD`);
    if (!categoryMeta[item.category]) errors.push(`${where}.category 未知：${item.category}`);
    if (item.systemLayer && !systemLayerMeta[item.systemLayer]) {
      errors.push(`${where}.systemLayer 未知：${item.systemLayer}`);
    } else if (!item.systemLayer) {
      warnings.push(`${where} 缺少 systemLayer；渲染时将按 category 回退到 ${resolveSystemLayer(item)}`);
    }
    const sections = resolveBriefingSections(item);
    if (!item.briefingSections && !item.briefingSection) warnings.push(`${where} 缺少 briefingSections；将按 category/systemLayer 回退`);
    for (const section of sections) if (!publicationSectionMeta[section]) errors.push(`${where}.briefingSections 未知：${section}`);
    if (item.primaryBriefingSection && !sections.includes(item.primaryBriefingSection)) errors.push(`${where}.primaryBriefingSection 必须包含在 briefingSections 中`);
    if (item.sectionPoints && (typeof item.sectionPoints !== "object" || Array.isArray(item.sectionPoints))) errors.push(`${where}.sectionPoints 必须是对象`);
    for (const [section, point] of Object.entries(item.sectionPoints || {})) {
      if (!publicationSectionMeta[section]) errors.push(`${where}.sectionPoints 使用未知栏目：${section}`);
      if (!sections.includes(section)) errors.push(`${where}.sectionPoints.${section} 不在 briefingSections 中`);
      if (typeof point !== "string" || !point.trim()) errors.push(`${where}.sectionPoints.${section} 必须是非空字符串`);
    }
    if (sections.includes("model_progress")) {
      for (const field of ["organization", "version", "architecture", "attentionPattern", "quantization"]) {
        if (!item.modelProfile?.[field]) errors.push(`${where}.modelProfile 缺少 ${field}`);
      }
      if (!Array.isArray(item.modelProfile?.generationDelta) || item.modelProfile.generationDelta.length < 1) errors.push(`${where}.modelProfile.generationDelta 至少需要一项代际变化`);
      const figure = item.modelProfile?.architectureFigure;
      if (!figure && !item.modelProfile?.architectureFigureUnavailable) errors.push(`${where}.modelProfile 必须提供 architectureFigure 或 architectureFigureUnavailable`);
      if (figure) {
        for (const field of ["url", "alt", "caption", "sourceUrl", "sourceLabel"]) if (!figure[field]) errors.push(`${where}.modelProfile.architectureFigure 缺少 ${field}`);
        if (figure.url && !/^https:\/\//.test(figure.url)) errors.push(`${where}.modelProfile.architectureFigure.url 必须使用 https`);
        if (figure.sourceUrl && !/^https:\/\//.test(figure.sourceUrl)) errors.push(`${where}.modelProfile.architectureFigure.sourceUrl 必须使用 https`);
        const primaryUrls = new Set((item.sources || []).filter(source => source?.role === "primary").map(source => source.url));
        if (figure.sourceUrl && !primaryUrls.has(figure.sourceUrl)) errors.push(`${where}.modelProfile.architectureFigure.sourceUrl 必须对应条目的一手来源`);
      }
      for (const [deltaIndex, delta] of (item.modelProfile?.generationDelta || []).entries()) {
        if (!delta?.label || !delta?.before || !delta?.after) errors.push(`${where}.modelProfile.generationDelta[${deltaIndex}] 缺少 label/before/after`);
      }
    }
    if (!["headline", "recommended", "full_only", "context", "risk"].includes(item.editorialRole)) errors.push(`${where}.editorialRole 非法`);
    if (!["in_window", "background", "preannouncement"].includes(item.windowRole)) errors.push(`${where}.windowRole 非法`);
    if (item.windowRole === "in_window" && isoDate(item.eventDate) && isoDate(window.start) && isoDate(window.end) && (item.eventDate < window.start || item.eventDate > window.end)) {
      errors.push(`${where} 标记为 in_window，但日期不在观察窗口内`);
    }
    if (item.windowRole !== "in_window" && !item.boundary) errors.push(`${where} 非窗口内条目必须填写 boundary`);
    const itemSources = Array.isArray(item.sources) ? item.sources : [];
    const primary = itemSources.filter(source => source && typeof source === "object" && !Array.isArray(source) && source.role === "primary");
    if (primary.length === 0) errors.push(`${where} 进入最终版但没有一手来源`);
    if (itemSources.length === 0) warnings.push(`${where} 没有来源`);
    for (const source of itemSources) {
      if (!source || typeof source !== "object" || Array.isArray(source)) {
        errors.push(`${where} 来源必须是对象`);
        continue;
      }
      if (!/^https:\/\//.test(source.url || "")) errors.push(`${where} 来源必须使用 https：${source.url || "<empty>"}`);
      if (source.display !== undefined && typeof source.display !== "boolean") errors.push(`${where} source.display 必须是布尔值`);
    }
  }

  const repositoryItems = items.filter(item => resolveBriefingSections(item).includes("repository_progress"));
  if (repositoryItems.length) {
    const digest = edition.repositoryDigest;
    if (!digest?.summary) errors.push("repositoryDigest.summary 不能为空");
    if (!Array.isArray(digest?.themes) || digest.themes.length < 1) errors.push("repositoryDigest.themes 至少需要一项总结");
    if (!Array.isArray(digest?.recommendedLinks) || digest.recommendedLinks.length < 1) errors.push("repositoryDigest.recommendedLinks 至少需要一个推荐链接");
    for (const [index, theme] of (digest?.themes || []).entries()) {
      if (!theme?.title || !theme?.point || !theme?.readerValue) errors.push(`repositoryDigest.themes[${index}] 缺少 title/point/readerValue`);
      if (!Array.isArray(theme?.signals) || theme.signals.length < 2) errors.push(`repositoryDigest.themes[${index}].signals 至少需要两个具体仓库信号`);
      for (const [signalIndex, signal] of (theme?.signals || []).entries()) if (!signal?.name || !signal?.change) errors.push(`repositoryDigest.themes[${index}].signals[${signalIndex}] 缺少 name/change`);
    }
    for (const [index, link] of (digest?.recommendedLinks || []).entries()) {
      if (!link?.label || !link?.url || !link?.why) errors.push(`repositoryDigest.recommendedLinks[${index}] 缺少 label/url/why`);
      if (link?.url && !/^https:\/\//.test(link.url)) errors.push(`repositoryDigest.recommendedLinks[${index}].url 必须使用 https`);
    }
  }

  for (const [section, spotlights] of Object.entries(edition.sectionSpotlights || {})) {
    if (!publicationSectionMeta[section]) errors.push(`sectionSpotlights 使用未知栏目：${section}`);
    if (!Array.isArray(spotlights)) {
      errors.push(`sectionSpotlights.${section} 必须是数组`);
      continue;
    }
    for (const [index, spotlight] of spotlights.entries()) {
      const where = `sectionSpotlights.${section}[${index}]`;
      if (!spotlight?.title || !spotlight?.thesis || !spotlight?.readerValue || !spotlight?.use || !spotlight?.boundary) errors.push(`${where} 缺少 title/thesis/readerValue/use/boundary`);
      if (!Array.isArray(spotlight?.itemIds) || spotlight.itemIds.length < 2) errors.push(`${where}.itemIds 至少需要两个关联条目`);
      for (const itemId of spotlight?.itemIds || []) if (!ids.has(itemId)) errors.push(`${where} 引用了未知条目：${itemId}`);
    }
  }

  const storyIds = new Set();
  for (const [index, story] of (edition.storylines || []).entries()) {
    const where = `storylines[${index}]`;
    if (!story || typeof story !== "object" || Array.isArray(story)) {
      errors.push(`${where} 必须是对象`);
      continue;
    }
    if (!story.id || !story.title || !story.thesis) errors.push(`${where} 缺少 id/title/thesis`);
    if (story.systemLayer && !systemLayerMeta[story.systemLayer]) {
      errors.push(`${where}.systemLayer 未知：${story.systemLayer}`);
    } else if (!story.systemLayer) {
      warnings.push(`${where} 缺少 systemLayer；渲染时将按关联条目的最上层位置回退`);
    }
    if (storyIds.has(story.id)) errors.push(`${where} id 重复：${story.id}`);
    storyIds.add(story.id);
    if (!Array.isArray(story.itemIds) || story.itemIds.length < 2) errors.push(`${where}.itemIds 至少需要两个关联条目`);
    for (const itemId of story.itemIds || []) if (!ids.has(itemId)) errors.push(`${where} 引用了未知条目：${itemId}`);
  }

  return {errors, warnings};
}

export function defaultOutputPath(input) {
  return path.join(path.dirname(input), "briefing.html");
}
