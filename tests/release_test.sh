#!/usr/bin/env bash
# Tests scripts/release.sh against a temp clone with a bare remote, a temp
# tap, and a local archive in place of GitHub's.
#   tests/release_test.sh
set -uo pipefail
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
fails=0; passes=0
pass() { passes=$((passes + 1)); printf '  ok    %s\n' "$1"; }
fail() { fails=$((fails + 1)); printf '  FAIL  %s\n' "$1"; [ -z "${2:-}" ] || printf '%s\n' "$2" | head -12 | sed 's/^/        /'; }

export GIT_AUTHOR_NAME=test GIT_AUTHOR_EMAIL=test@example.com GIT_COMMITTER_NAME=test GIT_COMMITTER_EMAIL=test@example.com
git init -q --bare -b main "$tmp/remote.git"
git init -q -b main "$tmp/repo"
mkdir -p "$tmp/repo/scripts"
cp "$root/scripts/release.sh" "$tmp/repo/scripts/"
echo 0.1.0 > "$tmp/repo/VERSION"
(cd "$tmp/repo" && git add -A && git commit -qm init && git remote add origin "$tmp/remote.git" && git push -q origin main)
mkdir -p "$tmp/tap/Formula"
cat > "$tmp/tap/Formula/demo-video.rb" <<'RB'
class DemoVideo < Formula
  desc "Test"
  url "https://example.com/old.tar.gz"
  sha256 "0000000000000000000000000000000000000000000000000000000000000000"
end
RB
echo "an archive" > "$tmp/archive.tar.gz"
want_sha=$(shasum -a 256 "$tmp/archive.tar.gz" | cut -d' ' -f1)
release() { (cd "$tmp/repo" && TAP_DIR="$tmp/tap" REPO_URL=https://github.com/o/r ARCHIVE_URL="file://$tmp/archive.tar.gz" scripts/release.sh "$@" 2>&1); }
state() { (cd "$tmp/repo" && git rev-parse HEAD && git tag && cat VERSION && git status --porcelain) ; cat "$tmp/tap/Formula/demo-video.rb"; }

echo "a bad version stops the release (R5.S2)"
before=$(state)
for bad in "" v0.2 0.2; do
  if out=$(release $bad); then fail "\"$bad\" fails" "$out"; else
    [ "$(state)" = "$before" ] && pass "\"$bad\" fails and changes nothing" || fail "\"$bad\" changed something" "$(state)"
  fi
done
echo dirty > "$tmp/repo/dirty.txt"
before=$(state)
if out=$(release 0.2.0); then fail "a dirty tree fails" "$out"; else
  [ "$(state)" = "$before" ] && pass "a dirty tree fails and changes nothing" || fail "a dirty tree changed something"
fi
rm "$tmp/repo/dirty.txt"

# main behind origin/main (a PR merged on GitHub, not pulled): stop before any tag.
git clone -q "$tmp/remote.git" "$tmp/other" && (cd "$tmp/other" && echo x > merged.txt && git add merged.txt && git commit -qm merged && git push -q origin main)
before=$(state)
if out=$(release 0.2.0); then fail "main behind origin/main fails" "$out"; else
  git --git-dir="$tmp/remote.git" rev-parse -q --verify refs/tags/v0.2.0 >/dev/null && fail "main behind origin/main published a tag" || pass "main behind origin/main fails and publishes no tag"
fi
(cd "$tmp/repo" && git pull -q origin main)

# A push that the remote rejects: nothing published, nothing left here, and it can run again.
printf '#!/bin/sh\nexit 1\n' > "$tmp/remote.git/hooks/pre-receive"; chmod +x "$tmp/remote.git/hooks/pre-receive"
head_before=$(cd "$tmp/repo" && git rev-parse HEAD)
if out=$(release 0.2.0); then fail "a rejected push fails" "$out"; else
  if (cd "$tmp/repo" && ! git rev-parse -q --verify refs/tags/v0.2.0 >/dev/null && [ "$(git rev-parse HEAD)" = "$head_before" ]); then
    pass "a rejected push leaves no local tag or commit"
  else fail "a rejected push leaves no local tag or commit"; fi
fi
rm "$tmp/remote.git/hooks/pre-receive"

echo "a release updates the formula (R5.S1)"
out=$(release 0.2.0); status=$?
[ "$status" -eq 0 ] && pass "release 0.2.0 succeeds" || fail "release 0.2.0 succeeds" "$out"
[ "$(cat "$tmp/repo/VERSION")" = 0.2.0 ] && pass "VERSION is 0.2.0" || fail "VERSION is 0.2.0"
git --git-dir="$tmp/remote.git" rev-parse -q --verify refs/tags/v0.2.0 >/dev/null && pass "the remote has the tag v0.2.0" || fail "the remote has the tag v0.2.0"
[ "$(git --git-dir="$tmp/remote.git" show v0.2.0:VERSION)" = 0.2.0 ] && pass "the tag has VERSION 0.2.0" || fail "the tag has VERSION 0.2.0"
f=$(cat "$tmp/tap/Formula/demo-video.rb")
grep -qF 'url "https://github.com/o/r/archive/refs/tags/v0.2.0.tar.gz"' <<<"$f" && pass "the formula has the tag's url" || fail "the formula has the tag's url" "$f"
grep -qF "sha256 \"$want_sha\"" <<<"$f" && pass "the formula has the archive's sha256" || fail "the formula has the archive's sha256" "$f"
# The same version again: the tag is published, so only the formula is written.
sed -i.bak -E 's|^(  sha256 ").*(")$|\1old\2|' "$tmp/tap/Formula/demo-video.rb" && rm "$tmp/tap/Formula/demo-video.rb.bak"
out=$(release 0.2.0)
grep -qF "sha256 \"$want_sha\"" "$tmp/tap/Formula/demo-video.rb" && pass "a run after a published tag writes the formula only" || fail "a run after a published tag writes the formula only" "$out"
[ "$(git --git-dir="$tmp/remote.git" tag | grep -c v0.2.0)" = 1 ] && pass "no second tag" || fail "no second tag"

echo "a later release, then the older one again"
out=$(release 0.3.0) && pass "release 0.3.0" || fail "release 0.3.0" "$out"
cp "$tmp/tap/Formula/demo-video.rb" "$tmp/formula.before"
release 0.2.0 >/dev/null 2>&1 && fail "an older published version fails" || { cmp -s "$tmp/formula.before" "$tmp/tap/Formula/demo-video.rb" && pass "an older published version fails and keeps the formula" || fail "an older version changed the formula"; }

echo "a failed release commit"
printf '#!/bin/sh\nexit 1\n' > "$tmp/repo/.git/hooks/pre-commit"; chmod +x "$tmp/repo/.git/hooks/pre-commit"
head_before=$(cd "$tmp/repo" && git rev-parse HEAD)
if out=$(release 0.4.0); then fail "a failed commit stops the release" "$out"; else
  (cd "$tmp/repo" && [ "$(git rev-parse HEAD)" = "$head_before" ] && [ -z "$(git status --porcelain)" ] && ! git rev-parse -q --verify refs/tags/v0.4.0 >/dev/null) \
    && ! git --git-dir="$tmp/remote.git" rev-parse -q --verify refs/tags/v0.4.0 >/dev/null \
    && pass "a failed commit stops the release, tags nothing and leaves a clean tree" || fail "a failed commit left something"
fi
rm "$tmp/repo/.git/hooks/pre-commit"

echo
echo "$passes passed, $fails failed"
[ "$fails" -eq 0 ]
