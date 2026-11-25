#!/usr/bin/env bash
# demo-video setup: installs what Homebrew does not, into $DEMO_VIDEO_HOME.
#   venv/          the beat tracker's Python packages (requirements.txt)
#   node_modules/  Playwright, and its Chromium build (in Playwright's cache)
# Safe to run again: each step installs only what is missing or out of date.
#   setup.sh <tool root>
set -euo pipefail
root=${1:?setup.sh <tool root>}
home=${DEMO_VIDEO_HOME:?DEMO_VIDEO_HOME is not set}

say() { printf '\n==> %s\n' "$*"; }
die() { printf 'demo-video setup: %s\n' "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

have python3 || die "python3 not found. Install Python 3 (brew install python@3.12)."
have node && have npm || die "node and npm not found. Install Node 20+ (brew install node)."
mkdir -p "$home"

say "Python: $home/venv with $(tr '\n' ' ' < "$root/requirements.txt")"
# A venv whose Python went away (an upgrade of Homebrew's Python) is made again.
if [ -e "$home/venv" ] && ! "$home/venv/bin/python" -c '' >/dev/null 2>&1; then
  echo "  the venv's Python is gone; making it again"
  rm -rf "$home/venv"
fi
[ -x "$home/venv/bin/python" ] || python3 -m venv "$home/venv"
"$home/venv/bin/python" -m pip install -q --disable-pip-version-check -r "$root/requirements.txt"
"$home/venv/bin/python" -c 'import librosa, numpy, sys; print(f"  python {sys.version.split()[0]}, librosa {librosa.__version__}, numpy {numpy.__version__}")'

say "Node: Playwright in $home/node_modules"
[ -f "$home/package.json" ] || printf '{\n  "private": true,\n  "dependencies": { "playwright": "^1.50.0" }\n}\n' > "$home/package.json"
npm install --prefix "$home" --no-audit --no-fund --loglevel=error
say "Chromium for Playwright"
(cd "$home" && npx --no-install playwright install chromium)
(cd "$home" && node -e 'const pw = require("playwright"); console.log(`  playwright ${require("playwright/package.json").version}, chromium ${pw.chromium.executablePath()}`)')

say "Done. Run demo-video doctor to check everything."
