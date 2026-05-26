# AlgoVision AI Voice Architecture

**Purpose:** Dedicated architecture blueprint for AI voice-guided algorithm visualizations in AlgoVision.

**Scope:** XTTS-v2, Kokoro TTS, Piper, StyleTTS2, NVIDIA TTS/Riva/NeMo, edge inference, synchronized narration, animation/audio sync, caching, async generation, frontend playback, streaming, scaling, worker queues, and inference optimization.

**Planning stance:** Do not generate TTS live per animation frame. AlgoVision already has backend-generated visualization states with educational messages. The correct production architecture is to convert those states into a narration timeline, pre-generate/cache audio segments asynchronously, and play animation plus audio from one shared timeline clock.

---

## 1. Product Goal

AlgoVision should explain algorithm visualizations with synchronized voice narration:

- every important animation step has concise narration
- voice and visual state remain synchronized
- no live TTS call per frame
- playback starts quickly
- common examples are cached
- custom examples generate audio asynchronously
- users can pause, resume, seek, change speed, mute, and switch text-only mode
- generated audio can be reused across users when narration text is identical

The voice feature must improve learning, not slow the visualization down. If audio generation is unavailable, visualizations must still work in text-only mode.

---

## 2. Current AlgoVision Fit

Current architecture already supports this feature well:

- Backend algorithm engines return ordered `states[]`.
- Each state includes an operation and message.
- Frontend already plays animations step by step.
- Backend already has FastAPI routers/services.
- Reports and future generated assets can move to object storage.

Required additions:

- narration planner
- timeline manifest
- TTS worker
- audio asset storage
- audio cache
- job status tracking
- frontend timeline player
- sync drift handling
- monitoring and cost controls

---

## 3. TTS Model Analysis

### 3.1 Summary Recommendation

| Model/System | AlgoVision Fit | Production Recommendation |
| --- | --- | --- |
| Kokoro TTS | Best default candidate for beta SaaS narration | Use first after benchmark and license verification |
| Piper | Best low-cost/offline/edge fallback | Use for fallback voices and CPU-heavy cost control |
| XTTS-v2 | Strong voice cloning and multilingual quality, but license-restricted | Do not use for commercial SaaS unless a commercial license is obtained |
| StyleTTS2 | High-quality research architecture, more operational complexity | Use for research/prototype only, not first production path |
| NVIDIA Riva/NeMo TTS | Enterprise-grade GPU path | Consider later for institutional/large-scale GPU deployment |
| Edge inference | Useful for offline/mobile and cost reduction | Phase later after web SaaS pipeline is stable |

### 3.2 Kokoro TTS

Kokoro-82M is an open-weight, lightweight TTS model. Its Hugging Face model card lists Apache-2.0 licensing and describes it as an 82M parameter model intended to be faster and more cost-efficient than larger models.

Why it fits AlgoVision:

- small enough for CPU or modest GPU experimentation
- suitable for pre-generated educational narration
- Apache-2.0 model card is more SaaS-friendly than non-commercial model licenses
- multiple voices/languages according to model card
- practical for batch segment generation

Risks:

- exact package/model version must be pinned
- quality must be benchmarked for technical terms: "AVL rotation", "binary search", "pointer", "heap", "recursion"
- model card and dependencies must be reviewed before paid launch
- pronunciation control may require phoneme hints or custom text normalization

Recommended use:

- default beta TTS candidate
- generate short narration segments in workers
- cache aggressively by normalized text and voice

### 3.3 Piper

Piper is a fast local neural TTS system with MIT-licensed code in the original `rhasspy/piper` repository. It is strong for local/offline generation and CPU-friendly workloads.

Why it fits AlgoVision:

- simple local deployment
- good fallback when GPU is unavailable
- useful for edge/offline experiments
- practical for deterministic educational narration
- can reduce hosted inference cost

Risks:

- voice quality may be less expressive than larger neural models
- project lineage has changed; choose and pin the exact maintained package/repository
- voice/model licenses must be checked separately from code license

Recommended use:

- fallback TTS engine
- low-cost batch generation
- edge/mobile experiments
- internal testing where quality is acceptable

### 3.4 XTTS-v2

XTTS-v2 is attractive because it supports high-quality multilingual generation and voice cloning. However, the Hugging Face license file for `coqui/XTTS-v2` states the Coqui Public Model License and non-commercial use restrictions.

