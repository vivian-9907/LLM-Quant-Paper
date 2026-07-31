# Recall 回归样本

修改 discovery、taxonomy、source 或 prefilter 规则后，用历史窗口检查召回能力。样本中的实体只用于测试，不得转化为生产白名单。

## 2026-07-24 至 2026-07-31

### 官方 API 发布

- 样本：DeepSeek-V4-Flash Official API public beta。
- 期望事件：`model_api_or_agent_release`。
- 期望路径：official updates/changelog 或发布报警源发现，再由 API 文档核验。
- 失败条件：只检查固定 news 页面，或因初始文案像营销内容而在核验前删除。

### 非重点仓库的重要合入

- 样本：Miles 的 Blackwell MXFP8 / NVFP4 RL 路径。
- 期望事件：`material_open_source_change`。
- 期望路径：全局 GitHub merged PR / release discovery，或从论文、框架和硬件关键词扩展发现。
- 失败条件：只有 tracked repositories 才能进入候选池，或把已有项目的重要新路径误当成“不是新项目”。

## 通过标准

- 两类事件都进入候选账本，不要求自动进入 headline；
- 日期、来源角色、成熟度和技术增量可核验；
- 召回不依赖样本实体出现在 watchlist 或 tracked-repos；
- 最终版面仍由 `editorial-rubric.yml` 决定。
