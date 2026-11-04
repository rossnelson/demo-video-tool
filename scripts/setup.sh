#!/usr/bin/env bash
# Cloud environment setup for the demo video tool.
#
# Claude Code runs the environment's setup script one directory above the
# repository checkout, once per new session, with no access to the
# environment's secrets (those arrive as variables inside the session).
# Paste this file's contents into the environment's "Setup script" field,
# or, once it is on main, use the one-liner:
#   cd demo-video-tool && bash scripts/setup.sh
#
# Idempotent: safe to re-run inside a session.
set -euo pipefail

REPO_DIR="${REPO_DIR:-demo-video-tool}"
[ "$(basename "$PWD")" = "$REPO_DIR" ] || cd "$REPO_DIR"

say()  { printf '\n==> %s\n' "$*"; }
have() { command -v "$1" >/dev/null 2>&1; }
apt_install() {
  # Apt lists are usually present; refresh them only if a plain install fails.
  sudo apt-get install -y -qq "$@" >/dev/null 2>&1 ||
    { sudo apt-get update -qq && sudo apt-get install -y -qq "$@"; }
}

# ---------------------------------------------------------------- system tools
say "System tools"
pkgs=()
have ffmpeg && have ffprobe || pkgs+=(ffmpeg)   # assemble.py, narrate.py, check_audio.py
have xvfb-run               || pkgs+=(xvfb)     # record.mjs opens a headed Chromium
[ "${#pkgs[@]}" -eq 0 ] || apt_install "${pkgs[@]}"
printf '  %s\n' "$(ffmpeg -version | head -1 | cut -d' ' -f1-3)" "xvfb-run: $(command -v xvfb-run)"

# --------------------------------------------------------- python: beat tracker
say "Python: .venv with $(tr '\n' ' ' < requirements.txt)"
if have uv; then
  [ -x .venv/bin/python ] || uv venv -q .venv
  uv pip install -q -p .venv/bin/python -r requirements.txt
else
  [ -x .venv/bin/python ] || python3 -m venv .venv
  .venv/bin/pip install -q --disable-pip-version-check -r requirements.txt
fi
.venv/bin/python - <<'PY'
import librosa, numpy, sys
print(f"  python {sys.version.split()[0]}, librosa {librosa.__version__}, numpy {numpy.__version__}")
PY

# ------------------------------------------------------------ node: playwright
say "Node: Playwright"
# The image ships Playwright and a matching Chromium under /opt/pw-browsers.
# Never run "playwright install" or add playwright to package.json: a second
# copy would look for a browser build that is not there. lib/playwright.mjs
# finds this copy; elsewhere set PLAYWRIGHT_DIR to a checkout that has one.
node -e '
  const pw = require("playwright");
  console.log(`  node ${process.version}, playwright ${require("playwright/package.json").version}, chromium ${pw.chromium.executablePath()}`);
'

# ------------------------------------------------------------------ inputs
say "Session inputs (set in the environment's variables / secrets)"
check_var() {  # name, purpose
  if [ -n "${!1:-}" ]; then printf '  %-20s set\n' "$1"
  else printf '  %-20s unset  (%s)\n' "$1" "$2"; fi
}
check_var ELEVENLABS_API_KEY "demo narrate needs it, or write the key to .el-key; --dry works without"
check_var MUSIC              "overrides music.path in a project's project.mjs"
# A project may read more of its own, such as the URL of the app it records.

say "Ready: bin/demo <command> <project-dir>. Try: bin/demo all projects/example --dry"
