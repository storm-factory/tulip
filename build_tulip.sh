#!/bin/bash
set -e

# Get version from package.json or prompt user
VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
echo "Current version: $VERSION"
echo "Press Enter to use this version, or type a new version:"
read NEW_VERSION
if [ ! -z "$NEW_VERSION" ]; then
    VERSION=$NEW_VERSION
fi

echo ""
echo "Building Tulip v$VERSION for macOS and Windows..."
echo ""

# Clean previous builds
rm -rf dist/

# Build for macOS (Intel and Apple Silicon)
echo "Building for macOS (x64 + arm64)..."
npx electron-packager . tulip \
    --platform=darwin \
    --arch=x64,arm64 \
    --icon=tulip-logo.icns \
    --app-version=$VERSION \
    --electron-version=33.0.0 \
    --out=dist \
    --overwrite \
    --asar.unpackDir="assets/svg" \
    --ignore="^/(dist|test|\.git|\.github|node_modules/\.cache)" \
    --app-bundle-id="com.tulip.app" \
    --app-category-type="public.app-category.productivity"

echo ""

# Build for Windows
echo ""
echo "Note: Windows builds from macOS require Wine or a Windows machine."
echo "To build for Windows:"
echo "  1. Install Wine: brew install --cask wine-stable"
echo "  2. Or use GitHub Actions / CI for cross-platform builds"
echo "  3. Or build on a Windows machine"
echo ""
echo "Skipping Windows build..."

echo ""
echo "Builds complete!"
echo ""
echo "macOS builds:"
ls -lh dist/tulip-darwin-*/tulip.app
echo ""
