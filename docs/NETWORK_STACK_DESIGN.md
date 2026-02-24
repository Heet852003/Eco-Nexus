## Eco‑Nexus Network Stack Design

### 1. Objectives

The Eco‑Nexus network stack is not a full Internet‑scale router; instead, it is a **focused embedded transport** for:

- Carrying **proposal data** and **decision results** between:
  - ML services (Python layer),
  - Embedded controller (C layer),
  - Optional external clients.
- Supporting **30–50+ concurrent sessions** with predictable latency.
- Remaining simple enough to be understood, debugged, and profiled end‑to‑end.

---

### 2. Protocol Overview

Eco‑Nexus defines a lightweight, text‑friendly application protocol called **EcoProto**:

```text
ECO/1.0 <message_type> <session_id>
Key: Value
Key: Value

<optional JSON payload>
```

**Message types:**

- `PROPOSAL` – incoming proposal data from an orchestrator or client.
- `SCORE` – ML‑generated sustainability score update.
- `DECISION` – final decision emitted by the C engine.
- `HEARTBEAT` – health check between orchestrator and engine.

This protocol can be carried over:

- TCP sockets (default for local simulations).
- Unix domain sockets (for on‑device optimization).

---

### 3. Session Lifecycle

Each proposal is tracked as a **session** within the engine:

1. **Session Created**  
   - Engine receives an `ECO/1.0 PROPOSAL` message.
   - Allocates a session slot, validates feature schema.

2. **ML Score Attached**  
   - Orchestrator sends `ECO/1.0 SCORE` for that `session_id`.
   - Engine merges ML score with static and dynamic features.

3. **Decision Computed**  
   - On next event‑loop tick, engine:
     - Evaluates policies (e.g., thresholds, weights).
     - Computes `ACCEPT`, `REJECT`, or `COMPARE` outcome.

4. **Decision Emitted**  
   - Engine sends `ECO/1.0 DECISION` back to the client/orchestrator.
   - Logs metrics (latency, outcome, confidence).

5. **Session Closed**  
   - Engine frees the session slot or marks it reusable.

Diagram:

```text
Client/Orchestrator          Firmware Engine (C)
        |                               |
        | PROPOSAL (ECO/1.0)            |
        |------------------------------>|
        |                               |
        | SCORE (ECO/1.0)               |
        |------------------------------>|
        |                               |
        |<------------------------------|
        |     DECISION (ECO/1.0)        |
        |                               |
```

---

### 4. Concurrency Model

**C Engine:**

- Uses a **single‑threaded event loop** with:
  - `select`/`poll` or equivalent to handle multiple sockets.
  - Per‑session state machines stored in arrays or pools.
- This keeps:
  - Memory usage predictable,
  - Locking complexity low,
  - Behavior reproducible.

**Python Orchestration:**

- Uses **thread pools** or `asyncio` to:
  - Open many connections to the engine.
  - Stagger proposals.
  - Apply randomized workloads.

By separating concerns, we can scale up to 50+ concurrent sessions without dragging complex threading into the C core.

---

### 5. Error Handling & Robustness

EcoProto includes simple, explicit error handling:

- Malformed headers → `DECISION` with `status=ERROR` and a reason.
- Timeouts → `DECISION` with `status=TIMEOUT`.
- Overloaded engine:
  - Refuses new sessions with a clear error code.
  - Keeps existing sessions stable.

Error scenarios are logged with:

- Timestamps.
- Session IDs.
- Error categories (parse, timeout, overload).

This supports low‑level debugging in embedded Linux environments where observability can be limited.

---

### 6. Performance Considerations

Optimizations applied:

- **Preallocated session arrays** instead of dynamic allocations.
- **Small, fixed‑size buffers** for protocol parsing.
- Optional **binary representation** for internal storage after initial parse.
- Use of **non‑blocking sockets** and careful handling of partial reads/writes.

Measurement is tied into:

- Per‑session latency statistics (proposal → decision).
- Event loop tick times.
- Number of active sessions.

Experiment scripts can turn these into graphs for before/after comparisons.

---

### 7. Extensibility

EcoProto is intentionally minimal but supports:

- Additional headers (e.g., `Trace-Id`, `Experiment-Group`).
- Future message types (e.g., `CANCEL`, `REPLAY`).
- Alternate transports (e.g., serial, CAN) by swapping out the transport layer while keeping the same message semantics.

This makes Eco‑Nexus a solid foundation for showcasing:

- Network protocol design skills,
- Embedded resource constraints,
- Integration with ML‑driven decision making.

