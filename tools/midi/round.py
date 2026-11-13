import sys,statistics as st
k=sys.argv[1]
rows=[l.split() for l in open('vel.log') if l.startswith('NOTE')]
ev=[];last=None
for r in rows:
    n,v,t=int(r[1]),int(r[3]),float(r[5])
    if last and last[:2]==(n,v) and t-last[2]<0.01: continue
    ev.append((n,v,t)); last=(n,v,t)
m=float(open('mark.txt').read()); r=[e for e in ev if e[2]>m]
if not r: print('no notes'); sys.exit()
prev=r[0][2]; line=[]
for n,v,t in r:
    if t-prev>2: line.append('|')
    line.append(str(v)); prev=t
print(' '.join(line))
v=[e[1] for e in r]; nz=[x for x in v if x>1]; q=st.quantiles(nz,n=4)
print(len(v),'notes; v=1:',v.count(1),'| without 1s: min',min(nz),'p25',q[0],'median',st.median(nz),'p75',q[2],'max',max(nz))
open(f'round{k}.txt','w').write(' '.join(map(str,v))); open('mark.txt','w').write(str(r[-1][2]))
