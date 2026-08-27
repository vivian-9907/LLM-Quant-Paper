---
name: llm-infra-briefing
description: Discover, verify and publish one HTML-first LLM Infra briefing from model, runtime, quantization, hardware, kernel, systems and technical-blog signals.
---

# LLM Infra Briefing v1.0

## 当前架构

`quantization` 与 `ai-infra` 是召回 scanner，不是最终出版频道。常规 briefing 运行所有默认 scanner，把结果合并成一个事件候选池，最终生成一份包含“3 分钟直觉版”和“全量版”的 HTML。

```text
quantization scanner ─┐
                      ├─ unified candidates ─ edition.json ─ briefing.html
ai-infra scanner ─────┘
```

一个事件只维护一次，可以同时拥有 quantization、hardware、runtime、kernel 等多个 topics。

## 工作流选择

- 用户要求搜索、扫描或研究单一方向时，使用 `workflows/radar.md`。
- 用户要求生成简报、HTML、群发版、正式版或合并 radar 时，使用 `workflows/briefing.md`。
- 用户补充遗漏链接或文章时，按 briefing 的人工补录流程处理，并修复可泛化的漏检原因。

## 常规 Briefing 必读

- `config/briefing.yml`
- `config/channels.yml`
- `config/sources.yml`
- `config/watchlist.yml`
- `config/tracked-repos.yml`
- `config/editorial-rubric.yml`
- `config/event-taxonomy.yml`
- `workflows/discovery.md`
- `workflows/briefing.md`

频道 profile 仍用于各 scanner 的专业召回；不得用它们切分最终版面。

## 召回

同时运行：

1. 已知生态监控：watchlist、tracked repos、重点官方源；
2. 开放世界发现：新论文、新仓库、新模型、新单位与高信号技术博客；
3. 硬件与 kernel smoke check；
4. 截止前 72 小时 closing sweep。

Watchlist 只做查询扩展和排序，不得成为召回边界。发现新的重要单位或模型时，必须解析其官方域名并补扫完整窗口。

Closing sweep 必须记录以下 source class 的状态：

- official model blogs；
- NVIDIA technical sources；
- repository releases；
- hardware platforms；
- independent technical blogs；
- emerging official domains。

每类必须标记 `checked_with_hits`、`checked_empty` 或 `access_failed`。缺项不得出版。

## 候选池与证据

按事件去重，而不是按链接去重。同一发布的公告、模型卡、API 文档、仓库适配和博客可以合并，但要保留各来源角色。

重要事实必须回到一手来源核验。搜索摘要和社交消息只能作为报警源。

每个出版条目必须有：

- 精确名称、组织与事件日期；
- `windowRole`：`in_window`、`background` 或 `preannouncement`；
- `maturity`；
- `editorialRole`；
- `point`、`evidence`、`boundary`、`use`；
- 一手来源。

厂商 benchmark、作者自报结果、preview、RC、未开放代码或权重必须标明边界。博客讨论旧对象时，分别记录博客日期和对象日期。

## 编辑

出版角色：

- `headline`：进入 3 分钟版和全量版；
- `recommended`：值得突出阅读的论文、官方文档或技术博客；
- `full_only`：只进入全量版；
- `context`：窗口外背景；
- `risk`：RC、preview、已知问题或证据不完整项；
- `archive`：只保留在研究候选池。

不要强行制造长期趋势或空泛 takeaway。标题直接使用日期。全量版每条采用“要点—证据—边界—用途”。

## Canonical 出版

`outputs/briefing/<date_range>/edition.json` 是唯一出版事实源，使用 `templates/briefing-edition.json` 初始化。

```powershell
node scripts/lint-briefing.mjs outputs/briefing/<date_range>/edition.json
node scripts/render-briefing.mjs outputs/briefing/<date_range>/edition.json outputs/briefing/<date_range>/briefing.html
```

`briefing.html` 是默认最终产物。3 分钟版是全量版的严格子集；不得分别手工维护 HTML、卡片稿和正文稿。

全量版默认按新模型、重要仓库、量化与低比特、硬件与互联、System 与架构、Kernel 与编译、技术博客组织。这些是阅读导航，不是召回边界。

## 人工补录

用户提供遗漏内容时：

1. 保留用户原始说明；
2. 补齐日期、事件类型、技术增量和证据；
3. 进入统一候选池并重新筛选；
4. 更新 `edition.json` 并重新生成 HTML；
5. 记录漏检原因，优先修复 source class、开放世界发现或 closing sweep，不为单个名字建立白名单。

## 输出

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

最终检查：quick 条目均有一手来源；时间角色正确；成熟度不强于证据；所有 source class 有覆盖记录；lint 与测试通过；HTML 能由 edition 重建。
