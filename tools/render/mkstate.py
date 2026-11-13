import sys,re
base=open(__import__('os').path.join(__import__('os').path.dirname(__file__),'../../private/factory-extracted/keyscape-au-default-state.xml'),encoding='latin-1').read()
pat=open(sys.argv[1],encoding='latin-1').read()
a=pat.index('<SynthEngine'); b=pat.index('</SynthEngine>')+len('</SynthEngine>')
se=pat[a:b]
i=base.index('<SynthEngine'); j=base.index('</SynthEngine>',i)+len('</SynthEngine>')
out=base[:i]+se+base[j:]
open(sys.argv[2],'w',encoding='latin-1').write(out); print(len(base),len(out))
