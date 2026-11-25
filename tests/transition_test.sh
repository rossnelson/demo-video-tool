#!/usr/bin/env bash
# Tests the transition checks of `demo theme` and the `demo review` command,
# with test themes made from tests/fixtures/transition-card.js and a built
# project made with ffmpeg. Needs Playwright with Chromium, and ffmpeg.
#   tests/transition_test.sh
set -uo pipefail
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
tmp=$(cd "$(mktemp -d)" && pwd -P)   # the real path, as node prints it
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
# refuse <name> <haystack> <needle>...: none of the needles is there
refuse() {
  local name=$1 out=$2; shift 2
  for needle in "$@"; do
    ! grep -qF -- "$needle" <<<"$out" || { fail "$name: has \"$needle\"" "$out"; return; }
  done
  pass "$name"
}
demo() { (cd "$tmp" && "$root/bin/demo" "$@"); }

# A test theme: the fixture card with options.exit, and handover when asked.
theme() {
  local name=$1 exit=$2 handover=${3:-false}
  mkdir -p "$tmp/themes/$name"
  cp "$root/tests/fixtures/transition-card.js" "$tmp/themes/$name/card.js"
  cp "$root/lib/themes/minimal/splash.html" "$tmp/themes/$name/splash.html"
  cat >"$tmp/themes/$name/theme.mjs" <<THEME
export default {
  name: '$name', description: 'Test theme: $exit exit.',
  colors: { bg: '#f6f1e6', text: '#1b1c20', muted: '#4d4a45', accent: '#b37a3a', step: '#2f6f95', key: '#fff', keyEdge: '#ddd' },
  fonts: { sans: 'Georgia, serif' }, pad: '#f6f1e6',
  handover: $handover, options: { exit: '$exit' },
};
THEME
}
theme fade fade
theme small small
theme wipe wipe
theme slide slide true

echo "a theme with only a whole-card fade (R1.S1, R2.S1, R4.S1)"
out=$(demo theme ./themes/fade 2>&1)
dir="$tmp/build/themes/fade"
report=$(cat "$dir/transitions.md" 2>/dev/null)
expect "no exit in the output" "$out" "no exit: nothing on the card moves" "(transitions/exit-light.png)"
expect "no exit in the report, with its strip" "$report" "no exit: nothing on the card moves" "strip: transitions/exit-light.png"
expect "grey wash over the dark page" "$out" "grey wash: exit over the dark page" "luminance spread of"
expect "the report has the grey wash" "$report" "grey wash: exit over the dark page"
missing=
for f in 01-card 02-card 03-card 04-card 05-card 06-long-no-keys 07-three-keys 08-intro 09-phone 10-end 11-end-late 12-key-hint 13-splash sheet \
  transitions/entry-light transitions/entry-dark transitions/exit-light transitions/exit-dark; do
  [ -f "$dir/$f.png" ] || missing="$missing $f.png"
done
[ -f "$dir/transitions.md" ] || missing="$missing transitions.md"
if [ -z "$missing" ]; then pass "the shots, the sheet, the strips and the report"; else fail "missing:$missing" "$out"; fi
expect "the last line gives the count and the report" "$(tail -1 <<<"$out")" "transition checks: 4 problems, see $dir/transitions.md"

echo "an exit that moves the title 30 px (R1.S2)"
expect "exit too small with the distance" "$(demo theme ./themes/small 2>&1)" "exit too small: the largest movement is 30 px (h1), under 60 px"

echo "a wipe (R1.S4)"
refuse "a wipe is an exit" "$(demo theme ./themes/wipe 2>&1)" "no exit" "exit too small"

echo "a card that slides on and off, with handover (R2.S2, R4.S2)"
out=$(demo theme ./themes/slide 2>&1)
refuse "no grey wash, no cut" "$out" "grey wash" "cut between two cards" "no exit" "exit too small"
expect "no problem found" "$out" "transition checks: no problem found"
if [ -f "$tmp/build/themes/slide/transitions/handover.png" ]; then pass "a handover strip"; else fail "a handover strip" "$out"; fi

echo "a bundled theme with no handover (R3.S1)"
expect "cut between two cards" "$(demo theme minimal 2>&1)" "cut between two cards: the theme does not declare handover: true"

critter="$root/../spec-studio-site/video/theme"
echo "the critter theme (R1.S3, R3.S2)"
if [ -f "$critter/theme.mjs" ]; then
  out=$(demo theme "$critter" 2>&1)
  refuse "its exit passes" "$out" "no exit" "exit too small" "cut between two cards"
  if [ -f "$tmp/build/themes/theme/transitions/handover.png" ]; then pass "a handover strip"; else fail "a handover strip" "$out"; fi
else
  echo "  skip  no critter theme at $critter"
fi

printf '\n%d passed, %d failed\n' "$passes" "$fails"
[ "$fails" -eq 0 ]
