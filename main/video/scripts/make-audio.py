import os, math
import numpy as np
from scipy.io.wavfile import write
SR=48000; D=60; t=np.arange(SR*D)/SR
out='video/public/audio'; os.makedirs(out,exist_ok=True)
def env(n,attack=.01,release=.1):
 x=np.ones(n); a=min(n,int(attack*SR)); r=min(n,int(release*SR));
 if a: x[:a]=np.linspace(0,1,a)
 if r: x[-r:]*=np.linspace(1,0,r)
 return x
def save(name,x):
 x=np.asarray(x); x=np.clip(x*.7,-.98,.98); stereo=np.stack([x,x],axis=1); write(f'{out}/{name}.wav',SR,(stereo*32767).astype(np.int16))
# Cinematic D-minor bed, beat-locked pulses and a filtered pluck motif
music=np.zeros_like(t)
for bar in range(120):
 start=bar*2
 if start>=D: break
 beat=int(start*SR); dur=min(int(2*SR),len(t)-beat); ix=np.arange(dur)/SR; active=t[beat:beat+dur]
 # harmonic bed from D minor chord tones
 prog=[[36,43,50,53],[32,39,46,51],[29,36,41,48],[34,41,46,53]][(bar//4)%4]
 pad=np.zeros(dur)
 for n in prog: pad+=np.sin(2*np.pi*(440*2**((n-69)/12))*ix)
 music[beat:beat+dur]+=pad*.025*np.minimum(ix/.4,1)*np.minimum((2-ix)/.5,1)
 if start>=12:
  for off in [0,.5,1,1.5]:
   q=beat+int(off*SR); ln=min(int(.28*SR),len(t)-q); z=np.arange(ln)/SR; note=[62,65,69,74][(bar*4+int(off*2))%4]; hz=440*2**((note-69)/12); music[q:q+ln]+=.07*np.sin(2*np.pi*hz*z)*np.exp(-z*10)
  for off in [0,1]:
   q=beat+int(off*SR); ln=min(int(.35*SR),len(t)-q); z=np.arange(ln)/SR; music[q:q+ln]+=.17*np.sin(2*np.pi*(55-28*z)*z)*np.exp(-z*10)
# smoother tail fade
music*=np.minimum(t/1.2,1)*np.minimum((D-t)/.8,1)
save('music',music)
def tone(name,freq=440,dur=.2,kind='sine',sweep=None):
 n=int(SR*dur); x=np.arange(n)/SR; phase=2*np.pi*(freq*x if sweep is None else freq*x+(sweep-freq)*x*x/(2*dur)); y=np.sin(phase)
 if kind=='noise': y=np.random.default_rng(3).normal(0,1,n)
 y*=env(n,min(.02,dur/5),min(.2,dur/2)); save(name,y*.25)
for name,f,d,k,sw in [('thud',70,.5,'sine',35),('impact',48,.6,'sine',24),('riser',300,2,'noise',None),('reverse_swell',180,1.2,'noise',None),('whoosh_l',500,.35,'noise',None),('whoosh_r',650,.35,'noise',None),('tick',1800,.035,'sine',None),('pop',900,.12,'sine',None),('ui_click',1200,.045,'sine',None),('ping',950,.2,'sine',None),('chime',740,.8,'sine',1480),('scan',2100,.6,'noise',None),('rewind',1100,1,'noise',None),('buzz',85,.35,'sine',55),('blip',1400,.12,'sine',None),('lock',100,.3,'sine',60)]: tone(name,f,d,k,sw)
