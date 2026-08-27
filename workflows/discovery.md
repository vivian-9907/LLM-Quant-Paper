# 通用发现工作流

## 目标

提高召回率，同时避免把重点公司、固定仓库或已知关键词变成白名单。历史漏项只作为回归样本，不写专属保留规则。

## 两条并行召回通道

### 已知生态监控

读取 `watchlist.yml`、`tracked-repos.yml` 和频道 profile，稳定检查已知模型、机构、产品、框架与仓库。它们用于 query expansion 和排序加权，不是召回边界。

### 开放世界发现

不限制实体，按时间窗口搜索：

- 新论文及论文关联代码；
- 新仓库、首次 release、模型或 artifact；
- 任意仓库中已合并或高活跃的重要 PR；
- 官方 changelog、updates、release notes、文档新增页；
- 公司或实验室技术报告；
- 学术会议、workshop、公司大会及其技术发布；
- 生产部署、系统 benchmark 和硬件执行路径。

GitHub 搜索必须同时覆盖 tracked repos 和全局 repository / release / merged PR 搜索。不要把“新开源项目”限制为新建仓库；已有项目首次合入端到端能力也属于新事件。

## 官方博客与技术博客

- 每次 briefing 必须读取 `config/briefing.yml` 的 closing sweep 和 `config/sources.yml` 的 `briefing_required`。
- 固定检查重点模型单位官方博客、NVIDIA Technical Blog、硬件平台报告、核心 runtime/repo release 与重点独立技术博客。
- watchlist 不是召回边界：窗口内出现新的高信号单位时，解析其官方域名并补扫完整窗口的 blog/news/changelog。
- 博客讨论旧模型或旧论文时，分别记录“博客发布日期”和“被讨论对象日期”，不得把背景对象误写成本期发布。
- 技术博客只有在提供机制、推导、实验、系统数据或实现细节时进入候选；普通新闻摘要归档。

## 事件槽位

每次常规 radar 必须检查以下槽位，即使结果为空：

1. 模型、API 或 Agent 产品发布；
2. 论文或技术报告；
3. 新开源项目或首次可运行 artifact；
4. 已有开源项目的重要能力合入；
5. Runtime / kernel / framework release 或工作簇；
6. 公司大会、学术会议或集中发布窗口；
7. 生产部署、真实集群或系统 benchmark；
8. 上期主线的新证据、实现或反例。

使用 `config/event-taxonomy.yml` 识别事件，不按公司名称硬编码判断。

## 通用来源策略

- 官方来源发现：RSS/Atom、sitemap、changelog、updates、release notes、版本化文档和新闻页。
- 社交媒体与搜索摘要只作报警源；重要事实回到官方文档、代码、论文或模型卡确认。
- 页面地址失效、长期无更新或与实际发布页分离时，记录 source health 问题，不把“页面无结果”等同于“本周无事件”。
- 对论文提取作者、机构、代码、项目页、模型和依赖仓库，扩展一次关联搜索。
- 对高价值 PR 检查所属项目、合并时间、功能范围、实验状态和 benchmark，不因仓库未被跟踪而丢弃。

## 三阶段处理

### 1. 宽召回

只判断时间与主题可能相关，允许证据不完整。为每个候选记录发现渠道和待核验问题，不在此阶段套用群发版长度或新闻性要求。

### 2. 证据核验

至少核验事件日期与观察窗口、首次公开或普通更新、一手来源、组织归属、artifact/benchmark/部署状态、成熟度，以及指标的测试对象、baseline、硬件和是否为作者自报。

### 3. 技术初筛

使用 `radar-rubric.yml` 判断 `inspect`、`track-code`、`replicate`、`skim`、`watch`、`ignore`。所有 `ignore` 候选保留最小记录，以便复核过滤是否过早。

## Closing sweep

生成最终候选池前重新检查窗口末 72 小时：官方更新与 changelog、新模型/API/公开测试、GitHub release 和 merged PR、新论文版本与关联代码，以及当周大会或临近截止日的技术发布。

Closing sweep 发现的内容走同样的核验流程，不因出现较晚而自动进入简报。

必须对以下槽位记录“已检查/有结果/空结果/访问失败”：重点官方模型博客、NVIDIA 技术博客及 release notes、硬件平台、核心 runtime/repo release、重点独立技术博客、新出现高信号单位的官方域名。缺少任一记录时不得进入出版阶段。

## 覆盖记录

输出：

- 各事件槽位是否检查、使用了哪些来源；
- 已知生态与开放发现是否都执行；
- closing sweep 的执行时间；
- 来源不可访问、速率限制或日期不确定项；
- 人工补录数量和处理状态。
