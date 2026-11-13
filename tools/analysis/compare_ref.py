"""Compare a reference recording against a Keyscape recording, band by band.

Usage: python3 tools/analysis/compare_ref.py REF.wav MINE.wav [--ref-skip A-B ...] [--mine-skip A-B ...]
Skips are in seconds (e.g. --ref-skip 186-999 drops a video outro). Both files must be stereo WAV.

Prints octave-band balance (each relative to its total power, so loudness does not matter),
L/R coherence per band, the 250 Hz to 8 kHz tilt, spectral centroid, side/mid width and dynamic range.
Same measures as compare.py, generalized for any reference.
"""
import argparse
import numpy as np
from scipy.io import wavfile
from scipy.signal import welch, csd

CENT = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]


def load(path, skips):
    sr, x = wavfile.read(path)
    x = x.astype(np.float64)
    keep = np.ones(len(x), bool)
    for a, b in skips:
        keep[int(a * sr):int(b * sr)] = False
    return sr, x[keep]


def feats(sr, x):
    L, R = x[:, 0], x[:, 1]
    M = (L + R) / 2
    f, P = welch(M, sr, nperseg=16384)
    _, PL = welch(L, sr, nperseg=16384)
    _, PR = welch(R, sr, nperseg=16384)
    _, C = csd(L, R, sr, nperseg=16384)
    coh = np.real(C) / np.sqrt(PL * PR)
    lv, co = [], []
    for c in CENT:
        s = (f >= c / np.sqrt(2)) & (f < c * np.sqrt(2))
        lv.append(10 * np.log10(P[s].sum()))
        co.append(np.average(coh[s], weights=P[s]))
    lv = np.array(lv) - 10 * np.log10(P[(f > 30) & (f < 16000)].sum())
    i = [3, 4, 5, 6, 7]
    tilt = np.polyfit(np.log2(np.array(CENT)[i]), lv[i], 1)[0]
    w = sr
    db = 20 * np.log10(np.array([np.sqrt(np.mean(M[j:j + w] ** 2)) for j in range(0, len(M) - w, w)]) + 1e-12)
    band = (f > 30) & (f < 16000)
    return dict(lv=lv, co=np.array(co), tilt=tilt, dr=np.percentile(db, 95) - np.percentile(db, 10),
                cen=(P[band] * f[band]).sum() / P[band].sum(),
                width=np.sqrt(np.mean(((L - R) / 2) ** 2)) / np.sqrt(np.mean(M ** 2)))


def rng(s):
    a, b = s.split('-')
    return float(a), float(b)


ap = argparse.ArgumentParser()
ap.add_argument('ref'); ap.add_argument('mine')
ap.add_argument('--ref-skip', type=rng, nargs='*', default=[])
ap.add_argument('--mine-skip', type=rng, nargs='*', default=[])
a = ap.parse_args()
A, B = feats(*load(a.ref, a.ref_skip)), feats(*load(a.mine, a.mine_skip))
print('   band    REF   MINE   MINE-REF   L/R coherence REF  MINE')
for c, x, y, cx, cy in zip(CENT, A['lv'], B['lv'], A['co'], B['co']):
    print(f'{c:7.0f} {x:6.1f} {y:6.1f} {y - x:+9.1f}              {cx:5.2f} {cy:5.2f}')
print(f"tilt 250 Hz-8 kHz: REF {A['tilt']:.1f}  MINE {B['tilt']:.1f} dB/oct")
print(f"centroid:          REF {A['cen']:.0f}  MINE {B['cen']:.0f} Hz")
print(f"side/mid width:    REF {A['width']:.2f}  MINE {B['width']:.2f}")
print(f"dynamic range:     REF {A['dr']:.1f}  MINE {B['dr']:.1f} dB")
