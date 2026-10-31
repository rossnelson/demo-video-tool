"""Synthesizes a lofi hip-hop bed for the meta demo. Nothing is sampled: the
drums, keys, bass and vinyl are all generated, then played with human feel.

   .venv/bin/python projects/meta/lofi.py <out.wav> [seconds] [bpm] [seed]

Feel: every hit has zero-mean timing jitter and its own velocity, the hats
swing and breathe, kick patterns change by 8-bar phrase, snare fills close
each phrase, the drums drop out for two bars every 32, chords are strummed
with a spread and shifting voicings, a sparse melody answers in the gaps,
the bass slides into some notes, the keys duck under the kick, and the whole
mix gets tape wow, bit-reduced drums and vinyl wear.

The beat tracker (lib/beats.py) wants a steady tempo and beat 1 as the loudest
onset, so the jitter is zero-mean (no systematic late snares) and the
downbeat carries an extra bright accent.
"""
import sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

out = sys.argv[1]
LEN = float(sys.argv[2]) if len(sys.argv) > 2 else 360.0
BPM = float(sys.argv[3]) if len(sys.argv) > 3 else 60 * 22050 / (512 * 32)   # exactly 32 librosa frames a beat
rng = np.random.default_rng(int(sys.argv[4]) if len(sys.argv) > 4 else 7)
SR = 44100
BEAT = 60 / BPM
BAR = 4 * BEAT
N = int(LEN * SR)
t_all = np.arange(N) / SR
bars = int(np.ceil(LEN / BAR)) + 1

# ------------------------------------------------------------- helpers
def lp(x, hz, order=2):  return sosfilt(butter(order, min(hz, SR / 2 - 1), 'low', fs=SR, output='sos'), x)
def hp(x, hz, order=2):  return sosfilt(butter(order, hz, 'high', fs=SR, output='sos'), x)
def env(n, a, d, curve=5.0):
    x = np.zeros(n); na = max(int(a * SR), 1); nd = n - na
    x[:na] = np.linspace(0, 1, na)
    x[na:] = np.exp(-curve * np.arange(nd) / max(int(d * SR), 1))
    return x
def place(buf, start, sig, gain=1.0):
    i = int(round(start * SR))
    if i < 0: sig, i = sig[-i:], 0
    if i >= N or len(sig) == 0: return
    j = min(i + len(sig), N)
    buf[i:j] += gain * sig[: j - i]
def jit(ms):            return rng.normal(0, ms / 1000)           # zero-mean timing, seconds
def vel(mean, spread):  return float(np.clip(rng.normal(mean, spread), 0.05, 1.3))
def midi(n):            return 440.0 * 2 ** ((n - 69) / 12)
def chance(p):          return rng.random() < p

# a slow push/pull: the whole band leans a few ms ahead or behind over 2 bars (zero-mean)
def lean(t):            return 0.004 * np.sin(2 * np.pi * t / (2 * BAR) + 0.7)

# ---------------------------------------------------------------- drums
def kick(v=1.0, tone=1.0):
    n = int(0.5 * SR); tt = np.arange(n) / SR
    f = 46 * tone + 115 * np.exp(-tt * (26 + rng.uniform(-3, 3)))
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * env(n, 0.002, 0.45, 6)
    click = hp(rng.standard_normal(n), 1800) * env(n, 0.0005, 0.01, 8) * 0.25
    return v * np.tanh(1.8 * (body + click))
def snare(v=1.0, bright=1.0):
    n = int(0.3 * SR); tt = np.arange(n) / SR
    tone = np.sin(2 * np.pi * (180 + rng.uniform(-6, 6)) * tt) * env(n, 0.001, 0.09, 6) * 0.5
    noise = hp(rng.standard_normal(n), 800) * env(n, 0.001, 0.18 + rng.uniform(0, 0.05), 5) * 0.6
    return v * lp(tone + noise, 2800 * bright)
def hat(v=1.0, open_=False):
    dec = (0.18 + rng.uniform(0, 0.12)) if open_ else (0.035 + rng.uniform(0, 0.03))
    n = int(dec * 3 * SR)
    x = hp(rng.standard_normal(n), 6000 + rng.uniform(-800, 800), 4) * env(n, 0.0005, dec, 6)
    return v * 0.33 * x
