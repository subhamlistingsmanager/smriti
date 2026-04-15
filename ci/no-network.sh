#!/bin/bash
# CI check: ensure no network calls exist in the app source code.
# This is a hard constraint — Smriti is fully offline.

set -e

echo "Checking for network call patterns in src/..."

PATTERNS=(
  "fetch("
  "XMLHttpRequest"
  "axios"
  "http://"
  "https://"
  "WebSocket"
  "navigator.onLine"
  "NetInfo"
  "expo-network"
  "react-native-network"
)

FAILED=0

for pattern in "${PATTERNS[@]}"; do
  # Search in src/ and App.tsx, excluding comments
  matches=$(grep -rn "$pattern" src/ App.tsx 2>/dev/null | grep -v "^.*//.*$pattern" | grep -v "^.*\*.*$pattern" || true)
  if [ -n "$matches" ]; then
    echo "VIOLATION: Found '$pattern' in source code:"
    echo "$matches"
    FAILED=1
  fi
done

if [ $FAILED -eq 1 ]; then
  echo ""
  echo "Network calls detected. Smriti must be fully offline."
  echo "Remove all network-related code before committing."
  exit 1
fi

echo "No network calls found. All clear."
