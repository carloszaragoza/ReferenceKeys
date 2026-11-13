import sys,numpy as np
from scipy.io import wavfile
from scipy.signal import welch,csd
def load(p,excl=()):
    sr,x=wavfile.read(p); x=x.astype(np.float64)
    keep=np.ones(len(x),bool)
    for a,b in excl: keep[int(a*sr):int(b*sr)]=False
    return sr,x[keep]
def feats(sr,x):
    L,R=x[:,0],x[:,1]; M=(L+R)/2
    f,P=welch(M,sr,nperseg=16384); _,PL=welch(L,sr,nperseg=16384); _,PR=welch(R,sr,nperseg=16384); _,C=csd(L,R,sr,nperseg=16384)
    coh=np.real(C)/np.sqrt(PL*PR)
    # third-octave-ish: octave bands
    cent=[31.5,63,125,250,500,1000,2000,4000,8000,16000]
    lv=[];co=[]
    for c in cent:
        s=(f>=c/np.sqrt(2))&(f<c*np.sqrt(2)); lv.append(10*np.log10(P[s].sum())); co.append(np.average(coh[s],weights=P[s]))
    lv=np.array(lv); tot=10*np.log10(P[(f>30)&(f<16000)].sum()); lv=lv-tot
    i=[3,4,5,6,7]; tilt=np.polyfit(np.log2(np.array(cent)[i]),lv[i],1)[0]
    w=sr; rms=np.array([np.sqrt(np.mean(M[j:j+w]**2)) for j in range(0,len(M)-w,w)]); db=20*np.log10(rms+1e-12)
    dr=np.percentile(db,95)-np.percentile(db,10)
    # pitch-register: spectral centroid of note fundamentals approx via median centroid
    cen=(P*f).sum()/P.sum()
    sm=np.sqrt(np.mean(((L-R)/2)**2))/np.sqrt(np.mean(M**2))
    return cent,lv,np.array(co),tilt,dr,cen,sm
A=feats(*load(sys.argv[1],[(73,200)])); B=feats(*load(sys.argv[2],[(37,200)]))
print('octave   REF    Keyscape  difference(KS-REF)   corrL/R REF  KS')
for c,a,b,ca,cb in zip(A[0],A[1],B[1],A[2],B[2]): print(f"{c:7.0f} {a:6.1f} {b:8.1f} {b-a:+10.1f}            {ca:5.2f} {cb:5.2f}")
print(f"tilt 250-8k: REF {A[3]:.1f}  KS {B[3]:.1f} dB/oct")
print(f"dynamic range:  REF {A[4]:.1f}  KS {B[4]:.1f} dB")
print(f"centroid:       REF {A[5]:.0f}  KS {B[5]:.0f} Hz")
print(f"side/mid:        REF {A[6]:.2f}  KS {B[6]:.2f}")
