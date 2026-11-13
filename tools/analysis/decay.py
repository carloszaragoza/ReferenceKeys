import sys,numpy as np
from scipy.io import wavfile
from scipy.signal import butter,sosfilt
sr,x=wavfile.read(sys.argv[1]); M=x.astype(np.float64).mean(1)
w=int(.02*sr); env=np.array([np.sqrt(np.mean(M[i:i+w]**2)) for i in range(0,len(M)-w,w)]); db=20*np.log10(env+1e-9)
t=np.arange(len(db))*.02
# find steepest sustained drops: windows where over 0.6s level falls >15dB
cands=[]
for i in range(len(db)-30):
    if db[i]-db[i+30]>15 and db[i]>-40: cands.append(i)
# group
groups=[];
for i in cands:
    if not groups or i-groups[-1][-1]>10: groups.append([i])
    else: groups[-1].append(i)
for g in groups:
    i0=g[0]; pk=i0+np.argmax(db[i0:i0+15]); seg=db[pk:pk+100]; tt=t[pk:pk+100]
    # fit from -5 dB below peak to -25 dB below (T20 style)
    a=np.where(seg<seg[0]-5)[0]; b=np.where(seg<seg[0]-25)[0]
    if len(a) and len(b) and b[0]>a[0]+3:
        k=np.polyfit(tt[a[0]:b[0]],seg[a[0]:b[0]],1)[0]
        print(f"t={t[pk]:6.2f}s peak {seg[0]:6.1f} dB  decay {k:6.1f} dB/s  -> RT60 approx {60/-k:4.2f} s")
    else:
        print(f"t={t[pk]:6.2f}s peak {seg[0]:6.1f} dB  (does not fall 25 dB within 2 s)  min {seg.min():.1f}")
