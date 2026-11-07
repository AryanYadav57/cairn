from pathlib import Path
import wave
import numpy as np

FS=48000
OUT=Path('video/public/audio')
OUT.mkdir(parents=True,exist_ok=True)
rng=np.random.default_rng(4206)

def save(name,left,right):
    stereo=np.stack([left,right],axis=1)
    peak=np.max(np.abs(stereo))
    if peak>0.92: stereo*=0.92/peak
    pcm=(np.clip(stereo,-1,1)*32767).astype('<i2')
    with wave.open(str(OUT/name),'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(FS); w.writeframes(pcm.tobytes())

def soft_tap():
    n=int(FS*.18); t=np.arange(n)/FS
    noise=rng.normal(0,1,n)
    high=noise-np.concatenate([[noise[0]],noise[:-1]])*.82
    low=np.sin(2*np.pi*(215-85*t/.18)*t)*np.exp(-t*34)
    tick=np.sin(2*np.pi*1750*t)*np.exp(-t*75)
    body=np.sin(2*np.pi*520*t)*np.exp(-t*56)
    y=(low*.32+tick*.20+body*.13+high*np.exp(-t*105)*.026)
    env=np.minimum(1,t/.002)
    y*=env
    save('soft-tap.wav',y*.94,y)

def soft_thud():
    n=int(FS*.34); t=np.arange(n)/FS
    freq=78*np.exp(-t*2.2)+38
    phase=2*np.pi*np.cumsum(freq)/FS
    y=np.sin(phase)*np.exp(-t*16)*.46
    y+=np.sin(2*np.pi*142*t)*np.exp(-t*26)*.10
    y*=np.minimum(1,t/.003)
    save('soft-thud.wav',y,y*.91)

def confirm():
    n=int(FS*.52); t=np.arange(n)/FS
    env=(1-np.exp(-t*48))*np.exp(-t*6.5)
    a=np.sin(2*np.pi*880*t)+.58*np.sin(2*np.pi*1320*t+.15)+.24*np.sin(2*np.pi*1760*t+.3)
    b=np.sin(2*np.pi*988*t)+.48*np.sin(2*np.pi*1480*t+.1)+.22*np.sin(2*np.pi*1976*t+.25)
    save('ui-confirm.wav',a*env*.17,b*env*.17)

def swish():
    n=int(FS*.52); t=np.arange(n)/FS
    noise=rng.normal(0,1,n)
    # A smoothed noise bed with a soft descending tonal edge.
    smoothed=np.convolve(noise,np.ones(19)/19,mode='same')
    sweep=np.sin(2*np.pi*(460-260*t/.52)*t)*.16
    env=np.sin(np.pi*t/.52)**1.6
    y=(smoothed*.55+sweep)*env*.46
    save('soft-swish.wav',y*np.linspace(.78,1,n),y*np.linspace(1,.78,n))

soft_tap(); soft_thud(); confirm(); swish()
print('Generated four short stereo interface effects.')
