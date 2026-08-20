#!/usr/bin/env bash
#
# Fetches the CC0 upstream sources that dataforge imports from.
#
# Everything downloaded here is public domain (CC0 1.0). Nothing is committed to
# this repository -- vendor/ is gitignored, and dataforge treats it as optional
# input. The vertical slice runs without it, using the authored bootstrap
# location in packages/content/authored/.
#
# Usage: ./scripts/fetch-cc0-sources.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENDOR="$ROOT/vendor"
mkdir -p "$VENDOR"

clone_or_update() {
  local name="$1" url="$2"
  if [ -d "$VENDOR/$name/.git" ]; then
    echo "==> updating $name"
    git -C "$VENDOR/$name" pull --ff-only
  else
    echo "==> cloning $name"
    git clone --depth 1 "$url" "$VENDOR/$name"
  fi
}

# The complete server-side game logic and data from Glitch: items, skills,
# quests, recipes, achievements, dialogue. Released CC0 by Tiny Speck.
clone_or_update glitch-gsjs https://github.com/tinyspeck/glitch-GameServerJS.git

echo
echo "Fetched into $VENDOR:"
du -sh "$VENDOR"/* 2>/dev/null || true
echo
echo "Next: npm run dataforge"
