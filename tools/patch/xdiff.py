import re,sys,struct
def parse(path):
    txt=open(path,encoding='latin-1').read()
    out={};stack=[];counts={}
    for m in re.finditer(r'<(/?)([A-Za-z0-9_]+)([^>]*)>',txt):
        close,tag,attrs=m.groups()
        if close: 
            if stack and stack[-1][0]==tag: stack.pop()
            continue
        parent='/'.join(s[1] for s in stack)
        key=parent+'/'+tag; counts[key]=counts.get(key,0)+1
        node=f"{tag}[{counts[key]-1}]"
        p=(parent+'/'+node) if parent else node
        for a,v in re.findall(r'([A-Za-z0-9_]+)="([^"]*)"',attrs): out[p+'@'+a]=v
        stack.append((tag,node))
    return out
def f(v):
    try: return round(struct.unpack('>f',bytes.fromhex(v.zfill(8)))[0],4) if re.fullmatch(r'[0-9a-f]{1,8}',v) else v
    except: return v
a=parse(sys.argv[1]);b=parse(sys.argv[2])
strip=lambda k: re.sub(r'^(KeyscapePart\[0\]/|AmberPart\[0\]/)','',k)
a={strip(k):v for k,v in a.items()}; b={strip(k):v for k,v in b.items()}
for k in sorted(set(a)|set(b)):
    if a.get(k)!=b.get(k) and 'SLICESEQ' not in k and 'ENTRYDESCR' not in k:
        print(k, a.get(k), '->', b.get(k), '|', f(a.get(k,'')), '->', f(b.get(k,'')))
