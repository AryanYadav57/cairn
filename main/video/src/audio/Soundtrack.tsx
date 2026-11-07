import React from 'react';
import {Audio, Sequence, staticFile, interpolate, useCurrentFrame} from 'remotion';
import {cues} from './cues';
export const Soundtrack:React.FC=()=> {const f=useCurrentFrame();const fade=interpolate(f,[1776,1799],[1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});return <>
 <Audio src={staticFile('audio/music.wav')} volume={fade*.38}/>
 {cues.map((cue,i)=><Sequence key={i} from={cue.frame}><Audio src={staticFile(`audio/${cue.file}`)} volume={cue.volume}/></Sequence>)}
</>};