def rim(v=1.0):
    n = int(0.06 * SR); tt = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 1850 * tt) + 0.6 * np.sin(2 * np.pi * 3100 * tt)) * env(n, 0.0005, 0.03, 7)
    return v * 0.4 * x
def shaker(v=1.0):
    n = int(0.09 * SR)
    return v * 0.12 * hp(rng.standard_normal(n), 4000, 4) * env(n, 0.01, 0.05, 5)

KICKS = [  # (beat position, velocity) patterns; one is chosen per 8-bar phrase, varied per bar
    [(0, 1.0), (2, 0.8)],
    [(0, 1.0), (1.5, 0.6), (2, 0.8)],
    [(0, 1.0), (2.5, 0.75), (3.5, 0.5)],
    [(0, 1.0), (1.75, 0.55), (2, 0.8), (3.5, 0.45)],
]
drums = np.zeros(N); hatsL = np.zeros(N); kick_times = []
swing_base = 0.06 + rng.uniform(0, 0.03)
for b in range(bars):
    t0 = b * BAR
    phrase, pos = b // 8, b % 8
    breakdown = (b % 32) in (30, 31) and b > 8
    fill = pos == 7 and not breakdown
    swing = (swing_base + 0.012 * np.sin(2 * np.pi * b / 16)) * BEAT      # the swing breathes
    if breakdown:
        # drums out: just a soft shaker and the odd rim
        for k in range(8):
            if chance(0.7): place(hatsL, t0 + k * BEAT / 2 + jit(9), shaker(vel(0.5, 0.15)))
        if chance(0.5): place(drums, t0 + 3 * BEAT + jit(10), rim(0.3))
        continue
    # kicks
    pattern = KICKS[(phrase + (1 if pos in (3, 7) else 0)) % len(KICKS)]
    for beat, v in pattern:
        if beat == 0:
            tk = t0 + jit(2.5) + lean(t0)                      # the downbeat is the tightest hit
            place(drums, tk, kick(vel(1.0, 0.04)))
            place(drums, tk, hat(1.5 + 0.2 * rng.random(), open_=True))
            place(drums, tk, rim(vel(0.85, 0.1)))
        elif chance(0.9 if beat == 2 else 0.7):
            tk = t0 + beat * BEAT + (swing if beat % 1 else 0) + jit(5) + lean(t0 + beat * BEAT)
            place(drums, tk, kick(vel(v, 0.08), tone=rng.uniform(0.97, 1.03)))
        else: continue
        kick_times.append(tk)
    # snares on 2 and 4, a ghost sometimes, a fill at the phrase end
    for beat, v in ((1, 0.88), (3, 0.95)):
        if fill and beat == 3: break
        place(drums, t0 + beat * BEAT + jit(6) + lean(t0 + beat * BEAT), snare(vel(v, 0.07), bright=rng.uniform(0.9, 1.15)))
    if chance(0.3): place(drums, t0 + 3.75 * BEAT + swing * 0.5 + jit(8), snare(vel(0.35, 0.08)))
    if chance(0.18): place(drums, t0 + 1.75 * BEAT + swing * 0.5 + jit(8), snare(vel(0.3, 0.08)))
    if fill:
        hits = rng.choice([3, 4, 6])
        for i in range(hits):
            tf = t0 + 3 * BEAT + i * BEAT / hits + jit(5)
            place(drums, tf, snare(0.35 + 0.5 * i / hits + jit(40), bright=1.1))
        if chance(0.6): place(drums, t0 + 3.5 * BEAT + jit(5), kick(0.6))
    # hats: swung 8ths, breathing velocity contour, dropped and doubled hits
    contour = rng.uniform(0.75, 1.0, 8)
    for k in range(8):
        if fill and k >= 6: break
        if chance(0.08 if k % 2 else 0.02): continue           # a hit left out
        tk = t0 + k * BEAT / 2 + (swing if k % 2 else 0) + jit(7 if k % 2 else 4) + lean(t0 + k * BEAT / 2)
        v = (0.9 if k % 2 == 0 else 0.5) * contour[k] * (0.6 if pos == 0 and k == 0 else 1)
        open_ = (k == 7 and pos % 2 == 1 and chance(0.8)) or chance(0.04)
        place(hatsL, tk, hat(vel(v, 0.06), open_=open_))
        if k % 2 and chance(0.12):                                      # a 16th double
            place(hatsL, tk + BEAT / 4 + jit(6), hat(vel(0.35, 0.05)))
    if phrase % 2 == 1 and chance(0.6):                                 # shaker on the off-16ths some phrases
        for k in range(16):
            if k % 4 == 2: place(hatsL, t0 + k * BEAT / 4 + jit(8), shaker(vel(0.6, 0.15)))

