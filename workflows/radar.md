# Radar 工作流

## 目的

从固定频道的研究范围内发现有价值的论文、项目、模型发布、agent 产品更新、框架 release、重要仓库 activity、博客、benchmark 和 artifact，输出轻量简报。不要为了数量填充低价值条目。

## Topic scout 模式

当 radar 由常规 briefing 调用时，它是 `config/topic-scouts.yml` 中一个 topic scout 的执行单元，而不是完整 briefing 的冒烟测试。调用方必须传入 scout id，并要求该 scout 对完整窗口同时执行 known ecosystem 与 open world discovery，输出统一候选台账及 scout × event-slot coverage 记录。

多个 topic scouts 应并行运行。候选由后续 merge 按事件去重；同一事件允许被多个 scouts 召回并保留多个 topics。Radar 不写最终 HTML prose，也不以某个频道已有命中为由跳过其他 scouts。

## 输入

只需要：

- `channel`：`quantization` 或 `ai-infra`。如果用户没有显式指定，按 `SKILL.md` 的默认频道规则推断。
- `time_range`：今天、本周、过去 30 天，或明确日期范围。
- `scout_id`：由 briefing 调用时必填，取自 `config/topic-scouts.yml`。独立 radar 可省略。
- `source_scope`：全部来源、只查 arXiv、只查 GitHub、只查 Hugging Face、只查 RSS、只查 model releases、只查 framework releases、只查 agent products、只查 repo activity，或 `config/sources.yml` 中定义的来源组。

默认不要要求用户提供临时关键词。常规 radar 读取 `config/channels/<channel>/profile.yml` 和 `config/watchlist.yml`：profile 决定频道主题，watchlist 决定每周固定关注的模型、agent 产品、机构和框架。`config/sources.yml` 决定来源通道；当使用 GitHub release / activity 类来源时，读取 `config/tracked-repos.yml` 获取具体 repo 清单。`config/experts.yml` 和 `config/venues.yml` 按需读取，用于作者/团队/会议线索的 query expansion、归因和信号加权，不是保留门槛。只有在专项扫描、召回不足、分类不确定或用户要求完整覆盖时，才展开读取 `topics.full.yml` 和频道 research map。

## 领域限定与软过滤

当用户使用“专项”“只看”“聚焦”“某个方向”“某个领域”“围绕某类”等表达时，把它理解为本轮 radar 的领域限定，而不是新的自由关键词系统。

处理方式：

- 先把用户表达映射到本频道 profile 中最接近的核心方向；如果 profile 不够判断，再展开 `topics.full.yml` 和频道 research map。例如 `quantization` 频道可映射到 KV cache、optimizer quantization、balanced/outlier-aware quantization、FP4/MXFP4/NVFP4、多模态量化、visual token compression、kernel/runtime、rotation/transform、long-context mechanisms for compression；`ai-infra` 频道可映射到 serving/runtime、speculative decoding、MoE systems、training systems、communication、kernel/operator、architecture infra impact、performance analysis。
- 搜索和筛选时优先保留该子类的核心候选；明显不属于该子类、且无法解释关系的条目应过滤掉。
- 允许保留相邻候选，但必须满足至少一个条件：提供该子类的 baseline、benchmark、runtime 依赖、kernel/artifact 路径、上游/下游方法，或能解释该方向的技术趋势。
- 对相邻候选必须在候选表或详情中标注“关联原因”，例如“作为 KV cache 压缩 baseline”“提供 FP4 runtime artifact”“与 outlier balancing 共享 activation scaling 思路”。
- 不要因为用户说“只看某方向”就机械丢弃所有交叉工作。量化与 infra 常有交叉：例如 balanced/outlier-aware 与 rotation/transform 交叉，KV cache 压缩与 serving/runtime 交叉，optimizer quantization 与 training/finetuning 交叉，MoE 与通信/算子/runtime 交叉。
- 如果相邻候选太多，最多保留少量高证据条目，并把其余方向写入“暂不展开的子类及原因”。

