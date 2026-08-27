# Briefing HTML-first 出版工作流

本文件是 v1.0 的默认 briefing 规范。

## 目标

从多个召回视角构建统一候选池，以单页 HTML 作为最终产物。HTML 同时包含“3 分钟直觉版”和“全量版”；量化、硬件、kernel、runtime、论文与技术博客是扫描视角和标签，不是互斥频道。

## 必要输入

- 时间窗口；
- ai-infra、quantization 以及其他专题 scanner 候选；
- 人工补录与最近一期历史快照；
- `config/briefing.yml` 的出版契约和 closing sweep 要求。

所有 scanner 结果进入一个候选池。一个事件可以同时带有 quantization、hardware、kernel、runtime 等多个 topics。

## 候选与时间角色

同一发布的公告、模型卡、仓库适配和技术文档合并为一个事件，但保留各来源的证据角色。博客讨论旧模型时，分别记录博客发布日期和被讨论对象日期。

每个出版条目必须填写：

- `eventDate`；
- `windowRole`：`in_window`、`background` 或 `preannouncement`；
- `maturity`：released、preview、RC、research 等；
- `editorialRole`：headline、recommended、full_only、context、risk 或 archive；
- `point`、`evidence`、`boundary`、`use`；
- 一手来源；进入 3 分钟版的条目必须有一手来源。

窗口外内容只能作为明确背景。厂商 benchmark、作者自报结果、preview、RC 和尚未开放的 artifact 必须直接写明边界。

## 72 小时 Closing sweep

生成 edition 前，必须逐项检查并记录“有结果、空结果或访问失败”：

1. 重点模型单位官方 blog、news、API changelog；
2. NVIDIA Technical Blog、release notes 与硬件平台资料；
3. 核心 runtime、kernel、compiler、communication 仓库 release；
4. 重点独立技术博客；
5. 窗口中新出现的高信号单位官方域名；
6. 模型卡、论文新版本、代码和 artifact。

Watchlist 不得成为召回边界。发现新单位或新模型时，必须解析其官方域名并补扫整个窗口。搜索摘要和社交消息只能报警，重要事实回到官方页面、论文、模型卡或代码核验。

## 编辑选择

- headline：进入 3 分钟版和全量版；
- recommended：值得突出阅读的论文、官方技术文档或技术博客；
- full_only：只进入全量版；
- context：解释窗口内事件，必须标明背景日期；
- risk：RC、preview、已知问题或证据不完整，但对工程判断有价值；
- archive：只保留在研究候选池。

不要强行提炼长期趋势，也不强制填满条目。只有新的、可命名的技术增量进入 3 分钟版。

## 唯一出版事实源

`outputs/briefing/<date_range>/edition.json` 是唯一出版事实源，使用 `templates/briefing-edition.json` 初始化。研究阶段的 YAML 和 Markdown 不得冒充最终稿。

全量版默认按阅读对象组织：新模型、重要仓库、量化与低比特、硬件与互联、System 与架构、Kernel 与编译、技术博客。同一事件只维护一次，可以带多个 topics。每条统一写“要点—证据—边界—用途”。

3 分钟版是全量版的严格子集，不另写一套结论；标题直接使用日期，不强制空泛 takeaway。

## 生成

```powershell
node scripts/lint-briefing.mjs outputs/briefing/<date_range>/edition.json
node scripts/render-briefing.mjs outputs/briefing/<date_range>/edition.json outputs/briefing/<date_range>/briefing.html
```

`briefing.html` 是 canonical artifact；Markdown 只作为可选导出。内容修改应回写 edition 后重新生成，禁止分别手工维护 HTML、卡片稿和正文稿。

## 输出目录

```text
outputs/briefing/<date_range>/
├── research/
│   ├── candidates.yml
│   ├── coverage.md
│   └── verification.md
├── edition.json
├── briefing.html
├── briefing.md
└── manifest.yml
```

最终检查：3 分钟版是全量版子集；quick 条目均有一手链接；日期角色正确；成熟度不强于证据；必查 source class 均有覆盖记录；HTML lint 通过且能由 edition 重建。
