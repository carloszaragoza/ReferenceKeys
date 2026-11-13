#!/bin/sh
# Renders landing/assets/og.jpg (1200x630 social card) from tools/landing/og.html with headless Chrome.
cd "$(dirname "$0")/../.." || exit 1
OUT="$PWD/landing/assets"
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=3000 \
  --screenshot="$OUT/og.png" "file://$PWD/tools/landing/og.html" || exit 1
sips -s format jpeg -s formatOptions 84 "$OUT/og.png" --out "$OUT/og.jpg" >/dev/null && rm "$OUT/og.png"
