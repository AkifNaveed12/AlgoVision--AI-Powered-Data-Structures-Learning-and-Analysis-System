# AlgoVision Realtime Architecture

**Purpose:** Dedicated architecture blueprint for realtime systems in AlgoVision.

**Scope:** WebSockets, Socket.IO decisioning, Redis, pub/sub, matchmaking, realtime leaderboards, battle synchronization, synchronized timers, realtime analytics, event-driven architecture, and battle lifecycle management.

**Planning stance:** Keep the current FastAPI backend and React frontend. Add realtime capabilities through a modular monolith architecture first, not premature microservices. Separate runtime responsibilities when needed, but keep the same codebase.

---

## 1. Realtime Product Requirements

AlgoVision needs realtime infrastructure for:

- live XP and leaderboard updates
- 1v1 coding battle matchmaking
- battle room state synchronization
- synchronized battle timers
- live submission status
- opponent progress indicators
- suspicious activity events
- realtime admin/beta analytics
- future synchronized voice-guided visualization sessions

These systems are correctness-sensitive. A battle timer, score update, or winner decision cannot depend on a browser clock or a single server's local memory.

---

## 2. Recommended Architecture

### 2.1 High-Level Architecture

```text
React Frontend
  -> REST API for durable commands/queries
  -> WebSocket/Socket.IO connection for live events

FastAPI Modular Monolith
  -> REST routers
  -> realtime gateway
  -> domain services
  -> event publisher

Redis
  -> presence
  -> pub/sub fanout
  -> streams for replayable events
  -> sorted sets for leaderboards
  -> matchmaking queues
  -> distributed locks
  -> battle room snapshots

PostgreSQL/Supabase
  -> durable source of truth
  -> users/profiles
  -> battles
  -> submissions
  -> gamification events
  -> audit logs
  -> leaderboard snapshots

Workers
  -> matchmaking worker
  -> leaderboard rollup worker
  -> battle finalization worker
  -> analytics aggregation worker
  -> compiler execution worker
```

### 2.2 Runtime Shape

Use the same backend codebase but allow separate process types:

- `api`: REST endpoints and lightweight commands.
- `realtime`: WebSocket/Socket.IO connections, heartbeats, room fanout.
- `worker`: matchmaking, rollups, battle finalization, analytics.
- `compiler-worker`: isolated code execution.

Why:

- Keeps development simple.
- Allows realtime connections to scale separately from REST.
- Prevents compiler execution from affecting battle socket stability.
- Avoids premature microservices while still supporting production deployment.

---

## 3. WebSockets vs Socket.IO

### 3.1 Raw WebSockets

Use raw WebSockets when:

- protocol needs are simple
- you want fewer dependencies
- you control reconnect/resume behavior yourself
- FastAPI-native implementation is preferred

Pros:

- Lightweight.
- Native browser support.
- Simple mental model.
- Fits FastAPI directly.

Cons:

- Must implement rooms, reconnection, acknowledgements, missed-event recovery, heartbeats, and backpressure yourself.

### 3.2 Socket.IO

Use Socket.IO when:

- you want built-in rooms and reconnection semantics
- client network conditions are unpredictable
- the team prefers a mature realtime abstraction
- fallback transports are useful

Pros:

- Rooms are built in.
- Reconnect is built in.
- Client/server ecosystem is mature.
- Easier battle-room ergonomics.

Cons:

- Not plain WebSocket protocol.
- Adds dependency and adapter complexity.
- Python Socket.IO integration is separate from FastAPI-native WebSocket patterns.

### 3.3 Recommendation

For AlgoVision:

- **Phase 1:** Use FastAPI WebSockets for simple realtime leaderboards/admin presence.
- **Phase 2:** Before coding battles, reassess Socket.IO. If battle-room complexity grows, Socket.IO with a Redis adapter-style design may reduce implementation risk.
- **Critical rule:** Regardless of raw WebSockets or Socket.IO, durable battle state must not live only inside socket memory.

---

## 4. Core Realtime Design Rules

