import re,sys
sys.path.insert(0,__import__('os').path.dirname(__file__))
from xdiff_lib import parse
base,donor,dst=sys.argv[1:4]
d=parse(donor)
skip=lambda k: ('ENTRYDESCR' in k or '/Custom' in k or '_Cstm' in k or k.endswith('@Vers') or k.endswith('@VCname') or 'SLICESEQ' in k)
types={k.rsplit('@',1)[0]:v for k,v in d.items() if k.endswith('@Type')}
txt=open(base,encoding='latin-1').read()
stack=[];counts={};out=[];pos=0;changed=0;skipped_fx=set()
btypes={}
for m in re.finditer(r'<(/?)([A-Za-z0-9_]+)([^>]*)>',txt):
    close,tag,attrs=m.groups(); out.append(txt[pos:m.start()]); pos=m.end()
    if close:
        if stack and stack[-1][0]==tag: stack.pop()
        out.append(m.group(0)); continue
    parent='/'.join(s[1] for s in stack); key=parent+'/'+tag
    counts[key]=counts.get(key,0)+1; node=f"{tag}[{counts[key]-1}]"
    p=(parent+'/'+node) if parent else node
    if tag=='EFFMODULE':
        bt=re.search(r'Type="([^"]*)"',attrs).group(1)
        if types.get(p)!=bt: skipped_fx.add(p)
    blocked=any(p==x or p.startswith(x+'/') for x in skipped_fx)
    def rep(mm):
        global changed
        k=p+'@'+mm.group(1)
        if not blocked and k in d and not skip(k) and d[k]!=mm.group(2):
            changed+=1; return f'{mm.group(1)}="{d[k]}"'
        return mm.group(0)
    out.append(f'<{tag}{re.sub(r"([A-Za-z0-9_]+)=\"([^\"]*)\"",rep,attrs)}>'); stack.append((tag,node))
out.append(txt[pos:]); open(dst,'w',encoding='latin-1').write(''.join(out))
print('changed',changed,'fx slots not copied (type differs):',sorted(x.split('SYNTHENG[0]/')[1] for x in skipped_fx if 'VOICE' not in x))
