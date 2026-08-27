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
    if (ids.has(item.id)) errors.push(`${where} id 重复：${item.id}`);
    ids.add(item.id);
    if (!isoDate(item.eventDate)) errors.push(`${where}.eventDate 必须是 YYYY-MM-DD`);
    if (!categoryMeta[item.category]) errors.push(`${where}.category 未知：${item.category}`);
    if (!["headline", "recommended", "full_only", "context", "risk"].includes(item.editorialRole)) errors.push(`${where}.editorialRole 非法`);
    if (!["in_window", "background", "preannouncement"].includes(item.windowRole)) errors.push(`${where}.windowRole 非法`);
    if (item.windowRole === "in_window" && isoDate(item.eventDate) && isoDate(window.start) && isoDate(window.end) && (item.eventDate < window.start || item.eventDate > window.end)) {
      errors.push(`${where} 标记为 in_window，但日期不在观察窗口内`);
    }
    if (item.windowRole !== "in_window" && !item.boundary) errors.push(`${where} 非窗口内条目必须填写 boundary`);
    const itemSources = Array.isArray(item.sources) ? item.sources : [];
    const primary = itemSources.filter(source => source && typeof source === "object" && !Array.isArray(source) && source.role === "primary");
    if (item.quick && primary.length === 0) errors.push(`${where} 进入 3 分钟版但没有一手来源`);
    if (itemSources.length === 0) warnings.push(`${where} 没有来源`);
    for (const source of itemSources) {
      if (!source || typeof source !== "object" || Array.isArray(source)) {
        errors.push(`${where} 来源必须是对象`);
        continue;
      }
      if (!/^https:\/\//.test(source.url || "")) errors.push(`${where} 来源必须使用 https：${source.url || "<empty>"}`);
    }
  }
  return {errors, warnings};
}

export function defaultOutputPath(input) {
  return path.join(path.dirname(input), "briefing.html");
}
