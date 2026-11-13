import sys,struct
d=open(sys.argv[1],'rb').read()
fmt,ntr,div=struct.unpack('>HHH',d[8:14]); p=14; ev=[]; tempos=[(0,500000)]
def vlq(p):
    v=0
    while True:
        b=d[p]; p+=1; v=(v<<7)|(b&0x7f)
        if b<0x80: return v,p
for t in range(ntr):
    ln=struct.unpack('>I',d[p+4:p+8])[0]; q=p+8; end=q+ln; tick=0; rs=None
    while q<end:
        dt,q=vlq(q); tick+=dt; st=d[q]
        if st==0xff:
            typ=d[q+1]; l,q2=vlq(q+2)
            if typ==0x51: tempos.append((tick,int.from_bytes(d[q2:q2+3],'big')))
            q=q2+l; continue
        if st in (0xf0,0xf7): l,q2=vlq(q+1); q=q2+l; continue
        if st&0x80: rs=st; q+=1
        hi=rs&0xf0; n=1 if hi in (0xc0,0xd0) else 2
        ev.append((tick,[rs&0xf0]+list(d[q:q+n]))); q+=n
    p=end
tempos.sort()
def sec(tk):
    s=0; lt,lp=0,tempos[0][1]
    for t,tp in tempos[1:]:
        if t>=tk: break
        s+=(t-lt)/div*lp/1e6; lt,lp=t,tp
    return s+(tk-lt)/div*lp/1e6
for tk,b in sorted(ev,key=lambda e:e[0]): print(f"{sec(tk):.6f} "+' '.join(map(str,b)))
