import sys; sys.argv=sys.argv[:1]+['a','b']+sys.argv[1:]
src=open(__import__('os').path.join(__import__('os').path.dirname(__file__),'compare.py')).read().split('A=feats')[0]; exec(src)
import numpy as np
from scipy.signal import welch
ref=feats(*load('private/reference-audio/Roland German Concert demo.wav',[(0,1),(128,200)]))
names=sys.argv[3:]; F=[feats(*load(n,[(62,200)])) for n in names]
print('oct     ROLAND  '+'  '.join(f"{n.split('/')[-1][:10]:>14}" for n in names))
for i,c in enumerate(ref[0]): print(f"{c:6.0f} {ref[1][i]:7.1f}  "+'  '.join(f"{F[k][1][i]:6.1f} ({F[k][1][i]-ref[1][i]:+5.1f})" for k in range(len(F))))
for n,j in [('tilt',3),('DR',4),('centroid',5),('side/mid',6)]: print(f"{n:9}", round(float(ref[j]),2), [round(float(f[j]),2) for f in F])
def fine(p,ex):
    sr,x=wavfile.read(p); m=x[ex[0]*sr:ex[1]*sr].astype(float).mean(1); f,P=welch(m,sr,nperseg=8192); tot=P[(f>30)&(f<16000)].sum()
    return ' '.join(f"{int(a/1000)}k:{10*np.log10(P[(f>=a)&(f<a+2000)].sum()/tot):.1f}" for a in range(2000,16000,2000))
print('ROLAND ',fine('private/reference-audio/Roland German Concert demo.wav',(1,128)))
for n in names: print(n.split('/')[-1][:10],fine(n,(0,62)))