1. **Server time is authoritative.**
2. **Postgres is durable truth.**
3. **Redis is realtime coordination and fast state, not the only durable truth.**
4. **Every realtime event has an ID and sequence number.**
5. **Clients must recover from reconnect using snapshots.**
6. **Battle state transitions must be idempotent.**
7. **Every room has a heartbeat and expiry policy.**
8. **No battle-critical decision should depend only on browser events.**
9. **Compiler results must come from the execution worker, not the client.**
10. **Realtime analytics should be sampled/aggregated, not emitted as unbounded raw events forever.**

---

## 5. Event-Driven Architecture

### 5.1 Event Types

Core realtime events:

```text
user.connected
user.disconnected
profile.updated
xp.awarded
leaderboard.updated
matchmaking.enqueued
matchmaking.cancelled
battle.created
battle.joined
battle.ready
battle.started
battle.timer.tick
battle.submission.received
battle.submission.running
battle.submission.result
battle.suspicious_activity
battle.completed
battle.cancelled
analytics.session.started
analytics.session.heartbeat
analytics.session.ended
```

### 5.2 Event Envelope

Every realtime event should follow one envelope:

```json
{
  "event_id": "uuid",
  "event_type": "battle.submission.result",
  "room_id": "battle:uuid",
  "sequence": 42,
  "server_time_ms": 1730000000000,
  "actor_user_id": "uuid",
  "payload": {},
  "requires_ack": true
}
```

Why:

- `event_id` supports idempotency.
- `sequence` supports missed-event detection.
- `server_time_ms` supports synchronized timers.
- `room_id` supports routing.
- `requires_ack` supports reliability for important events.

### 5.3 Durable vs Ephemeral Events

Durable events:

- battle created/started/completed
- submission received/result
- XP awarded
- leaderboard score changed
- suspicious activity
- admin actions

Ephemeral events:

- cursor movement
- typing status
- presence heartbeat
- temporary opponent progress indicator
- non-critical timer tick

Durable events must be persisted in Postgres or Redis Streams with a recovery path. Ephemeral events can be Redis pub/sub only.

---

## 6. Redis Usage

### 6.1 Redis Responsibilities

Use Redis for:

- active socket presence
- room membership
- pub/sub fanout
- Redis Streams for replayable room events
- leaderboards with sorted sets
- matchmaking queues
- battle room snapshots
- distributed locks
- rate limits
- short-lived analytics counters

Do not use Redis as the only permanent record for:

- final battle results
- accepted submissions
- XP ledger
- billing
- account state
- audit logs

### 6.2 Redis Key Design

```text
presence:user:{user_id}
presence:socket:{socket_id}
room:{room_id}:members
room:{room_id}:snapshot
room:{room_id}:seq
stream:room:{room_id}
pubsub:room:{room_id}

matchmaking:queue:{region}:{rating_bucket}
matchmaking:user:{user_id}
lock:matchmaking:{user_id}

battle:{battle_id}:snapshot
battle:{battle_id}:participants
battle:{battle_id}:submissions
battle:{battle_id}:timer
battle:{battle_id}:lock

lb:xp:global
lb:xp:weekly:{year}:{week}
lb:xp:monthly:{year}:{month}
lb:battle:rating

analytics:active_users
analytics:active_battles
analytics:events:{yyyyMMddHHmm}
```

### 6.3 Redis TTL Policy

Recommended TTLs:

| Key | TTL |
| --- | --- |
| `presence:user:{user_id}` | 60-90 seconds |
| `presence:socket:{socket_id}` | 60-90 seconds |
| `room:{room_id}:snapshot` | 24 hours after room end |
| `stream:room:{room_id}` | 24-72 hours after room end |
| `matchmaking:user:{user_id}` | 5-10 minutes |
| `battle:{battle_id}:snapshot` | 24-72 hours |
| analytics minute buckets | 24-48 hours |

### 6.4 Redis Pub/Sub vs Streams

Use **pub/sub** for:

- live fanout where missed messages can be repaired from snapshot
- leaderboard update notifications
- presence changes
- non-critical opponent activity

