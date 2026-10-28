"""Puts every scene on the music's downbeats and writes build/plan.json.
   plan.py <project-dir>   (after narrate and beats)
"""
from project import load, read_json, write_json

project, build = load()
beats = read_json(build, 'beats.json')
durations = dict(read_json(build, 'durations.json'))
T = project['timing']
M = project['music']

BEAT = 60 / beats['tempo']
BAR = 4 * BEAT
first = beats['downbeats'][0]
music_downbeats = [first + k * BAR for k in range(-int(first // BAR), 400)]
# Skip the track's lead-in: the first downbeat after it lands at firstDownbeatAt.
OFFSET = next(d for d in music_downbeats if d > M['leadIn']) - M['firstDownbeatAt']
downbeats = [d - OFFSET for d in music_downbeats if d - OFFSET >= 0]

CARD = T['cardBeats'] * BEAT
def next_downbeat(t):
    return next(d for d in downbeats if d >= t - 1e-6)

scenes = project['scenes']
plan, order, t = {}, [], next_downbeat(0.2)
for i, scene in enumerate(scenes):
    name, kind = scene['name'], scene['kind']
    if scene['narration'] and name not in durations:
        raise SystemExit(f'no narration clip for {name}; run narrate first')
    dur = durations.get(name, 0)
    start = t
    if kind == 'intro':
        # The card holds while the narration plays. Narration starts one bar in.
        narration = start + BAR
        end = next_downbeat(narration + dur + T['introGap'] + 2 * BEAT)
        # The card leaves just before the scene ends: its in and out beats
        # (cardBeats minus holdBeats) are what it needs, whatever the hold is.
        hold = (end - start) - (T['cardBeats'] - T['holdBeats']) * BEAT
    elif kind == 'outro':
        narration = start + BAR
        end_card_follows = i + 1 < len(scenes) and scenes[i + 1]['kind'] == 'end'
        play_out = BAR if end_card_follows else T['outroBars'] * BAR    # music plays out over the card
        end = next_downbeat(narration + dur + play_out)
        hold = (end - start) + 4 * BAR                                   # never fades out
    elif kind == 'end':
        # The end card comes in on the downbeat and stays to the end of the video.
        narration = start + (BAR if dur else 0)
        end = next_downbeat(max(narration + dur + T['gap'], start + T['endBars'] * BAR))
        hold = (end - start) + 4 * BAR
    else:
        narration = start + CARD
        end = next_downbeat(narration + dur + T['gap'])
        hold = T['holdBeats'] * BEAT
    plan[name] = {'start': round(start, 3), 'narration': round(narration, 3), 'end': round(end, 3), 'holdMs': round(hold * 1000)}
    order.append(name)
    t = end

total = plan[order[-1]]['end']
write_json(build, 'plan.json', {'musicOffset': round(OFFSET, 3), 'beat': BEAT, 'bar': BAR, 'segments': plan, 'order': order,
                                'total': total, 'musicFade': round(total - M['fadeBars'] * BAR, 3)}, indent=1)
for name in order:
    p = plan[name]
    print(f"{name:14} start {p['start']:7.2f}  voice {p['narration']:7.2f}  end {p['end']:7.2f}  ({(p['end'] - p['start']) / BAR:.0f} bars)")
print(f'total {total:.1f}s = {int(total // 60)}:{total % 60:04.1f}')
