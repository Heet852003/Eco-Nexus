"""
Experiment harness for Eco‑Nexus.

Runs a grid of concurrency levels and writes summary metrics that can be used
to compare baseline vs optimized variants (firmware flags, model versions, etc.).
"""

from __future__ import annotations

import argparse
import time
from pathlib import Path

import pandas as pd

from orchestration.session_manager import run_sessions, summarize_results


def run_experiment(model_path: str, sessions: int, workers: int) -> dict:
    start = time.perf_counter()
    results = run_sessions(model_path=model_path, n_sessions=sessions, max_workers=workers)
    elapsed = time.perf_counter() - start

    df = summarize_results(results)
    return {
        "sessions": sessions,
        "workers": workers,
        "elapsed_s": elapsed,
        "throughput": len(df) / elapsed if elapsed > 0 else float("inf"),
        "avg_latency_ms": df["latency_ms"].mean(),
        "p95_latency_ms": df["latency_ms"].quantile(0.95),
        "accept": int((df["decision"] == "ACCEPT").sum()),
        "compare": int((df["decision"] == "COMPARE").sum()),
        "reject": int((df["decision"] == "REJECT").sum()),
        "error": int((df["decision"] == "ERROR").sum()),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Eco‑Nexus concurrency experiments.")
    parser.add_argument(
        "--model",
        type=str,
        default="ml/eco_nexus_model.joblib",
        help="Path to trained .joblib model.",
    )
    parser.add_argument(
        "--out",
        type=str,
        default="experiment_summary.csv",
        help="Output CSV file.",
    )
    parser.add_argument(
        "--levels",
        type=str,
        default="10,30,50",
        help="Comma-separated concurrency levels to test (sessions/workers).",
    )

    args = parser.parse_args()
    if not Path(args.model).exists():
        raise SystemExit(f"Model not found at {args.model}. Train it first.")

    levels = [int(x.strip()) for x in args.levels.split(",") if x.strip()]

    rows = []
    for lvl in levels:
        rows.append(run_experiment(args.model, sessions=lvl, workers=lvl))

    df = pd.DataFrame(rows)
    df.to_csv(args.out, index=False)
    print(df)
    print(f"Summary written to {args.out}")


if __name__ == "__main__":
    main()