如果用户的领域限定无法通过 profile 映射到现有子类，再用 `topics.full.yml` 的同义词和频道研究地图做近似归类；仍不确定时，在输出中明确说明本轮采用的解释口径。

## 方向观察（可选）

默认不写方向观察。只有用户指定子方向，或候选足以支持方向级判断时才写：

- 同一子类下有 2 个以上高价值候选，并且共享明确技术问题、方法、数据格式、runtime 路径或实验趋势。
- 或者只有 1 个候选，但它有强证据：论文、代码、release note、artifact、benchmark 或工程落地信号明确。
- 用户明确要求观察某个子类。

不要在只有弱候选、near-miss、标题关键词或证据不足时写趋势判断。方向观察最多 1-3 个子类，必须说明触发依据、代表工作、共同点、不确定性和下一步动作。

## 执行步骤

1. 读取 `config/channels.yml`，确定本轮 `channel`。若由 briefing 调用，同时读取 `config/topic-scouts.yml` 并锁定 `scout_id`；不要把频道边界当成 scout 的召回边界。
2. 读取该频道的 `profile.yml`、`config/watchlist.yml`、`config/sources.yml` 和 `config/radar-rubric.yml`。
2a. 读取 `workflows/discovery.md` 和 `config/event-taxonomy.yml`；已知实体/仓库监控与开放世界发现必须并行执行，前者不得成为白名单。
3. 用频道 profile 生成主题搜索 query，用 watchlist 扩展每周固定关注实体的搜索 query；watchlist 用于召回和筛选，不代表最终报告必须覆盖每个实体。`ai-infra` 常规 radar 必须包含一组 architecture infra impact query，覆盖 attention architecture、KV-sharing / low-rank / grouped attention variants、sparse / linear / sliding-window / hybrid attention、MoE architecture、routed / shared / hierarchical experts、expert-choice routing、residual stream、Hyper-Connections、xHC/mHC、sparse residual paths、architecture scaling、training FLOPs、memory traffic、MoE pre-training efficiency 等词，避免只召回 serving/runtime 和 repo release。
3a. `ai-infra` 常规 radar 必须执行 hardware platform smoke-check。不要把它当成可选补充。先读取 `profile.yml` 中 `required_smoke_checks.hardware_platform_reports`，并把 `exact_query_terms` 和 `official_source_terms` 作为本轮固定 query 组执行；这些 query 至少覆盖 Rubin、Blackwell、Instinct、TPU、AI Hypercomputer、NVLink、rack-scale、AI factory。若任一结果命中 official platform report、architecture deep dive、HBM/HBM4/memory bandwidth、interconnect/NVLink/fabric、rack-scale/NVL/AI factory、power/cooling/tokens per watt、MoE/all-to-all/expert routing、long-context attention/KV cache capacity、partner benchmark 或 deployment status，则必须展开 `hardware_platform_reports` 来源组并检查官方页面 / vendor blog。该 smoke-check 不应压过 serving/runtime、paper 和 repo activity 主线，但必须在运行元信息里写明执行过哪些硬件关键词、是否命中、是否展开，以及若未保留候选的原因。它只是 sentinel，不能把 hardware scout 或任何 coverage cell 标为已完成。
3b. `ai-infra` 常规 radar 必须执行 operator / kernel smoke-check。不要把它当成普通 repo activity 的可选子集；对有昇腾算子、CANN/ATB、CUDA/Triton/CUTLASS/FlashInfer 或硬件后端背景的读者，这是固定主线。先读取 `profile.yml` 中 `required_smoke_checks.operator_kernel_reports`，并把 `exact_query_terms` 和 `official_source_terms` 作为本轮固定 query 组执行；这些 query 至少覆盖 Ascend CANN、ATB、torch-npu、Triton、FlashInfer、CUTLASS、cuDNN Frontend、TensorRT-LLM kernel、SGLang kernel、vLLM kernel、ROCm、MoE GEMM、MLA kernel、FlashAttention、fused operator。若任一结果命中 CANN/ATB/torch-npu release note、Ascend NPU kernel/operator、custom/fused operator、Triton/CUTLASS/FlashInfer/cuDNN Frontend release、runtime kernel backend integration、MLA/FlashMLA/FlashAttention/GQA/MQA、MoE GEMM/grouped GEMM/fused MoE、FP8/FP4/NVFP4/MXFP4/INT4 low-bit kernel path、TMA/WGMMA/TMEM/blockscale/swizzle/layout optimization、ROCm/HIP/gfx950/backend path，或带 latency/throughput/bandwidth/occupancy/memory traffic 的 benchmark，则必须展开 `operator_kernel_reports` 来源组并检查对应 release / PR / changelog / official page。该 smoke-check 不应压过 serving/runtime、paper 和硬件主线，但必须在运行元信息里写明执行过哪些算子关键词、是否命中、是否展开，以及若未保留候选的原因。它只是 sentinel，不能把 kernel/operator scout 或任何 coverage cell 标为已完成。
4. 如果 source_scope 包含 github_releases、github_activity、framework_releases 或 repo_activity，读取 `config/tracked-repos.yml`，按当前频道和 repo 的 `source_modes` 过滤出本轮要查的仓库。
5. 当 source_scope 包含 papers / arxiv / github / rss / vendor_blogs / repo_activity，用户指定作者/实验室/maintainer，或候选归因有助于排序时，读取 `config/experts.yml` 和/或 `config/venues.yml`。专家和会议只用于 query expansion、venue context、attribution 和 signal weighting，不能替代保留标准；`primary_channels` 命中强于 `related_channels`，后者只作为弱相关信号或排序 tie-breaker。
6. 默认不要读取 `topics.full.yml` 和频道 research map；只有在专项扫描、召回不足、分类不确定、需要方向观察或用户明确要求完整覆盖时才展开读取。
7. 在指定时间范围和来源范围内搜索。
7a. 按事件槽位补充通用搜索：模型/API、论文/技术报告、新开源项目、已有项目重要合入、runtime/kernel 工作簇、会议/公司活动、生产系统证据和上期主线增量。全局 GitHub discovery 不受 `tracked-repos.yml` 限制。
8. 如果用户给出领域限定，先按“领域限定与软过滤”确定本轮核心子类和允许保留的相邻子类。
9. 先用频道 profile、watchlist 和 `config/radar-rubric.yml` 的 `prefilter_gates` 做主题过滤；未通过过滤的条目直接丢弃或标记为 `ignore`。
9a. 召回阶段允许证据不完整；未通过后续核验或初筛的候选保留最小记录与过滤原因，不直接从候选账本消失。
10. 对领域限定场景，再用软过滤判断条目是核心候选、相邻候选还是应过滤条目；相邻候选必须能解释其关系。
11. 读取本频道在 `config/channels.yml` 中配置的 `template`；如果未配置，则使用 `templates/radar-result.md` 作为 fallback。
12. 将通过过滤的结果整理成 Briefing Card。每条保持轻量，默认 2-5 行，避免长摘要：
   - 标题
   - 链接
   - 来源
   - 发布或更新时间
   - 类型：论文、代码、博客、benchmark、数据集、报告、model release、agent product update 或 framework release
   - 子类：默认使用频道 profile 中的核心方向；展开时可使用 full topics / research map 中的子类
   - 如果本轮有领域限定，说明是否属于核心候选或相邻候选；相邻候选必须写关联原因
   - 对模型 / agent / artifact：简要描述、技术博客或文档、开源状况、关键技术信号
   - 对论文：主要内容、所属趋势、证据强度、是否值得精读
   - 对开源项目：做什么、亮点、成熟度、是否值得看代码
   - 对重要仓库 activity：本周 PR / release 变化、趋势判断、影响
   - 频道关键信号：量化写数据格式/压缩率/checkpoint/kernel/runtime；infra 写系统层级/性能/扩展性/runtime/repo activity
   - 证据
   - 初筛信号摘要
   - 建议动作
