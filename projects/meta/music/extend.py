"""Extends Butter (Lukrembo, freetouse.com) from 2:35 to about 4:40 for the
meta video, by repeating its middle sections on its own bar grid.

   .venv/bin/python projects/meta/music/extend.py

The track is 90 bpm, first downbeat at 1.3347 s, and its form in bars is
intro 8 | drums 16 | break 8 | drums 16 | outro 8 + tail. The edit plays
intro, drums, break, drums, break, drums, break, drums, outro, joining
sections at downbeats with a 20 ms linear crossfade (most joins are the
same audio on both sides, and a linear fade sums to exactly one there).
"""
import subprocess, numpy as np, soundfile as sf
from pathlib import Path

here = Path(__file__).parent
src = here / 'Lukrembo - Butter.mp3'
out = here / 'butter-extended.wav'
SR = 44100
BAR = 4 * 60 / 90.0
FIRST = 1.3347                               # the first downbeat in the file: the drums enter at bar 8, 22.668 s
X = int(0.010 * SR)                          # half a crossfade

wav = here / '.butter-decoded.wav'
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-ar', str(SR), '-ac', '2', '-c:a', 'pcm_f32le', str(wav)], check=True)
y, sr = sf.read(wav, dtype='float32'); wav.unlink()
assert sr == SR
n_total = len(y)

def down(n): return int(round((FIRST + n * BAR) * SR))
INTRO, A, B, A2, OUTRO = (0, 8), (8, 24), (24, 32), (32, 48), (48, None)
sequence = [INTRO, A, B, A2, B, A, B, A2, OUTRO]

pieces = []
pos = 0
for start_bar, end_bar in sequence:
    s = down(start_bar); e = down(end_bar) if end_bar is not None else n_total
    s0, e0 = max(s - X, 0), min(e + X, n_total)
    seg = y[s0:e0].copy()
    head = s - s0; tail = e0 - e
    if head: seg[:2 * X] *= np.linspace(0, 1, 2 * X)[:, None]
    if tail: seg[-2 * X:] *= np.linspace(1, 0, 2 * X)[:, None]
    pieces.append((pos - head, seg))
    pos += e - s

mix = np.zeros((pos + X, 2), dtype='float32')
for at, seg in pieces:
    at = max(at, 0); mix[at:at + len(seg)] += seg[: len(mix) - at]
mix = mix[:pos]
assert np.abs(mix).max() <= 1.0, f'clipping: peak {np.abs(mix).max():.2f}'
sf.write(out, mix, SR, subtype='PCM_16')
bars = sum((e if e is not None else 56) - s for s, e in sequence)
print(f'wrote {out.name}: {len(mix) / SR:.1f}s, {bars} bars at 90 bpm, first downbeat {FIRST}s, peak {np.abs(mix).max():.2f}')
