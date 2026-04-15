#!/bin/bash
# build-android.sh - Build Android release APK(s)
# Usage: scripts/build-android.sh [arch]
#   arch: all (default), aarch64, armv7, i686, x86_64

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
RELEASE_DIR="$ROOT_DIR/release"
ARCH="${1:-all}"

# Optional version label for artifact names.
# CI tag builds provide GITHUB_REF_NAME (e.g. v0.1.10), and local builds can
# override with TIN_VERSION if desired.
VERSION="${TIN_VERSION:-${GITHUB_REF_NAME#v}}"
VERSION_PREFIX=""
if [ -n "$VERSION" ]; then
  VERSION_PREFIX="${VERSION}_"
fi

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

EXPECTED_ABI=""
case "$ARCH" in
  aarch64) EXPECTED_ABI="arm64-v8a" ;;
  armv7) EXPECTED_ABI="armeabi-v7a" ;;
  i686) EXPECTED_ABI="x86" ;;
  x86_64) EXPECTED_ABI="x86_64" ;;
esac

OUTPUT_APKS=()
index=0
for apk in "${APKS[@]}"; do
  index=$((index + 1))

  ABI_CSV=""
  if command -v unzip >/dev/null 2>&1; then
    ABI_CSV=$(unzip -Z1 "$apk" "lib/*/*.so" 2>/dev/null | awk -F/ '{print $2}' | sort -u | paste -sd, -)
    if [ -n "$ABI_CSV" ]; then
      echo "    APK ABI(s): $ABI_CSV"
    fi
  fi

  if [ -n "$EXPECTED_ABI" ] && [ -n "$ABI_CSV" ]; then
    if [[ ",$ABI_CSV," != *",$EXPECTED_ABI,"* ]]; then
      echo "❌ Built APK does not contain expected ABI '$EXPECTED_ABI' for arch '$ARCH'"
      echo "    APK: $apk"
      echo "    ABI(s): $ABI_CSV"
      exit 1
    fi
  fi

  if [ "$ARCH" = "all" ] && [ -n "$ABI_CSV" ]; then
    if [[ ",$ABI_CSV," != *",arm64-v8a,"* ]]; then
      echo "❌ Universal APK is missing arm64-v8a ABI (likely incompatible on most phones)"
      echo "    APK: $apk"
      echo "    ABI(s): $ABI_CSV"
      exit 1
    fi
  fi

  if [ "$ARCH" = "all" ]; then
    OUTPUT_NAME="Tin_${VERSION_PREFIX}universal.apk"
  else
    OUTPUT_NAME="Tin_${VERSION_PREFIX}${ARCH}.apk"
  fi

  if [ "${#APKS[@]}" -gt 1 ]; then
    OUTPUT_NAME="${OUTPUT_NAME%.apk}_${index}.apk"
  fi

  OUTPUT_PATH="$RELEASE_DIR/$OUTPUT_NAME"
  cp "$apk" "$OUTPUT_PATH"
  OUTPUT_APKS+=("$OUTPUT_PATH")
done

echo ""
echo "=========================================="
echo "  Android APK(s) copied to: release/"
ls -lh "${OUTPUT_APKS[@]}"
echo "=========================================="
