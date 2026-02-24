"""
Eco‑Nexus session manager

Drives 30–50+ concurrent proposal evaluations by:
- Generating or loading proposal data,
- Calling the ML model for sustainability scores,
- Simulating interactions with the C decision engine.
"""

from __future__ import annotations

import argparse
import concurrent.futures
import random
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List

import numpy as np
import pandas as pd

from ml.predict_sustainability import predict_sustainability


@dataclass
class Proposal:
    session_id: int
    vendor_price_today: float
    vendor_delivery_days: int
    local_flag_numeric: int
    past_sustainability_avg: float


@dataclass
class DecisionResult:
    session_id: int
    score: float
    decision: str
    latency_ms: float


def generate_proposals(n: int) -> List[Proposal]:
    rng = np.random.default_rng(seed=123)

    prices = rng.normal(100.0, 20.0, size=n).clip(20, 400)
    days = rng.integers(1, 45, size=n)
    local_flags = rng.integers(0, 2, size=n)
    past_scores = rng.normal(75.0, 15.0, size=n).clip(0, 100)

    return [
        Proposal(
            session_id=i,
            vendor_price_today=float(prices[i]),
            vendor_delivery_days=int(days[i]),
            local_flag_numeric=int(local_flags[i]),
            past_sustainability_avg=float(past_scores[i]),
        )
        for i in range(n)
    ]


def simulate_decision(score: float) -> str:
    """Simple policy stub that mimics a C decision engine."""
    if score >= 80:
        return "ACCEPT"
    if score >= 60:
        return "COMPARE"
    return "REJECT"


def process_proposal(
    model_path: str,
    proposal: Proposal,
    jitter_ms: int = 20,
) -> DecisionResult:
    start = time.perf_counter()

    # Optional small jitter to mimic network / processing variance
    if jitter_ms > 0:
        time.sleep(random.uniform(0, jitter_ms / 1000.0))

    score = predict_sustainability(
        model_path=model_path,
        vendor_price_today=proposal.vendor_price_today,
        vendor_delivery_days=proposal.vendor_delivery_days,
        local_flag_numeric=proposal.local_flag_numeric,
        past_sustainability_avg=proposal.past_sustainability_avg,
    )

    if score is None:
        score_val = 0.0
        decision = "ERROR"
    else:
        score_val = float(score)
        decision = simulate_decision(score_val)

    latency_ms = (time.perf_counter() - start) * 1000.0
    return DecisionResult(
        session_id=proposal.session_id,
        score=score_val,
        decision=decision,
        latency_ms=latency_ms,
    )


def run_sessions(
    model_path: str,
    n_sessions: int,
    max_workers: int,
) -> list[DecisionResult]:
    proposals = generate_proposals(n_sessions)
    results: list[DecisionResult] = []

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(process_proposal, model_path, p) for p in proposals
        ]
        for fut in concurrent.futures.as_completed(futures):
            results.append(fut.result())

    return results


def summarize_results(results: Iterable[DecisionResult]) -> pd.DataFrame:
    df = pd.DataFrame(
        [
            {
                "session_id": r.session_id,
                "score": r.score,
                "decision": r.decision,
                "latency_ms": r.latency_ms,
            }
            for r in results
        ]
    )

    return df


def main() -> None:
    parser = argparse.ArgumentParser(description="Run concurrent Eco‑Nexus sessions.")
    parser.add_argument(
        "--model",
        type=str,
        default="ml/eco_nexus_model.joblib",
        help="Path to trained .joblib model.",
    )
    parser.add_argument(
        "--sessions",
        type=int,
        default=50,
        help="Number of concurrent sessions to simulate.",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=50,
        help="Max worker threads (simulated concurrent sessions).",
    )
    parser.add_argument(
        "--out",
        type=str,
        default="orchestration_results.csv",
        help="Where to write a CSV of results.",
    )

    args = parser.parse_args()

    model_path = args.model
    if not Path(model_path).exists():
        raise SystemExit(
            f"Model not found at {model_path}. "
            "Run `python ml/train_model.py` first."
        )

    print(
        f"Running {args.sessions} sessions with up to {args.workers} workers "
        f"using model {model_path}..."
    )
    start = time.perf_counter()
    results = run_sessions(model_path, args.sessions, args.workers)
    elapsed = time.perf_counter() - start

    df = summarize_results(results)
    df.to_csv(args.out, index=False)

    avg_latency = df["latency_ms"].mean()
    p95_latency = df["latency_ms"].quantile(0.95)
    throughput = len(df) / elapsed if elapsed > 0 else float("inf")

    print(f"Completed in {elapsed:.2f}s")
    print(f"Sessions: {len(df)}  |  Throughput: {throughput:.2f} proposals/s")
    print(f"Avg latency: {avg_latency:.2f} ms | p95: {p95_latency:.2f} ms")
    print("Decision breakdown:")
    print(df["decision"].value_counts())
    print(f"Results written to {args.out}")


if __name__ == "__main__":
    main()

