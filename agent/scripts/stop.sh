#!/bin/bash
set -e

AGENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$AGENT_DIR"

echo "Stopping FaceGuard Agent..."
docker compose down

echo "Agent stopped successfully!"