13. 丢弃明显过时、浅层或只有营销信息的低信号条目。
14. 对 `quantization` 频道的 `long_context_mechanisms_for_compression` 这类相邻机制/挑战标签，只有在候选明确连接到量化、KV cache 压缩、serving、activation outlier、memory 或 inference efficiency 时才保留；否则过滤或标为 `ignore`。
15. 对 `quantization` 频道的 `multimodal_quantization` 这类多模态标签，优先保留明确涉及 VLM/MLLM/LVLM、视觉/视频/语音 encoder、modality projector、cross-modal attention、visual tokens、多模态 KV cache、DiT/diffusion transformer、serving/runtime 或 kernel 的候选；纯图像压缩、传统视频 codec 或和 LLM/transformer 推理无关的图像量化应过滤。
16. 对综述/benchmark/taxonomy，只在它明确聚焦本频道核心范围时保留；主要建议动作为 `skim`、`inspect` 或 `update-map`。
17. 对模型发布、agent 产品更新、硬件平台报告和框架 release，结合 watchlist 判断是否属于重点实体；只有当它包含模型版本、架构、context length、runtime 支持、量化 artifact、benchmark、kernel、兼容性信息、agent 工作流变化、工具调用能力、IDE/CLI/GitHub 集成、权限/沙箱变化、rack-scale topology、interconnect、power/cooling、token-cost、partner benchmark 或 deployment status 时才保留。
17a. 对 `ai-infra` 的架构类论文，不能只按 serving/runtime 过滤。若论文明确说明 attention / MoE / residual-stream 等架构改变会影响 compute graph、KV cache layout、prefill/decode cost、routing、all-to-all、expert parallelism、memory traffic、training FLOPs、MFU、kernel path、通信形态、MoE pre-training efficiency 或 serving/training runtime，即使不是系统框架论文，也应作为 `architecture infra impact` 候选保留。
17b. 对 `ai-infra` 的硬件平台报告，不能只依赖单一 developer technical blog RSS。若官方新闻页、vendor blog、partner benchmark 或 whitepaper 明确给出 rack-scale topology、interconnect/fabric、HBM、low-bit hardware path、power/cooling、token-cost、MoE all-to-all、KV capacity、deployment status 或 partner benchmark，即使它是 vendor blog 而不是论文或 framework release，也可作为高价值技术报告候选保留。若只有发布口号、股价/市场信息或泛数据中心营销，不保留。
17c. 对 `ai-infra` 的硬件 smoke-check 结果，不能因为“不是论文 / 不是 framework release / 不是 repo activity”而丢弃。只要官方技术报告或架构 deep dive 落在时间范围内，并包含 `profile.yml` 的 `required_smoke_checks.hardware_platform_reports.expand_hardware_platform_reports_if_any` 中任一系统证据，就进入候选池；再按 rubric 排序。若被过滤，必须在 Near Miss 写出过滤原因。
17d. 对 `ai-infra` 的 operator / kernel smoke-check 结果，不能因为“只是 nightly / 只是 PR / 不是模型发布”而直接丢弃。若 release note、PR、commit cluster、官方文档或 benchmark 明确涉及 Ascend CANN/ATB/torch-npu、Triton/CUTLASS/FlashInfer/cuDNN Frontend、runtime kernel backend、MLA/FlashAttention、MoE GEMM、low-bit GEMM、operator fusion、layout/swizzle/TMA/WGMMA/TMEM、ROCm/HIP 或其他硬件后端路径，并能解释其对 latency、throughput、memory bandwidth、occupancy、compile path、serving compatibility 或 training/serving bottleneck 的影响，就进入候选池；再按 rubric 排序。若只有自动 binary rebuild、wheel availability 或无说明 nightly，可放入 Near Miss / watch，并说明“缺少 kernel 变更证据”。
17e. kernels_compilers_and_operators scout 必须单独完成一次 AI 辅助算子生成检查：覆盖直接 CUDA/Triton/CuTe/Ascend C 生成、compiler-agent 共设计、verifier/cost-model 引导、RL-trained kernel agent、multi-agent/superagent 优化与从单 shape 到 dispatch/library 的泛化。记录原始发布日期和窗口内 revision/implementation 日期，不能把窗口内二次传播当成新发布；只有具备一手论文/仓库且至少披露 correctness gate、目标硬件、benchmark baseline、搜索预算或 upstream integration 之一时才保留。
18. 先按子类聚合候选，并判断是否有子类满足方向观察条件。
19. 在子类内按初筛评分排序，不按固定 Top N 凑数。
20. 在输出开头给出“本轮方向摘要”：哪些子类强、哪些子类弱、哪些子类满足方向观察条件、哪些子类暂不展开以及原因。
21. 按频道模板输出轻量简报，不默认输出大表格。`ai-infra` 的 full report 顺序是：新模型与 agent 产品、新论文趋势、高优先级论文、高价值技术报告 / 架构报告 / 工程文章、高优先级开源项目、重要仓库 PR / Release 趋势。`quantization` 的顺序是：新模型与量化 artifact、新论文趋势、高优先级论文、高优先级开源项目、高价值技术博客 / 工程文章、重要仓库 PR / Release 趋势。
21a. 当频道配置了 `digest_template` 且需要保存结果时，同时生成工作群短简报，写入该频道 `outputs.digest` 对应目录。短简报不替代 full report；它只保留一句话结论、新模型 / Agent 产品或新模型 / 量化 Artifact、本周必看、本周趋势、可跳过和完整版链接。
21b. 保存结果时，同时按 `templates/candidate-ledger.yml` 输出结构化候选，供跨频道 briefing 去重和编辑；频道 digest 不是最终群发版的唯一来源。
22. 只有当“本轮方向摘要”已经点名某个子类满足条件时，才补充“方向观察”。方向观察要总结方向级信号、共同点、分歧和下一步，而不是重复单条候选。
23. 如果某个子类本轮信号明显，可以补充方向观察；证据不足时必须写入“暂不展开的子类及原因”。
24. 如果用户已有历史表格或明确要求维护历史记录，可以追加“历史表格”；第一版默认只预留，不强制维护。
25. 如果没有高价值结果，直接说明；只有在有帮助时才列出少量 near-miss。
25a. 输出前按 `workflows/discovery.md` 先完成 scout × event-slot coverage 与 gap audit，再执行窗口末 72 小时 closing sweep。必查 source class、来源失败和人工补录状态要单独记录；source-class 检查不能代替 topic scout 覆盖。
25b. 若用户要生成最终周简报，转入 `workflows/briefing.md`，把所有 scanner 候选合并为统一事件池，不要直接拼接频道 digest。

