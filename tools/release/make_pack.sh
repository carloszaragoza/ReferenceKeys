#!/bin/sh
# Builds dist/ReferenceKeys.zip: the three reference-calibrated Keyscape presets, the MX88 velocity curves
# and install notes. Only presets/ goes in; in-progress/ never ships.
# Publish:  gh release create vX.Y.Z dist/ReferenceKeys.zip --title "ReferenceKeys vX.Y.Z" --notes-file dist/NOTES.md
# The landing links to releases/latest/download/ReferenceKeys.zip, so the asset name must stay the same.
set -e
cd "$(dirname "$0")/../.."
STAGE=dist/ReferenceKeys
rm -rf dist && mkdir -p "$STAGE/Keyscape Patches" "$STAGE/Velocity Curves"
cp presets/keyscape/*.prt_key "$STAGE/Keyscape Patches/"
cp velocity-curves/*.velcrv "$STAGE/Velocity Curves/"
cat > "$STAGE/INSTALL.txt" <<'EOF'
ReferenceKeys: three Keyscape piano presets calibrated against reference recordings,
plus velocity curves measured on a Yamaha MX88.

Requires a licensed copy of Spectrasonics Keyscape. Settings only, no samples.

macOS
  Keyscape Patches/*.prt_key  ->  ~/Library/Application Support/Spectrasonics/STEAM/Keyscape/Settings Library/Patches/User/My Patches/
  Velocity Curves/*.velcrv    ->  ~/Library/Application Support/Spectrasonics/STEAM/Keyscape/Settings Library/Presets/User/Velocity Curve/

Then click Refresh Library in the Keyscape browser.

  CZ German Concert V2   calibrated against Roland RD-2000 German Concert
  CZ CFX Concert         calibrated against Yamaha CFX
  CZ Royal 3D Grand      calibrated against Nord Royal Grand 3D

  MX88 Wide              measured on a Yamaha MX88 set to Wide (pp 19, p 28, mf 48, f 87)
  MX88 Normal, MX88

Not affiliated with Spectrasonics, Yamaha, Nord or Roland.
https://carloszaragoza.github.io/ReferenceKeys/
EOF
(cd dist && zip -qrX ReferenceKeys.zip ReferenceKeys -x '*.DS_Store')
cat > dist/NOTES.md <<'EOF'
Three Keyscape piano presets, each calibrated band by band against a recording of a real concert grand, plus velocity curves measured on a Yamaha MX88.

| Preset | Calibrated against |
|---|---|
| CZ German Concert V2 | Roland RD-2000 German Concert |
| CZ CFX Concert | Yamaha CFX |
| CZ Royal 3D Grand | Nord Royal Grand 3D |

Velocity curves: MX88 Wide, MX88 Normal, MX88.

Unzip and follow `INSTALL.txt`. Requires a licensed copy of Spectrasonics Keyscape (settings only, no samples).
EOF
unzip -l dist/ReferenceKeys.zip
