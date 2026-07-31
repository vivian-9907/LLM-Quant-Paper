# Briefing 编辑工作流

## 输入

- 时间窗口；
- `ai-infra` 与 `quantization` radar 候选；
- `inputs/manual/` 中落入窗口的人工补录；
- `history/editions.yml` 中当前窗口之前最近一期的结构化快照。

若频道 radar 尚未运行，先按 `workflows/radar.md` 和 `workflows/discovery.md` 运行。人工补录不要求重跑全部检索，但必须核验并重新计算相关主题的选题与摘要。

## 最终稿与手工润色

- 若存在 `local/briefing.yml`，生成 briefing 时同时解析最终稿的实际路径，并写入本期 `outputs/briefing/<date_range>/manifest.yml`；本地配置和 manifest 都不提交 Git。
- 第一次生成时可以把包含群发版与正文版的组合稿写到 canonical final path。之后若该文件可能已被用户手工修改，任何自动更新必须先重新读取现有文件，并只修改用户要求的部分；不得用旧草稿整文件覆盖。
- `briefing finalize <path>` 优先使用显式路径；未提供路径时读取本期 manifest 的 `canonical_final_path`；仍没有时才使用仓库内的 `briefing-full.md`。
- Finalize 必须重新读取磁盘上的实际最终文件，从其中重新提取 takeaway、群发入选项、主题判断、full-only items 和 next watch，再 upsert `status: final` 的历史快照。
- 若 canonical 文件不存在或无法读取，停止 finalize 并要求路径；不得用生成阶段的 draft 快照冒充最终稿。

## 统一候选池

把所有来源规范化到 `templates/candidate-ledger.yml` 的字段。按事件而不是按链接去重：

- 同一发布的社交消息、文档和模型卡合并为一个事件；
- 同一论文的 arXiv、项目页和代码合并；
- 同一技术主线的多篇独立工作保持各自名称，但可组成一个版面主题；
- 同一 PR 在两个频道出现时只保留一份事件记录和多个频道标签。

## 历史选择与写回

1. 读取 `history/editions.yml`；
2. 过滤 `window.end < 当前窗口 start` 的记录；
3. 优先选择 `status: final` 且 `window.end` 最大的一期；若只有最近的 `draft`，可使用，但必须在复核记录中提示；
4. 若历史为空但用户提供上一期文件，先按 `templates/edition-history.yml` 导入快照；
5. 若两者都没有，明确标记无历史对照，不编造“上周”；
6. 每次成功生成或修改 briefing 后，按 `window.start + window.end` 对 `history/editions.yml` 执行 upsert：不存在则新增，已存在则原位覆盖，不追加重复记录；
7. 自动写入 `status: draft`、`created_at` 和 `updated_at`；`briefing add` 或后续编辑完成后再次 upsert，确保快照始终对应最新草稿；
8. 当用户说“定稿”“最终版”或执行 `briefing finalize` 时，按“最终稿与手工润色”重新读取 canonical 文件，用磁盘上的实际内容重建并 upsert `status: final` 的快照。

历史快照只保存比较所需的结论、入选项、主题状态和 next watch；完整正文仍留在 `outputs/briefing/`。用户不需要手工编辑历史文件。

## 与上期比较

为每个主题标记：

- `new`：本期全新事件；
- `new_evidence`：延续上期，但新增生产数据、benchmark 或技术证据；
- `new_implementation`：延续上期，但出现代码、artifact、API 或 runtime 落地；
- `continuation`：有新工作，但结论主要延续；
- `repeat_only`：没有足够增量。

开头允许用一句话承接上周。重复信号可以保留，但必须写清本周新增内容。

## 编辑筛选

使用 `config/editorial-rubric.yml`，将候选分为：

- `headline`：进入群发版和正文；
- `trend`：与其他候选合并为趋势；
- `full_only`：只进入正式版；
- `watch`：进入观察项；
- `archive`：只保留在候选池。

不要让普通兼容性 PR、缺乏增量的框架变更或证据不足的项目挤占群发版。若 runtime/kernel 在本周形成清晰工作簇，可以单列；否则合并进正文的工程信号。

## 双版本生成

### 群发版

使用 `templates/briefing-card.md`。假设最终可能被制作成无链接图片：

- 写出准确项目/论文/模型名称；
- 写出机构或项目归属；
- 写清发生了什么；
- 最多保留一个最有辨识度的指标；
- 对 beta、experimental、自报数据等给出短限定；
- 不依赖“点击链接才能理解”。

### 正式版

使用 `templates/briefing-full.md`，与群发版使用同一选题决策；保留一手链接、技术机制、完整指标和证据边界，并补充 `full_only`、观察项和来源索引。不要把正文写成两个 radar 的简单拼接。

## 人工补录

当用户说“补充这个”“这个漏了”或提供链接/文本时：

1. 按 `templates/manual-candidate.yml` 记录到 `inputs/manual/<date_range>.yml`；
2. 保留用户原始说明；
3. 自动补齐事件类型、日期、来源、组织、技术增量和证据状态；
4. 标记 `origin: manual` 和漏检原因；
5. 进入统一候选池并按相同标准筛选，不默认强制上头条；
6. 若已有本期 briefing，更新受影响的选题、趋势、群发版和正式版；
7. 把漏检原因归类，用于改进通用 collector、taxonomy 或过滤规则，不为单个名字增加专属保留规则。

## 输出目录

```text
outputs/briefing/<date_range>/
├── candidates.yml
├── coverage.md
├── verification.md
├── selection.yml
├── manifest.yml
├── briefing-card.md
└── briefing-full.md
```

最终自检：群发版与正文事实一致；正文包含所有头条的一手链接；时间在窗口内或明确作为背景；组织归属、发布状态和成熟度不强于证据；closing sweep 与人工补录均已处理；draft 已自动 upsert；finalize 时已从实际最终文件重建 final 快照。
