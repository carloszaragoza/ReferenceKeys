import sys,statistics as st
rows=[l.split() for l in open('vel.log') if l.startswith('NOTE')]
ev=[];last=None
for r in rows:
    n,v,t=int(r[1]),int(r[3]),float(r[5])
    if last and last[0]==n and last[1]==v and t-last[2]<0.01: continue
    ev.append((n,v,t)); last=(n,v,t)
start=float(sys.argv[1]) if len(sys.argv)>1 else 0
ev=[e for e in ev if e[2]>start]
print('events',len(ev)); print([e[1] for e in ev]); print('notes',[e[0] for e in ev])
if ev: 
    v=[e[1] for e in ev]; print('min',min(v),'median',st.median(v),'mean',round(st.mean(v),1),'max',max(v)); print('last_t',ev[-1][2])
