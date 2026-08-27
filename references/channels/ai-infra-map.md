# AI Infra Research Map

Use this map to tag radar candidates for AI / LLM infrastructure. The focus is
systems value, not generic model news.

## Technical Directions

- Serving/runtime: vLLM, SGLang, TensorRT-LLM, llama.cpp, continuous batching,
  paged attention, chunked prefill, prefix cache, disaggregated serving.
- Speculative decoding: draft model, target verification, tree attention,
  multi-token prediction, EAGLE/Medusa/lookahead-style decoding.
- MoE systems: expert parallelism, dispatch/combine, all-to-all, grouped GEMM,
  expert placement, MegaMoE/DeepEP-style communication-compute overlap.
- Training systems: distributed training, DP/TP/PP/SP, FSDP/ZeRO, checkpointing,
  optimizer sharding, step-time and MFU optimization.
- Communication and parallelism: collectives, topology awareness, overlap,
  NVLink/InfiniBand/HCCL/NCCL behavior.
- Kernels/operators: attention, GEMM, MoE, RoPE, norm, quant/dequant, fused
  kernels, Triton/CUDA/CUTLASS implementation paths.
- Kernel compilers: GPU DSL/IR, hardware-explicit schedule representations,
  warp specialization, memory movement and synchronization contracts, verifier,
  cost model, compiler diagnostics, autotuning, agentic kernel generation and
  evolution, plus promotion from single-shape kernels to dispatched libraries.
  Give extra weight to NVIDIA Research and work that lands in NVIDIA kernels,
  compiler backends, libraries or upstream runtime integrations.
- Hardware platforms with infra impact: GPU / accelerator architecture, HBM,
  NVLink/NVSwitch, rack-scale systems, tensor cores, low-bit hardware formats
  and power/cooling constraints when they change serving/training bottlenecks,
  memory bandwidth, communication, KV cache capacity, MoE weight movement or
  kernel/runtime design.
- Architecture with infra impact: attention architecture such as KV-sharing,
  low-rank or grouped attention variants, sparse / sliding-window / hybrid /
  linear attention and state-space models; MoE architecture such as routed
  experts, shared experts, hierarchical MoE, expert-choice routing and load
  balancing; plus lookup memory, long-context mechanisms, residual stream
  design, Hyper-Connections / xHC-style residual expansion, and model
  structures that change training or runtime shape, memory traffic,
  communication, kernel paths or bottlenecks.
- Performance analysis: profiling, benchmark design, TTFT/TPOT/P99, memory
  footprint, throughput, utilization, bottleneck analysis.

## Retention Criteria

Keep a candidate only when it has at least one strong systems signal:

- Concrete runtime, framework, kernel, communication, hardware or benchmark
  evidence.
- Hardware platform detail that affects memory bandwidth, interconnect,
  low-bit execution, rack-scale communication, KV cache capacity, MoE weight
  movement, power/cooling or kernel/runtime design.
- Clear impact on serving/training latency, throughput, memory, cost or
  scalability.
- Code, artifact, reproducible benchmark, release note with technical detail,
  or a paper with enough implementation evidence.
- A model architecture change that directly affects compute graph, memory,
  communication, scheduling or operator shape.
- An attention or MoE architecture change that affects KV cache layout,
  prefill/decode cost, routing, all-to-all traffic, expert parallelism,
  operator/kernel shape, batching, long-context serving or training efficiency.
- A model architecture paper that reports systems-facing evidence such as
  training FLOPs, MFU, memory traffic, memory bandwidth, scaling behavior,
  pre-training efficiency, kernel implementation, or serving/training runtime
  implications.

Filter generic capability news, launch announcements and application-layer
agent/prompt workflows unless they include concrete infra implications.

## Maturity Stages

- concept: interesting systems idea, limited evidence.
- experimental: enough detail for a small reproduction.
- reproducible: code, config, benchmark or implementation details are available.
- integrable: clear path into known runtime/framework/kernel stacks.
- production-grade: strong benchmark, stable implementation and hardware/runtime
  path.

## Operator / Runtime Tags

- serving-runtime
- scheduler
- kv-cache
- speculative-decoding
- moe-runtime
- communication-overlap
- distributed-training
- kernel-optimization
- operator-fusion
- memory-bandwidth
- hardware-platform
- rack-scale-system
- hardware-portability
- benchmark-design
- end-to-end-performance
