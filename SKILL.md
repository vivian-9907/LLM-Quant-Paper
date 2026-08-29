---
name: llm-infra-briefing
description: Discover, verify and publish one HTML-first LLM Infra briefing from model, runtime, quantization, hardware, kernel, systems and technical-blog signals.
---

# LLM Infra Briefing v1.1

## 架构

常规 briefing 使用 `config/topic-scouts.yml` 定义的 topic scouts 并行召回：

```text
model architecture ─────┐
quantization/training ───┤
KV/long context ─────────┤
runtime/serving ─────────┼─ unified event ledger ─ edition.json ─ briefing.html
kernel/compiler/operator ┤
hardware/interconnect ───┤
open-world discovery ────┘
```

Scouts 是召回单元，不是出版频道。一个事件只维护一次，可由多个 scouts 发现，并保留多个 topics、system layers 与来源角色。

## 工作流选择

- 搜索、扫描或研究单一方向：使用 `workflows/radar.md`。
- 生成简报、HTML、群发版、正式版或合并 radar：使用 `workflows/briefing.md`。
- 用户补充遗漏链接：进入统一候选池重新核验，并修复可泛化的漏检原因。

## 常规 briefing 必读

- `config/briefing.yml`
- `config/topic-scouts.yml`
- `config/channels.yml`
- `config/sources.yml`
- `config/watchlist.yml`
- `config/tracked-repos.yml`
- `config/editorial-rubric.yml`
- `config/event-taxonomy.yml`
- `workflows/discovery.md`
- `workflows/briefing.md`

## 并行召回

每个 topic scout 默认由独立 subagent 执行，并且必须：

1. 覆盖完整时间窗口；
2. 同时执行 known ecosystem 与 open world discovery；
3. 输出统一候选台账，不写最终 prose；
4. 为全部 event slots 填写 coverage matrix；
5. 对过滤项、访问失败与待核验问题保留最小记录。

Watchlist 和 tracked repos 只做 query expansion 与信号加权，不得成为召回边界。开放世界 scout 负责发现新单位、新仓库、新论文、独立技术博客和跨层工作。

每个 scout × event-slot 单元格必须标记 `checked_with_hits`、`checked_empty` 或 `access_failed`。某个 scout 的命中、硬件 smoke check 或 kernel smoke check 都不能代替另一单元格的检查；smoke check 只是 sentinel。

## 合并与证据

按事件去重，不按链接去重。同一发布的公告、模型卡、API 文档、论文、仓库适配和技术博客可以合并，但必须保留：

- 全部 scout provenance 与 topics；
- system layers；
- 每个来源的 evidence role；
- event date、组织、artifact identity 与成熟度冲突。

重要事实回到一手来源核验；搜索摘要和社交消息只能报警。博客讨论旧对象时，分别记录博客日期与对象日期。

## Gap audit 与 closing sweep

所有 scouts 返回后先执行 gap audit：

- 补齐 coverage matrix 缺项；
- 为 `access_failed` 尝试替代来源；
- 复查薄弱或空白 topic layers；
- 复查单一弱来源候选；
- 为新出现单位扩展官方域名；
- 合并跨 scout 重复并保留多 topic。

随后执行窗口末 72 小时 closing sweep。除 official model blogs、NVIDIA technical sources、repository releases、hardware platforms、independent technical blogs 和 emerging official domains 外，还要定向补扫 gap audit 未解决的 topics。Source-class 状态不能代替 scout coverage。

Kernel scout 还必须单独补扫 AI 辅助算子生成：直接 kernel/operator codegen、compiler-agent 共设计、verifier/cost-model 引导、RL-trained agent、multi-agent/superagent 优化与 library generalization。分别记录首发日期和窗口内 revision/implementation 日期，二次传播不能冒充新事件。

## 编辑与出版

每个出版条目必须有精确名称、组织、`eventDate`、`windowRole`、`maturity`、`editorialRole`、`systemLayer`、`point`、`evidence`、`boundary`、`use` 与一手来源。

出版角色：

- `headline`：最终版重点展开；
- `recommended`：值得突出阅读，在最终版重点展开；
- `full_only`：保留为轻量信号，只写日期、名称与一句增量；
- `context`：窗口外背景，轻量呈现并标明原始日期；
- `risk`：RC、preview 或证据不完整但会影响工程判断的条目，重点展开并写清边界；
- `archive`：只保留在研究候选池。

不要强行制造长期趋势或凑数。厂商 benchmark、作者自报、preview、RC、未开放代码或权重必须标明边界。

群发版正文默认按跨项目读者编写：先用白话说明对象、变化和影响，首次出现的陌生缩写只保留必要者并立即解释。Evidence 不是核验日志，只选一到两个能支撑结论的事实；包发布时间、PR 数、完整设备清单和次要 API 名称写入 canonical 条目的 `verificationNotes`。仅用于核验的来源标记 `display: false`，保留在 edition 中但不进入 HTML。常规升级兼容性不单独组成仓库主题。

## 固定栏目出版

不要用 scout、topic 或抽象 storyline 直接充当 HTML 目录。最终 HTML 只有一个阅读流，固定按以下栏目展开：

1. 新模型进展；
2. 重要仓库进展；
3. 量化与低比特；
4. Serving、Runtime 与系统；
5. Kernel、Compiler 与 Operator；
6. 硬件、互联与平台。

模型栏使用纵向发布时间线，每个模型事件明确写组织、版本、架构、attention mix、量化与可用性；混合注意力在一手 artifact 已披露时必须写层比例或层数，未披露则明示。优先引用官方博客、论文、技术报告或模型卡的主架构图，并提供相对同组织上一代模型的 before / after / impact；不得自行绘制看似官方的替代图，无官方图时明确记录缺失。其余栏目按重要性分配篇幅：`headline`、`recommended`、`risk` 展开 point、evidence、boundary 与 use；`full_only`、`context` 只作一行轻量信号，不为凑篇幅重复证据。仓库栏不逐条陈列 release，而是提炼 2–4 个跨仓库主题；每个主题填写 `readerValue`，列出 2–4 个具名仓库或 release 及其改变的执行路径，再选择 3–5 个最值得阅读的一手链接并说明推荐理由。一个 canonical event 可以进入多个 `briefingSections`，用 `sectionPoints` 写各栏切面，并用 `primaryBriefingSection` 保证只展开一次。

固定栏目内部可用 sectionSpotlights 呈现有至少两个已核验事件支持的方向观察；必须填写 `readerValue`、引用 canonical items、区分窗口内与相邻证据，并写清共同变化、工程含义和边界。Spotlight 不是新的 HTML 顶层栏目。

## Canonical 出版

`outputs/briefing/<date_range>/edition.json` 是唯一出版事实源，`briefing.html` 是唯一默认最终呈现。不得分别手工维护快速版、完整稿、卡片稿和正文稿；内容密度统一由 `editorialRole` 决定。

```powershell
node scripts/lint-briefing.mjs outputs/briefing/<date_range>/edition.json
node scripts/render-briefing.mjs outputs/briefing/<date_range>/edition.json outputs/briefing/<date_range>/briefing.html
```

最终检查：所有 scouts 完成两种召回模式；coverage matrix 无缺项；gap audit 与 closing sweep 已执行；跨 scout 事件正确合并；模型时间线字段完整；HTML 只有一个最终阅读流且固定六栏目顺序正确；所有出版条目均有一手来源；重点与轻量信号的密度符合 `editorialRole`；lint 与测试通过；HTML 可由 edition 重建。
