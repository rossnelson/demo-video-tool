import json, re, subprocess, collections

def per_second(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'asetnsamples=4410,astats=metadata=1:reset=1,ametadata=print:key=lavfi.astats.Overall.RMS_level', '-f', 'null', '-'], capture_output=True, text=True).stderr
    vals = re.findall(r'pts_time:([\d.]+)\s*\n\[[^\]]*\] lavfi.astats.Overall.RMS_level=([-\d.inf]+)', out)
    buckets = collections.defaultdict(list)
    for t, v in vals:
        buckets[int(float(t))].append(-99.0 if 'inf' in v else float(v))
    return [round(sum(b) / len(b), 1) for _, b in sorted(buckets.items())]

plan = json.load(open('plan.json'))
durs = dict(json.load(open('durations.json')))
voice, bed, mix = per_second('stem-voice.wav'), per_second('stem-bed.wav'), per_second('stem-mix.wav')
print('voice stem per segment (dB inside narration / outside):')
for n in plan['order']:
    p = plan['segments'][n]
    a, b = int(p['narration'] + 0.5), int(p['narration'] + durs[n] - 0.5)
    inside = max(voice[a:b + 1])
    after = voice[b + 2] if b + 2 < len(voice) else None
    print(f"  {n:12} {inside:6.1f}  after {after}")
print('bed stem every 10 s:', bed[::10], 'last 5:', bed[-5:])
print('mix  every 10 s:', mix[::10], 'last 5:', mix[-5:])
