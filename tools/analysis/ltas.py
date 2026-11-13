import sys,numpy as np
from scipy.io import wavfile
from scipy.signal import welch, csd
sr,x=wavfile.read(sys.argv[1]); x=x.astype(np.float64)
keep=np.ones(len(x),bool); keep[int(65*sr):int(72*sr)]=False; keep[int(118*sr):]=False
x=x[keep]; L,R=x[:,0],x[:,1]; M=(L+R)/2
f,P=welch(M,sr,nperseg=16384)
_,PL=welch(L,sr,nperseg=16384); _,PR=welch(R,sr,nperseg=16384); _,C=csd(L,R,sr,nperseg=16384)
coh=np.real(C)/np.sqrt(PL*PR)
cent=[31.5,63,125,250,500,1000,2000,4000,8000,16000]
ref=None; print('octave   level(dB rel 250Hz)   L/R correlation')
vals=[]
for c in cent:
    s=(f>=c/np.sqrt(2))&(f<c*np.sqrt(2)); v=10*np.log10(P[s].sum()); vals.append(v)
r=vals[3]
for c,v in zip(cent,vals):
    s=(f>=c/np.sqrt(2))&(f<c*np.sqrt(2))
    print(f"{c:7.0f}  {v-r:7.1f}            {np.average(coh[s],weights=P[s]):5.2f}")
# tilt 250-8k
i=[3,4,5,6,7]; k=np.polyfit(np.log2(np.array(cent)[i]),np.array(vals)[i],1)[0]; print('tilt 250Hz-8kHz: %.1f dB/octave'%k)
# where is the high-frequency cutoff
cum=np.cumsum(P)/P.sum(); print('95%% energia bajo %.0f Hz, 99%% bajo %.0f Hz, 99.9%% bajo %.0f Hz'%(f[np.searchsorted(cum,.95)],f[np.searchsorted(cum,.99)],f[np.searchsorted(cum,.999)]))
hf=10*np.log10(P+1e-30); 
for fr in (10000,12000,14000,15000,16000,17000,18000,19000,20000): print(fr,'Hz',round(hf[np.argmin(abs(f-fr))]-10*np.log10(P[(f>200)&(f<300)].mean()),1),'dB vs 250Hz')
# loudness range over 1s windows
w=sr; rms=np.array([np.sqrt(np.mean(M[i:i+w]**2)) for i in range(0,len(M)-w,w)]); db=20*np.log10(rms+1e-12)
print('dynamic range (1s, p10..p95): %.1f dB'%(np.percentile(db,95)-np.percentile(db,10)))
# crest factor per 50ms (attack punch)
w2=int(.05*sr); cf=[20*np.log10(np.max(abs(M[i:i+w2]))/(np.sqrt(np.mean(M[i:i+w2]**2))+1e-12)) for i in range(0,len(M)-w2,w2) if np.sqrt(np.mean(M[i:i+w2]**2))>1e-3]
print('crest factor mediano 50ms: %.1f dB'%np.median(cf))