Why it is risky:

- not appropriate for a commercial SaaS feature without commercial licensing
- voice cloning adds consent and abuse risks
- heavier inference footprint than Kokoro/Piper
- not needed for first version of educational narration

Recommended use:

- research only
- non-commercial demos only if license permits the specific use
- premium/custom voice feature only after legal review and commercial license

Do not make XTTS-v2 the default AlgoVision SaaS TTS model.

### 3.5 StyleTTS2

StyleTTS2 is a high-quality research TTS system. The repository code is MIT licensed, while the pretrained model usage has additional speaker/voice permission requirements. The paper positions it as a high-quality model using style diffusion and adversarial training.

Why it is interesting:

- high naturalness potential
- research-grade quality
- related to Kokoro's architecture lineage

Risks:

- operationally heavier
- pretrained model terms require careful handling of synthesized voices
- not as straightforward for stable SaaS inference
- likely more tuning/engineering work than Kokoro/Piper

Recommended use:

- research benchmark
- future high-quality voice experiments
- not first production engine

### 3.6 NVIDIA TTS: Riva And NeMo

NVIDIA Riva is a GPU-accelerated speech AI stack with TTS services optimized with NVIDIA inference infrastructure. NVIDIA NeMo is an Apache-2.0 framework for speech AI and related models, but model checkpoints can have their own terms.

Why it fits later:

- production-grade GPU inference path
- optimized serving with NVIDIA ecosystem
- strong fit for enterprise/institutional deployments
- supports cloud, data center, and edge-style deployments

Risks:

- GPU infrastructure cost
- heavier DevOps burden
- less suitable for early beta budget
- licensing/model terms must be checked per checkpoint

Recommended use:

- not needed for beta
- evaluate when user volume or institutional deployments justify GPU serving
- consider if voice becomes a core differentiator

### 3.7 Edge Inference

Edge inference means running TTS on the user's device, mobile app, desktop, or local browser-compatible runtime.

Benefits:

- lower server cost
- lower cloud dependency
- offline potential
- privacy advantage if text stays local

Risks:

- inconsistent device performance
- browser support varies
- model downloads are large for web users
- harder to guarantee synchronized UX
- mobile battery/performance impact

Recommended path:

- start with server-side generated/cached audio
- later test Piper/Kokoro ONNX/WebGPU/WASM paths
- use edge inference for offline/mobile premium modes only after web pipeline is stable

---

## 4. Recommended Voice Stack

### 4.1 Beta Stack

Use:

- **TTS engine:** Kokoro first, Piper fallback
- **API:** FastAPI narration endpoints
- **Queue:** Postgres durable job table + Redis dispatch
- **Worker:** Python TTS worker
- **Storage:** Supabase Storage initially, Cloudflare R2/S3 later if needed
- **Cache:** Postgres `narration_assets` + Redis lock/cache + object storage CDN
- **Playback:** browser Web Audio API or HTMLAudioElement managed by a timeline controller

Why:

- avoids commercial-license risk of XTTS-v2
- avoids GPU requirement in early beta
- preserves current FastAPI architecture
- supports async generation and caching
- lets visualizations continue without voice if TTS fails

### 4.2 Later Scale Stack

If usage grows:

- GPU TTS worker pool for faster batch generation
- object storage behind CDN
- model-serving process separated from job workers
- pre-generation pipeline for common lessons
- optional NVIDIA Riva/NeMo for enterprise-grade serving
- optional edge inference for mobile/offline

---

## 5. Synchronized Narration Pipeline

### 5.1 Core Flow

```text
Frontend requests visualization
  -> FastAPI algorithm endpoint generates states[]
  -> Narration planner creates narration segments
  -> Backend creates visualization_session + timeline manifest
  -> Backend checks narration asset cache
  -> Missing segments become TTS jobs
  -> Worker generates audio
  -> Worker stores audio in object storage
  -> Worker records duration and asset metadata
  -> Frontend receives/updates manifest
  -> Timeline player synchronizes animation and audio
```

### 5.2 Narration Planner

Input:

- algorithm name
- operation
- input data
- generated visualization states
- educational level
- preferred verbosity
- language/voice

Output:

- ordered narration segments
- one segment can map to one or more animation states
- each segment has text, step range, estimated duration, and priority

Example:

