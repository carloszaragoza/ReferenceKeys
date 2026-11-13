import re,sys,os
sys.path.insert(0,sys.argv[1]); D=sys.argv[1]
from xdiff_lib import parse
ST=os.path.expanduser('~/Library/Application Support/Spectrasonics/STEAM')
K=ST+'/Keyscape/Settings Library/Patches/User/My Patches/ARLO Royal 3D Grand.prt_key'
BASE=ST+'/Omnisphere/Settings Library/Multis/User/PIANOS/Stage Piano And Pad.mlt_omn'
OUT=sys.argv[2]
arlo={re.sub(r'^KeyscapePart\[0\]/','',k):v for k,v in parse(K).items()}
skip=lambda k: ('ENTRYDESCR' in k or '/Custom' in k or k.endswith('@Vers') or k.endswith('@VCname') or 'SLICESEQ' in k)
# rewrite czp0 with ARLO values, walking tags with same path scheme
txt=open(D+"/czp0.txt",encoding="latin-1").read().rstrip().removesuffix("</SynthSubEngine>").rstrip()+"\n"
stack=[];counts={};out=[];pos=0;changed=0;added=0
for m in re.finditer(r'<(/?)([A-Za-z0-9_]+)([^>]*)>',txt):
    close,tag,attrs=m.groups()
    out.append(txt[pos:m.start()]);pos=m.end()
    if close:
        if stack and stack[-1][0]==tag: stack.pop()
        out.append(m.group(0));continue
    parent='/'.join(s[1] for s in stack); key=parent+'/'+tag
    counts[key]=counts.get(key,0)+1; node=f"{tag}[{counts[key]-1}]"
    p=(parent+'/'+node) if parent else node
    present=set()
    def rep(mm):
        global changed
        a,v=mm.group(1),mm.group(2); present.add(a); k=p+'@'+a
        if k in arlo and not skip(k) and arlo[k]!=v:
            changed+=1; return f'{a}="{arlo[k]}"'
        return mm.group(0)
    newattrs=re.sub(r'([A-Za-z0-9_]+)="([^"]*)"',rep,attrs)
    # add custom-curve attrs ARLO has on this element but omni lacks
    extra=[(k.split('@')[1],v) for k,v in arlo.items() if k.split('@')[0]==p and '_Cstm_' in k and k.split('@')[1] not in present and not skip(k)]
    if extra:
        added+=len(extra); tail=newattrs.rstrip(); sp=newattrs[len(tail):]
        newattrs=tail+''.join(f'  {a}="{v}"' for a,v in extra)+(sp or ' ')
    out.append(f'<{tag}{newattrs}>')
    stack.append((tag,node))
out.append(txt[pos:]); part=''.join(out)
desc=re.search(r'<ENTRYDESCR[^>]*>',open(K,encoding='latin-1').read()).group(0)
desc=re.sub(r'\s+',' ',desc).replace('<ENTRYDESCR ','<ENTRYDESCR ',1).replace(' >','>')
part=re.sub(r'<ENTRYDESCR [^>]*>',desc,part,count=1)
assert part.startswith('<SynthEngine>') and part.rstrip().endswith('</SynthEngine>'), part[-80:]
print('changed',changed,'added curve attrs',added)
lines=open(BASE,encoding='latin-1').read().split('\n')
assert lines[499].strip()=='<SynthSubEngine>' and lines[1339].strip()=='</SynthEngine>' and lines[1340].strip()=='</SynthSubEngine>'
new=lines[:500]+part.rstrip('\n').split('\n')+lines[1340:]
s='\n'.join(new)
s=s.replace('<ENTRYDESCR name="Stage Piano And Pad" library="User" ATTRIB_VALUE_DATA="Author=Carlos Zaragoza;size=27039948800;">',
 '<ENTRYDESCR name="ARLO Royal 3D + Pad" library="User" ATTRIB_VALUE_DATA="Author=Carlos Zaragoza;Description=Live: ARLO Royal 3D Grand (Keyscape LA Custom C7) + AV JX-8P Soundtrack pad, ambos en Live mode;size=27039948800;">',1)
s=s.replace('liveOnOff_v2="0"','liveOnOff_v2="3f800000"',1)
s=re.sub(r'(<Simple [^>]*?p1=")0(")',r'\g<1>3f800000\2',s,count=1)
open(OUT,'w',encoding='latin-1').write(s)
