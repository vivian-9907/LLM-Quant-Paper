# Changelog

## v1.4 - Reader-facing evidence and agentic kernel coverage

- Added required scouting and fixed-section spotlights for AI-assisted kernel/operator generation, including multi-agent and superagent workflows.
- Separated group-facing evidence from canonical `verificationNotes` and added supported hidden source links with `display: false`.
- Required explicit reader value for repository themes and section spotlights.
- Added soft lint for verification-log prose and dense unexplained acronyms.
- Simplified the current edition's repository and serving explanations for cross-project readers.
- Made local publication images self-contained in shared HTML and tracked canonical edition assets.

## v1.3 - Unified publication and substantive repository digest

- Replaced separate quick/full reading layers with one final editorial stream whose density follows `editorialRole`.
- Required model cards to state the attention mix and disclosed hybrid layer ratio/count.
- Expanded repository themes with named releases and concrete execution-path or compatibility changes.
- Kept official architecture figures, generation deltas and fixed top-down section ordering as publication requirements.
- Added validation and rendering tests for attention patterns and repository theme signals.

## v1.2 - Fixed editorial sections and model release tracker

- Replaced storyline-first summaries with six fixed reader-facing sections.
- Added a model release timeline with organization, version, architecture, quantization and availability fields.
- Separated recall topics, system layers and publication sections.
- Allowed one canonical event to expose different section-specific points without duplicating the full article.
- Kept cross-domain storylines optional and outside the primary table of contents.

## v1.1 - Parallel topic scouts and top-down editing

- Replaced broad channel scanners as the briefing unit with seven parallel topic scouts.
- Required known-ecosystem and open-world recall for every scout.
- Added a scout x event-slot coverage matrix with explicit hit, empty and access-failure states.
- Made smoke checks sentinels only; they no longer count as topic coverage.
- Added event-level multi-scout merge provenance and a gap audit before closing sweep.
- Ordered final HTML from model architecture through training/quantization, runtime/systems, kernels/operators and hardware/interconnect.
- Assigned repositories and technical blogs to the system layer they implement or explain.


## v1.0 - HTML-first unified briefing

- Reframed quantization and AI Infra as recall scanners that merge into one event pool.
- Added edition.json as the canonical publication source and a single-page HTML renderer with 3-minute and full sections.
- Added editorial lint for window roles, primary sources, maturity, background boundaries and required closing-sweep source classes.
- Added required scans for official model blogs, NVIDIA technical sources, hardware, repository releases, expert blogs and newly important official domains.
- Added Z.ai / GLM and GLM-5.3-Flash as a recall-regression fixture.

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
