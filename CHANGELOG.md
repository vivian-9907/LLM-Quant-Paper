# Changelog

## v0.9 - Recall and editorial pipeline

- Added event-based discovery that runs known-ecosystem monitoring and open-world discovery in parallel.
- Added mandatory coverage slots for model/API releases, reports, open-source projects, material repository changes, events and production evidence.
- Added a closing sweep for late-window official updates, releases, merged PRs and paper artifacts.
- Added a normalized candidate ledger so AI Infra and quantization results can be deduplicated by event.
- Added a separate editorial rubric for headline, trend, full-only, watch and archive placement.
- Added a `briefing` workflow that compares the previous edition and generates a link-independent card plus a sourced full version.
- Added first-class manual candidate intake and generalized miss feedback without entity-specific retention rules.

## v0.8 - Hardware platform report coverage

- Added `hardware_platform_reports` as an opt-in / conditionally expanded source group for rack-scale system, interconnect, power/cooling and token-cost reports.
- Added official NVIDIA blog coverage as a fallback page so platform reports outside the developer technical blog RSS can still be found.
- Added a compact hardware platform smoke-check watchlist instead of broad vendor-specific platform tracking.
- Updated the radar workflow to add lightweight hardware platform / AI factory smoke-check queries for `ai-infra`, with conditional expansion when official reports, partner benchmarks, deployment status or system metrics are detected.

## v0.7 - Layered radar sources

- Added `config/experts.yml` for author, maintainer, lab and research-group signal weighting.
- Added `config/venues.yml` for conference, workshop and benchmark context.
- Added `config/tracked-repos.yml` so concrete GitHub repositories are maintained once with channel tags and source modes.
- Added training and kernel repositories such as Megatron-LM, DeepSpeed, TransformerEngine and CUTLASS to tracked GitHub release/activity coverage.
- Updated radar workflow and templates to report whether tracked repos, experts or venues were used.

## v0.6 - Lightweight infra briefing baseline

- Renamed the project to LLM Infra Briefing.
- Generalized the skill into two channels: `quantization` and `ai-infra`.
- Added channel-specific profiles, full topic maps, research maps and output templates.
- Added shared sources, watchlist and radar rubric configuration.
- Switched regular radar runs to read lightweight profiles by default and expand full topics only when needed.

## Maintenance Notes

- Keep generated reports under `outputs/<channel>/radar/`; reports are ignored by git.
- Keep `.gitkeep` files so the expected output directories exist in fresh clones.
- Review `config/watchlist.yml` periodically so query expansion stays high-signal instead of becoming a broad news list.
