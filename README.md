# ReferenceKeys

Five presets for **Spectrasonics Keyscape**, four grands and an electric piano, each calibrated against a reference
recording (Roland German Concert, Yamaha CFX, Nord Royal Grand 3D, Nord White Grand, Nord Silver EP) by measuring spectral balance, stereo image, dynamics and room,
plus velocity curves measured on a Yamaha MX88.

> Requires a licensed copy of Keyscape. This repo contains settings only (patches and curves), no samples.

**Download:** [ReferenceKeys.zip](https://github.com/carloszaragoza/ReferenceKeys/releases/latest/download/ReferenceKeys.zip) (latest release) ·
[landing page](https://keys.chartdown.app/)

## Presets

| Preset | Instrument | Calibrated against |
|---|---|---|
| CZ German Concert V2 | Keyscape (LA Custom C7) | Roland RD-2000 German Concert |
| CZ CFX Concert | Keyscape (LA Custom C7) | Official Yamaha CFX demo |
| CZ Royal 3D Grand | Keyscape | Nord Grand · Royal Grand 3D |
| CZ White Grand | Keyscape (LA Custom C7) | Official Nord White Grand demo |
| CZ Silver EP | Keyscape (MKS-20 E.Piano 2) | Official Nord Silver EP demos |

Eleven more patches (Keyscape grands, Omnisphere keys and multis) live in `in-progress/`. They are not calibrated
against a reference yet and are not part of the release.

## Velocity curves

- **MX88 Wide**: measured playing a Yamaha MX88 (pp 19, p 28, mf 48, f 87, max 104-111). Use it with the keyboard set to *Wide*.
- **MX88 Normal**, **MX88**.

## Installation (macOS)

```
~/Library/Application Support/Spectrasonics/STEAM/
  Keyscape/Settings Library/Patches/User/My Patches/              <- presets/keyscape/*.prt_key
  Keyscape/Settings Library/Presets/User/Velocity Curve/          <- velocity-curves/*.velcrv
```

Then click *Refresh Library* in the plugin browser.

## Release

`tools/release/make_pack.sh` builds `dist/ReferenceKeys.zip` from `presets/` and `velocity-curves/` (never `in-progress/`),
then `gh release create vX.Y.Z dist/ReferenceKeys.zip --notes-file dist/NOTES.md`. Keep the asset name: the landing links to
`releases/latest/download/ReferenceKeys.zip`.

## Structure

```
presets/          the released presets (calibrated against a reference)
in-progress/      patches still being polished, not released
velocity-curves/  curve files (.velcrv)
history/          previous versions of each preset
tools/patch/      read and edit patches (knobs.py, setp.py, transfer.py)
tools/render/     offline MIDI render through the Keyscape AU (try.sh)
tools/analysis/   spectral comparison against references (cmp_gc.py, compare.py, decay.py)
tools/midi/       CoreMIDI velocity meter
tools/release/    builds the release ZIP
analysis/         saved measurements
landing/          project landing page
private/          NOT published: copyrighted reference audio, recordings, renders, backups
```

## Calibration workflow

1. Reference audio -> `private/reference-audio/`.
2. Your performance as MIDI -> `private/midi/` (convert with `tools/analysis/mid2ev.py`).
3. Render variants: `tools/render/try.sh <name> <patch.prt_key> '{"/EFFRACK[0]/EFFMODULE[0]@P3":0.55}'`.
4. Compare: `python3 tools/analysis/cmp_gc.py private/renders/work/<name>.wav` (requires `pip install -r tools/requirements.txt`).
5. Always check **L/R balance**, not just stereo width.

Parameter notes: Vintage 2-Band EQ `P5` Hi Freq = kHz/100 (0.08 = 8 kHz). Imager `P0` is **balance** (keep at 0.5), `P1` is **width** (0.38 ≈ side/mid 0.45).

Author: Carlos Zaragoza
