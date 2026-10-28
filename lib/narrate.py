"""Makes build/audio/<scene>.mp3 for every scene with ElevenLabs, and writes
build/durations.json.

  narrate.py <project-dir> [scene ...]   only these scenes; the others keep their clips
  narrate.py <project-dir> --dry         silent clips of an estimated length, no API key needed
"""
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request

from project import load, write_json

args = sys.argv[1:]
dry = '--dry' in args
args = [a for a in args if a != '--dry']
project, build = load(args)
only = set(args[1:])
voice = project['voice']
voice_id = os.environ.get('VOICE_ID', voice['id'])


def api_key():
    key = os.environ.get('ELEVENLABS_API_KEY')
    for path in [os.path.join(project['dir'], '.el-key'), os.path.join(os.path.dirname(__file__), '..', '.el-key')]:
        if not key and os.path.exists(path):
            key = open(path).read().strip()
    if not key:
        sys.exit('Set ELEVENLABS_API_KEY or write the key to .el-key (or run with --dry)')
    return key


def speak(text, out):
    body = json.dumps({'text': text, 'model_id': voice['model'], 'voice_settings': voice['settings']}).encode()
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format={voice['format']}",
        data=body, method='POST',
        headers={'xi-api-key': api_key(), 'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req) as r, open(out, 'wb') as f:
            f.write(r.read())
    except urllib.error.HTTPError as e:
        sys.exit(f'ElevenLabs {e.code}: {e.read().decode()[:400]}')


def silence(text, out):
    # About 2.5 words a second, plus a little room at the end.
    seconds = 0.4 * len(text.split()) + 0.5
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
                    '-t', f'{seconds:.2f}', '-c:a', 'libmp3lame', '-q:a', '9', out], check=True)


def duration(path):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
                                capture_output=True, text=True).stdout)


audio = os.path.join(build, 'audio')
os.makedirs(audio, exist_ok=True)
durations_path = os.path.join(build, 'durations.json')
known = dict(json.load(open(durations_path))) if os.path.exists(durations_path) else {}
durs = []
for scene in project['scenes']:
    name, text = scene['name'], scene['narration']
    out = os.path.join(audio, f'{name}.mp3')
    if only and name not in only and name in known and os.path.exists(out):
        durs.append([name, known[name]])
        continue
    (silence if dry else speak)(text, out)
    dur = duration(out)
    durs.append([name, dur])
    print(f'{name:14} {dur:6.2f}s  {text[:60]}{"…" if len(text) > 60 else ""}')
write_json(build, 'durations.json', durs)
print('total narration', round(sum(d for _, d in durs), 1), '(dry run: silent clips)' if dry else '')