```json
{
  "step_index": 2,
  "state_range": [2, 3],
  "narration_text": "We compare the middle element with the target. Since it is smaller, we continue in the right half.",
  "priority": "core",
  "voice_id": "default_female",
  "estimated_duration_ms": 4200
}
```

### 5.3 Narration Rules

- Keep text short.
- Avoid reading every low-value state.
- Explain the decision, not just the movement.
- Use consistent terminology.
- Normalize technical terms for pronunciation.
- Do not include user PII or secrets.
- Do not ask the LLM to generate narration for every request unless necessary.

For most algorithm states, deterministic templates are better than LLM narration:

```text
array_search.compare:
"Compare {current_value} with target {target}."

binary_search.move_right:
"The middle value is smaller than the target, so the search moves to the right half."

avl.rotate_left:
"This subtree is right-heavy, so we perform a left rotation to restore balance."
```

Use AI-generated narration only for:

- lesson summaries
- adaptive explanations
- beginner/intermediate/expert variants
- multilingual phrasing

---

## 6. Animation And Audio Synchronization

### 6.1 Master Clock Strategy

The frontend must use one master timeline clock.

Do not run:

- animation timer independently
- audio playback independently
- progress slider independently

Use one timeline controller:

```text
timeline_time_ms
  -> current animation state
  -> current audio segment
  -> progress bar
  -> captions
```

### 6.2 Preferred Clock Source

When audio is playing:

- use `AudioContext.currentTime` or media playback time as the clock anchor
- map audio segment time to global timeline time

When muted or text-only:

- use `performance.now()` as the clock anchor

When paused:

- freeze timeline time

When seeking:

- find the segment/state at target time
- seek audio if available
- render matching animation state immediately

### 6.3 Timeline Manifest

Example:

```json
{
  "session_id": "uuid",
  "algorithm": "binary_search",
  "operation": "search",
  "total_duration_ms": 28000,
  "states": [],
  "segments": [
    {
      "segment_id": "uuid",
      "step_start": 0,
      "step_end": 1,
      "timeline_start_ms": 0,
      "timeline_end_ms": 3200,
      "text": "We begin binary search on a sorted array.",
      "audio_status": "ready",
      "audio_url": "signed-url",
      "duration_ms": 3180
    }
  ]
}
```

### 6.4 Drift Handling

Sources of drift:

- browser timer throttling
- audio buffering
- variable TTS duration
- user speed changes
- tab backgrounding

Mitigation:

- state rendering derives from timeline time, not `setTimeout`
- use measured audio duration after generation
- adjust segment boundaries after audio generation
- if audio lags, hold visual transition at segment boundary
- if audio is missing, use text-only timed estimate
- on tab visibility change, resync from current audio time

### 6.5 Captions

Always show captions:

- accessibility
- noisy classroom environments
- fallback when audio fails
- supports muted playback

Captions should use the same segment text as audio.

---

## 7. Caching Strategy

### 7.1 Cache Key

Audio should be cached by normalized generation parameters:

```text
sha256(
  normalized_text
  + voice_id
  + tts_engine
  + model_version
  + speed
  + language
  + audio_format
)
```

Why:

- identical narration text can be reused across users
- model upgrades do not corrupt old cache
- speed/voice/language differences stay separate

### 7.2 Storage Layers

Layer 1: Redis

- generation locks
- job progress
- hot manifest cache
- short TTL signed URL cache

Layer 2: Postgres

- durable asset metadata
- narration hash
- duration
- storage key
- model version
- generation status

Layer 3: Object Storage

- audio files
- private bucket
- signed URLs
- CDN later

### 7.3 Database Tables

```sql
create table voice_profiles (
  id text primary key,
  display_name text not null,
  tts_engine text not null,
  model_version text not null,
  language text not null,
  settings jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table visualization_voice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  algorithm text not null,
  operation text not null,
  input_hash text not null,
  states jsonb not null,
  manifest jsonb not null,
  status text not null default 'planning',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table narration_assets (
  id uuid primary key default gen_random_uuid(),
  narration_hash text not null unique,
  text text not null,
  tts_engine text not null,
  model_version text not null,
  voice_id text not null,
  language text not null,
  audio_format text not null default 'mp3',
  sample_rate integer,
  duration_ms integer,
  storage_key text,
  status text not null default 'pending',
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table narration_jobs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references visualization_voice_sessions(id) on delete cascade,
  narration_asset_id uuid references narration_assets(id),
  status text not null default 'queued',
  attempts integer default 0,
  scheduled_for timestamptz default now(),
  started_at timestamptz,
  finished_at timestamptz,
  last_error text,
  created_at timestamptz default now()
);
```