## 来源说明

- arXiv：重点看标题、摘要、日期、类别、作者，以及是否有代码。
- GitHub：优先关注论文关联仓库、kernel/runtime 集成、活跃维护、stars、近期提交和 benchmark 证据。
- GitHub Releases / repo activity：优先关注 `config/tracked-repos.yml` 中和本频道相关的仓库，筛选模型支持、serving、训练、量化、kernel、PR 趋势和 breaking changes。
- Hugging Face：按频道过滤模型卡、paper/project 关联、artifact、benchmark、推理示例和 runtime 使用说明。不要扩展成泛模型能力新闻监控；只保留和本频道目标相关的条目。
- Model hubs：关注新模型版本、模型卡、context length、架构、license、quantized checkpoint、GGUF/safetensors、runtime 兼容和 benchmark。
- Vendor blogs：关注官方模型发布、agent 产品更新、硬件平台 / AI factory 报告、技术博客和框架公告；过滤只有营销表述、没有技术细节的普通新闻。
- Hardware platform reports：关注官方 vendor blog、data center 页面和 partner benchmark。重点保留 rack-scale topology、interconnect、token-cost、power/cooling、MoE all-to-all、KV capacity、deployment status 等系统证据。
- RSS：实验室、公司、博客和工程团队文章只有在有明确技术细节，或指向论文/代码时才保留。

