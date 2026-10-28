#!/usr/bin/env bash
# Calls the ElevenLabs API, for looking things up (voices, models, usage).
# Usage: el.sh <endpoint> [curl args...]      e.g. el.sh /v1/voices | jq '.voices[].name'
# Reads the key from $ELEVENLABS_API_KEY, or from .el-key next to this script.
KEY=${ELEVENLABS_API_KEY:-$(cat "$(dirname "${BASH_SOURCE[0]}")/.el-key" 2>/dev/null)}
[ -n "$KEY" ] || { echo "Set ELEVENLABS_API_KEY or write the key to .el-key" >&2; exit 1; }
endpoint=$1; shift
curl -sS -H "xi-api-key: $KEY" "https://api.elevenlabs.io$endpoint" "$@"
