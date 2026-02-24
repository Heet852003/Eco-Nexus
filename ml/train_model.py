"""
Train a simple sustainability scoring model for Eco‑Nexus.

This script:
- Loads proposal data (or generates synthetic data if none is provided),
- Trains a regression model to predict a sustainability score (0–100),
- Saves the model as a .joblib artifact alongside minimal metadata.
"""

import argparse
import json
import os
from datetime import datetime

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split


DEFAULT_OUTPUT_MODEL = "eco_nexus_model.joblib"
DEFAULT_METADATA = "eco_nexus_model_meta.json"


def generate_synthetic_data(n_samples: int = 500) -> pd.DataFrame:
    rng = np.random.default_rng(seed=42)

    price_today = rng.normal(loc=100.0, scale=25.0, size=n_samples).clip(10, 500)
    delivery_days = rng.integers(low=1, high=60, size=n_samples)
    local_flag_numeric = rng.integers(low=0, high=2, size=n_samples)
    past_sustainability_avg = rng.normal(loc=75.0, scale=10.0, size=n_samples).clip(0, 100)

    # Simple synthetic relationship:
    # lower price, lower delivery days, local vendors, and higher past sustainability are better.
    base = 80.0
    score = (
        base
        - 0.1 * (price_today - 80.0)
        - 0.3 * (delivery_days - 7.0)
        + 5.0 * local_flag_numeric
        + 0.5 * (past_sustainability_avg - 70.0)
    )
    score = np.clip(score, 0, 100)

    return pd.DataFrame(
        {
            "vendor_price_today": price_today,
            "vendor_delivery_days": delivery_days,
            "local_flag_numeric": local_flag_numeric,
            "past_sustainability_avg": past_sustainability_avg,
            "target_score": score,
        }
    )


def load_data(path: str | None) -> pd.DataFrame:
    if path is None:
        return generate_synthetic_data()

    if not os.path.exists(path):
        raise FileNotFoundError(f"Data file not found: {path}")

    if path.endswith(".csv"):
        df = pd.read_csv(path)
    elif path.endswith(".json"):
        df = pd.read_json(path)
    else:
        raise ValueError("Unsupported data format. Use CSV or JSON.")

    required_cols = {
        "vendor_price_today",
        "vendor_delivery_days",
        "local_flag_numeric",
        "past_sustainability_avg",
        "target_score",
    }
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns in data: {missing}")

    return df[list(required_cols)]


def train_and_save(
    data_path: str | None,
    out_model: str,
    out_meta: str,
    random_state: int = 42,
) -> None:
    df = load_data(data_path)

    feature_cols = [
        "vendor_price_today",
        "vendor_delivery_days",
        "local_flag_numeric",
        "past_sustainability_avg",
    ]
    X = df[feature_cols]
    y = df["target_score"]

    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=random_state
    )

    model = RandomForestRegressor(
        n_estimators=200,
        max_depth=8,
        random_state=random_state,
        n_jobs=-1,
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_val)
    mae = float(mean_absolute_error(y_val, y_pred))
    r2 = float(r2_score(y_val, y_pred))

    joblib.dump(model, out_model)

    metadata = {
        "created_at": datetime.utcnow().isoformat() + "Z",
        "data_path": data_path,
        "output_model": out_model,
        "features": feature_cols,
        "metrics": {
            "mae": mae,
            "r2": r2,
        },
        "random_state": random_state,
    }

    with open(out_meta, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"Saved model to {out_model}")
    print(f"Saved metadata to {out_meta}")
    print(f"Validation MAE={mae:.3f}, R²={r2:.3f}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Train Eco‑Nexus sustainability model.")
    parser.add_argument(
        "--data",
        type=str,
        default=None,
        help="Path to CSV/JSON data file. If omitted, synthetic data is generated.",
    )
    parser.add_argument(
        "--out",
        type=str,
        default=DEFAULT_OUTPUT_MODEL,
        help=f"Output model path (default: {DEFAULT_OUTPUT_MODEL})",
    )
    parser.add_argument(
        "--meta-out",
        type=str,
        default=DEFAULT_METADATA,
        help=f"Output metadata JSON path (default: {DEFAULT_METADATA})",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducibility.",
    )

    args = parser.parse_args()
    train_and_save(args.data, args.out, args.meta_out, random_state=args.seed)


if __name__ == "__main__":
    main()

