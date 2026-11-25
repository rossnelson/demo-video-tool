#!/usr/bin/env bash
# demo-video doctor: reports each dependency as found or missing, and what
# fixes a missing one. Exits 1 when anything is missing.
#   doctor.sh <tool root>
set -uo pipefail
root=${1:?doctor.sh <tool root>}
home=${DEMO_VIDEO_HOME:?DEMO_VIDEO_HOME is not set}
config=${XDG_CONFIG_HOME:-$HOME/.config}/demo-video
missing=0

found()   { printf '  found    %-14s %s\n' "$1" "$2"; }
lacking() { printf '  missing  %-14s %s\n' "$1" "$2"; missing=1; }
tool() {  # command, fix
  if command -v "$1" >/dev/null 2>&1; then found "$1" "$(command -v "$1")"; else lacking "$1" "$2"; fi
}

echo "demo-video $(cat "$root/VERSION")"
echo "data folder: $home"
tool ffmpeg  "brew install ffmpeg"
tool ffprobe "brew install ffmpeg"
tool node    "brew install node"
tool python3 "brew install python@3.12"

# The beat tracker: the checkout's .venv, else the data folder's venv.
py=
for p in "$root/.venv/bin/python" "$home/venv/bin/python"; do [ -x "$p" ] && { py=$p; break; }; done
if [ -n "$py" ] && "$py" -c 'import librosa, numpy' >/dev/null 2>&1; then
  found "beat tracker" "$py"
else
  lacking "beat tracker" "run demo-video setup"
fi

# Playwright: $PLAYWRIGHT_DIR, the tool's module path, else the data folder.
pw=$(cd "$root" && node --input-type=module -e '
  import { playwright } from "./lib/playwright.mjs";
  import { existsSync } from "node:fs";
  try {
    const { chromium } = playwright();
    const exe = chromium.executablePath();
    console.log(existsSync(exe) ? `ok ${exe}` : "nobrowser");
  } catch { console.log("none"); }
' 2>/dev/null)
case $pw in
  ok\ *)     found "playwright" "${pw#ok }" ;;
  nobrowser) lacking "playwright" "Chromium is not installed: run demo-video setup" ;;
  *)         lacking "playwright" "run demo-video setup" ;;
esac

if [ -n "${ELEVENLABS_API_KEY:-}" ]; then found "ElevenLabs key" "\$ELEVENLABS_API_KEY"
elif [ -s "$config/el-key" ]; then found "ElevenLabs key" "$config/el-key"
elif [ -s "$root/.el-key" ]; then found "ElevenLabs key" "$root/.el-key"
else lacking "ElevenLabs key" "set ELEVENLABS_API_KEY, or write it to $config/el-key or a project's .el-key (narrate --dry needs none)"
fi

if [ "$missing" -ne 0 ]; then echo; echo "Something is missing: see the lines above."; exit 1; fi
echo; echo "Everything is ready."
