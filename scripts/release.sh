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
! git rev-parse -q --verify "refs/tags/$tag" >/dev/null || die "the tag $tag exists"

echo "$version" > VERSION
git add VERSION
git commit -qm "Release $tag" || true   # VERSION may already say $version
git tag -a "$tag" -m "demo-video $version"
git push -q origin main "$tag"

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
