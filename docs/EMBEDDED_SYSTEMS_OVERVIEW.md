## Eco‑Nexus Embedded Systems Overview

### 1. Goal

Eco‑Nexus is an **embedded systems and network infrastructure platform** designed to:

- Evaluate **30+ sustainability proposals** per run using a **C + Python + ML** stack.
- Sustain **50+ concurrent decision sessions** with near real‑time responsiveness.
- Demonstrate **hardware–software co‑design** across Linux, FPGA, and ML components.

This document explains how the embedded layers fit together.

---

### 2. Layered Architecture

At a high level, Eco‑Nexus is structured as:

```text
┌───────────────────────────────────────────────┐
│ Orchestration & Experiments (Python)         │
│ - Session manager (30–50+ concurrent runs)   │
│ - Experiment scripts & metrics collection    │
└───────────────────────────────────────────────┘
                ▲
                │
┌───────────────────────────────────────────────┐
│ ML Pipeline (Python)                          │
│ - Data ingestion & feature engineering        │
│ - Model training & export (joblib)           │
│ - CLI prediction interface                    │
└───────────────────────────────────────────────┘
                ▲
                │
┌───────────────────────────────────────────────┐
│ Embedded Decision Engine (C on Linux)         │
│ - Session lifecycle & state machine           │
│ - Network protocol handling                   │
│ - Score aggregation & final decision logic    │
└───────────────────────────────────────────────┘
                ▲
                │
┌───────────────────────────────────────────────┐
│ FPGA / Hardware Acceleration (FPGA + C stubs) │
│ - Offloadable data-path operations            │
│ - Example RTL + MMIO integration patterns     │
└───────────────────────────────────────────────┘
```

The **decision engine** is where real‑time constraints live. ML operates at a slower cadence (model training, periodic updates) while inference is optimized and treated as a service to the C layer.

---

### 3. Embedded Decision Engine (C)

Located in `firmware/`, the engine:

- Maintains a pool of **sessions** (each session corresponds to a proposal or vendor negotiation).
- Uses Linux primitives (sockets, timers) to handle:
  - Incoming proposal updates,
  - Timeout handling,
  - Result publication.
- Exposes a small C API:

```c
int eco_init_engine(size_t max_sessions);
int eco_submit_proposal(const eco_proposal_t *proposal);
int eco_step_engine(void);          /* single tick of the event loop */
int eco_get_decision(int session_id, eco_decision_t *out);
void eco_shutdown_engine(void);
```

The actual implementation focuses on:

- **Deterministic state machines** per session.
- **Predictable memory usage** (fixed pools where possible).
- Clear **instrumentation hooks** for latency and error tracking.

---

### 4. ML Integration (Python ↔ C)

The ML pipeline in `ml/` and the decision engine communicate via:

- **File or IPC interfaces** for batched predictions.
- A simple **line‑based protocol** for passing feature vectors and predicted scores.

The typical flow:

1. The Python **session manager** aggregates relevant features.
2. It calls the ML model for **sustainability score prediction**.
3. It passes score + raw features to the C engine.
4. The C engine applies **policy logic** (e.g., thresholds, tie‑breaking, risk rules).

This separation allows:

- ML models to change frequently.
- Firmware to remain stable and certifiable.

---

### 5. Network & Concurrency Model

Eco‑Nexus treats proposals as if they arrive over the network:

- The C layer can listen on a TCP/UDP port or be driven via in‑process calls.
- The Python orchestration layer can simulate **high‑concurrency traffic** by:
  - Opening multiple connections,
  - Staggering proposal arrival times,
  - Randomizing payloads.

The concurrency target (≥50 sessions) is achieved by:

- Efficient **event loops** in C (e.g., `select`/`poll`‑style patterns).
- **Threaded or async** orchestration drivers feeding the engine.

---

### 6. Hardware / FPGA Hooks

Eco‑Nexus includes `fpga/` stubs showing:

- How feature extraction or crypto checks could be offloaded to FPGA.
- Example **memory‑mapped register layouts** and C integration:

```c
volatile uint32_t *eco_fpga_base = ECO_FPGA_MMIO_BASE;
eco_fpga_base[ECO_FPGA_REG_FEATURE_READY] = 1;
```

This makes the project a realistic demonstration of **firmware + FPGA** collaboration instead of a purely software‑only simulation.

---

### 7. Optimization & Measurement

Optimization goals:

- Reduce **avg. decision latency** by ~35% relative to a naive baseline.
- Maintain correctness while increasing concurrency.

Mechanisms:

- Timestamps in C and Python.
- Per‑session metrics logged to CSV/JSON.
- Experiment scripts in `orchestration/experiments.py` to compare:
  - Build flags,
  - Model configurations,
  - Concurrency levels.

---

### 8. How This Maps to the Resume Bullets

- **“Embedded decision engine using C, Python, and AI/ML…”**  
  Implemented via the C core (`firmware/`), Python ML (`ml/`), and orchestration glue layers.

- **“Firmware components with FPGA development experience…”**  
  Documented and partially prototyped in `fpga/`, including how firmware would access accelerators.

- **“Integrated hardware–software interfaces, performed low‑level debugging and optimization…”**  
  Supported by the logging, profiling, and concurrency experiments spanning C, Python, and (stubbed) FPGA components.