### 7.4 Cache Invalidation

Invalidate or version cache when:

- model version changes
- voice profile changes
- text normalization changes
- audio format changes
- pronunciation dictionary changes

Do not delete old assets immediately. Keep old audio until no active manifests reference it or until retention expiry.

---

## 8. Async Generation Architecture

### 8.1 Why Async

TTS generation can be slow or bursty. It should not block visualization API response.

The API should return:

- states immediately
- narration manifest
- status for each segment
- ready audio URLs where cached
- queued status for missing audio

### 8.2 Job Flow

```text
API creates missing narration_assets
API creates narration_jobs
API pushes job IDs to Redis queue
Worker claims job
Worker locks narration_hash
Worker generates audio
Worker measures duration
Worker uploads audio
Worker updates narration_assets
Worker publishes progress event
Frontend updates segment status
```

### 8.3 Durable Job Rules

- Postgres stores durable job state.
- Redis accelerates dispatch.
- Worker jobs are idempotent by `narration_hash`.
- Failed jobs retry with backoff.
- Dead-letter after max attempts.
- Admin can retry failed assets.

### 8.4 Worker Types

Start with:

- `tts-worker-cpu`

Later:

- `tts-worker-gpu`
- `tts-batch-pregenerator`
- `tts-edge-pack-builder`

### 8.5 Job Priorities

Priority levels:

- `interactive`: user is waiting for a custom visualization
- `prewarm`: common lesson generation
- `batch`: nightly cache building
- `repair`: failed asset retry

Interactive jobs should generate the first 1-2 segments first so playback can start quickly.

---

## 9. Frontend Playback Architecture

### 9.1 Components

Add:

```text
VoiceTimelinePlayer
  - owns master timeline clock
  - maps time to visual state
  - maps time to audio segment
  - controls play/pause/seek/speed

NarrationCaption
  - displays current segment text

AudioSegmentLoader
  - preloads next audio segments
  - refreshes signed URLs

VoiceControls
  - voice on/off
  - speed
  - captions
  - replay segment
  - text-only fallback
```

### 9.2 State Model

Frontend state:

```json
{
  "mode": "voice|text_only|muted",
  "playback_state": "idle|loading|playing|paused|buffering|ended|error",
  "timeline_time_ms": 0,
  "current_step": 0,
  "current_segment_id": "uuid",
  "buffered_segments": ["uuid"],
  "missing_segments": ["uuid"]
}
```

### 9.3 Playback Rules

- If audio for current segment is ready, play audio and sync animation to audio.
- If audio is missing, use text-only timing or wait depending on user setting.
- Preload current segment plus next 2-3 segments.
- Refresh signed URLs before expiry.
- If audio fails, mark segment failed and continue in text-only mode.
- Seeking should pause, reposition visual state, and load the target audio segment.

### 9.4 Browser APIs

Use:

- `HTMLAudioElement` for simpler segment playback initially
- `Web Audio API` later for tighter scheduling, crossfade, and advanced buffering

Recommended beta path:

- Start with `HTMLAudioElement`
- Move to Web Audio API only if drift or gapless playback becomes a real issue

---

## 10. Streaming Architecture

### 10.1 What Streaming Means Here

There are two different streams:

1. **Generation progress stream**
   - tells frontend which segments are ready
   - WebSocket or SSE

2. **Audio byte streaming**
   - streams generated audio bytes
   - HTTP range requests/object storage/CDN

Do not confuse them.

### 10.2 Recommended Beta Streaming

Use:

- WebSocket/SSE for generation progress
- signed object storage URLs for audio files
- HTTP range support through storage/CDN

Avoid:

- streaming raw TTS audio directly from the FastAPI API process for normal playback

Why:

- object storage/CDN is better for audio delivery
- API process should not become audio bandwidth bottleneck
- signed URLs are easier to scale

### 10.3 Progress Events

Example:

```json
{
  "event_type": "narration.segment.ready",
  "session_id": "uuid",
  "segment_id": "uuid",
  "audio_url": "signed-url",
  "duration_ms": 3180
}
```

### 10.4 Startup Strategy

