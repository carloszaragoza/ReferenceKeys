# ReferenceKeys

Piano presets for **Spectrasonics Keyscape** and **Omnisphere**, calibrated against reference recordings
(Yamaha CFX, Nord Royal Grand 3D, Roland German Concert) by measuring spectral balance, stereo image, dynamics and room.

> Requires licensed Keyscape and/or Omnisphere. This repo contains settings only (patches, multis and curves), no samples.

## Presets

| Preset | Instrument | Calibrated against |
|---|---|---|
| CZ German Concert V2 | Keyscape (LA Custom C7) | Roland RD-2000 German Concert |
| CZ CFX Concert | Keyscape (LA Custom C7) | Demo oficial Yamaha CFX |
| CZ Royal 3D Grand | Keyscape | Nord Grand · Royal Grand 3D |
| CZ German Concert | Keyscape | (v1, no reference) |
| CZ C7 Grand Piano, LA Custom C7, Stage Grand, White Grand, Velvet Grand, Center Cinematic | Keyscape | — |
| CZ Mk I Bright Dyno, Mk I Suitcase, Wurli 200A | Omnisphere | — |
| CZ Royal 3D + Pad, CZ Rich Ballad | Omnisphere (multi, Live mode) | — |

## Velocity curves

- **MX88 Wide**: measured playing a Yamaha MX88 (pp 19, p 28, mf 48, f 87, max 104-111). Use it with the keyboard set to *Wide*.
- **MX88 Normal**, **MX88**.

## Installation (macOS)

```
~/Library/Application Support/Spectrasonics/STEAM/
  Keyscape/Settings Library/Patches/User/My Patches/      <- presets/keyscape/*.prt_key
  Omnisphere/Settings Library/Patches/User/My Category/   <- presets/omnisphere/patches/*.prt_omn
  Omnisphere/Settings Library/Multis/User/                <- presets/omnisphere/multis/*.mlt_omn
  Keyscape|Omnisphere/Settings Library/Presets/User/Velocity Curve/  <- velocity-curves/*.velcrv
```

Then click *Refresh Library* in the plugin browser.

## Structure

```
presets/          current versions (the published ones)
velocity-curves/  curve files (.velcrv)
history/          previous versions of each preset
tools/patch/      read and edit patches (knobs.py, setp.py, transfer.py)
tools/render/     offline MIDI render through the Keyscape AU (try.sh)
tools/analysis/   spectral comparison against references (cmp_gc.py, compare.py, decay.py)
tools/midi/       CoreMIDI velocity meter
analysis/         saved measurements
landing/          project landing page
private/          NOT published: copyrighted reference audio, recordings, renders, backups
```

## Calibration workflow

1. Reference audio -> `private/reference-audio/`.
2. Your performance as MIDI -> `private/midi/` (convert with `tools/analysis/mid2ev.py`).
3. Render variants: `tools/render/try.sh <nombre> <patch.prt_key> '{"/EFFRACK[0]/EFFMODULE[0]@P3":0.55}'`.
4. Compare: `python3 tools/analysis/cmp_gc.py private/renders/work/<nombre>.wav` (requires `pip install -r tools/requirements.txt`).
5. Always check **L/R balance**, not just stereo width.

Parameter notes: Vintage 2-Band EQ `P5` Hi Freq = kHz/100 (0.08 = 8 kHz). Imager `P0` is **balance** (keep at 0.5), `P1` is **width** (0.38 ≈ side/mid 0.45).

Author: Carlos Zaragoza
