#!/usr/bin/env bash
# One-command real-window e2e for local AI: launches the app with the
# e2e-testing feature, brings up the tauri-webdriver bridge, drives the actual
# webview to run a local-AI analysis on a fixture DICOM, then tears everything
# down. Proves the bundled llama-server local AI works end to end in the app.
#
# Requires: `cargo install tauri-webdriver` and `pnpm install` (webdriverio).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PLUGIN_PORT=4445
DRIVER_PORT=4444
APP_LOG=/tmp/openscans-e2e-app.log
DRIVER_LOG=/tmp/openscans-e2e-driver.log

cleanup() {
  echo "[e2e] cleaning up..."
  [[ -n "${DRIVER_PID:-}" ]] && kill "$DRIVER_PID" 2>/dev/null || true
  [[ -n "${APP_PID:-}" ]] && kill "$APP_PID" 2>/dev/null || true
  pkill -f "tauri-webdriver" 2>/dev/null || true
  pkill -f "target/debug/app" 2>/dev/null || true
  pkill -f "binaries/llama-server" 2>/dev/null || true
  lsof -ti:${PLUGIN_PORT},${DRIVER_PORT} 2>/dev/null | xargs kill 2>/dev/null || true
}
trap cleanup EXIT

cleanup
sleep 1

echo "[e2e] preparing fixture..."
base64 -i e2e/fixtures/single-image.dcm | tr -d '\n' > /tmp/fixture-dcm-b64.txt

echo "[e2e] launching app (tauri dev --features e2e-testing)..."
pnpm tauri dev --features e2e-testing > "$APP_LOG" 2>&1 &
APP_PID=$!

echo "[e2e] waiting for webdriver plugin on :${PLUGIN_PORT} (cold build can take minutes)..."
for i in $(seq 1 180); do
  lsof -ti:${PLUGIN_PORT} >/dev/null 2>&1 && break
  if ! kill -0 "$APP_PID" 2>/dev/null; then echo "[e2e] app exited early:"; tail -20 "$APP_LOG"; exit 1; fi
  sleep 2
done

echo "[e2e] starting tauri-webdriver bridge..."
tauri-webdriver > "$DRIVER_LOG" 2>&1 &
DRIVER_PID=$!
for i in $(seq 1 15); do
  curl -sf http://localhost:${DRIVER_PORT}/status >/dev/null 2>&1 && break
  sleep 1
done

echo "[e2e] driving the window..."
node scripts/e2e-local-ai.mjs
