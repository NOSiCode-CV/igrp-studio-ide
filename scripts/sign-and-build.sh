#!/bin/bash
set -e

# Load signing credentials
if [ -f .env.signing ]; then
    export APPLE_ID=$(grep "^APPLE_ID=" .env.signing | cut -d '=' -f2)
    export APPLE_TEAM_ID=$(grep "^APPLE_TEAM_ID=" .env.signing | cut -d '=' -f2)
    export APPLE_APP_SPECIFIC_PASSWORD=$(grep "^APPLE_APP_SPECIFIC_PASSWORD=" .env.signing | cut -d '=' -f2)

    echo "✓ Loaded signing credentials"
    echo "  APPLE_ID: $APPLE_ID"
    echo "  APPLE_TEAM_ID: $APPLE_TEAM_ID"
    echo "  Password: [HIDDEN]"
else
    echo "Error: .env.signing file not found"
    exit 1
fi

# Release notes for the update feed (embedded into the channel yml
# via build.releaseInfo.releaseNotesFile)
node scripts/generate-release-notes.mjs

# Run the build
echo "Building with notarization..."
electron-vite build && electron-builder --mac "$@" --config
