## Eco‑Nexus – HackNYU 2026 Sustainability Track Notes

### 1. Track & Result

- **Track:** Sustainability
- **Event:** HackNYU 2026
- **Result:** 🥉 **3rd Place (Sustainability)**

Eco‑Nexus was presented as an **embedded + ML decision platform** that optimizes sustainable vendor and infrastructure choices under real‑time constraints.

---

### 2. Problem Framing (Pitch)

**Problem:**  
Organizations need to choose between many vendors / configurations under:

- Cost constraints,
- Delivery deadlines,
- Sustainability / carbon goals,
- Reliability SLAs.

Existing tools focus on **spreadsheets and dashboards**, not on **embedded, real‑time decision loops** that can run close to the hardware.

**Our angle:**  
Treat the decision process as an **embedded system**:

- Real‑time controller (C on Linux),
- ML‑driven scoring (Python),
- Optional FPGA acceleration for heavy data‑path operations,
- Designed to handle **dozens of concurrent decisions** reliably.

---

### 3. Demo Flow

1. **Setup**
   - Brief architecture slide: C engine + Python ML + FPGA hooks.
   - Explain EcoProto and session concept.

2. **Live Run**
   - Run `scripts/run_all_linux.sh`.
   - Show:
     - Model training (or loading).
     - Firmware build.
     - Session manager output (50+ concurrent sessions).

3. **Results View**
   - Highlight:
     - Number of proposals evaluated.
     - Distribution of sustainability scores.
     - Final decisions (accept/reject/rank).
     - Average and p95 decision latency.

4. **Optimization Story**
   - Compare:
     - Baseline build vs optimized build (e.g., `-O0` vs `-O2`, and small data‑structure tweaks).
   - Show ~35% improvement in latency with:
     - Plots or before/after metrics,
     - Simple explanation of what changed.

5. **Hardware Story**
   - Show `fpga/` layout and explain:
     - How certain features (e.g., feature extraction) could move to FPGA.
     - How firmware would communicate over MMIO / interrupts.

---

### 4. Talking Points for Judges

- **Embedded focus:**
  - “We treat decision making as a real‑time control problem, not as a batch analytics job.”
  - “The core decision engine is in C with deterministic state machines and explicit profiling.”

- **ML integration:**
  - “ML is used for sustainability scoring, but the final policy is encoded in the embedded layer for predictability.”
  - “We separate training (offline) from inference (fast, controlled) and version models via artifacts.”

- **Scalability & Concurrency:**
  - “Our orchestration tests show we can handle 50+ concurrent sessions, and the engine is designed to scale further with minimal changes.”

- **Optimization:**
  - “We systematically measured baseline vs optimized builds, and achieved ~35% reduction in average decision latency.”

- **Hardware awareness:**
  - “The project includes FPGA interface stubs and design notes that show a clear path to hardware acceleration.”

---

### 5. Metrics to Highlight

- **Throughput:**  
  Proposals processed per second at different concurrency levels (10, 30, 50 sessions).

- **Latency:**  
  - Average decision latency.
  - p95 / p99 latency.

- **Model Quality:**  
  - Validation metrics (MAE/R²).
  - Stability of scores across runs.

- **Resource Usage (Optional):**  
  - CPU utilization of C engine vs Python layers.
  - Memory footprint under load.

---

### 6. Q&A Prep

**Q:** Why use C instead of just Python?  
**A:** To simulate a realistic embedded controller with predictable performance, limited resources, and clearer hardware‑integration boundaries.

**Q:** What would you offload to FPGA first?  
**A:** Feature extraction or cryptographic verification for high‑volume streams, where parallelism and determinism matter.

**Q:** How hard is it to change the ML model?  
**A:** Retain data and retrain with `ml/train_model.py`; then update the `.joblib` artifact. The C engine is unaware of internal ML details as long as the interface stays consistent.

**Q:** How do you guarantee the 35% improvement is real?  
**A:** We provide reproducible scripts and logs so that baseline and optimized runs can be compared with identical workloads.

---

### 7. Takeaways

Eco‑Nexus is less about a flashy UI and more about showing:

- **End‑to‑end thinking** from hardware to ML,
- **Real‑time constraints** and concurrency,
- **Measurable optimization** rather than anecdotal claims.

These notes are here to help recreate the **HackNYU 2026 narrative** or adapt it for future demos.

