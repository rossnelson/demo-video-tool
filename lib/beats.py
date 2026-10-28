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
tempo = float(np.atleast_1d(tempo)[0])
beats = np.asarray(beats)
onset = librosa.onset.onset_strength(y=y, sr=sr)
times = librosa.times_like(onset, sr=sr)

# Find the downbeat phase: the beat offset (0-3) whose beats carry the most onset energy.
strength = np.interp(beats, times, onset)
phase = int(np.argmax([strength[k::4].mean() for k in range(4)]))
downbeats = beats[phase::4]

# Loudness per 2 s, to see the track's sections.
rms = librosa.feature.rms(y=y)[0]
rt = librosa.times_like(rms, sr=sr)
sections = [round(float(20 * np.log10(rms[(rt >= s) & (rt < s + 2)].mean() + 1e-9)), 1) for s in range(0, int(rt[-1]), 2)]

write_json(build, 'beats.json', {'path': path, 'tempo': tempo, 'beats': beats.round(3).tolist(), 'downbeats': downbeats.round(3).tolist()})
intervals = np.diff(beats)
print(f'tempo {tempo:.1f} bpm, {len(beats)} beats, beat interval median {np.median(intervals):.3f}s (sd {intervals.std():.3f})')
print(f'bar {4 * 60 / tempo:.2f}s, first downbeats', downbeats[:6].round(2).tolist())
print('dB per 2 s:', sections)
