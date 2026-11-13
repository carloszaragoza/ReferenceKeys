import re,struct,sys
src,dst=sys.argv[1],sys.argv[2]
H=lambda x: '0' if x==0 else struct.pack('>f',x).hex().lstrip('0') or '0'
P='KeyscapePart[0]/SynthEngine[0]/SYNTHENG[0]'
S={
 P+'/EFFRACK[0]/EFFMODULE[0]@P3':0.35,      # Hi Boost (era 0)
 P+'/EFFRACK[0]/EFFMODULE[0]@P5':0.08,      # Hi Freq 8 kHz (era 14k)
 P+'/VOICE[0]/AENVPARAMS[0]@velsens':0.45,  # Dynamics (era 0.50)
 P+'@irsendaux':0.20,                       # Reverb Amount (era 0.17)
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
    out.append(f'<{tag}{a}>'); stack.append((tag,node))
out.append(txt[pos:]); s=''.join(out)
missing=set(S)-done; assert not missing, missing
open(dst,'w',encoding='latin-1').write(s); print('ok',len(done),'params set')
