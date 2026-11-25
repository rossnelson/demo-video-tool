#!/usr/bin/env bash
# Tests the demo-video command as an installed command would run: through a
# symlink, from a folder outside the checkout, with a temp HOME.
#   tests/cli_test.sh
set -uo pipefail
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
fails=0; passes=0

pass() { passes=$((passes + 1)); printf '  ok    %s\n' "$1"; }
fail() { fails=$((fails + 1)); printf '  FAIL  %s\n' "$1"; [ -z "${2:-}" ] || printf '%s\n' "$2" | head -12 | sed 's/^/        /'; }
# expect <name> <haystack> <needle>...
expect() {
  local name=$1 out=$2; shift 2
  for needle in "$@"; do
    grep -qF -- "$needle" <<<"$out" || { fail "$name: no \"$needle\"" "$out"; return; }
  done
  pass "$name"
}

# An installed layout: a bin folder elsewhere with a symlink named demo-video.
mkdir -p "$tmp/bin" "$tmp/home" "$tmp/work"
ln -s "$root/bin/demo" "$tmp/bin/demo-video"
export HOME="$tmp/home" XDG_DATA_HOME= XDG_CONFIG_HOME= DEMO_VIDEO_HOME=
unset ELEVENLABS_API_KEY MUSIC PLAYWRIGHT_DIR
dv() { (cd "$tmp/work" && "$tmp/bin/demo-video" "$@"); }
version=$(cat "$root/VERSION")

echo "version and help (R1.S1)"
expect "--version" "$(dv --version)" "demo-video $version"
help=$(dv --help)
expect "--help lists every command" "$help" "demo-video <command>" setup doctor --version new show narrate beats plan record assemble check splash build all themes "theme <name> [project]"
expect "the formula's wrapper name" "$(DEMO_VIDEO_NAME=demo-video "$root/bin/demo" --help; DEMO_VIDEO_NAME=demo-video "$root/bin/demo" nope 2>&1)" "demo-video <command>" "demo-video nope: which project directory?"

echo "a new project outside the checkout (R1.S2)"
out=$(dv new "my video" 2>&1)
if [ -f "$tmp/work/my video/project.mjs" ] && [ -f "$tmp/work/my video/page.html" ]; then pass "new copies the example project"; else fail "new copies the example project" "$out"; fi
expect "show prints the new project" "$(dv show "my video" 2>&1)" '"name": "notes-demo"' '"cardBeats": 8'
dv new "my video" >/dev/null 2>&1 && fail "new on an existing folder fails" || pass "new on an existing folder fails"

echo "a symlinked command finds its files (R1.S3)"
expect "themes" "$(dv themes 2>&1)" slant paper terminal

echo "the checkout keeps working (R1.S4)"
expect "bin/demo show" "$(cd "$root" && bin/demo show projects/example 2>&1)" '"name": "notes-demo"'
if command -v ffmpeg >/dev/null; then
  cp -R "$root/projects/example" "$tmp/example"
  out=$(cd "$root" && bin/demo narrate "$tmp/example" --dry 2>&1)
  if [ -s "$tmp/example/build/durations.json" ]; then pass "bin/demo narrate --dry"; else fail "bin/demo narrate --dry" "$out"; fi
else
  echo "  skip  bin/demo narrate --dry (no ffmpeg)"
fi

echo "the per-user environment (R2.S2)"
data="$tmp/data"
mkdir -p "$data/venv/bin" "$tmp/proj"
printf '#!/bin/sh\necho "stub python $*"\n' > "$data/venv/bin/python"; chmod +x "$data/venv/bin/python"
if [ -x "$root/.venv/bin/python" ]; then
  echo "  skip  beats uses the data folder's venv (this checkout has a .venv, which comes first)"
else
  expect "beats uses the data folder's venv" "$(DEMO_VIDEO_HOME="$data" dv beats "$tmp/proj" 2>&1)" "stub python" "lib/beats.py"