To reduce perceived latency:

1. Generate/serve first segment first.
2. Start playback when first segment and timeline are ready.
3. Continue generating later segments in background.
4. If generation falls behind, switch to text-only or pause at boundary based on user setting.

---

## 11. Scaling Strategy

### 11.1 Phase 1: Beta

Architecture:

- one API process
- one CPU TTS worker
- Redis
- Supabase Storage
- Postgres asset metadata

Expected capability:

- cached common examples start quickly
- custom examples may take seconds
- voice is optional/fallback

### 11.2 Phase 2: Pre-Generation

Add:

- nightly pre-generation for common visualizations
- cache warming for homepage demos
- top practice problem explanations
- common array/sorting/tree examples

Benefits:

- most users hit cached audio
- lower interactive latency
- lower peak worker demand

### 11.3 Phase 3: Worker Pool

Add:

- multiple CPU workers
- priority queues
- job age monitoring
- autoscaling where host supports it

Watch:

- average generation time
- queue depth
- oldest job age
- cache hit rate
- failed generation rate

### 11.4 Phase 4: GPU/Enterprise

Add only if needed:

- GPU TTS serving
- model server process
- NVIDIA Riva/NeMo evaluation
- separate TTS inference service

Do not add GPU serving before:

- real user demand is measured
- cache hit rate is known
- cost per generated minute is calculated

---

## 12. Inference Optimization

### 12.1 Text Optimization

- Normalize technical terms.
- Expand abbreviations where needed.
- Keep segments short.
- Avoid long paragraphs.
- Use deterministic templates for common operations.
- Maintain pronunciation dictionary:

```json
{
  "AVL": "A V L",
  "BST": "B S T",
  "FIFO": "first in, first out",
  "LIFO": "last in, first out"
}
```

### 12.2 Model Optimization

Evaluate:

- ONNX export where stable
- quantized model variants
- batch generation for prewarm jobs
- persistent model loading in worker
- warm worker pools
- CPU thread tuning
- GPU batching later

### 12.3 Audio Optimization

Use:

- MP3 or Opus for delivery
- WAV only for internal generation/debugging
- normalize loudness
- trim leading/trailing silence
- store duration after encoding
- consistent sample rate per engine

### 12.4 Cache Optimization

Track:

- cache hit rate
- duplicate text frequency
- storage size
- most used voices
- model version distribution
- average generated seconds per user

---

## 13. API Design

### 13.1 Endpoints

```text
POST /voice/visualization-session
GET  /voice/session/{session_id}
GET  /voice/session/{session_id}/manifest
POST /voice/session/{session_id}/regenerate
GET  /voice/assets/{asset_id}/signed-url
GET  /voice/jobs/{job_id}
```

### 13.2 Create Session Response

```json
{
  "session_id": "uuid",
  "manifest": {},
  "voice_status": "partial",
  "ready_segments": 3,
  "queued_segments": 8
}
```

### 13.3 Error Modes

Return controlled errors:

- `VOICE_DISABLED`
- `TTS_PROVIDER_UNAVAILABLE`
- `VOICE_LICENSE_NOT_ALLOWED`
- `VOICE_QUOTA_EXCEEDED`
- `NARRATION_GENERATION_FAILED`
- `AUDIO_ASSET_NOT_FOUND`
- `SIGNED_URL_EXPIRED`

Visualizations should continue without voice for non-critical voice errors.

---

## 14. Security And Privacy

### 14.1 Security Rules

- Do not include secrets, tokens, emails, payment data, or admin notes in narration.
- Enforce max narration text length.
- Enforce max generated audio duration per request.
- Rate-limit voice generation per user.
- Store audio in private buckets.
- Use signed URLs.
- Validate ownership before returning manifests.
- Audit voice generation for paid/limited plans.

### 14.2 Voice Cloning Rules

Do not enable voice cloning in V1.

If added later:

- require explicit speaker consent
- store consent records
- watermark or disclose synthetic voice where appropriate
- prevent cloning public figures/teachers without consent
- add abuse review workflow
- review all model licenses

### 14.3 Licensing

Before paid launch:

- verify selected model license
- verify voice asset licenses
- verify dependency licenses
- verify generated output rights
- document allowed commercial use

XTTS-v2 must not be used commercially unless the team obtains a commercial license.

---

## 15. Observability

Track:

