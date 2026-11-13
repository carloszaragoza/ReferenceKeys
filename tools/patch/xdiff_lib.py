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
