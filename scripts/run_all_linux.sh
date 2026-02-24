#!/usr/bin/env bash
set -euo pipefail

# End-to-end runner for Eco‑Nexus on Linux/WSL.
# 1) Set up Python env and install ML deps
# 2) Generate mock data (optional)
# 3) Train sustainability model
# 4) Build firmware (stubbed here, C engine may be added incrementally)
# 5) Run concurrent session simulation

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[1/5] Setting up Python virtualenv..."
VENV_DIR=".venv-eco"
if [[ ! -d "$VENV_DIR" ]]; then
  python3 -m venv "$VENV_DIR"
fi
source "$VENV_DIR/bin/activate"

echo "[2/5] Installing ML requirements..."
pip install --upgrade pip >/dev/null
pip install -r ml/requirements.txt

echo "[3/5] Generating mock proposal data..."
python scripts/generate_mock_data.py --n 300 --out data/proposals.csv

echo "[4/5] Training sustainability model..."
python ml/train_model.py --data data/proposals.csv --out ml/eco_nexus_model.joblib

echo "[5/5] Running concurrent session simulation (50 sessions)..."
python orchestration/session_manager.py \
  --model ml/eco_nexus_model.joblib \
  --sessions 50 \
  --workers 50 \
  --out orchestration_results.csv

echo "Done. See orchestration_results.csv for detailed per-session metrics."

