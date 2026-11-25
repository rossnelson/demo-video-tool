#!/bin/sh
# Makes the site's share image (the og:image of every page) with demo-video's
# own splash command, from share/project.mjs and share/splash.html, and puts it
# in static/share.png. Needs `npm ci` here (the fonts) and the tool's
# Playwright (`demo-video setup`, or bin/demo doctor to check).
set -e
cd "$(dirname "$0")/.."
if [ ! -d node_modules/@fontsource-variable/schibsted-grotesk ]; then
  echo "share-image: run npm ci in site/ first; the image uses the site's fonts" >&2
  exit 1
fi
../bin/demo splash share
cp share/build/share-splash.png static/share.png
echo "wrote site/static/share.png"
