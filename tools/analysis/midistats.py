import sys,struct,numpy as np
d=open(sys.argv[1],'rb').read()
fmt,ntr,div=struct.unpack('>HHH',d[8:14]); p=14; notes=[]; cc64=[]; tempo=500000; tempos=[]
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
        hi=rs&0xf0
        if hi in (0xc0,0xd0): a=d[q]; q+=1; continue
        a,b=d[q],d[q+1]; q+=2
        if hi==0x90 and b>0: notes.append((tick,a,b))
        if hi==0xb0 and a==64: cc64.append((tick,b))
    p=end
tp=tempos[0][1] if tempos else 500000
sec=lambda t: t/div*tp/1e6
v=np.array([n[2] for n in notes]); k=np.array([n[1] for n in notes])
print(f"notes {len(v)}  duration {sec(notes[-1][0]):.1f}s  tempo {60e6/tp:.0f}bpm")
print("velocity: min %d p10 %d p50 %d p90 %d max %d"%(v.min(),*np.percentile(v,[10,50,90]),v.max()))
names='C C# D D# E F F# G G# A A# B'.split(); nm=lambda n:f"{names[n%12]}{n//12-1}"
print("range",nm(k.min()),"-",nm(k.max()),"  median",nm(int(np.median(k))))
h,_=np.histogram(v,[0,20,30,48,64,80,96,128]); print("hist vel <20,20-29,30-47,48-63,64-79,80-95,96+:",h)
print("low<C3",(k<48).mean().round(2),"mid C3-C5",((k>=48)&(k<72)).mean().round(2),"high>=C5",(k>=72).mean().round(2))
print("pedal events",len(cc64))
