# Briefing HTML-first 出版工作流

## 目标

从并行 topic scouts 构建一个事件候选池，以单页 HTML 作为最终产物。专题 scout 用于防漏，不是出版目录；最终 HTML 使用固定栏目，让读者先按问题类型扫读，再进入完整证据。

## 必要输入

- 时间窗口；
- `config/topic-scouts.yml` 定义的全部 scout 结果；
- 合并后的统一候选台账与冲突清单；
- scout × event-slot coverage matrix；
- gap audit、closing sweep 与证据核验记录；
- 人工补录与最近一期历史快照；
- `config/briefing.yml` 的出版契约。

任何 scout 都不能直接提交最终 prose。先完成结构化召回、事件合并和覆盖审计，再进入编辑。

## 并行召回与合并

按 `workflows/discovery.md` 为各 topic 启动独立 subagent，并行运行 scouts。每个 scout 都要执行 known ecosystem 与 open world 两种模式，并填写完整 coverage matrix。Smoke check 只触发扩展搜索，不构成覆盖完成。

同一发布的公告、模型卡、论文、仓库适配、release note 和技术博客合并为一个事件，同时保留：

- 全部 scout ids 与 topics；
- system layers；
- 每个来源的 evidence role；
- 发现路径与待核验问题；
- 日期、组织、artifact 或成熟度冲突。

博客讨论旧对象时，分别记录博客发布日期和对象日期。

## Gap audit 与 72 小时 closing sweep

所有 scout 返回后先执行 gap audit：补齐缺失 coverage cells，为 access failures 寻找替代来源，检查薄弱 topic layers、单一弱来源候选和新单位官方域名。不能因候选数量足够而跳过空白分支。

仓库覆盖必须区分“没有正式 release”和“没有高价值变化”。对 Dynamo、LMCache、NIXL、CUTLASS/CuTe、cuTile 等高价值执行链，联合检查正式版、RC/prerelease、staged changelog、版本化文档和 merged work cluster；由一个项目发现的跨仓库依赖要触发 sibling-repo expansion。编辑阶段人工发现的漏项必须回写 tracked repos、watchlist 或查询规则，并在下一次 gap audit 中作为回归样本。

随后对窗口末 72 小时执行 closing sweep。除重点模型单位官方页面、NVIDIA 技术资料、核心 runtime/kernel/compiler 仓库、硬件平台、独立技术博客和 emerging official domains 外，还要定向复查 gap audit 未解决的 topic。每个 source class 和 scout × event-slot cell 使用 `checked_with_hits`、`checked_empty` 或 `access_failed` 记录；两类覆盖记录不能互相替代。

## 候选与时间角色

每个出版条目必须填写：

- `eventDate`；
- `windowRole`：`in_window`、`background` 或 `preannouncement`；
- `maturity`：released、preview、RC、research 等；
- `editorialRole`：headline、recommended、full_only、context、risk 或 archive；
- `systemLayer`；
- `point`、`evidence`、`boundary`、`use`；
- 一手来源；进入最终版的每个条目都必须有一手来源。

窗口外内容只能作为明确背景。厂商 benchmark、作者自报结果、preview、RC 和未开放 artifact 必须直接写明边界。

## 编辑选择

- headline：在最终版重点展开；
- recommended：值得突出阅读的论文、官方技术文档或技术博客，在最终版重点展开；
- full_only：作为轻量信号保留，只写日期、名称与一句增量；
- context：作为轻量背景，必须标明原始日期；
- risk：RC、preview、已知问题或证据不完整，但对工程判断有价值，重点展开并写清边界；
- archive：只保留在研究候选池。

不要强行提炼长期趋势，也不强制填满条目。只有新的、可命名的技术增量进入最终版。

## 固定栏目式 HTML

最终 HTML 只有一个阅读流，并使用以下固定顺序：

1. `model_progress`：新模型进展；
2. `repository_progress`：重要仓库进展；
3. `quantization_low_bit`：量化与低比特；
4. `serving_runtime_systems`：Serving、Runtime、KV 与系统；
5. `kernels_compilers_operators`：Kernel、Compiler 与 Operator；
6. `hardware_platforms`：硬件、互联与平台。

召回 topic、`systemLayer` 与 `briefingSections` 是三套不同维度。一个事件只维护一次，但可以属于多个 `briefingSections`；用 `sectionPoints` 为每个栏目写不同的一句话切面，用 `primaryBriefingSection` 决定最终版只在哪里呈现，避免跨栏目重复。

模型栏使用纵向发布时间线，禁止把多个大卡片挤在单行横向轨道。每个模型事件都填写 `modelProfile.organization`、`version`、`architecture`、`attentionPattern`、`quantization` 与 `generationDelta`，并尽量填写 `availability`。混合注意力在一手 artifact 已披露时必须写层比例或层数，未披露则明确记录。优先从官方博客、技术报告、论文或模型卡引用原始主架构图，写入 `architectureFigure` 并保留图注和一手来源；不得自行重画一张看似官方的架构图。若一手材料没有发布完整主图，填写 `architectureFigureUnavailable`，只保留官方规格与文字说明。代际变化必须和该组织可比的上一代模型写成 before / after / impact；不可比或未披露必须明示。

