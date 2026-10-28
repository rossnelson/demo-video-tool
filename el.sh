#!/bin/zsh
# Usage: el.sh <endpoint> [curl args...]
# Reads the ElevenLabs key from $ELEVENLABS_API_KEY, or from .el-key next to this script.
KEY=${ELEVENLABS_API_KEY:-$(cat "${0:A:h}/.el-key" 2>/dev/null)}
[[ -n $KEY ]] || { echo "Set ELEVENLABS_API_KEY or write the key to .el-key" >&2; exit 1; }
endpoint=$1; shift
curl -sS -H "xi-api-key: $KEY" "https://api.elevenlabs.io$endpoint" "$@"
