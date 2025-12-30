#!/bin/bash
# sync-version.sh - Syncs version from Cargo.toml to package.json
# Runs as part of beforeBuildCommand in Tauri

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
CARGO_TOML="$ROOT_DIR/src-tauri/Cargo.toml"
PACKAGE_JSON="$ROOT_DIR/package.json"

# Extract version from Cargo.toml
VERSION=$(grep -m1 '^version' "$CARGO_TOML" | sed 's/version = "\([^"]*\)"/\1/' | tr -d '\r')

if [ -z "$VERSION" ]; then
    echo "❌ Could not find version in Cargo.toml"
    exit 1
fi

# Get current package.json version
CURRENT=$(grep -m1 '"version"' "$PACKAGE_JSON" | sed 's/.*"version": "\([^"]*\)".*/\1/')

if [ "$VERSION" = "$CURRENT" ]; then
    echo "✓ package.json already at v$VERSION"
else
    # Update package.json version using sed
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS requires empty string for -i
        sed -i '' "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" "$PACKAGE_JSON"
    else
        # Linux/Windows (Git Bash)
        sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$VERSION\"/" "$PACKAGE_JSON"
    fi
    echo "✓ Updated package.json to v$VERSION"
fi