Use **Redis Streams** for:

- battle room event history
- replay after reconnect
- important realtime events where short-term recovery matters

Use **Postgres** for:

- permanent durable state
- auditability
- final battle outcomes
- submissions
- XP/event ledger

---

## 7. WebSocket Backend Design

### 7.1 Connection Flow

1. Client opens socket with access token.
2. Backend validates token through Supabase/auth service.
3. Backend creates `socket_id`.
4. Backend stores presence in Redis.
5. Backend subscribes socket to allowed rooms.
6. Backend sends initial snapshot.
7. Client acknowledges snapshot version.
8. Heartbeat begins.

### 7.2 Authentication

Every socket connection must validate:

- access token
- user status
- user role for admin rooms
- battle participant membership for battle rooms
- token expiry

Long-lived sockets need revalidation:

- disconnect on expired token
- or require token refresh event
- or force reconnect after max connection age

### 7.3 Connection Manager

Responsibilities:

- map `socket_id -> user_id`
- map `room_id -> socket_ids`
- send event to socket
- broadcast to room
- enforce backpressure
- close slow clients
- handle disconnect cleanup
- renew presence heartbeat

For multi-replica:

- local process only knows local sockets
- Redis pub/sub distributes room messages
- Redis room snapshots store shared state

### 7.4 Heartbeats

Server sends ping every 20-30 seconds.

Client responds with pong.

If no pong after threshold:

- mark socket stale
- delete socket presence
- keep user presence until TTL expires
- notify rooms only after user truly times out

Why:

- Disconnect events are unreliable.
- Mobile/laptop network changes can interrupt silently.

---

## 8. Matchmaking Architecture

### 8.1 Matchmaking Goals

Match users by:

- availability
- rating bucket
- region/latency if needed
- battle mode
- problem difficulty
- anti-abuse constraints

### 8.2 Matchmaking Flow

1. User clicks `Find Battle`.
2. REST API validates auth and current battle status.
3. API writes `matchmaking_requests` row in Postgres.
4. API adds user to Redis queue:

```text
matchmaking:queue:{mode}:{rating_bucket}
```

5. Matchmaking worker scans queues.
6. Worker takes distributed locks for candidate users.
7. Worker creates `battles` and `battle_participants` rows.
8. Worker creates Redis battle snapshot.
9. Worker publishes `matchmaking.match_found` to both users.
10. Clients connect/join battle room.

### 8.3 Matchmaking DB Schema

```sql
create table matchmaking_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  mode text not null,
  rating integer not null,
  rating_bucket integer not null,
  status text not null default 'queued',
  battle_id uuid,
  created_at timestamptz default now(),
  matched_at timestamptz,
  cancelled_at timestamptz
);
```

### 8.4 Failure Recovery

If worker crashes after locking users but before creating battle:

- locks expire
- requests remain queued
- another worker can retry

If worker creates battle but fails before publish:

- battle exists in Postgres
- reconnect/polling can discover active battle
- repair worker publishes missing event

If user disconnects during matchmaking:

- presence TTL expires
- matchmaking worker cancels stale request

---

## 9. Battle Lifecycle Management

### 9.1 Battle States

```text
created
waiting_for_players
ready_check
countdown
running
finalizing
completed
cancelled
expired
disputed
```

### 9.2 Battle Lifecycle

1. **Created**
   - battle row exists
   - participants assigned
   - problem selected

2. **Waiting For Players**
   - both users must join socket room
   - server sends room snapshot

3. **Ready Check**
   - both clients acknowledge readiness
   - timeout if one user never joins

4. **Countdown**
   - server defines `starts_at`
   - clients render countdown from server time

5. **Running**
   - problem visible
   - timer active
   - submissions accepted
   - activity events captured

6. **Finalizing**
   - timer ended or both completed
   - pending compiler jobs finish or timeout
   - score calculated server-side

7. **Completed**
   - winner stored
   - rating/XP events written
   - leaderboard updated
   - final event broadcast

8. **Cancelled/Expired/Disputed**
   - no winner or manual review
   - audit reason stored

