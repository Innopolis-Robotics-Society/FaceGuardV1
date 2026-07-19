#!/bin/bash
set -e

AGENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$AGENT_DIR"

if [ ! -f ".env" ]; then
    echo "Error: .env file not found in $AGENT_DIR"
    echo "Please create .env file with required variables"
    echo "You can copy from .env.example if available"
    exit 1
fi

echo "Starting FaceGuard Agent..."
docker compose up -d

echo ""
echo "Agent started successfully!"
echo "Following logs (Ctrl+C to exit, container will keep running)..."
echo ""

docker compose logs -f
