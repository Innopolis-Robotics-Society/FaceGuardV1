#!/bin/bash
set -e

AGENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$AGENT_DIR"

echo "Showing FaceGuard Agent logs..."
echo "Press Ctrl+C to exit"
echo ""

docker compose logs -f
