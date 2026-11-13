import sys,re,struct
sys.path.insert(0,__import__('os').path.dirname(__file__))
from xdiff_lib import parse
def f(v):
    try: return round(struct.unpack('>f',bytes.fromhex(v.zfill(8)))[0],3)
    except: return v
def knobs(path):
    t=open(path,encoding='latin-1').read()
    labels={int(m.group(1)):m.group(2) for m in re.finditer(r'<Custom(\d+)\s+Label="([^"]*)"',t)}
    a=parse(path); res={}
    for k,v in a.items():
        m=re.match(r'(.*)@(\w+?)_Cstm(?:_0_)?$',k)
        if m and v.isdigit():
            p=m.group(1)+'@'+m.group(2); res.setdefault(labels.get(int(v),'#'+v),[]).append((p,a.get(p)))
    return res
if __name__=='__main__':
    files=sys.argv[1:]; ks=[knobs(x) for x in files]
    for lab in sorted(set().union(*ks)):
        for i,k in enumerate(ks[:1]):
            for p,v in k.get(lab,[]):
                vals=[]
                for kk in ks:
                    d=dict(kk.get(lab,[])); vals.append(f(d.get(p,'')) if d.get(p) else '-')
                print(f"{lab:16} {p.replace('KeyscapePart[0]/SynthEngine[0]/SYNTHENG[0]/','')[:60]:60} {vals}")
