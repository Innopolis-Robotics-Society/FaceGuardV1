#!/bin/bash
set -e

AGENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$AGENT_DIR"

echo "FaceGuard Agent - Setup Script"
echo "==============================="
echo ""

if [ ! -f ".env" ]; then
    echo "Warning: .env file not found"
    echo "Please create .env file with required configuration"
    echo ""
    if [ -f ".env.example" ]; then
        echo "You can start with: cp .env.example .env"
        echo ""
    fi
fi

echo "Step 1: Building Docker image..."
docker compose build

echo ""
echo "Step 2: Downloading required models..."
docker compose run --rm agent python scripts/download_models.py

echo ""
echo "==============================="
echo "Setup completed successfully!"
echo ""
echo "Next steps:"
echo "  1. Configure .env file with your settings"
echo "  2. Run: ./scripts/run.sh"
echo ""