### 9.3 Battle Snapshot

Redis snapshot:

```json
{
  "battle_id": "uuid",
  "status": "running",
  "sequence": 91,
  "server_start_time_ms": 1730000000000,
  "duration_ms": 900000,
  "problem_id": "uuid",
  "participants": {
    "user_a": {
      "connected": true,
      "ready": true,
      "score": 120,
      "last_submission_status": "Accepted"
    },
    "user_b": {
      "connected": true,
      "ready": true,
      "score": 80,
      "last_submission_status": "Running"
    }
  },
  "last_event_id": "uuid"
}
```

Postgres stores final durable battle data. Redis snapshot supports reconnect and fast room rendering.

---

## 10. Battle Synchronization

### 10.1 Server-Authoritative Timer

The server sends:

```json
{
  "event_type": "battle.started",
  "server_time_ms": 1730000000000,
  "starts_at_ms": 1730000005000,
  "ends_at_ms": 1730000905000
}
```

Client computes:

```text
remaining = ends_at_ms - estimated_server_now_ms
```

Client estimates server time using:

- socket event `server_time_ms`
- round-trip time measurement
- periodic timer sync events

### 10.2 Timer Events

Do not broadcast every second as the source of truth.

Better:

- broadcast `battle.started`
- broadcast occasional `battle.timer.sync`
- client renders countdown locally from server timestamps
- server enforces submission cutoff

Why:

- Reduces socket traffic.
- Avoids timer drift from missed tick events.
- Prevents client clock cheating.

### 10.3 Submission Synchronization

Submission flow:

1. Client sends code through REST or socket command.
2. Backend validates battle state and deadline using server time.
3. Backend stores `battle_submissions` row with `received_at`.
4. Backend enqueues compiler job.
5. Backend broadcasts `battle.submission.received`.
6. Compiler worker runs tests.
7. Worker writes result.
8. Backend/worker publishes `battle.submission.result`.
9. Battle snapshot updates.
10. Score recalculates.

Submission acceptance must be based on server receive time, not client send time.

---

## 11. Realtime Leaderboards

### 11.1 Leaderboard Types

- global XP
- weekly XP
- monthly XP
- battle rating
- tournament score
- university/cohort leaderboard later

### 11.2 Redis Sorted Sets

Use:

```text
lb:xp:global
lb:xp:weekly:{year}:{week}
lb:xp:monthly:{year}:{month}
lb:battle:rating
```

Operations:

- `ZINCRBY` on XP event
- `ZADD` on rating recalculation
- `ZREVRANGE` for top N
- `ZREVRANK` for user rank

### 11.3 Durable Truth

Do not trust Redis alone.

Durable tables:

- `gamification_events`
- `users.xp`
- `users.battle_rating`
- `leaderboard_snapshots`

Redis leaderboard can be rebuilt from Postgres events if needed.

### 11.4 Realtime Updates

When XP changes:

1. Insert `gamification_events`.
2. Update `users.xp`.
3. Update Redis sorted sets.
4. Publish `leaderboard.updated`.
5. Clients subscribed to leaderboard room refetch affected rank window or receive small delta.

Avoid broadcasting entire leaderboard on every change. Send deltas or invalidation signals.

---

## 12. Realtime Analytics

### 12.1 What To Track

Realtime analytics:

- active users
- active sessions
- active battles
- matchmaking queue length
- average wait time
- battle completion rate
- compiler queue depth
- socket connection count
- reconnect count
- heartbeat failures
- leaderboard updates per minute
- suspicious activity count

### 12.2 Collection Strategy

Use Redis counters for short-lived realtime metrics:

```text
analytics:active_users
analytics:active_battles
analytics:matchmaking_queue_length
analytics:events:{yyyyMMddHHmm}
```

Use worker rollups to write aggregates to Postgres:

```sql
create table realtime_metric_rollups (
  id uuid primary key default gen_random_uuid(),
  metric text not null,
  bucket_start timestamptz not null,
  bucket_size text not null,
  value numeric not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
```

### 12.3 Admin Realtime Feed

