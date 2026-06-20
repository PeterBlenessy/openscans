#!/bin/bash
# Build a SELF-CONTAINED `llama-server` (llama.cpp) from source and install it as
# the Tauri sidecar at `src-tauri/binaries/llama-server-<target-triple>`.
#
# Why build instead of download:
#   - Recent llama.cpp release binaries are dynamically linked (a thin launcher
#     plus a dozen dylibs). Bundling those into a *signed* .app means signing
#     every dylib too — tauri-action only signs the single externalBin, so the
#     app gets Gatekeeper-killed. A static build is one self-contained binary
#     (system frameworks only) that tauri-action signs as-is.
#   - We get the LATEST llama.cpp with exactly the features we need: multimodal
#     vision (mtmd/mmproj) IN, HTTPS/OpenSSL + curl OUT (loopback HTTP only).
#
# Usage:
#   ./scripts/build-llama-server.sh [version] [target-triple]
#   ./scripts/build-llama-server.sh                       # version from
#                                                         # binaries/LLAMA_CPP_VERSION,
#                                                         # host triple
#   ./scripts/build-llama-server.sh b9728 x86_64-apple-darwin   # cross-compile
#
# Supported hosts: macOS (arm64/x64, incl. cross-arch via CMAKE_OSX_ARCHITECTURES)
# and Linux x64. Windows is built via its own MSVC path (not this script).
set -euo pipefail

REPO="ggml-org/llama.cpp"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BINARIES_DIR="${ROOT_DIR}/src-tauri/binaries"
VERSION_FILE="${BINARIES_DIR}/LLAMA_CPP_VERSION"

# ---------------------------------------------------------------------------
# Resolve version + target triple
# ---------------------------------------------------------------------------
VERSION="${1:-}"
if [[ -z "${VERSION}" ]]; then
  VERSION="$(tr -d '[:space:]' < "${VERSION_FILE}" 2>/dev/null || true)"
fi
if [[ -z "${VERSION}" ]]; then
  echo "No version given and ${VERSION_FILE} is empty." >&2
  exit 1
fi

# Default target triple = host triple.
host_triple() {
  local arch os
  arch="$(uname -m)"
  case "${arch}" in
    arm64|aarch64) arch="aarch64" ;;
    x86_64|amd64)  arch="x86_64" ;;
  esac
  case "$(uname -s)" in
    Darwin) os="apple-darwin" ;;
    Linux)  os="unknown-linux-gnu" ;;
    *) echo "unsupported-host" ; return ;;
  esac
  echo "${arch}-${os}"
}
TRIPLE="${2:-$(host_triple)}"
echo "Building llama-server ${VERSION} for ${TRIPLE}"

# ---------------------------------------------------------------------------
# Per-target CMake flags
# ---------------------------------------------------------------------------
# Shared: static libs, no HTTPS (loopback only), no curl, server tool only.
CMAKE_FLAGS=(
  -DCMAKE_BUILD_TYPE=Release
  -DBUILD_SHARED_LIBS=OFF
  -DLLAMA_OPENSSL=OFF
  -DLLAMA_CURL=OFF
  -DLLAMA_BUILD_TESTS=OFF
  -DLLAMA_BUILD_EXAMPLES=OFF
  -DLLAMA_BUILD_TOOLS=ON
)

case "${TRIPLE}" in
  aarch64-apple-darwin|x86_64-apple-darwin)
    # Metal GPU with the shader library embedded into the binary (no sidecar
    # .metallib file to ship). Embedding needs the Metal toolchain at build.
    if ! xcrun -sdk macosx metal --version >/dev/null 2>&1; then
      echo "Metal toolchain missing — downloading (one-time, ~700 MB)..."
      xcodebuild -downloadComponent MetalToolchain
    fi
    OSX_ARCH="$([[ "${TRIPLE}" == aarch64-* ]] && echo arm64 || echo x86_64)"
    CMAKE_FLAGS+=(
      -DGGML_METAL=ON
      -DGGML_METAL_EMBED_LIBRARY=ON
      -DCMAKE_OSX_ARCHITECTURES="${OSX_ARCH}"
    )
    ;;
  x86_64-unknown-linux-gnu|aarch64-unknown-linux-gnu)
    # CPU build (BLAS via the system if present). GPU backends are opt-in and
    # would re-introduce runtime .so dependencies, defeating self-containment.
    ;;
  *)
    echo "Unsupported target triple: ${TRIPLE}" >&2
    exit 1 ;;
esac

# ---------------------------------------------------------------------------
# Clone + build
# ---------------------------------------------------------------------------
SRC_DIR="$(mktemp -d)"
trap 'rm -rf "${SRC_DIR}"' EXIT

echo "Cloning ${REPO}@${VERSION}..."
git clone --depth 1 --branch "${VERSION}" "https://github.com/${REPO}" "${SRC_DIR}" 2>&1 | tail -1

cmake -S "${SRC_DIR}" -B "${SRC_DIR}/build" "${CMAKE_FLAGS[@]}"
cmake --build "${SRC_DIR}/build" --target llama-server -j"$(getconf _NPROCESSORS_ONLN 2>/dev/null || echo 4)"

SRC_BIN="$(find "${SRC_DIR}/build" -name 'llama-server' -type f -perm -u+x | head -1)"
if [[ -z "${SRC_BIN}" ]]; then
  echo "Build produced no llama-server binary." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# Verify self-contained (macOS): only system libraries may be linked.
# ---------------------------------------------------------------------------
if [[ "${TRIPLE}" == *-apple-darwin ]]; then
  NONSYS="$(otool -L "${SRC_BIN}" | tail -n +2 | grep -vE '/usr/lib/|/System/Library/' || true)"
  if [[ -n "${NONSYS}" ]]; then
    echo "ERROR: binary links non-system libraries (not self-contained):" >&2
    echo "${NONSYS}" >&2
    exit 1
  fi
  echo "Verified self-contained (system frameworks only)."
fi

# ---------------------------------------------------------------------------
# Install
# ---------------------------------------------------------------------------
mkdir -p "${BINARIES_DIR}"
DEST_BIN="${BINARIES_DIR}/llama-server-${TRIPLE}"
cp "${SRC_BIN}" "${DEST_BIN}"
chmod +x "${DEST_BIN}"

# Copying invalidates the linker's ad-hoc signature; on Apple Silicon an
# invalidly-signed binary is SIGKILL'd on exec. Re-sign ad-hoc so it runs in
# dev. A release build re-signs this with the real Developer ID identity.
if [[ "${TRIPLE}" == *-apple-darwin ]]; then
  codesign --force --sign - "${DEST_BIN}"
fi

echo "Installed: ${DEST_BIN}"
ls -lh "${DEST_BIN}"
"${DEST_BIN}" --version 2>&1 | head -2 || true
echo "Done."
