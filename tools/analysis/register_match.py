"""Build a register-matched test performance from a reference recording.

Usage: python3 tools/analysis/register_match.py REF.wav OUT.ev [--velocities private/midi/demo.ev] [--seed 1]

Band-by-band comparisons are only fair when both recordings play in the same register: a bass-heavy
performance measures as "too much low end" whatever the patch does. This script estimates, from the
reference audio, how often each of the 88 keys is struck (onsets at each key's fundamental) and the
note density over time, then writes a random performance (.ev, the format tools/render/render reads)
with the same key histogram, density and length. Velocities are drawn from a real performance so
the dynamics stay human. Rendering that file through a patch gives a recording that can be compared
against the reference band by band without the register bias.
"""
import argparse
import numpy as np
from scipy.io import wavfile
from scipy.signal import stft

ap = argparse.ArgumentParser()
ap.add_argument('ref'); ap.add_argument('out')
ap.add_argument('--velocities', default='private/midi/demo.ev')
ap.add_argument('--seed', type=int, default=1)
a = ap.parse_args()

sr, x = wavfile.read(a.ref)
m = x.astype(np.float64).mean(1)
f, t, Z = stft(m, sr, nperseg=8192, noverlap=8192 - 1024)
P = np.abs(Z) ** 2
keys = 21 + np.arange(88)
fk = 440 * 2 ** ((keys - 69) / 12)
lvl = np.array([P[(f >= q / 1.015) & (f <= q * 1.015)].max(0) if ((f >= q / 1.015) & (f <= q * 1.015)).any() else np.zeros(P.shape[1]) for q in fk])
db = 10 * np.log10(lvl + 1e-12)
# a key is active when it is a local peak among its neighbours (so harmonics of lower notes count less)
peak = (db > np.roll(db, 1, 0) + 3) & (db > np.roll(db, -1, 0) + 3) & (db > db.max() - 45)
# onset: becomes active, or jumps 6 dB within ~0.1 s
jump = np.zeros_like(peak); jump[:, 3:] = (db[:, 3:] - db[:, :-3]) > 6
on = peak & np.concatenate([np.ones((88, 1), bool), ~peak[:, :-1] | jump[:, 1:]], 1)
hist = on.sum(1).astype(float) + .05
dur = len(m) / sr
# note density from broadband spectral flux (per-key onsets overcount: harmonics and beating retrigger them)
L = np.log10(P[(f > 60) & (f < 6000)] + 1e-12)
flux = np.maximum(np.diff(L, axis=1), 0).sum(0)
thr = np.median(flux) + 1.5 * flux.std()
pk = [i for i in range(2, len(flux) - 2) if flux[i] > thr and flux[i] == flux[i - 2:i + 3].max()]
rate = len(pk) / dur  # onsets per second (chords count once, so add a little for simultaneous notes)
rate *= 1.6
print(f'reference: {dur:.1f} s, {len(pk)} attacks, ~{rate:.1f} notes/s, key range {keys[hist > 1].min()}-{keys[hist > 1].max()}, '
      f'median key {int(np.median(np.repeat(keys, on.sum(1))))}')

vel = [int(l.split()[3]) for l in open(a.velocities) if l.split()[1] == '144' and int(l.split()[3]) > 0]
rng = np.random.default_rng(a.seed)
ev, tt = [], 0.25
while tt < dur - 1.5:
    k = int(rng.choice(keys, p=hist / hist.sum()))
    v = int(rng.choice(vel)); ln = float(rng.uniform(.35, 1.6))
    ev.append((tt, 144, k, v)); ev.append((tt + ln, 128, k, 0))
    tt += float(rng.exponential(1 / rate))
for s in np.arange(0, dur - 1, 2.0):  # sustain pedal: down for most of each 2 s phrase, then lifted
    ev.append((s + .05, 176, 64, 100)); ev.append((s + 1.8, 176, 64, 0))
ev.sort()
with open(a.out, 'w') as o:
    for e in ev: o.write(f'{e[0]:.6f} {e[1]} {e[2]} {e[3]}\n')
print(f'wrote {a.out}: {sum(1 for e in ev if e[1] == 144)} notes over {dur:.1f} s')
