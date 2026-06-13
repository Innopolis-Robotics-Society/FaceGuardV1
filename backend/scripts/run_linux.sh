#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements-pi.txt

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env. Change API_KEY before production."
fi

python main.py