## 候选动作

使用以下动作之一：

- `ignore`：相关性或证据不足。
- `skim`：可能有用，但证据较弱。
- `inspect`：值得后续人工检查、代码检查或单独技术分析的强候选。
- `track-code`：主要价值在实现、runtime 集成或代码。
- `replicate`：实验、benchmark、artifact 或代码路径足够明确，值得后续复现或跑通最小验证。
- `watch`：有潜力但还不成熟，等待代码、实验或后续版本。
- `update-map`：主要价值在更新研究地图、关键词、benchmark 视角或评分标准，常用于综述、taxonomy、benchmark 或 position paper。

## 必需输出

优先使用频道配置的模板：`quantization` 使用 `templates/radar-result-quantization.md`，`ai-infra` 使用 `templates/radar-result-ai-infra.md`。如果频道没有配置模板，再使用 `templates/radar-result.md`。必须包含：

- 搜索时间范围和来源范围
- 本轮频道与 scout id（如适用）、读取的 profile、是否读取 tracked-repos / experts / venues、是否展开 full topics / research map、来自配置的主题/查询依据
- 由 briefing 调用时，输出该 scout 的 known ecosystem/open world 执行记录与完整 event-slot coverage 状态
- `ai-infra` 常规 radar 必须报告 hardware smoke-check：执行的硬件关键词、官方来源 query、是否命中、是否展开 `hardware_platform_reports`、最终保留或过滤了哪些硬件平台候选
- `ai-infra` 常规 radar 必须报告 operator / kernel smoke-check：执行的算子关键词、官方来源 query、是否命中、是否展开 `operator_kernel_reports`、最终保留或过滤了哪些算子/kernel/compiler-backend 候选
- 如用户给出“专项/只看某方向”等领域限定，说明本轮核心子类、软过滤口径和相邻候选保留规则
- 本轮方向摘要：强信号子类、弱信号子类、满足方向观察条件的子类、暂不展开的子类及原因
- 按频道模板组织的轻量简报
- 只列有价值候选
- 每个候选为什么重要
- 频道相关的关键信号：量化看数据格式/压缩率/checkpoint/kernel/runtime；infra 看系统层级/性能/扩展性/runtime/repo activity
- 初筛信号摘要
- 下一步建议动作
- 只有满足方向观察条件时才补充方向观察；否则明确写“本轮无方向观察”
- 必要时补充历史表格预留

频道如果配置了 `digest_template`，并且本轮保存结果，则额外输出群发短简报。短简报必须满足：

- 不改变、不压缩 full report；full report 仍作为完整归档。
- 面向工作群阅读，控制在 1 屏到 2 屏左右。
- `ai-infra` 单独包含“新模型 / Agent 产品”，但只收有 infra、quant、serving、model-card、runtime、benchmark、agent workflow 或 API 行为信号的发布。
- `quantization` 单独包含“新模型 / 量化 Artifact”，但只收有量化、压缩、serving、runtime、kernel、model-card、benchmark 或 quantized checkpoint 信号的发布。
- “本周必看”优先列 3-5 条最高价值候选，混排论文、技术报告、repo release、工程博客和模型发布。
- 每条必须包含动作：`精读`、`看代码`、`观察` 或 `跳过`。
- 结尾提供 full report 链接或本地路径。

不要写死 “Top N”。可以使用“高价值候选”“值得观察”“本轮无强候选”等标题。
