#!/bin/bash
# Wrapper script to run LED test with correct Python path

# Change to agent directory (parent of scripts)
cd "$(dirname "$0")/.."

# Run as Python module to ensure proper imports
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
python3 -m scripts.test_leds "$@"
