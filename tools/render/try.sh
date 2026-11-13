#!/bin/zsh
# Usage: tools/render/try.sh <name> <base_patch.prt_key> '<parameter json>' <events.ev>
# Builds a patch variant, renders it through the Keyscape AU and writes <name>.wav to private/renders/work/
set -e
R=${0:A:h:h:h}; cd $R
N=$1; BASE=$2; JSON=$3; EV=${4:-private/midi/demo.ev}; OUT=private/renders/work; mkdir -p $OUT
python3 tools/patch/setp.py "$BASE" $OUT/$N.prt_key "$JSON" >/dev/null
python3 tools/render/mkstate.py $OUT/$N.prt_key $OUT/st_$N.xml >/dev/null
[[ -x tools/render/render ]] || swiftc -O tools/render/render.swift -o tools/render/render
tools/render/render $OUT/st_$N.xml $EV $OUT/$N.raw.wav 15 >/dev/null 2>&1
ffmpeg -v error -y -i $OUT/$N.raw.wav -c:a pcm_s16le $OUT/$N.wav && rm $OUT/$N.raw.wav
echo $OUT/$N.wav
