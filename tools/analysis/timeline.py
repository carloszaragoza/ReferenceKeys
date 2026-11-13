import sys,numpy as np
from scipy.io import wavfile
sr,x=wavfile.read(sys.argv[1]); x=x.astype(np.float64)
m=x.mean(1); side=(x[:,0]-x[:,1])/2
win=sr  # 1 s
print(' t  dBFS  centroid  low<250 mid250-2k hi2k-8k air>8k  S/M  flat  harm')
for i in range(len(m)//win):
    s=m[i*win:(i+1)*win]; rms=np.sqrt(np.mean(s**2))+1e-12
    S=np.abs(np.fft.rfft(s*np.hanning(len(s))))**2; f=np.fft.rfftfreq(len(s),1/sr)
    tot=S[(f>30)].sum()+1e-20
    band=lambda a,b: 10*np.log10(S[(f>=a)&(f<b)].sum()/tot+1e-12)
    cen=(S*f).sum()/S.sum()
    flat=np.exp(np.mean(np.log(S[(f>50)&(f<8000)]+1e-20)))/np.mean(S[(f>50)&(f<8000)])
    # harmonicity: peakiness of spectrum = top 1% bins energy share 50-5k
    sel=S[(f>50)&(f<5000)]; harm=np.sort(sel)[-len(sel)//100:].sum()/sel.sum()
    sm=np.sqrt(np.mean(side[i*win:(i+1)*win]**2))/rms
    print(f"{i:3d} {20*np.log10(rms):6.1f} {cen:7.0f} {band(30,250):7.1f} {band(250,2000):7.1f} {band(2000,8000):7.1f} {band(8000,20000):6.1f} {sm:5.2f} {flat:5.3f} {harm:4.2f}")
