# Shot list: the landing as a film

Status: draft, approved direction. Not built yet except where marked **(live)**.

A concert grand alone in a dark room. The camera approaches it, listens, compares, and hands over the three
presets. There are no "sections": scroll moves the film forward.

**The pack is three sounds**, one per reference:

| Preset | Measured against |
|---|---|
| CZ German Concert V2 | Roland RD-2000 German Concert |
| CZ CFX Concert | Yamaha CFX |
| CZ Royal 3D Grand | Nord Royal Grand 3D |

## Shots

### 0 · Opening (before any scroll) **(live)**
- **Image:** full black with one point of light.
- **Text:** "Headphones on?" with *Enter with sound* or *Enter in silence*.
- **Sound:** nothing yet. This choice is the permission for anything to play later.
- **Out:** slow fade from black into shot 1.

### 1 · In the dark (1 screen)
- **Image:** a spotlight comes on from above and reveals the piano tail first, lid closed. Everything else stays in shadow.
- **Camera:** still, eye level, from the side.
- **Text:** the REFERENCEKEYS wordmark rises, with "Three concert grands, measured against the real thing" below.
- **Sound:** with sound on, the first bars of German Concert V2.

### 2 · The lid opens (pinned, 1.5 screens)
- **Image:** the lid rises to its stick as you scroll. Light falls in and the strings appear.
- **Camera:** travels along the side from the tail toward the keyboard.
- **Text:** one subtitle line: "One reference. One goal: sound the same."
- **Sound:** German Concert continues and gets slightly louder as the lid opens.

### 3 · The hammers (pinned, 2 screens)
- **Image:** close-up of hammers and strings moving with the real audio, background out of focus.
- **Camera:** drops into the piano, almost grazing the strings.
- **Text:** the numbers arrive one by one as subtitles (live dB gap, stereo width, number of renders). Replaces the proof strip.
- **Out:** a half-second **cut to black**, the film's first hard cut.

### 4 · Three references (pinned, 3 chapters of 1 screen)
The heart of the page. Each chapter has the same structure:

| | German Concert V2 | CFX Concert | Royal 3D Grand |
|---|---|---|---|
| Camera | side, low | overhead, above the lid | three-quarter from the tail |
| Light | neutral | slightly cooler | slightly warmer |
| Audio | german-v1 → v2 | cfx-v1 → v2 | royal-v1 → v3 |

- **Text per chapter:** name, "measured against [reference]", final dB gap, a **Before / After** toggle.
- **Image:** the measured curve draws itself over the piano while it plays.
- **Sound:** crossfade to the next preset's render between chapters.

Merges the current story, compare and takes sections.

### 5 · The keyboard (1.5 screens)
- **Image:** overhead shot of the keyboard. Bars of light rise from four keys with the measured MX88 velocities (pp 19, p 28, mf 48, f 87): the velocity drawing, in 3D.
- **Text:** "Includes velocity curves for the MX88."
- **Sound:** four single notes, pp to f.

### 6 · The method (fast rhythm, 1 screen)
- **Image:** the camera holds still with the piano in silhouette; three quick cuts pass over it: measure, adjust, render again.
- **Sound:** drops almost to silence to change the rhythm before the end.

### 7 · Download (1 screen)
- **Image:** the camera pulls back to the whole piano while the spotlight narrows on it.
- **Text:** the three names roll in like credits, a large **Download the 3 presets** button and install in three lines.
- **Sound:** a final chord that dies away.

### 8 · Credits (footer)
- **Image:** black.
- **Text:** rolling credits: design and code; not affiliated with Spectrasonics, Yamaha, Nord or Roland; design system; GitHub.

## Rules for the whole film
- **Length:** about 12 screens of scroll.
- **Scroll:** Lenis, with inertia, so the camera glides.
- **Grounding (live):** the piano never floats. A pool of light sits on the floor under it and a soft shadow sits inside the pool: a wide blurred shadow of the case plus tight contact spots under the casters, lyre and pedals. Light comes from above and slightly in front, so the shadow stays fixed under the case while the camera turns. Baked once into canvas textures, no real-time shadow maps. When the lid animates (shot 2) its shadow should stretch with it.
- **Light:** the piano stays a white line drawing, that is the signature. Add spotlight, floor shadow and depth of field on close shots.
- **Audio:** a mute button always visible. Nothing plays without consent from the opening.
- **Reduced motion:** each shot becomes a still frame.
- **Phone:** the same shots with vertical framing.

## Download **(live)**
The button downloads `ReferenceKeys.zip` from the latest GitHub Release: the three presets, the MX88 velocity
curves and `INSTALL.txt`. Built by `tools/release/make_pack.sh`. The other twelve patches live in `in-progress/`
until they are polished, and are not on the page or in the ZIP.
