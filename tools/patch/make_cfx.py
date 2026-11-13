import re,struct,sys
src,dst=sys.argv[1],sys.argv[2]
H=lambda x: '0' if x==0 else struct.pack('>f',x).hex().lstrip('0') or '0'
P='KeyscapePart[0]/SynthEngine[0]/SYNTHENG[0]'
S={
 P+'/EFFRACK[0]/EFFMODULE[1]@Active':0.0,   # Tape off
 P+'/EFFRACK[0]/EFFMODULE[2]@Active':0.0,   # Compresor off
 P+'/EFFRACK[0]/EFFMODULE[0]@Active':1.0,   # EQ on
 P+'/EFFRACK[0]/EFFMODULE[0]@P2':0.0,       # Lo Cut 0
 P+'/EFFRACK[0]/EFFMODULE[0]@P0':0.20,      # Lo Boost: 9-foot body
 P+'/EFFRACK[0]/EFFMODULE[0]@P3':0.35,      # Hi Boost: claro pero natural
 P+'/EFFRACK[0]/EFFMODULE[0]@P5':0.18,      # Hi Freq
 P+'/VOICE[0]/AENVPARAMS[0]@velsens':0.35,  # Dynamics: ~21 dB of range
 P+'/VOICE[0]/AENVPARAMS[0]@rels':0.80,     # Rel Time largo
 P+'/MULTISAMPLE[0]@relVol':0.65,           # Rel Noise natural
 P+'/MULTISAMPLE[0]@pedLvl':0.55,           # Pedal Noise natural
 P+'@irsendaux':0.07,                       # Reverb Amount: medium room
 P+'/AUXEFFRACK[0]/EFFMODULE[2]@P2':0.50,   # Reverb Time: RT60 ~1.1 s
 P+'@vcx':0.49, P+'@vcy':0.88, P+'@vcg':0.5, P+'@vcb':0.5,
}
txt=open(src,encoding='latin-1').read()
stack=[];counts={};out=[];pos=0;done=set()
for m in re.finditer(r'<(/?)([A-Za-z0-9_]+)([^>]*)>',txt):
    close,tag,attrs=m.groups(); out.append(txt[pos:m.start()]); pos=m.end()
    if close:
        if stack and stack[-1][0]==tag: stack.pop()
        out.append(m.group(0)); continue
    parent='/'.join(s[1] for s in stack); key=parent+'/'+tag
    counts[key]=counts.get(key,0)+1; node=f"{tag}[{counts[key]-1}]"
    p=(parent+'/'+node) if parent else node
    def rep(mm):
        k=p+'@'+mm.group(1)
        if k in S: done.add(k); return f'{mm.group(1)}="{H(S[k])}"'
        return mm.group(0)
    a=re.sub(r'([A-Za-z0-9_]+)="([^"]*)"',rep,attrs)
    if tag=='SYNTHENG' and p==P:
        a=re.sub(r'VCname="[^"]*"','VCname="MX88 Wide"',a) if 'VCname=' in a else a.rstrip()+'  VCname="MX88 Wide" '
    out.append(f'<{tag}{a}>'); stack.append((tag,node))
out.append(txt[pos:]); s=''.join(out)
missing=set(S)-done; assert not missing, missing
desc=('Author=Carlos Zaragoza;Complexity=Simple;Model=LA Custom C7 Grand Piano;Type=Acoustic Pianos;Osc Type=Sample Only;'
 'Description=Approximation of the Yamaha CFX (9-foot), calibrated against an official Yamaha demo: natural balance (-6 dB/oct), '
 'full body at 125-500 Hz, deep lows, no tape or compressor, wide dynamic range, medium room (RT60 ~1.1 s). '
 'Based on LA Custom C7 - Natural. MX88 Wide velocity curve (keyboard set to Wide).;')
s=re.sub(r'<ENTRYDESCR\s+name="[^"]*"\s+library="[^"]*"\s+ATTRIB_VALUE_DATA="[^"]*"',
         f'<ENTRYDESCR  name="CZ CFX Concert"  library="User"  ATTRIB_VALUE_DATA="{desc}"',s,count=1)
assert 'name="CZ CFX Concert"' in s
open(dst,'w',encoding='latin-1').write(s); print('ok',len(done),'params set')
