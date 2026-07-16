#!/bin/bash
set -e

AGENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$AGENT_DIR"

if [ $# -eq 0 ]; then
    echo "Usage: ./scripts/docker-run.sh <python-command>"
    echo ""
    echo "Examples:"
    echo "  ./scripts/docker-run.sh main.py"
    echo "  ./scripts/docker-run.sh scripts/test_leds.py"
    echo "  ./scripts/docker-run.sh scripts/download_models.py --force"
    exit 1
fi

if [ ! -f ".env" ]; then
    echo "Warning: .env file not found"
    echo "Some functionality may not work correctly"
    echo ""
fi

docker compose run --rm agent python "$@"
