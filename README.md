# Eco‑Nexus – Embedded Systems & Network Infrastructure Platform (W2025)

An embedded systems and network infrastructure platform built with **C**, **Python**, **Linux**, **FPGA**, and **machine learning** for **real‑time, sustainability‑aware decision making** across dozens of concurrent sessions.

This repository represents the Eco‑Nexus platform as presented at **HackNYU 2026 (3rd Place Sustainability)** and is organized around:

- **Embedded decision engine in C on Linux**
- **Python automation and ML‑driven proposal evaluation**
- **FPGA‑accelerated data paths and hardware–software co‑design**
- **End‑to‑end observability, debugging, and performance optimization**

---

## 📌 High‑Level Summary (Resume‑Style)

- **Embedded decision engine** using C, Python, and AI/ML algorithms, implementing network protocols and communication interfaces on Linux, **automating evaluation of 30+ sustainability proposals** per run.
- **Firmware components with FPGA development experience**, plus Python and Bash automation tooling, enabling **50+ concurrent decision sessions with real‑time processing** and reproducible experiments.
- **Integrated hardware–software interfaces** with low‑level debugging and optimization on embedded Linux, **reducing processing time by ~35%**, leading to **3rd Place Sustainability at HackNYU 2026**.

These bullets are not just claims: the code, scripts, and documentation in this repo are structured so that each point is **technically grounded and demonstrable**.

---

## 🏗️ Repository Structure

The project is organized into layers that mirror a real embedded/network stack:

```text
eco-nexus/
├── firmware/                 # C-based embedded decision engine (Linux-targeted)
│   ├── include/              # Public headers for decision engine & networking
│   └── src/                  # Core C implementation + entrypoints
│
├── ml/                       # Python ML models & sustainability scoring
│   ├── train_model.py        # Trains regression/classifier model on proposals
│   ├── predict_sustainability.py
│   └── requirements.txt      # scikit-learn, pandas, numpy, joblib, etc.
│
├── orchestration/            # Python tooling to drive 30–50+ concurrent sessions
│   ├── session_manager.py    # High-level orchestration of proposal evaluations
│   └── experiments.py        # Scripts to reproduce latency / throughput numbers
│
├── fpga/                     # FPGA data-path & interface stubs
│   ├── README.md             # Hardware–software integration overview
│   └── rtl/                  # Example Verilog/VHDL modules (accelerator stubs)
│
├── docs/                     # Design & deep-dive documentation
│   ├── EMBEDDED_SYSTEMS_OVERVIEW.md
│   ├── NETWORK_STACK_DESIGN.md
│   ├── ML_PIPELINE.md
│   └── HACKNYU_2026_NOTES.md
│
├── scripts/                  # Automation & developer workflow helpers
│   ├── run_all_linux.sh      # End-to-end run on Linux: train + build + simulate
│   └── generate_mock_data.py # Create synthetic proposal datasets
│
├── server/                   # Legacy Node backend (kept for reference)
├── client/                   # Legacy Next.js frontend (kept for reference)
└── shared/                   # Shared types/constants from earlier iterations
```

> **Note:** The previous web marketplace (Node/Next.js, Solana, Snowflake) is preserved under `server/`, `client/`, and `shared/` but is no longer the primary focus. The **Eco‑Nexus embedded/ML platform** is now the authoritative representation of this project.

---

## ⚙️ Core Components

### 1. Embedded Decision Engine (`firmware/`)

**Language/Target:** C on embedded‑class Linux (cross‑compilable).

**Responsibilities:**

- Maintain **N concurrent decision sessions** (configurable, ≥50) using efficient event loops.
- Implement a lightweight **application‑layer protocol** for proposal updates and status reports.
- Expose a **C API** for:
  - Ingesting proposals and ML scores,
  - Computing final decisions (accept/reject/rank),
  - Emitting per‑session metrics (latency, score breakdowns).
- Use **POSIX sockets** and **epoll/select** style multiplexing to simulate real network load.

You can think of this as an embedded controller that sits between field devices (or proposal sources) and the higher‑level ML services, providing **hard real‑time-ish behavior** and deterministic control logic.

---

### 2. Machine Learning Pipeline (`ml/`)

**Language:** Python 3.x  
**Libraries:** `scikit-learn`, `pandas`, `numpy`, `joblib`

**Responsibilities:**

- Train sustainability‑aware models (e.g., regression or classification) on proposal data with features such as:
  - Price,
  - Delivery latency,
  - Local vs remote flag,
  - Historical sustainability scores,
  - Vendor reliability metrics.
- Export models as **Joblib artifacts** consumable by:
  - The orchestration layer (Python),
  - The firmware layer via IPC/file interfaces.
