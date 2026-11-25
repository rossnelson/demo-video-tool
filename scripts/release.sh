#!/usr/bin/env bash
# Releases demo-video <version>: writes VERSION, commits, tags v<version>,
# pushes main and the tag, then writes the tag archive's url and sha256 into
# the formula of a local tap checkout. Commit and push the tap yourself.
#
#   scripts/release.sh 0.2.0
#
#   TAP_DIR      the tap checkout (default: ../homebrew-tools next to this repo)
#   REPO_URL     the GitHub repo (default: https://github.com/rossnelson/demo-video-tool)
#   ARCHIVE_URL  where to download the archive from (default: the tag's archive on
#                REPO_URL; the tests point it at a local file)
set -euo pipefail
root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
die() { printf 'release: %s\n' "$*" >&2; exit 1; }

version=${1:-}
[ -n "$version" ] || die "which version? scripts/release.sh 0.2.0"
[[ $version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || die "the version is X.Y.Z, with no v: got $version"
tag="v$version"
tap=${TAP_DIR:-$root/../homebrew-tools}
formula="$tap/Formula/demo-video.rb"
repo_url=${REPO_URL:-https://github.com/rossnelson/demo-video-tool}
url="$repo_url/archive/refs/tags/$tag.tar.gz"
archive_url=${ARCHIVE_URL:-$url}

cd "$root"
[ -f "$formula" ] || die "no formula at $formula: set TAP_DIR to the tap checkout"
[ "$(git rev-parse --abbrev-ref HEAD)" = main ] || die "release from main, not $(git rev-parse --abbrev-ref HEAD)"
[ -z "$(git status --porcelain)" ] || die "the working tree has changes: commit or remove them first"
# Tag what is on GitHub's main: a local main behind it (a PR merged on GitHub
# and not pulled) would tag the wrong commit.
git fetch -q --tags origin main
[ "$(git rev-parse main)" = "$(git rev-parse origin/main)" ] || die "main is not the same as origin/main: pull (or push) first"

if git ls-remote --exit-code --tags origin "refs/tags/$tag" >/dev/null 2>&1; then
  # The tag is published (an earlier run stopped after the push): only write
  # the formula, and only when the tag is on main.
  git merge-base --is-ancestor "$tag" main || die "the tag $tag exists and is not on main"
  # Only the latest release: an older version would put the formula back.
  [ "$(cat VERSION)" = "$version" ] || die "the tag $tag exists, and main is at $(cat VERSION): release a new version"
  echo "The tag $tag is published; writing the formula only."
else
  ! git rev-parse -q --verify "refs/tags/$tag" >/dev/null || die "the tag $tag exists here but not on origin: remove it (git tag -d $tag)"
  start=$(git rev-parse HEAD)
  echo "$version" > VERSION
  git add VERSION
  # No commit when VERSION already says $version; any other failure of the
  # commit (a hook, signing) stops the release before the tag.
  if ! git diff --cached --quiet; then
    git commit -qm "Release $tag" || { git reset -q --hard "$start"; die "the release commit failed; nothing was tagged"; }
  fi
  git tag -a "$tag" -m "demo-video $version"
  # --atomic: the tag is not published when the push of main fails. Then undo
  # the local commit and tag, so the release can run again.
  if ! git push -q --atomic origin main "$tag"; then
    git tag -d "$tag" >/dev/null
    git reset -q --hard "$start"
    die "the push was rejected; nothing was published"
  fi
fi

tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
curl -fsSL --retry 3 -o "$tmp/archive.tar.gz" "$archive_url"
sha=$(shasum -a 256 "$tmp/archive.tar.gz" | cut -d' ' -f1)

sed -i.bak -E \
  -e "s|^(  url \").*(\")$|\1$url\2|" \
  -e "s|^(  sha256 \").*(\")$|\1$sha\2|" \
  "$formula"
rm -f "$formula.bak"
grep -qF "url \"$url\"" "$formula" && grep -qF "sha256 \"$sha\"" "$formula" || die "could not write the url and sha256 into $formula"

echo "Released $tag."
echo "  $formula: url $url"
echo "  sha256 $sha"
echo "Next: commit and push the tap, e.g. (cd $tap && git commit -am \"demo-video $version\" && git push)"
