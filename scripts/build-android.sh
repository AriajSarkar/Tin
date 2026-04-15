#!/bin/bash
# build-android.sh - Build Android release APK(s)
# Usage: scripts/build-android.sh [arch]
#   arch: all (default), aarch64, armv7, i686, x86_64

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
RELEASE_DIR="$ROOT_DIR/release"
ARCH="${1:-all}"

case "$ARCH" in
  all|aarch64|armv7|i686|x86_64)
    ;;
  *)
    echo "❌ Unsupported Android arch: $ARCH"
    echo "Usage: scripts/build-android.sh [all|aarch64|armv7|i686|x86_64]"
    exit 1
    ;;
esac

cd "$ROOT_DIR"

echo "==> Building Android APK(s) for: $ARCH"
if [ "$ARCH" = "all" ]; then
  pnpm tauri android build --apk true
else
  pnpm tauri android build --apk true --target "$ARCH"
fi

mkdir -p "$RELEASE_DIR"

mapfile -t APKS < <(find "$ROOT_DIR/src-tauri/gen/android/app/build/outputs/apk" -type f -path "*/release/*.apk")
if [ "${#APKS[@]}" -eq 0 ]; then
  echo "❌ No release APKs found under src-tauri/gen/android/app/build/outputs/apk"
  exit 1
fi

for apk in "${APKS[@]}"; do
  cp "$apk" "$RELEASE_DIR/"
done

echo ""
echo "=========================================="
echo "  Android APK(s) copied to: release/"
ls -lh "$RELEASE_DIR"/*.apk
echo "=========================================="
