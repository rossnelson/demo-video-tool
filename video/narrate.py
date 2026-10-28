import json
import os
import subprocess

VOICE = os.environ.get('VOICE_ID', 'cBTYF7NiJbR8Bvmdeuse')

lines = json.load(open('lines.json'))
os.makedirs('audio', exist_ok=True)
durs = []
for name, text in lines:
    body = json.dumps({"text": text, "model_id": "eleven_multilingual_v2", "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True}})
    out = f"audio/{name}.mp3"
    r = subprocess.run(["../el.sh", f"/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128", "-X", "POST", "-H", "Content-Type: application/json", "-d", body, "-o", out, "-w", "%{http_code}"], capture_output=True, text=True)
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", out], capture_output=True, text=True).stdout)
    durs.append([name, dur])
    print(name, r.stdout, f"{dur:.2f}s")
json.dump(durs, open('durations.json', 'w'))
print('total narration', round(sum(d for _, d in durs), 1))