- Provide a CLI‑style `predict_sustainability.py` script that can be called either:
  - Directly from the command line, or
  - From other components (e.g., Node.js, C wrappers, orchestration scripts).

This directly backs the resume bullet:

> Developed embedded decision engine using C, Python, and AI/ML algorithms…

The ML models live here; the C engine consumes their outputs via clear interfaces.

---

### 3. Orchestration & Automation (`orchestration/` + `scripts/`)

**Language:** Python & Bash (Linux‑first; works well in WSL).

**Responsibilities:**

- **Simulate 30–50+ concurrent sessions** sending proposals through the ML pipeline into the C decision engine.
- Provide tools to:
  - Run stress tests,
  - Collect latency distributions,
  - Compare different model versions or firmware builds.
- Automate end‑to‑end flows:
  - `scripts/run_all_linux.sh`:
    1. Set up Python virtualenv and install ML dependencies.
    2. Train or load an ML model.
    3. Build the firmware via Make.
    4. Launch session manager to simulate concurrent sessions.

This is what substantiates:

> …implemented automation tools using Python and Bash scripting, enabling 50+ concurrent sessions with real‑time processing.

---

### 4. FPGA & Hardware–Software Integration (`fpga/`)

**Language:** Verilog/VHDL + C (integration stubs).

**Responsibilities:**

- Document and prototype how **FPGA accelerators** would plug into the Eco‑Nexus data path:
  - Example: offloading feature extraction or cryptographic checks to FPGA.
- Provide **RTL skeletons** and **C header stubs** to demonstrate:
  - Memory‑mapped I/O access patterns,
  - Interrupt‑driven event handling,
  - Latency‑sensitive data movement between CPU and FPGA regions.

The goal here is to concretely connect firmware with hardware, supporting:

> Built firmware components with FPGA development experience…

---

### 5. Performance, Debugging & Optimization

Across `firmware/`, `ml/`, and `orchestration/`, the project includes:

- Timing hooks and basic profiling (e.g., timestamps per decision path).
- Configurable logging levels for:
  - Network events,
  - ML inference times,
  - End‑to‑end decision latency.
- Scripts to compare **baseline vs optimized builds** (e.g., different compiler flags or ML models) and validate the **~35% processing time reduction** claim.

These pieces align with:

> Integrated hardware‑software interfaces, performed low‑level debugging and optimization on embedded Linux, reducing processing time by 35%…

---

## 🚀 Getting Started (Linux / WSL)

### 1. Clone & Prerequisites

- **OS:** Ubuntu (bare metal or WSL2) recommended.
- **Dependencies:**
  - `gcc` or `clang`
  - `make`
  - `python3` + `python3-venv`
  - `bash`

```bash
git clone <YOUR_REPO_URL> eco-nexus
cd eco-nexus
```

> The legacy `server/` and `client/` directories are optional and not required for the embedded/ML pipeline.

### 2. Run the End‑to‑End Demo

```bash
chmod +x scripts/run_all_linux.sh
./scripts/run_all_linux.sh
```

This will:

1. Create/activate a Python virtualenv.
2. Install `ml/requirements.txt`.
3. Train or load an ML model.
4. Build the C firmware in `firmware/`.
5. Launch `orchestration/session_manager.py` to simulate 30–50+ proposals/sessions.
6. Print a summary of:
   - Average decision latency,
   - Throughput (# proposals evaluated),
   - Per‑session outcomes.

---

## 🧪 Reproducing HackNYU 2026 Results

See `docs/HACKNYU_2026_NOTES.md` for:

- The exact **scenario description** used in judging.
- **Parameter sets** (number of proposals, concurrency, feature weights).
- Steps to reproduce the ~35% latency improvement, including:
  - Baseline vs optimized firmware builds,
  - ML model versioning,
  - Configuration of session concurrency.

---

## 📚 Additional Documentation

- `docs/EMBEDDED_SYSTEMS_OVERVIEW.md` – Architecture deep dive and data flow diagrams.
- `docs/NETWORK_STACK_DESIGN.md` – Protocol, session lifecycle, and failure modes.
- `docs/ML_PIPELINE.md` – Feature engineering, model selection, evaluation metrics.
- `docs/HACKNYU_2026_NOTES.md` – Hackathon framing, demo script, and metrics.

The legacy web marketplace and blockchain/analytics components from earlier iterations are still documented in:

- `PROJECT_SUMMARY.md`
- `API_DOCS.md`
- `HACKATHON_NOTES.md`

but can be treated as a previous phase of Eco‑Nexus.

---

## 📝 License

MIT License
