# LLM Infra Briefing

> 当前架构：两个召回 Scanner，一个候选池，一份 HTML。

## 结论

量化与 AI Infra 已经合并出版，但仍保留两个召回扫描器。

```text
quantization scanner ─┐
                      ├─ 统一候选池 ─ edition.json ─ briefing.html
ai-infra scanner ─────┘
```

`quantization` 和 `ai-infra` 不是两份最终简报。它们从不同角度防漏；同一事件只维护一次，可以同时带有 quantization、hardware、kernel、runtime 等标签。

## 使用方式

Radar 用于单独扫描：

```text
radar quantization 本周
radar ai-infra 过去 30 天
radar ai-infra 只看 kernel 和硬件
```

Briefing 合并所有必要扫描结果并统一出版：

```text
briefing 2026-08-15 2026-08-28
```

最终只生成一份 briefing，不再分别生成量化简报和 Infra 简报。

## 默认覆盖

- 新模型、模型卡、API 和官方技术博客
- 重要 runtime、kernel、compiler 与通信仓库
- 量化、KV、MoE、System 和模型架构论文
- NVIDIA 技术博客、release notes、硬件平台与互联
- 科学空间等高信号独立技术博客
- 窗口中新出现的重要单位及其官方域名

Watchlist 用于查询扩展，不是召回边界。

## HTML 出版

`workflows/briefing.md` 是当前默认出版工作流。每期维护：

```text
outputs/briefing/<date_range>/edition.json
```

然后执行：

```powershell
node scripts/lint-briefing.mjs outputs/briefing/<date_range>/edition.json
node scripts/render-briefing.mjs outputs/briefing/<date_range>/edition.json outputs/briefing/<date_range>/briefing.html
```

`edition.json` 是唯一出版事实源。最终 HTML 同时包含：

- 3 分钟直觉版
- 全量版

全量版按新模型、重要仓库、量化与低比特、硬件与互联、System 与架构、Kernel 与编译、技术博客组织。3 分钟版是全量版的严格子集。

## 防漏与门禁

截止前执行 72 小时 closing sweep。出版前必须记录以下来源的检查状态：

- 重点官方模型博客
- NVIDIA 技术资料
- 核心仓库 release
- 硬件平台
- 独立技术博客
- 新出现重要单位的官方域名

进入 3 分钟版的条目必须有一手来源。背景、预告、厂商自报、preview 和 RC 必须明确标注。

## 测试

```powershell
npm test
```
