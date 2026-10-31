"""Finds the beats and downbeats of the project's music track and writes
build/beats.json.   beats.py <project-dir>   (needs the .venv: librosa, numpy)
"""
import sys

import librosa
import numpy as np

from project import load, write_json

project, build = load()
path = project['music']['path']
if not path:
    sys.exit('No music track: set music.path in project.mjs or $MUSIC')
y, sr = librosa.load(path, sr=22050, mono=True)
tempo, beats = librosa.beat.beat_track(y=y, sr=sr, units='time', tightness=200)
beats = np.asarray(beats)
# librosa quantizes the tempo to whole onset frames (about 1% at 80-90 bpm) and the
# plan extrapolates every bar from it, so fit the tempo to the tracked beats instead.
coarse = float(np.atleast_1d(tempo)[0])
fit = np.polyfit(np.arange(len(beats)), beats, 1) if len(beats) > 8 else (60 / coarse, beats[0])
tempo = 60 / fit[0]
onset = librosa.onset.onset_strength(y=y, sr=sr)
times = librosa.times_like(onset, sr=sr)

# Find the downbeat phase: the beat offset (0-3) whose beats carry the most onset energy,
# or, when the project names a downbeat, the offset that lands on it.
bar = 4 * 60 / tempo
if project['music'].get('downbeat') is not None:
    off = [abs((beats[k] - project['music']['downbeat'] + bar / 2) % bar - bar / 2) for k in range(4)]
    phase = int(np.argmin(off))
else:
    strength = np.interp(beats, times, onset)
    phase = int(np.argmax([strength[k::4].mean() for k in range(4)]))
# Downbeats on the fitted grid: a tracked beat is quantized to an onset frame (23 ms), the fit is not.
downbeats = np.polyval(fit, np.arange(len(beats)))[phase::4]

# Loudness per 2 s, to see the track's sections.
rms = librosa.feature.rms(y=y)[0]
rt = librosa.times_like(rms, sr=sr)
sections = [round(float(20 * np.log10(rms[(rt >= s) & (rt < s + 2)].mean() + 1e-9)), 1) for s in range(0, int(rt[-1]), 2)]

write_json(build, 'beats.json', {'path': path, 'tempo': tempo, 'beats': beats.round(3).tolist(), 'downbeats': downbeats.round(3).tolist()})
intervals = np.diff(beats)
print(f'tempo {tempo:.2f} bpm (librosa said {coarse:.1f}), {len(beats)} beats, beat interval median {np.median(intervals):.3f}s (sd {intervals.std():.3f})')
print(f'bar {4 * 60 / tempo:.2f}s, first downbeats', downbeats[:6].round(2).tolist())
print('dB per 2 s:', sections)