仓库栏不是 release inventory，也不能只剩抽象结论。完整事实仍保留在 canonical events 中，但 HTML 发布 `repositoryDigest` 时，先用一句话总结跨仓库变化，再提炼 2–4 个共同主题；每个主题必须填写 `readerValue`，列出 2–4 个具名仓库或 release，并说明它实际改变的执行路径、兼容边界或工程决策。最后选择 3–5 个最值得读的官方 release、迁移说明或技术文档，为每个链接写清“为什么值得看”。只有不能被主题吸收、且会直接改变工程决策的单仓库事件，才允许单独展开。

最终版按重要性而不是按两个版本分配信息密度：模型进展保留官方大图、代际变化和来源；`headline`、`recommended`、`risk` 展开 point、evidence、boundary 与 use；`full_only`、`context` 只保留日期、精确名称与一句 point，不重复完整证据和来源列表。仓库栏只呈现主题摘要和少量有理由的推荐链接，不展开 release inventory。

群发版默认面向懂 LLM Infra 但不熟悉每个项目内部术语的读者。正文先解释这个系统是做什么的，再说明本期变化和影响；KV cache、CUDA VMM、DCP、RBLN、MUSA 等缩写或专名首次出现时，要么用一句白话解释，要么在不影响结论时直接省略。evidence 只保留一到两个支撑判断的事实，不复述包发布时间、PR 数、完整硬件适配列表或次要 API 名称；这些细节写入 canonical 条目的 `verificationNotes`，仅用于核验的来源标记 `display: false`，保留在 edition 中但不进入 HTML。

仓库主题必须回答受众为什么要看。常规升级兼容性、参数迁移或破坏性 API 变化不单独组成主题；只有它会改变是否升级、部署方案或性能判断时，才写入对应条目的 boundary。

每个栏目先给一句本栏结论，再列日期、精确名称、变化 point 和必要边界。空栏目明确说明没有足够重要且已核验的更新，不用低价值内容填充。跨领域综合只作为可选补充，不得取代固定栏目，也不得要求读者先理解抽象 storyline。

当同一固定栏目内至少两个已核验事件形成会改变工程决策的子方向时，可以使用 sectionSpotlights 增加一张方向观察卡。卡片必须填写 `readerValue`、引用 canonical item id，区分窗口内证据与相邻背景，并给出共同变化、工程含义和边界；它不是新的顶层栏目，也不能把旧论文的窗口内二次传播写成当期首发。Kernel 栏对 AI 辅助算子生成尤其检查四条路径：直接代码生成、compiler/verifier 约束搜索、RL-trained agent、多 agent/superagent 编排，以及生成结果能否进入 dispatch、library 或真实 serving 路径。

## 唯一出版事实源

`outputs/briefing/<date_range>/edition.json` 是唯一出版事实源，使用 `templates/briefing-edition.json` 初始化。研究阶段的 YAML 和 Markdown 不得冒充最终稿。只生成一个最终呈现版，信息密度由 `editorialRole` 决定。

## 生成

```powershell
node scripts/lint-briefing.mjs outputs/briefing/<date_range>/edition.json
node scripts/render-briefing.mjs outputs/briefing/<date_range>/edition.json outputs/briefing/<date_range>/briefing.html
```

`briefing.html` 是 canonical artifact；Markdown 只作为可选导出。内容修改应回写 edition 后重新生成，禁止分别手工维护 HTML、卡片稿和正文稿。群发 HTML 必须是可独立转发的单文件：`presentation.easterEgg.image` 等本地图片使用 edition 目录内的相对路径，渲染器自动转为 data URL；对应文件保留在该期 `assets/` 并纳入版本管理。

## 输出目录

```text
outputs/briefing/<date_range>/
├── research/
│   ├── scouts/
│   ├── candidates.yml
│   ├── coverage.md
│   ├── gap-audit.md
│   └── verification.md
├── edition.json
├── briefing.html
├── briefing.md
└── manifest.yml
```

最终检查：全部 scout 已完成两种召回模式；coverage matrix 无缺失；gap audit 和 closing sweep 已执行；跨 scout 事件正确合并；模型为纵向时间线，官方主图或缺图声明与代际变化字段完整；HTML 只有一个最终阅读流；重点条目充分展开且轻量信号不重复证据；仓库栏是主题总结与精选链接而不是逐条 release；固定六栏目顺序正确；多栏目事件只在 `primaryBriefingSection` 呈现；所有出版条目均有一手链接；lint 与测试通过且能由 edition 重建。
## Scout 结果合并与覆盖审计

每个 subagent 按 `templates/scout-result.json` 写入一个 JSON。全部返回后直接运行：

```powershell
$scoutFiles = @(Get-ChildItem "outputs/briefing/<date_range>/research/scouts" -Filter "*.json" | Select-Object -ExpandProperty FullName)
npm run briefing:merge -- --out "outputs/briefing/<date_range>/research/merged-candidates.json" $scoutFiles
npm run briefing:audit -- --requirements "templates/scout-requirements.json" --out "outputs/briefing/<date_range>/research/coverage-audit.json" $scoutFiles
```

`briefing:merge` 遇到日期、标题、artifact identity 或 release maturity 冲突时返回退出码 2，并把冲突写入输出。`briefing:audit` 在 coverage cell 缺失或为 `access_failed` 时返回退出码 2；先完成定向补扫和替代来源检查，再进入编辑。
