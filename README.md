# LLM Infra Briefing

> 当前架构：并行 topic scouts，一个事件候选池，一份自上而下的 HTML。

## 结论

常规 briefing 不再依赖两个频道 scanner 加少量冒烟检查。它并行运行模型架构、量化训练、KV/长上下文、服务调度、kernel/compiler/operator、硬件互联与开放技术发现七个 scouts。

```text
7 topic scouts ─ coverage matrix ─ merge/gap audit ─ edition.json ─ briefing.html
```

每个 scout 都做已知生态与开放世界发现；同一事件可由多个 scouts 召回，合并后只维护一次并保留全部 topics 和证据。Smoke check 只作 sentinel，不代表对应专题已覆盖。

## 使用方式

单方向扫描仍使用 radar：

```text
radar quantization 本周
radar ai-infra 过去 30 天
radar ai-infra 只看 kernel 和硬件
```

正式 briefing 使用完整 topic scout 拓扑：

```text
briefing 2026-08-15 2026-08-28
```

具体 scout、event slots、coverage 状态和系统层级见 `config/topic-scouts.yml`。

## 防漏流程

1. 七个 scouts 作为独立 subagents 并行运行；
2. 每个 scout 同时执行 known ecosystem 与 open world；
3. 每个 scout × event-slot 记录 `checked_with_hits`、`checked_empty` 或 `access_failed`；
4. 按事件合并跨 scout 候选，保留多 topic 与多来源；
5. 执行 gap audit，补齐缺项和替代来源；
6. 再执行窗口末 72 小时 closing sweep。

Watchlist 用于查询扩展，不是召回边界。候选已经很多也不能跳过空白 coverage cells。

## HTML 出版顺序

`edition.json` 是唯一出版事实源。最终 HTML 使用固定栏目组织：

1. 新模型进展（发布时间线）；
2. 重要仓库进展；
3. 量化与低比特；
4. Serving、Runtime 与系统；
5. Kernel、Compiler 与 Operator；
6. 硬件、互联与平台。

HTML 只有一个最终阅读流：`headline`、`recommended`、`risk` 展开，`full_only`、`context` 轻量呈现。同一事件可进入多个栏目，用 `sectionPoints` 写不同技术切面，并由 `primaryBriefingSection` 保证最终版只呈现一次。模型卡必须写 attention mix；混合架构在一手 artifact 已披露时写明层比例或层数。仓库栏按主题组织，但每个主题必须填写 `readerValue` 并列出 2–4 个具名仓库/release 及其改变的执行路径，不能只剩抽象总结。群发证据与核验记录分层：`evidence` 只保留读者需要的事实，细节进入 `verificationNotes`；来源可用 `display: false` 保留在 edition 而不显示在 HTML。跨领域综合是可选补充，不再主导首页。

```powershell
node scripts/lint-briefing.mjs outputs/briefing/<date_range>/edition.json
node scripts/render-briefing.mjs outputs/briefing/<date_range>/edition.json outputs/briefing/<date_range>/briefing.html
```

本地剧照等装饰图片放在该期 `assets/`，在 edition 中使用相对路径；渲染时会自动内嵌为 data URL，因此群发只需发送一个 HTML 文件。

## 测试

```powershell
npm test
```
## Scout 结果合并与覆盖审计

每个 subagent 按 `templates/scout-result.json` 写入一个 JSON。全部返回后直接运行：

```powershell
$scoutFiles = @(Get-ChildItem "outputs/briefing/<date_range>/research/scouts" -Filter "*.json" | Select-Object -ExpandProperty FullName)
npm run briefing:merge -- --out "outputs/briefing/<date_range>/research/merged-candidates.json" $scoutFiles
npm run briefing:audit -- --requirements "templates/scout-requirements.json" --out "outputs/briefing/<date_range>/research/coverage-audit.json" $scoutFiles
```

`briefing:merge` 遇到日期、标题、artifact identity 或 release maturity 冲突时返回退出码 2，并把冲突写入输出。`briefing:audit` 在 coverage cell 缺失或为 `access_failed` 时返回退出码 2；先完成定向补扫和替代来源检查，再进入编辑。
