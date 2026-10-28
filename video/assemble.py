import os
import json, subprocess, sys

data = json.load(open('frames.json'))
frames, timeline, end = data['frames'], data['timeline'], data['end']
pauses = [p for p in data.get('pauses', []) if 'end' in p]
t0 = data.get('recStart') or frames[0]['t']

# Real time to video time, with the paused stretches cut out.
def vt(t):
    return t - t0 - sum(p['end'] - p['start'] for p in pauses if p['end'] <= t)

total = vt(end)

with open('frames.txt', 'w') as out:
    out.write('ffconcat version 1.0\n')
    for i, frame in enumerate(frames):
        nxt = vt(frames[i + 1]['t']) if i + 1 < len(frames) else total
        out.write(f"file 'frames/{frame['file']}'\nduration {max(nxt - vt(frame['t']), 0.001):.4f}\n")
    out.write(f"file 'frames/{frames[-1]['file']}'\n")

def loudness(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    summary = out[out.rindex('Integrated loudness'):]
    return float(summary.split('I:')[1].split('LUFS')[0])

VOICE_LUFS, MUSIC_LUFS = -16.0, -27.0
MUSIC = os.environ.get('MUSIC', os.path.expanduser('~/Downloads/above-the-next-wave.mp3'))
plan = json.load(open('plan.json'))
inputs, filters, labels = [], [], []
for i, seg in enumerate(timeline):
    path = f"audio/{seg['name']}.mp3"
    inputs += ['-i', path]
    gain = VOICE_LUFS - loudness(path)
    delay = int(round((vt(seg['start']) + 0.1) * 1000))
    # Every input runs the full length, so amix never re-weights when one ends.
    filters.append(f"[{i}:a]aformat=channel_layouts=stereo,volume={gain:.2f}dB,adelay={delay}|{delay},apad=whole_dur={total:.3f},atrim=end={total:.3f}[a{i}]")
    labels.append(f"[a{i}]")
m = len(timeline)
inputs += ['-i', MUSIC]
music_gain = MUSIC_LUFS - loudness(MUSIC)
fade_len = plan['bar'] * 2
filters.append(f"{''.join(labels)}amix=inputs={len(labels)}:normalize=0:duration=longest,apad=whole_dur={total:.3f},atrim=end={total:.3f},asplit=3[voice][key][voicestem]")
filters.append(f"[{m}:a]aformat=channel_layouts=stereo,atrim=start={plan['musicOffset']:.3f},asetpts=PTS-STARTPTS,atrim=end={total:.3f},volume={music_gain:.2f}dB,afade=t=out:st={total - fade_len:.3f}:d={fade_len:.3f}[bed]")
filters.append("[bed][key]sidechaincompress=threshold=0.02:ratio=4:attack=30:release=500:makeup=1,asplit=2[ducked][bedstem]")
filters.append(f"[voice][ducked]amix=inputs=2:normalize=0:duration=longest,alimiter=limit=0.89:level=false,atrim=end={total:.3f},afade=t=out:st={total - 1.0:.3f}:d=1.0[mix]")

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(r.stderr[-1500:]); sys.exit(r.returncode)

print(f'{len(frames)} frames, {total:.1f}s, {len(timeline)} narration clips + music bed')
run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(filters),
     '-map', '[mix]', '-c:a', 'pcm_s16le', 'stem-mix.wav',
     '-map', '[voicestem]', '-c:a', 'pcm_s16le', 'stem-voice.wav',
     '-map', '[bedstem]', '-c:a', 'pcm_s16le', 'stem-bed.wav'])
run(['ffmpeg', '-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', 'frames.txt', '-i', 'stem-mix.wav',
     '-filter_complex', f"[0:v]scale=1920:1080:force_original_aspect_ratio=decrease:flags=lanczos,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0b0b14,fps=30,format=yuv420p,fade=t=out:st={total - 1.0:.3f}:d=1.0[vout]",
     '-map', '[vout]', '-map', '1:a', '-t', f'{total:.3f}', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
     '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', 'command-palette-demo.mp4'])
print('ok')
