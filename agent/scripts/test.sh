#!/bin/bash
set -e

AGENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$AGENT_DIR"

if [ $# -eq 0 ]; then
    echo "FaceGuard Agent - Test Runner"
    echo "=============================="
    echo ""
    echo "Available tests:"
    echo "  leds    - Test LED indicators (requires GPIO access)"
    echo ""
    echo "Usage: ./scripts/test.sh <test-name>"
    echo ""
    echo "Example:"
    echo "  ./scripts/test.sh leds"
    exit 0
fi

TEST_NAME="$1"

case "$TEST_NAME" in
    leds)
        echo "Testing LED indicators..."
        echo "Note: Requires GPIO access (--privileged flag)"
        docker compose run --rm --privileged agent python scripts/test_leds.py
        ;;
    *)
        echo "Error: Unknown test '$TEST_NAME'"
        echo "Run './scripts/test.sh' to see available tests"
        exit 1
        ;;
esac
