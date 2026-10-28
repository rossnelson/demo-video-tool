import json, math

beats = json.load(open('beats.json'))
BEAT = 60 / beats['tempo']
BAR = 4 * BEAT
first = beats['downbeats'][0]
music_downbeats = [first + k * BAR for k in range(-int(first // BAR), 200)]
# Skip the track's silent lead-in: the first downbeat after it lands at 0.3 s.
OFFSET = next(d for d in music_downbeats if d > 1.5) - 0.3
downbeats = [d - OFFSET for d in music_downbeats if d - OFFSET >= 0]
durations = dict(json.load(open('durations.json')))
order = [n for n, _ in json.load(open('durations.json'))]

CARD = 8 * BEAT          # 2 beats in, 4 hold, 2 out
GAP = 0.6                # after the narration ends
def next_downbeat(t):
    return next(d for d in downbeats if d >= t - 1e-6)

plan, t = {}, next_downbeat(0.2)
for name in order:
    dur = durations[name]
    start = t
    if name in ('00-intro', '13-outro'):
        # The card holds while Mike speaks. Narration starts one bar in.
        narration = start + BAR
        if name == '13-outro':
            end = next_downbeat(narration + dur + 3 * BAR)   # music plays out over the card
        else:
            end = next_downbeat(narration + dur + 0.4 + 2 * BEAT)
        hold = (end - start) - 4 * BEAT if name == '00-intro' else (end - start) + 4 * BAR
    else:
        narration = start + CARD
        end = next_downbeat(narration + dur + GAP)
        hold = 4 * BEAT
    plan[name] = {'start': round(start, 3), 'narration': round(narration, 3), 'end': round(end, 3), 'holdMs': round(hold * 1000)}
    t = end

total = plan[order[-1]]['end']
json.dump({'musicOffset': round(OFFSET, 3), 'beat': BEAT, 'bar': BAR, 'segments': plan, 'order': order, 'total': total, 'musicFade': round(total - 2 * BAR, 3)}, open('plan.json', 'w'), indent=1)
for name in order:
    p = plan[name]
    print(f"{name:12} start {p['start']:7.2f}  voice {p['narration']:7.2f}  end {p['end']:7.2f}  ({(p['end'] - p['start']) / BAR:.0f} bars)")
print(f'total {total:.1f}s = {int(total // 60)}:{total % 60:04.1f}')
