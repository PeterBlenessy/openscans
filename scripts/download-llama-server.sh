#!/bin/bash
# Download a prebuilt llama-server (llama.cpp) and place it where Tauri expects
# the bundled sidecar: src-tauri/binaries/llama-server-<target-triple>.
#
# Usage:
#   ./scripts/download-llama-server.sh [version]
#   ./scripts/download-llama-server.sh b5460     # pin a llama.cpp release tag
#   ./scripts/download-llama-server.sh           # uses the latest release tag
#
# Supports the host platform (macOS arm64/x64, Linux x64). Windows binaries are
# fetched on a Windows host via this script under Git Bash, or downloaded
# manually from the llama.cpp releases page.
#
# NOTE: not yet exercised in CI for every platform — verify the asset name and
# the resulting binary before a release build.
set -euo pipefail

REPO="ggml-org/llama.cpp"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST_DIR="${ROOT_DIR}/src-tauri/binaries"

# ---------------------------------------------------------------------------
# Resolve version (default: latest release tag)
# ---------------------------------------------------------------------------
VERSION="${1:-}"
if [[ -z "${VERSION}" ]]; then
  echo "Resolving latest llama.cpp release tag..."
  VERSION="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
    | grep -m1 '"tag_name"' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')"
fi
echo "Using llama.cpp version: ${VERSION}"

# ---------------------------------------------------------------------------
# Map host OS/arch -> llama.cpp asset name + Rust target triple
# ---------------------------------------------------------------------------
OS="$(uname -s)"
ARCH="$(uname -m)"
case "${OS}-${ARCH}" in
  Darwin-arm64)
    ASSET="llama-${VERSION}-bin-macos-arm64.zip"
    TRIPLE="aarch64-apple-darwin" ;;
  Darwin-x86_64)
    ASSET="llama-${VERSION}-bin-macos-x64.zip"
    TRIPLE="x86_64-apple-darwin" ;;
  Linux-x86_64)
    ASSET="llama-${VERSION}-bin-ubuntu-x64.zip"
    TRIPLE="x86_64-unknown-linux-gnu" ;;
  *)
    echo "Unsupported host platform: ${OS}-${ARCH}" >&2
    echo "Download a matching asset manually from https://github.com/${REPO}/releases" >&2
    exit 1 ;;
esac

URL="https://github.com/${REPO}/releases/download/${VERSION}/${ASSET}"
echo "Asset: ${ASSET}"

# ---------------------------------------------------------------------------
# Download + extract
# ---------------------------------------------------------------------------
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

echo "Downloading ${URL}..."
curl -fSL "${URL}" -o "${TMP_DIR}/llama.zip"
unzip -q "${TMP_DIR}/llama.zip" -d "${TMP_DIR}/extracted"

# The binary lives in build/bin/ (recent releases) or bin/ (older).
SRC_BIN="$(find "${TMP_DIR}/extracted" -type f -name 'llama-server' | head -n1)"
if [[ -z "${SRC_BIN}" ]]; then
  echo "llama-server not found inside ${ASSET}" >&2
  exit 1
fi
SRC_LIB_DIR="$(dirname "${SRC_BIN}")"

mkdir -p "${DEST_DIR}"
DEST_BIN="${DEST_DIR}/llama-server-${TRIPLE}"
cp "${SRC_BIN}" "${DEST_BIN}"
chmod +x "${DEST_BIN}"

# Copy the shared libraries next to the binary so it can find them at runtime.
mkdir -p "${DEST_DIR}/lib"
find "${SRC_LIB_DIR}" -maxdepth 1 \( -name '*.dylib' -o -name '*.so' -o -name '*.so.*' \) \
  -exec cp {} "${DEST_DIR}/lib/" \; 2>/dev/null || true

# On macOS, rewrite the binary's library search path to @executable_path/lib so
# it locates the copied dylibs relative to itself once bundled.
if [[ "${OS}" == "Darwin" ]]; then
  for dylib in "${DEST_DIR}/lib/"*.dylib; do
    [[ -e "${dylib}" ]] || continue
    base="$(basename "${dylib}")"
    install_name_tool -change "@rpath/${base}" "@executable_path/lib/${base}" "${DEST_BIN}" 2>/dev/null || true
  done
  install_name_tool -add_rpath "@executable_path/lib" "${DEST_BIN}" 2>/dev/null || true
fi

echo "Installed: ${DEST_BIN}"
echo "Libraries: ${DEST_DIR}/lib/"
echo "Done."
