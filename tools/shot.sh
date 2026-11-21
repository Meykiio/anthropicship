#!/usr/bin/env bash
# Screenshots an HTML file with headless Chrome or Edge, at 2x:
#   bash tools/shot.sh <in.html> <out.png> [width] [height]
set -euo pipefail
in="$1"; out="$2"; w="${3:-1200}"; h="${4:-900}"
browser="/c/Program Files/Google/Chrome/Application/chrome.exe"
[ -f "$browser" ] || browser="/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
profile="$(mktemp -d)"
mkdir -p "$(dirname "$out")"
"$browser" --headless=new --disable-gpu --hide-scrollbars --no-first-run --force-device-scale-factor=2 \
  --user-data-dir="$(cygpath -w "$profile")" --window-size="$w,$h" \
  --screenshot="$(cygpath -w "$(pwd)/$out")" "file:///$(cygpath -m "$(pwd)/$in")" >/dev/null 2>&1 || true
rm -rf "$profile" 2>/dev/null || true
[ -f "$out" ] && echo "wrote $out" || { echo "screenshot failed"; exit 1; }