Admin realtime feed should show:

- current active users
- active battles
- queue length
- recent errors
- suspicious events
- worker delays

If WebSocket analytics fails, admin dashboard should degrade to polling.

---

## 13. Failure Recovery

### 13.1 Client Disconnect

On disconnect:

- keep battle participant active for grace period
- presence TTL expires if no reconnect
- opponent receives `participant.connection_lost`
- if reconnect occurs, send latest snapshot and missed stream events
- if no reconnect after threshold, mark participant disconnected

### 13.2 Server Restart

On restart:

- local sockets are lost
- clients reconnect
- server rebuilds room state from Redis snapshot or Postgres
- active battles continue if within allowed recovery window
- battle finalizer repairs expired/running battles

### 13.3 Redis Failure

If Redis fails:

- realtime fanout degrades
- REST APIs should still work where possible
- battle creation may pause
- active battle recovery relies on Postgres
- users see reconnect/degraded state

Mitigation:

- health checks
- alerting
- managed Redis for production
- keep durable events in Postgres

### 13.4 Worker Failure

If matchmaking worker fails:

- users remain queued in Postgres
- Redis locks expire
- worker resumes after restart

If compiler worker fails:

- submissions remain pending until timeout
- battle finalizer marks unresolved submissions as failed/timeout after threshold

If finalizer fails:

- scheduled repair job scans battles stuck in `running` or `finalizing`

### 13.5 Duplicate Events

Clients and server must handle duplicate events by `event_id`.

State transitions must be idempotent:

- battle can only start once
- submission result can only finalize once
- XP event should use idempotency key
- leaderboard update can be replayed safely

---

## 14. Backend Design

### 14.1 Suggested Backend Modules

```text
backend/
  realtime/
    connection_manager.py
    auth.py
    events.py
    rooms.py
    heartbeat.py
    redis_bus.py
    schemas.py
  domains/
    matchmaking/
      service.py
      repository.py
      worker.py
    battles/
      service.py
      repository.py
      scoring.py
      lifecycle.py
      finalizer.py
    leaderboards/
      service.py
      repository.py
      redis_store.py
    analytics/
      realtime_metrics.py
      rollups.py
```

### 14.2 REST vs Socket Responsibilities

Use REST for:

- create/cancel matchmaking request
- submit code
- fetch battle history
- fetch leaderboard page
- fetch durable analytics
- admin moderation actions

Use WebSocket/Socket.IO for:

- match found
- room joined
- timer sync
- opponent submission status
- battle result broadcast
- leaderboard invalidation/delta
- presence
- admin live feed

Why:

- REST is easier to secure, retry, and audit for commands.
- Sockets are best for low-latency notifications and room state.

### 14.3 Command Handling Rule

Important commands should not rely only on socket messages.

For example, code submission should be accepted by REST or a socket command that internally goes through the same validated command service:

```text
validate auth
validate battle membership
validate battle status
validate server deadline
persist command
enqueue work
publish event
```

---

## 15. Scaling Strategy

### 15.1 Phase 1: Single Realtime Instance

Use:

- one API/realtime process
- Redis
- Postgres
- worker

Good for:

- beta testing
- leaderboards
- small battle tests

Limitations:

- restart disconnects everyone
- no horizontal socket scale
- simpler debugging

### 15.2 Phase 2: Multiple Realtime Replicas

Requirements:

- Redis pub/sub fanout
- shared room snapshots
- no reliance on local memory for room truth
- sticky sessions preferred but not required if events are fully Redis-backed
- connection metrics per replica

### 15.3 Phase 3: Dedicated Realtime Runtime

Separate process:

- `backend-api`
- `backend-realtime`
- `worker`
- `compiler-worker`

Why:

- Scale socket connections independently.
- Protect sockets from slow REST endpoints.
- Tune process limits differently.

### 15.4 Capacity Risks

Watch:

- max open sockets per instance
- memory per socket
- Redis command rate
- Redis stream size
- leaderboard update frequency
- battle room fanout rate
- compiler queue delay
- p95 socket message latency

