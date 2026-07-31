---
name: llm-infra-briefing
description: Discover, verify, select and publish LLM Infra briefings. 用于运行 quantization / ai-infra radar，发现近期论文、模型/API 发布、技术报告、开源项目、重要仓库变更、会议和生产系统信号；也用于合并多频道候选、与上期比较、接收人工补录，并生成无链接可读的群发版和带来源的正式版。
---

# LLM Infra Briefing

## 概览

使用这个 skill 执行两层 LLM infra 简报工作流：

- `radar`：按频道发现并筛选候选。
- `briefing`：合并频道候选与人工补录，完成复核、编辑和双版本发布。

当前频道来自 [config/channels.yml](config/channels.yml)：

- `quantization`：LLM quantization、低 bit 推理/训练、多模态/全模态模型量化、模型压缩、serving 优化和系统/runtime 工作。不要把这里的“量化”理解成金融量化。
- `ai-infra`：LLM infrastructure、serving/runtime、training systems、MoE、通信并行、kernel/operator、硬件亲和和端到端性能分析。

## 工作流选择

- 当用户要求搜索、扫描、监控、推送、发现或总结近期有价值的论文/项目/博客/artifact 时，使用 [workflows/radar.md](workflows/radar.md)。
- 当用户要求生成周简报、群发版、卡片版、正式版，或合并多个 radar 时，使用 [workflows/briefing.md](workflows/briefing.md)。
- 当用户要求补充一条系统漏掉的新闻、论文、项目或链接时，按 [workflows/briefing.md](workflows/briefing.md) 的“人工补录”处理。
- 如果用户没有显式指定频道，但提到量化、低 bit、KV cache compression、FP4/FP8、multimodal quantization，默认使用 `quantization`。
- 如果用户没有显式指定频道，但提到 serving、vLLM、SGLang、推理系统、训练系统、MoE、通信、kernel、硬件或性能分析，默认使用 `ai-infra`。

## 共享规则

- 频道路由来自 [config/channels.yml](config/channels.yml)。
- 默认频道画像来自 `config/channels/<channel>/profile.yml`。常规 radar 每次读取 profile，用于频道主题和噪音过滤。
- 重点实体来自 [config/watchlist.yml](config/watchlist.yml)。常规 radar 每次读取，用于固定搜索模型、agent 产品、机构和框架更新。
- 专家、maintainer、实验室和研究团队来自 [config/experts.yml](config/experts.yml)。只在作者/实验室归因有帮助、用户指定专家、论文召回不足或专项扫描时读取；用于 query expansion 和 signal weighting，不是强制保留名单。
- 会议、workshop 和 benchmark 场域来自 [config/venues.yml](config/venues.yml)。只在会议/benchmark 扫描、论文召回不足或需要 venue context 时读取；会议名不是直接 source，除非具体页面已写入 `sources.yml`。
- 完整主题来自 `config/channels/<channel>/topics.full.yml`，仅在专项扫描、召回不足或分类不确定时读取。
- 来源配置来自 [config/sources.yml](config/sources.yml)。
- 具体 GitHub 仓库清单来自 [config/tracked-repos.yml](config/tracked-repos.yml)。当 source_scope 包含 framework releases、repo activity、GitHub releases 或 GitHub activity 时读取；每个 repo 只在这里维护一次，通过 `source_modes` 决定扫描 release / activity。
- radar 初筛使用 [config/radar-rubric.yml](config/radar-rubric.yml)。
- 常规 radar 按 [workflows/discovery.md](workflows/discovery.md) 执行通用事件发现；重点实体和仓库只用于加权与稳定监控，不得成为召回边界。
- 事件分类和最低证据要求来自 [config/event-taxonomy.yml](config/event-taxonomy.yml)。
- briefing 的版面取舍使用 [config/editorial-rubric.yml](config/editorial-rubric.yml)，不要用 radar 分数直接决定群发版。
- briefing 的上期对照读取 [history/editions.yml](history/editions.yml)，优先选择当前窗口之前最近的 final；每次生成或修改自动 upsert draft；finalize 必须根据 `local/briefing.yml` 或 manifest 重新读取用户实际润色后的文件，再重建 final 快照。
- 修改 discovery、taxonomy、source 或 prefilter 规则时，按 [references/recall-regression.md](references/recall-regression.md) 做历史召回回归；样本只用于测试，不得变成生产白名单。
- 输出模板优先使用频道在 [config/channels.yml](config/channels.yml) 中配置的 `template`；未配置时使用 [templates/radar-result.md](templates/radar-result.md)。
- 标签、技术方向、应用场景和成熟度阶段参考 `references/channels/<channel>-map.md`，仅在需要方向解释、方向观察或分类不确定时读取。
- 消费关系：频道 profile 用于默认召回和过滤；sources 用于选择来源通道；tracked-repos 用于 GitHub release / activity 直连监控；watchlist 用于模型、agent 产品和框架发布监控；experts / venues 用于按需扩展召回、归因和上下文；full topics / research map 用于按需扩展。
- 输出风格遵循 [references/prompt-style.md](references/prompt-style.md)：简洁、判断明确、证据优先。
- 优先保证有用和高信号，不强行凑固定数量；如果高价值候选很少，就少列或说明本轮没有强候选。
- 召回阶段偏宽，核验和编辑阶段再收紧；不要为了简报短而在发现阶段过早删除候选。
- 每次周度运行在截止前执行 closing sweep，专门检查窗口末 48 小时的新发布和重要合入。

## 输出约定

如果需要保存文件，写入：

- `outputs/<channel>/radar/`：保存 radar 报告。

- `outputs/briefing/<date_range>/`：保存统一候选池、复核记录、选题决策、群发版和正式版。
- `inputs/manual/`：保存用户人工补录的候选；补录不等于强制入选，但必须进入复核。
- `history/editions.yml`：保存仅限本机、由 `.gitignore` 排除的精简历史快照，用于自动周际比较。

如果用户没有要求保存文件，就在对话中按对应模板输出：

- [templates/radar-result.md](templates/radar-result.md)
