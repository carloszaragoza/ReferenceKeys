import re,struct,sys
src,dst=sys.argv[1],sys.argv[2]
H=lambda x: '0' if x==0 else struct.pack('>f',x).hex().lstrip('0') or '0'
P='KeyscapePart[0]/SynthEngine[0]/SYNTHENG[0]'
S={  # path@attr : value
 P+'/EFFRACK[0]/EFFMODULE[0]@P3':0.78,   # Hi Boost 0.97 -> 0.78 (singing brightness, no harshness)
 P+'/EFFRACK[0]/EFFMODULE[0]@P0':0.25,   # Lo Boost 0 -> 0.25 (Steinway D low end)
 P+'/EFFRACK[0]/EFFMODULE[1]@Active':0.0,# Classic Twin off (limpio)
 P+'/EFFRACK[0]/EFFMODULE[3]@Active':0.0,# Tape off (limpio)
 P+'/VOICE[0]/AENVPARAMS[0]@velsens':0.35, # Dynamics 0.17 -> 0.35
 P+'/MULTISAMPLE[0]@relVol':0.55,        # Rel Noise 0.74 -> 0.55
 P+'/MULTISAMPLE[0]@pedLvl':0.50,        # Pedal Noise 0.66 -> 0.50
 P+'@irsendaux':0.12,                    # Reverb Amount 0.088 -> 0.12
 P+'/AUXEFFRACK[0]/EFFMODULE[2]@P2':0.70,# Reverb Time 0.64 -> 0.70
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
 'Description=Approximation of the Roland RD-2000 German Concert (Steinway D concert grand), based on LA Custom C7 - Classical: '
 'clean with no amp or tape, fuller lows, bright highs without harshness, more dynamic range, concert hall, '
 'less key and pedal noise. MX88 Wide velocity curve (keyboard set to Wide).;')
s=re.sub(r'<ENTRYDESCR\s+name="[^"]*"\s+library="[^"]*"\s+ATTRIB_VALUE_DATA="[^"]*"',
         f'<ENTRYDESCR  name="CZ German Concert"  library="User"  ATTRIB_VALUE_DATA="{desc}"',s,count=1)
assert 'name="CZ German Concert"' in s
open(dst,'w',encoding='latin-1').write(s); print('ok',len(done),'params set')