---

## 16. Security

### 16.1 WebSocket Security

- Validate token on connect.
- Validate room authorization before join.
- Validate origin.
- Enforce max rooms per socket.
- Enforce max message size.
- Rate-limit socket commands.
- Disconnect expired or unauthorized sessions.
- Do not accept user-provided winner/score/timer state.

### 16.2 Battle Security

- Server owns battle status and timer.
- Server receives submission before deadline.
- Hidden tests never sent to client.
- Compiler worker has no production secrets.
- Suspicious events are treated as signals, not automatic bans in V1.
- All final results are auditable.

### 16.3 Leaderboard Security

- XP/rating changes only from server-side events.
- Redis leaderboard rebuilt from Postgres if tampered/lost.
- Apply abuse caps.
- Audit unusual XP/rating changes.

---

## 17. Observability

Track:

- socket connections active
- connections per user
- rooms active
- messages sent/received
- message latency
- reconnect count
- heartbeat misses
- Redis pub/sub errors
- Redis stream lag
- matchmaking queue length
- matchmaking wait time
- battle start failures
- battle finalization failures
- compiler queue delay
- leaderboard update latency
- duplicate event count

Every realtime log should include:

- request_id or event_id
- user_id
- room_id
- battle_id if applicable
- socket_id
- event_type
- sequence

Alerts:

- heartbeat failures spike
- Redis unavailable
- battle finalization stuck
- matchmaking queue age too high
- compiler queue age too high
- socket reconnect rate spike
- message publish failures

---

## 18. Implementation Phases

### Phase 0: Stabilization Prerequisites

- request IDs
- structured logs
- Redis connected
- auth rate limits
- backend error contract
- compiler isolation plan

### Phase 1: Realtime Foundation

- WebSocket auth
- connection manager
- heartbeat
- Redis presence
- room join/leave
- event envelope
- basic pub/sub fanout

### Phase 2: Realtime Leaderboards

- XP event publish
- Redis sorted sets
- leaderboard invalidation events
- client leaderboard subscription
- rebuild job from Postgres

### Phase 3: Matchmaking

- matchmaking request table
- Redis matchmaking queues
- matchmaking worker
- lock handling
- stale request cleanup

### Phase 4: Battle Rooms

- battle lifecycle schema
- battle room snapshots
- ready check
- server-authoritative timers
- submission status events
- reconnect recovery

### Phase 5: Battle Finalization

- compiler worker integration
- scoring
- final result persistence
- XP/rating updates
- leaderboard updates
- stuck battle repair job

### Phase 6: Realtime Analytics

- active users
- active battles
- queue metrics
- socket metrics
- admin live feed
- rollup worker

---

## 19. Production Readiness Checklist

- [ ] WebSocket host supports long-lived connections.
- [ ] Origin and token validation implemented.
- [ ] Heartbeat and stale presence TTL implemented.
- [ ] Reconnect sends latest snapshot.
- [ ] Events include `event_id` and `sequence`.
- [ ] Battle timers use server time.
- [ ] Submission deadline is enforced server-side.
- [ ] Redis pub/sub is not used as sole durable truth.
- [ ] Important room events use Redis Streams or Postgres.
- [ ] Battle finalizer repairs stuck battles.
- [ ] Matchmaking requests survive worker restart.
- [ ] Redis leaderboards can be rebuilt from Postgres.
- [ ] Compiler worker is isolated before public battles.
- [ ] Realtime metrics and alerts exist.
- [ ] Load test covers concurrent sockets and battle rooms.

---

## 20. Final Recommendation

Start with FastAPI WebSockets and Redis because the current backend is FastAPI and the immediate goal is modular-monolith stabilization. Keep the transport abstraction clean enough that Socket.IO can be adopted later if battle-room reconnection and room ergonomics become too costly to maintain manually.

The key architectural rule is:

**Realtime delivery can be ephemeral, but realtime decisions must be durable and server-authoritative.**

Redis should make AlgoVision fast and synchronized. PostgreSQL should make AlgoVision correct and recoverable.