fi
mkdir -p "$data/node_modules/playwright"
printf '{"name":"playwright","version":"0.0.0","main":"index.js"}\n' > "$data/node_modules/playwright/package.json"
printf 'module.exports = { stub: "data-folder" };\n' > "$data/node_modules/playwright/index.js"
out=$(cd "$tmp" && DEMO_VIDEO_HOME="$data" node --input-type=module -e "
  import { playwright } from '$root/lib/playwright.mjs';
  console.log(playwright().stub ?? 'other');" 2>&1)
if (cd "$root" && node -e 'require.resolve("playwright")' >/dev/null 2>&1); then
  echo "  skip  playwright from the data folder (the module path has one, which comes first)"
else
  expect "playwright from the data folder" "$out" "data-folder"
fi

echo "doctor reports what is missing (R2.S3)"
out=$(DEMO_VIDEO_HOME="$tmp/empty" dv doctor 2>&1); status=$?
[ "$status" -ne 0 ] && pass "doctor exits non-zero" || fail "doctor exits non-zero" "$out"
expect "doctor lists the tools" "$out" "node" "python3"
expect "doctor lists what is missing" "$out" "missing  playwright" "missing  ElevenLabs key" "demo-video setup" "el-key"
[ -x "$root/.venv/bin/python" ] || expect "doctor lists the beat tracker" "$out" "missing  beat tracker"

mkdir -p "$tmp/keyed"; echo "k" > "$tmp/keyed/.el-key"
mkdir -p "$tmp/blank"; echo "" > "$tmp/blank/.el-key"
expect "doctor: a blank .el-key is no key" "$(DEMO_VIDEO_HOME="$tmp/empty" dv doctor "$tmp/blank" 2>&1)" "missing  ElevenLabs key"
expect "doctor finds a project's .el-key" "$(DEMO_VIDEO_HOME="$tmp/empty" dv doctor "$tmp/keyed" 2>&1)" "found    ElevenLabs key $tmp/keyed/.el-key"

echo "a tool folder with a space in its path"
cp -R "$root/bin" "$root/lib" "$root/VERSION" "$tmp/with space/" 2>/dev/null || { mkdir -p "$tmp/with space" && cp -R "$root/bin" "$root/lib" "$root/VERSION" "$tmp/with space/"; }
expect "themes from a folder with a space" "$(cd "$tmp/work" && "$tmp/with space/bin/demo" themes 2>&1)" slant paper

echo "a relative DEMO_VIDEO_HOME, and a tool path through a symlinked folder"
out=$(cd "$tmp" && DEMO_VIDEO_HOME=data node -e '' && DEMO_VIDEO_HOME=data "$tmp/bin/demo-video" doctor 2>&1)
expect "a relative DEMO_VIDEO_HOME is made absolute" "$out" "data folder: $tmp/data"
ln -s "$tmp/with space" "$tmp/linked"
expect "show through a symlinked folder" "$(cd "$tmp/work" && "$tmp/linked/bin/demo" show "my video" 2>&1)" '"name": "notes-demo"'

echo "a per-user ElevenLabs key (R3.S1)"
# A project with one line, and a urlopen stub that prints the key it was sent.
mkdir -p "$tmp/keyproj" "$tmp/stub"
cat > "$tmp/keyproj/project.mjs" <<'JS'
export default { name: 'key', scenes: [{ name: '01', kind: 'intro', narration: 'Hello.' }] };
JS
cat > "$tmp/stub/sitecustomize.py" <<'PY'
import sys, urllib.request
def urlopen(req, *a, **k):
    sys.exit('sent key ' + req.get_header('Xi-api-key'))
urllib.request.urlopen = urlopen
PY
mkdir -p "$tmp/home/.config/demo-video"
echo "key-from-config" > "$tmp/home/.config/demo-video/el-key"
if [ -f "$root/.el-key" ]; then
  echo "  skip  key from the config file (this checkout has a .el-key, which comes first)"
else
  expect "key from the config file" "$(PYTHONPATH="$tmp/stub" dv narrate "$tmp/keyproj" 2>&1)" "sent key key-from-config"
  rm "$tmp/home/.config/demo-video/el-key"
  expect "no key names every place" "$(PYTHONPATH="$tmp/stub" dv narrate "$tmp/keyproj" 2>&1)" "ELEVENLABS_API_KEY" ".el-key" ".config/demo-video/el-key"
fi

echo "the README says how to install (R7.S1)"
expect "README" "$(cat "$root/README.md")" "brew install rossnelson/tools/demo-video" "demo-video setup"

echo
echo "$passes passed, $fails failed"
[ "$fails" -eq 0 ]
