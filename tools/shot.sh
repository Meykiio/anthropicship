#!/usr/bin/env bash
# Screenshot an SVG or HTML file with a headless browser, so you can look at it.
#   bash tools/shot.sh <in.svg|in.html> <out.png> [width] [height]
# Safe to run from several agents at once: each run uses its own profile folder.
set -euo pipefail

in="$1"
out="$2"
w="${3:-1608}"
h="${4:-1008}"

browser="/c/Program Files/Google/Chrome/Application/chrome.exe"
[ -f "$browser" ] || browser="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"

abs_in="$(cd "$(dirname "$in")" && pwd -W)/$(basename "$in")"
mkdir -p "$(dirname "$out")"
abs_out="$(cd "$(dirname "$out")" && pwd -W)/$(basename "$out")"
profile="$(mktemp -d)"
profile_win="$(cd "$profile" && pwd -W)"

"$browser" --headless=new --disable-gpu --hide-scrollbars --no-first-run \
  --user-data-dir="$profile_win" --window-size="$w,$h" \
  --screenshot="$abs_out" "file:///$abs_in" >/dev/null 2>&1 || true

rm -rf "$profile" 2>/dev/null || true
[ -f "$abs_out" ] && echo "wrote $abs_out (${w}x${h})" || { echo "screenshot failed"; exit 1; }
