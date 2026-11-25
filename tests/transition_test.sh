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
theme bob bob
theme quick quick

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

echo "a whole-card fade with a bobbing title (R1.S1)"
out=$(demo theme ./themes/bob 2>&1)
expect "a bob is not an exit" "$out" "no exit: nothing on the card moves"
refuse "and not too small" "$out" "exit too small"

echo "two quick moves one after the other (R1)"
expect "each part is too short" "$(demo theme ./themes/quick 2>&1)" "exit too small: the longest part of the exit lasts"

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

echo "a review of a built video (R5.S1, R5.S2)"
proj="$tmp/rv"
mkdir -p "$proj/build"
cat >"$proj/project.mjs" <<'PROJECT'
export default {
  name: 'rv', title: 'Review test', theme: 'minimal',
  scenes: [
    { name: '00-intro', kind: 'intro', narration: 'Hello.' },
    { name: '01-add', step: '01', title: 'Add', narration: 'Add one.', async run() {} },
    { name: '02-short', step: '02', title: 'Short', narration: 'Quick.', async run() {} },
    { name: '03-end', kind: 'end' },
  ],
};
PROJECT
cat >"$proj/build/plan.json" <<'PLAN'
{ "beat": 0.5, "bar": 2, "musicOffset": 0, "total": 14, "musicFade": 12,
  "order": ["00-intro", "01-add", "02-short", "03-end"],
  "segments": {
    "00-intro": { "start": 0, "narration": 1, "end": 4, "holdMs": 2000 },
    "01-add":   { "start": 4, "narration": 6, "end": 9, "holdMs": 1000 },
    "02-short": { "start": 9, "narration": 11, "end": 11.2, "holdMs": 1000 },
    "03-end":   { "start": 11.2, "narration": 12.2, "end": 14, "holdMs": 2000 } } }
PLAN
printf '%s\n' '01-add ends at 9.00 planned 9.00' "late: [ '02-short started 0.42s late' ]" >"$proj/build/record.log"
ffmpeg -v error -f lavfi -i "color=c=0x303040:s=640x360:r=30:d=14" -pix_fmt yuv420p -y "$proj/build/rv.mp4"
out=$(demo review rv 2>&1)
report=$(cat "$proj/build/review/report.md" 2>/dev/null)
missing=
for f in 00-intro-handover 01-add-exit 02-short-entry 02-short-exit 03-end-entry; do
  [ -f "$proj/build/review/$f.png" ] || missing="$missing $f.png"
done
[ ! -f "$proj/build/review/01-add-entry.png" ] || missing="$missing (01-add-entry.png: the handover has it)"
if [ -z "$missing" ]; then pass "a strip for each entry, exit and handover"; else fail "missing:$missing" "$out"; fi
expect "the report names each strip with its time" "$report" "01-add-exit.png: 01-add card exit, from 6.00 s" "00-intro-handover.png: handover from 00-intro to 01-add, from 3.00 s"
expect "the late scene" "$report" "- 02-short started 0.42 s late"
expect "a late scene's strips move with it" "$report" "02-short-entry.png: 02-short card entry, from 9.42 s"
expect "the short page" "$report" "02-short shows its page for 1.2 s before the 03-end card"
expect "the report is printed" "$out" "# Review: rv" "strips and the report in"

echo "a review of a video that ends on an outro"
proj2="$tmp/rv2"
mkdir -p "$proj2/build"
sed -e "s/name: 'rv'/name: 'rv2'/" -e "s/{ name: '03-end', kind: 'end' },/{ name: '03-outro', kind: 'outro', narration: 'Bye.' },/" "$proj/project.mjs" >"$proj2/project.mjs"
sed 's/03-end/03-outro/g' "$proj/build/plan.json" | sed 's/"holdMs": 2000 } } }/"holdMs": 10800 } } }/' >"$proj2/build/plan.json"
cp "$proj/build/record.log" "$proj2/build/"
cp "$proj/build/rv.mp4" "$proj2/build/rv2.mp4"
out=$(demo review rv2 2>&1)
refuse "an outro never leaves" "$out" "03-outro-exit" "Not read"
expect "the outro's entry" "$out" "03-outro-entry.png"

echo "a review with nothing built (R5.S3)"
mkdir -p "$tmp/empty" && cp "$proj/project.mjs" "$tmp/empty/"
out=$(demo review empty 2>&1); status=$?
expect "says to build first" "$out" "run bin/demo build empty first"
if [ "$status" -ne 0 ]; then pass "exits with an error"; else fail "exits with an error" "$out"; fi

echo "the rules in the skill and the README (R6.S1, R6.S2)"
skill=$(cat "$root/.claude/skills/demo-theme/SKILL.md")
expect "the skill has the four rules" "$skill" "Every card needs an exit that mirrors its entry" "Never fade a light layer over a dark page with opacity" "Slide it off or wipe it" 'Declare `handover: true`' 'Check with `bin/demo theme` before a build'
readme=$(cat "$root/README.md")
expect "the README names both commands" "$readme" "bin/demo review <project>" "transitions.md" "no exit" "grey wash" "cut between two cards" "build/review/"
expect "the usage names both" "$("$root/bin/demo" --help)" "review " "check its transitions"

printf '\n%d passed, %d failed\n' "$passes" "$fails"
[ "$fails" -eq 0 ]