- TTS job count by engine
- generation latency
- queue depth
- oldest job age
- cache hit rate
- failed segments
- audio upload failures
- signed URL failures
- playback errors
- frontend buffering time
- drift corrections
- text-only fallback rate
- cost per generated minute

Logs should include:

- request_id
- user_id
- session_id
- segment_id
- narration_hash
- tts_engine
- model_version
- voice_id
- job_id
- latency_ms
- error_code

Alerts:

- TTS queue age too high
- generation failure rate spike
- storage upload failures
- signed URL failure spike
- cache hit rate drops unexpectedly
- generated minutes exceed daily budget

---

## 16. Failure Recovery

### 16.1 TTS Worker Failure

- job remains in Postgres as `queued` or `running`
- stale running jobs are retried after timeout
- retry with exponential backoff
- dead-letter after max attempts
- frontend falls back to text-only for failed segments

### 16.2 Storage Failure

- generated file upload fails
- asset remains `failed_upload`
- worker retries upload
- frontend keeps text/captions

### 16.3 Cache Miss Burst

- Redis lock per narration hash prevents duplicate generation
- first request creates job
- later requests subscribe to same asset status
- if job fails, all sessions using that segment receive fallback status

### 16.4 Signed URL Expiry

- frontend requests a fresh URL before playback if expired
- manifest stores storage keys indirectly, not permanent public URLs
- backend authorizes user before issuing new URL

---

## 17. Implementation Phases

### Phase 0: Stabilization Prerequisites

- reports/object storage pattern established
- Redis available
- worker process available
- durable job table available
- frontend error tracking available

### Phase 1: Text Narration Manifest

- create narration planner
- generate timeline manifest without audio
- captions synchronized with animation
- timeline-based animation player

### Phase 2: Cached Audio Assets

- narration asset table
- cache key generation
- object storage upload
- signed URL retrieval
- manual batch generation for selected demos

### Phase 3: Async TTS Worker

- TTS worker with Kokoro/Piper benchmark
- Redis dispatch
- Postgres job state
- progress events
- frontend partial-ready playback

### Phase 4: Playback Polish

- seeking
- speed control
- replay segment
- preloading
- drift correction
- text-only fallback

### Phase 5: Scale And Optimization

- pre-generation jobs
- cache analytics
- worker pool
- CDN
- quantization/ONNX benchmarking
- cost dashboards

### Phase 6: Advanced Engines

- evaluate NVIDIA Riva/NeMo
- evaluate StyleTTS2 for quality experiments
- evaluate edge inference
- voice cloning only after consent/licensing architecture

---

## 18. Production Readiness Checklist

- [ ] TTS model license reviewed.
- [ ] XTTS-v2 excluded from commercial path unless licensed.
- [ ] Narration planner works without AI dependency.
- [ ] Audio is cached by hash/model/voice/version.
- [ ] TTS generation is asynchronous.
- [ ] Worker jobs are durable.
- [ ] Audio stored in private object storage.
- [ ] Signed URLs issued only after authorization.
- [ ] Frontend supports text-only fallback.
- [ ] Animation derives from timeline clock.
- [ ] Audio drift handling implemented.
- [ ] Segment preloading implemented.
- [ ] Generation rate limits implemented.
- [ ] Observability covers generation and playback.
- [ ] Cost per generated minute measured.
- [ ] Common demos pre-generated.

---

## 19. Recommended First Version

V1 should be intentionally conservative:

- deterministic narration templates
- Kokoro or Piper after benchmark
- no voice cloning
- no live per-frame generation
- audio segment cache
- async worker
- private object storage
- captions always on
- text-only fallback
- timeline-driven playback

This gives AlgoVision the educational value of voice-guided visualizations without turning TTS into a reliability, licensing, or cost problem.

---

## 20. References Checked

- Kokoro-82M Hugging Face model card: https://huggingface.co/hexgrad/Kokoro-82M
- XTTS-v2 Hugging Face license file: https://huggingface.co/coqui/XTTS-v2/blob/main/LICENSE.txt
- Piper repository: https://github.com/rhasspy/piper
- StyleTTS2 repository/paper implementation: https://github.com/yl4579/StyleTTS2
- NVIDIA Riva documentation: https://docs.nvidia.com/riva/index.html
- NVIDIA NeMo repository: https://github.com/NVIDIA-NeMo/NeMo
