"""
Predict vendor sustainability score using a trained ML model.

This is a standalone script that can be called from:
- The orchestration layer (Python),
- Other languages via subprocess (C, Node.js, etc.).
"""

import sys
from pathlib import Path

import joblib
import pandas as pd


def predict_sustainability(
    model_path: str,
    vendor_price_today: float,
    vendor_delivery_days: int,
    local_flag_numeric: int,
    past_sustainability_avg: float,
) -> float | None:
    """
    Predict vendor sustainability score.

    Returns a score in [0, 100], or None on failure.
    """
    try:
        model = joblib.load(model_path)

        features = pd.DataFrame(
            [
                {
                    "vendor_price_today": float(vendor_price_today),
                    "vendor_delivery_days": int(vendor_delivery_days),
                    "local_flag_numeric": int(local_flag_numeric),
                    "past_sustainability_avg": float(past_sustainability_avg),
                }
            ]
        )

        score = float(model.predict(features)[0])
        score = max(0.0, min(100.0, score))
        return round(score, 2)
    except Exception as exc:  # pragma: no cover - defensive
        print(f"ERROR: {exc}", file=sys.stderr)
        return None


def main() -> None:
    if len(sys.argv) != 6:
        print(
            "Usage: predict_sustainability.py <model_path> <price_today> "
            "<delivery_days> <local_flag> <past_sustainability_avg>",
            file=sys.stderr,
        )
        sys.exit(1)

    model_path = sys.argv[1]
    if not Path(model_path).exists():
        print(f"ERROR: model not found: {model_path}", file=sys.stderr)
        sys.exit(1)

    try:
        vendor_price_today = float(sys.argv[2])
        vendor_delivery_days = int(sys.argv[3])
        local_flag_numeric = int(sys.argv[4])
        past_sustainability_avg = float(sys.argv[5])
    except ValueError as exc:
        print(f"ERROR: invalid numeric argument: {exc}", file=sys.stderr)
        sys.exit(1)

    score = predict_sustainability(
        model_path,
        vendor_price_today,
        vendor_delivery_days,
        local_flag_numeric,
        past_sustainability_avg,
    )

    if score is None:
        sys.exit(1)

    print(score)


if __name__ == "__main__":
    main()

