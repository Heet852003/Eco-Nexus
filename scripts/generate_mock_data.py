"""
Generate synthetic proposal datasets for Eco‑Nexus.

This is useful both for:
- Training ML models,
- Demonstrating 30+ proposals per run.
"""

import argparse
from pathlib import Path

import numpy as np
import pandas as pd


def generate(n: int) -> pd.DataFrame:
    rng = np.random.default_rng(seed=7)

    price_today = rng.normal(100.0, 25.0, size=n).clip(20, 400)
    delivery_days = rng.integers(1, 60, size=n)
    local_flag_numeric = rng.integers(0, 2, size=n)
    past_sustainability_avg = rng.normal(75.0, 15.0, size=n).clip(0, 100)

    # Synthetic target, similar to train_model
    base = 80.0
    target_score = (
        base
        - 0.1 * (price_today - 80.0)
        - 0.3 * (delivery_days - 7.0)
        + 5.0 * local_flag_numeric
        + 0.5 * (past_sustainability_avg - 70.0)
    )
    target_score = np.clip(target_score, 0, 100)

    return pd.DataFrame(
        {
            "vendor_price_today": price_today,
            "vendor_delivery_days": delivery_days,
            "local_flag_numeric": local_flag_numeric,
            "past_sustainability_avg": past_sustainability_avg,
            "target_score": target_score,
        }
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate mock Eco‑Nexus proposal data.")
    parser.add_argument(
        "--n",
        type=int,
        default=200,
        help="Number of samples to generate.",
    )
    parser.add_argument(
        "--out",
        type=str,
        default="data/proposals.csv",
        help="Output CSV path.",
    )

    args = parser.parse_args()
    df = generate(args.n)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_path, index=False)

    print(f"Wrote {len(df)} proposals to {out_path}")


if __name__ == "__main__":
    main()

