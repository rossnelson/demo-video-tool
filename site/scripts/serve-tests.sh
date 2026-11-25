#!/bin/sh
# Builds the site into test-out/demo-video-tool and serves test-out, so the
# pages sit under /demo-video-tool/ as on GitHub Pages. Playwright starts this.
set -e
cd "$(dirname "$0")/.."
rm -rf test-out
SITE_OUT=test-out/demo-video-tool npx vite build --logLevel error
exec python3 -m http.server "${1:-4111}" --bind 127.0.0.1 -d test-out >/dev/null 2>&1
