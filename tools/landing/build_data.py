"""Builds landing/data.js from real measurements, a spectrogram and waveform peaks."""
import json, base64, subprocess, numpy as np
from scipy.io import wavfile
from scipy.signal import welch, csd, stft
CENT=[31.5,63,125,250,500,1000,2000,4000,8000,16000]
def load(p, keep=None, excl=()):
    sr,x=wavfile.read(p); x=x.astype(np.float64)
    if x.ndim==1: x=np.stack([x,x],1)
    m=np.ones(len(x),bool)
    for a,b in excl: m[int(a*sr):int(b*sr)]=False
    return sr,x[m]
def feats(sr,x):
    L,R=x[:,0],x[:,1]; M=(L+R)/2
    f,P=welch(M,sr,nperseg=16384)
    lv=[]
    for c in CENT:
        s=(f>=c/np.sqrt(2))&(f<c*np.sqrt(2)); lv.append(10*np.log10(P[s].sum()))
    lv=np.array(lv); lv-=10*np.log10(P[(f>30)&(f<16000)].sum())
    i=[3,4,5,6,7]; tilt=np.polyfit(np.log2(np.array(CENT)[i]),lv[i],1)[0]
    cen=(P*f).sum()/P.sum()
    sm=np.sqrt(np.mean(((L-R)/2)**2))/np.sqrt(np.mean(M**2))
    bal=10*np.log10(np.mean(L**2)/np.mean(R**2))
    return dict(bands=[round(float(v),1) for v in lv],tilt=round(float(tilt),1),centroid=int(cen),width=round(float(sm),2))
P='private/'
SETS={
 'german':dict(ref=(P+'reference-audio/Roland German Concert demo.wav',[(0,1),(128,999)]),
               before=(P+'renders/German Concert v1.wav',[(62,999)]),after=(P+'renders/German Concert V2.wav',[(62,999)])),
 'royal':dict(ref=(P+'reference-audio/Nord Royal Grand 3D demo.wav',[(73,999)]),
              before=(P+'my-recordings/Royal 3D 1.wav',[(39,999)]),after=(P+'my-recordings/Royal 3D 3.wav',[(29,999)])),
 'cfx':dict(ref=(P+'reference-audio/Yamaha CFX demo.wav',[(65,72),(118,999)]),
            before=(P+'my-recordings/CFX compare 1.wav',[]),after=(P+'my-recordings/CFX compare 2.wav',[])),
}
D={'bands':CENT,'sets':{}}
for k,s in SETS.items():
    D['sets'][k]={n:feats(*load(p,excl=e)) for n,(p,e) in s.items()}
# waveforms from the published mp3s
def mp3(path):
    raw=subprocess.run(['ffmpeg','-v','error','-i',path,'-ac','1','-ar','8000','-f','s16le','-'],capture_output=True).stdout
    return np.frombuffer(raw,np.int16).astype(float)
D['wave']={}
for n in ['german-v1','german-v2','royal-v1','royal-v3','cfx-v1','cfx-v2']:
    y=mp3(f'landing/assets/audio/{n}.mp3'); N=180; seg=np.array_split(np.abs(y),N)
    pk=np.array([np.percentile(s,99) for s in seg]); pk=pk/pk.max()
    D['wave'][n]=[round(float(v),3) for v in np.sqrt(pk)]
# hero spectrogram: German V2 render, log-frequency, 8-bit
y=mp3('landing/assets/audio/german-v2.mp3'); sr=8000
f,t,Z=stft(y,sr,nperseg=1024,noverlap=1024-int(sr*64/420))
A=20*np.log10(np.abs(Z)+1e-6)
rows=64; edges=np.geomspace(40,3900,rows+1); img=np.zeros((rows,A.shape[1]))
for r in range(rows):
    s=(f>=edges[r])&(f<edges[r+1]); s = s if s.any() else (np.abs(f-edges[r])==np.abs(f-edges[r]).min())
    img[r]=A[s].max(0)
hi=np.percentile(img,99.5); img=np.clip((img-(hi-60))/60,0,1)
cols=min(img.shape[1],420); img=img[::-1,:cols]
D['spec']=dict(w=cols,h=rows,data=base64.b64encode((img*255).astype(np.uint8).tobytes()).decode())
D['mx88']=dict(pp=19,p=28,mf=48,f=87,max=111,vcx=0.49,vcy=0.88)
open('landing/data.js','w').write('window.RK_DATA='+json.dumps(D,separators=(',',':'))+';\n')
for k,v in D['sets'].items(): print(k,{n:(x['tilt'],x['centroid'],x['width']) for n,x in v.items()})
print('spec',cols,rows)