# -------------------------------------------------------------- keys
# Gm7 C7 Fmaj7 Dm7 (ii V I vi in F), several voicings each, around middle C
VOICINGS = [
    [[55, 58, 62, 65], [58, 62, 65, 69], [55, 62, 65, 69]],         # Gm7, Gm7/Bb, Gm9-ish
    [[55, 60, 64, 67], [52, 58, 60, 64], [55, 58, 64, 66]],         # C7, C7/E, C13
    [[57, 60, 64, 69], [53, 57, 60, 64], [57, 60, 64, 67]],         # Fmaj7, root, Fmaj9
    [[57, 60, 62, 65], [50, 57, 60, 65], [57, 60, 64, 65]],         # Dm7, Dm7 low, Dm9
]
BASS_ROOT = [43, 48, 41, 38]
MELODY_POOL = [[67, 70, 74, 77, 79], [67, 71, 74, 76, 79], [69, 72, 76, 77, 81], [69, 72, 74, 77, 81]]

def epiano(freq, dur, v=1.0, dull=1.0):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = freq * (1 + 0.002 * np.sin(2 * np.pi * rng.uniform(0.6, 1.1) * tt + rng.uniform(0, 6.28)))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sin(ph) + 0.45 * dull * np.sin(2 * ph) * np.exp(-tt * 3) + 0.18 * dull * np.sin(3 * ph) * np.exp(-tt * 5)
         + 0.07 * np.sin(5.01 * ph) * np.exp(-tt * 9))
    x *= env(n, 0.008 + 0.01 * (1 - v), dur * 0.95, 3.0 + rng.uniform(0, 0.6))
    x += 0.04 * np.sin(2 * np.pi * freq * 7.1 * tt) * env(n, 0.001, 0.03, 8)
    return v * x
def strum(buf, t, notes, dur, v, spread_ms=18):
    order = list(range(len(notes)))
    if chance(0.3): order.reverse()
    spread = rng.uniform(0.4, 1.0) * spread_ms / 1000
    for i, k in enumerate(order):
        place(buf, t + i * spread / max(len(notes) - 1, 1) + jit(4), epiano(midi(notes[k]), dur, vel(v, 0.08)))

