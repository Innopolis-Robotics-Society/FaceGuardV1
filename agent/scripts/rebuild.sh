#!/bin/bash
set -e

AGENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$AGENT_DIR"

echo "Rebuilding FaceGuard Agent Docker image..."
echo "This may take several minutes..."
echo ""

docker compose build --no-cache

echo ""
echo "Rebuild completed successfully!"
echo "Use ./scripts/run.sh to start the agent"
