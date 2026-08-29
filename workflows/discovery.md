# 通用发现工作流

## 目标

以并行 topic scout 提高召回率。每个 scout 独立完成已知生态监控与开放世界发现，输出结构化候选；最终编辑不由任何单个 scout 决定。历史漏项只作为回归样本，不写实体白名单。

## Topic scout 拓扑

读取 `config/topic-scouts.yml`，把每个 topic scout 作为独立 subagent 并行运行：

1. 模型架构与 artifact；
2. 量化方法与训练；
3. KV、内存与长上下文；
4. Runtime、Serving 与调度；
5. Kernel、Compiler 与 Operator；
6. 硬件、互联与平台；
7. 开放世界技术发现。

前六个 scout 负责专题深挖；开放世界 scout 专门寻找 watchlist 之外的新单位、新仓库、新论文、独立技术博客与跨层工作。它不是兜底免责声明，仍须完成自己的覆盖矩阵。

每个 scout 只返回统一候选台账，不写最终 HTML 行文，不自行限制出版数量。候选必须记录 scout id、topics、system layer、发现渠道、证据、待核验问题与过滤原因。

## 每个 scout 的两条召回通道

### 已知生态监控

读取 `watchlist.yml`、`tracked-repos.yml`、相关频道 profile 与重点官方源，稳定检查已知模型、机构、产品、框架与仓库。它们用于 query expansion 和排序加权，不是召回边界。

### 开放世界发现

不限制实体，按完整时间窗口搜索：

- 新论文及论文关联代码；
- 新仓库、首次 release、模型或 artifact；
- 任意仓库中已合并或高活跃的重要 PR；
- 官方 changelog、updates、release notes、文档新增页；
- 公司、实验室或硬件平台技术报告；
- 学术会议、workshop、公司大会及其技术发布；
- 生产部署、系统 benchmark 和硬件执行路径；
- 提供机制、实验或实现细节的独立技术博客。

GitHub 搜索同时覆盖 tracked repos 与全局 repository / release / merged PR。已有项目首次合入端到端能力也属于新事件。对高价值仓库不能只看正式 release：还要检查 prerelease/RC、主分支已写入但尚未打 tag 的 changelog、连续 merged PR 工作簇和版本化文档。正式 release 为空不等于该仓库本期无变化。

当事件牵涉缓存、互连或编译器家族时，执行 sibling-repo expansion：Dynamo 需要联查 NIXL 与 LMCache，CUTLASS/CuTe 需要联查 cuTile；同时记录项目边界，不能把 cuTile 与 CuTe DSL 当成同一个接口层。对 closing sweep 才发现的高价值线索，向窗口前回看 7 天；窗口外事件只能带原始日期作为 context，不能算作本期命中。

## 事件槽位与覆盖矩阵

每个 scout 必须逐一检查 `config/topic-scouts.yml` 中的全部 event slots。每个 scout × event-slot 单元格只能记录：

- `checked_with_hits`：已检查并召回候选；
- `checked_empty`：已检查但没有候选；
- `access_failed`：因访问、限流或来源故障无法完成。

所有单元格都要有状态、查询/来源摘要与时间戳。某个 scout 的命中不能代替另一个 scout 的检查；硬件或 kernel smoke check 也不能把对应 topic 标为已覆盖。Smoke check 只是发现来源异常或触发扩展搜索的 sentinel。

事件槽位包括模型/API 发布、论文/技术报告、新仓库或首次可运行 artifact、已有项目重要能力合入、runtime/kernel/framework 工作簇、集中发布窗口、生产部署/系统 benchmark、上期主线的新证据或反例。使用 `config/event-taxonomy.yml` 判定，不按公司名硬编码。

## 候选池与交叉召回

所有 scout 使用同一候选 schema。按事件去重，不按链接去重：

- 同一事件可由多个 scout 召回，并保留全部 scout provenance；
- 合并 topics、system layers 与不同 source roles；
- 公告、模型卡、论文、仓库适配、release note 与技术博客可归入同一事件；
- event date、组织、artifact identity 或成熟度冲突时，不自动覆盖，进入人工复核；
- 搜索摘要和社交媒体只作报警源，重要事实回到官方文档、代码、论文或模型卡确认。

博客讨论旧对象时，分别记录博客发布日期与对象日期。技术博客按它解释的技术机制归入对应 system layer，不独立形成“博客层”。

## 三阶段处理

### 1. 宽召回

只判断时间与主题可能相关，允许证据不完整。为候选记录发现渠道、scout、关联层与待核验问题，不套用群发版长度或新闻性门槛。

### 2. 证据核验

至少核验事件日期与观察窗口、首次公开或普通更新、一手来源、组织归属、artifact/benchmark/部署状态、成熟度，以及指标的测试对象、baseline、硬件和是否为作者自报。

### 3. 技术初筛

使用 `radar-rubric.yml` 判断 `inspect`、`track-code`、`replicate`、`skim`、`watch`、`ignore`。所有被过滤候选保留最小记录与原因，以便复核是否过早过滤。

## Gap audit

所有 scout 返回后、closing sweep 之前执行 gap audit：

1. 检查 coverage matrix 是否有缺失单元格；
2. 对 `access_failed` 尝试替代来源，未解决时保留明确说明；
3. 识别高优先级 topic layer 的空白或证据过弱区域；
4. 检查只由单一弱来源召回的候选；
5. 检查新出现高信号单位是否已扩展到官方域名；
6. 检查跨 scout 重复是否已按事件合并并保留多 topic。
7. 对用户补录或编辑阶段发现的漏项执行 regression backfill：判断是否应加入 tracked repos/watchlist、补哪一类查询，并记录原覆盖单元格为何误判为完成。

缺失单元格必须补扫；不能用“本期候选已经够多”关闭 gap。

## Closing sweep

Gap audit 后重新检查窗口末 72 小时。除固定 source classes 外，还要针对未解决 topic gaps 定向补扫。Closing sweep 候选走同样的召回、核验、合并与覆盖记录流程，不因出现较晚而自动进入简报。

固定检查重点官方模型博客、NVIDIA 技术资料、核心仓库 release、硬件平台、独立技术博客及新出现单位的官方域名。每类记录 `checked_with_hits`、`checked_empty` 或 `access_failed`；source-class 记录不能代替 scout × event-slot 覆盖矩阵。

## 必需输出

- 各 scout 的候选台账；
- 合并后的统一候选池及冲突清单；
- scout × event-slot coverage matrix；
- 已知生态与开放世界两种模式的执行记录；
- gap audit 与补扫结果；
- closing sweep 时间和 source-class 状态；
- 来源故障、日期不确定项与人工补录状态。