keys = np.zeros(N); lead = np.zeros(N)
COMPS = [  # (beat position, velocity, length in beats) comp rhythms
    [(0, 0.55, 3.8), (2.5, 0.32, 1.3)],
    [(0, 0.55, 1.8), (1.5, 0.3, 0.9), (2.5, 0.38, 1.3)],
    [(0, 0.5, 3.8), (3, 0.3, 0.9), (3.5, 0.28, 0.5)],
    [(0, 0.55, 3.8)],
]
melody_phrase = None
for b in range(bars):
    t0 = b * BAR
    ch = b % 4; phrase, pos = b // 8, b % 8
    breakdown = (b % 32) in (30, 31) and b > 8
    voicing = VOICINGS[ch][(phrase + (1 if pos >= 4 else 0)) % 3]
    comp = COMPS[(phrase * 3 + pos // 2) % len(COMPS)] if not breakdown else [(0, 0.5, 3.9)]
    swing = swing_base * BEAT
    for beat, v, length in comp:
        if beat and chance(0.15): continue
        if beat == 0: v *= 1.0 if pos else 1.1
        notes = voicing if beat == 0 else voicing[1:] if chance(0.5) else voicing
        t = t0 + beat * BEAT + (swing if beat % 1 else 0) + jit(10) + lean(t0 + beat * BEAT)
        strum(keys, t, notes, length * BEAT, v, spread_ms=14 if beat == 0 else 24)
    # the melody: a two-bar phrase every so often, answered by rests
    if pos % 4 == 0:
        melody_phrase = chance(0.55) and not breakdown
        if melody_phrase:
            n_notes = rng.integers(3, 7)
            slots = np.sort(rng.choice(np.arange(1, 16), n_notes, replace=False)) / 2    # 8th slots over 2 bars
    if melody_phrase and pos % 4 in (0, 1):
        for s in slots:
            if (pos % 4 == 0) != (s < 4): continue
            beat_in_bar = s % 4
            pool = MELODY_POOL[(b + (1 if beat_in_bar >= 2 else 0)) % 4]
            note = int(rng.choice(pool))
            t = t0 + beat_in_bar * BEAT + (swing if beat_in_bar % 1 else 0) + jit(14)
            place(lead, t, epiano(midi(note), rng.uniform(0.6, 1.6) * BEAT, vel(0.26, 0.06), dull=0.6))

# -------------------------------------------------------------- bass
def bnote(freq, dur, v, slide_from=None):
    n = int(dur * SR); tt = np.arange(n) / SR
    f = np.full(n, freq)
    if slide_from:
        g = int(0.09 * SR); f[:g] = np.geomspace(slide_from, freq, g)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.25 * np.sin(2 * ph) * np.exp(-tt * 4)
    return v * np.tanh(1.5 * x) * env(n, 0.01, dur, 3.5)
bass = np.zeros(N)
for b in range(bars):
    t0 = b * BAR
    ch = b % 4; phrase, pos = b // 8, b % 8
    breakdown = (b % 32) in (30, 31) and b > 8
    root = midi(BASS_ROOT[ch]); nxt = midi(BASS_ROOT[(b + 1) % 4])
    swing = swing_base * BEAT
    if breakdown:
        place(bass, t0 + jit(8), bnote(root, 3.5 * BEAT, 0.6)); continue
    place(bass, t0 + jit(5) + lean(t0), bnote(root, (1.7 + rng.uniform(0, 0.4)) * BEAT, vel(0.8, 0.05)))
    style = (phrase + pos // 4) % 3
    if style == 0:
        place(bass, t0 + 2 * BEAT + jit(7), bnote(root, 1.2 * BEAT, vel(0.62, 0.06)))
        if chance(0.7): place(bass, t0 + 3.5 * BEAT + swing + jit(8), bnote(nxt if chance(0.5) else root * 1.4983, 0.5 * BEAT, vel(0.45, 0.06)))
    elif style == 1:
        place(bass, t0 + 1.5 * BEAT + swing + jit(7), bnote(root, 0.5 * BEAT, vel(0.5, 0.06)))
        place(bass, t0 + 2 * BEAT + jit(7), bnote(root * 1.4983, 1.0 * BEAT, vel(0.6, 0.06)))
        if chance(0.6): place(bass, t0 + 3.5 * BEAT + swing + jit(8), bnote(nxt, 0.5 * BEAT, vel(0.45, 0.06), slide_from=nxt * 0.84))
    else:
        place(bass, t0 + 2.5 * BEAT + swing + jit(7), bnote(root, 1.0 * BEAT, vel(0.6, 0.06), slide_from=root * 0.89 if chance(0.5) else None))
        if chance(0.5): place(bass, t0 + 3.75 * BEAT + jit(8), bnote(nxt * 0.9439, 0.25 * BEAT, vel(0.4, 0.06)))

# -------------------------------------------------------------- vinyl
crackle = np.zeros(N)
density = 9 + 6 * np.interp(np.arange(0, LEN, 2), [0, LEN / 3, 2 * LEN / 3, LEN], rng.uniform(0, 1, 4))
for s, d in enumerate(density):
    for _ in range(rng.poisson(d * 2)):
        i = int((s * 2 + rng.uniform(0, 2)) * SR); w = int(rng.integers(8, 70))
        if i + w < N: crackle[i:i + w] += rng.uniform(-1, 1) * np.hanning(w) * rng.uniform(0.15, 1.0)
for _ in range(int(LEN / 25)):                                       # the occasional pop
    i = int(rng.uniform(0, LEN - 1) * SR); w = 400
    crackle[i:i + w] += rng.uniform(1.5, 3) * np.hanning(w) * np.sin(np.linspace(0, 9, w))
crackle = hp(crackle, 1100) * 0.08
hiss = lp(hp(rng.standard_normal(N), 300), 4500) * 0.006
rumble = lp(rng.standard_normal(N), 60, 4) * 0.02

# ----------------------------------------------------------------- mix
def bitcrush(x, bits=10, factor=2):
    q = 2 ** (bits - 1)
    y = np.round(x * q) / q
    return np.repeat(y[::factor], factor)[: len(x)]
def chorus(x, depth_ms=1.6, rate=0.35, base_ms=11):
    d = (base_ms + depth_ms * np.sin(2 * np.pi * rate * t_all)) / 1000 * SR
    idx = np.clip(np.arange(N) - d, 0, N - 1)
    return np.interp(idx, np.arange(N), x)
def wow(x, depth=0.0025, rate=0.33, flutter=0.0004, frate=5.7):
    dev = depth * np.sin(2 * np.pi * rate * t_all) + flutter * np.sin(2 * np.pi * frate * t_all)
    pos = np.cumsum(1 + dev); pos -= pos[0]
    pos = np.clip(pos, 0, N - 1)
    return np.interp(pos, np.arange(N), x)

# sidechain: the keys and lead duck a little after each kick
duck = np.ones(N)
if kick_times:
    kt = np.array(kick_times); idx = (kt * SR).astype(int)
    kern_n = int(0.3 * SR); kern = 0.45 * np.exp(-np.arange(kern_n) / (0.11 * SR))
    pulse = np.zeros(N + kern_n); pulse[idx[idx < N]] = 1
    duck = 1 - np.convolve(pulse, kern)[:N]; duck = np.clip(duck, 0.45, 1)

keys_dull = lp(keys, 3400) * (1 + 0.05 * np.sin(2 * np.pi * 0.3 * t_all))
# breakdown filter sweep: the keys open up over the two quiet bars
sweep = np.ones(N)
for b in range(bars):
    if (b % 32) in (30, 31) and b > 8 and b % 32 == 30:
        i, j = int(b * BAR * SR), int(min((b + 2) * BAR, LEN) * SR)
        sweep[i:j] = np.linspace(0, 1, j - i) ** 2
keys_mix = keys_dull * sweep + lp(keys, 650) * (1 - sweep) * 1.4
keys_mix = chorus(keys_mix) * duck
lead_mix = lp(lead, 2600) * duck
bass_mix = lp(bass, 230, 2)
drums_mix = lp(bitcrush(drums, 10, 2), 7500)
hats_mix = lp(bitcrush(hatsL, 11, 2), 9000)

mono = 0.95 * drums_mix + 0.75 * hats_mix + 0.55 * keys_mix + 0.5 * lead_mix + 0.7 * bass_mix + crackle + hiss + rumble
mono = lp(mono, 10500)
mono = np.tanh(1.15 * mono)
fade = int(0.05 * SR); mono[:fade] *= np.linspace(0, 1, fade)

# stereo: hats a touch right, keys/lead chorused wide, crackle drifts
side = 0.22 * hats_mix + 0.3 * keys_mix - 0.15 * lead_mix + 0.6 * crackle
left = wow(mono - 0.5 * side)
right = wow(mono + 0.5 * side)
st = np.stack([left, right], 1)
st /= np.abs(st).max() * 1.05
sf.write(out, st.astype(np.float32), SR, subtype='PCM_16')
print(f'wrote {out}: {LEN:.0f}s at {BPM:.2f} bpm, bar {BAR:.3f}s, {bars} bars, {len(kick_times)} kicks, seed {sys.argv[4] if len(sys.argv) > 4 else 7}')
