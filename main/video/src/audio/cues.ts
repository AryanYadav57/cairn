export type Cue={frame:number;file:string;volume:number;pan:number};
export const cues:Cue[]=[
 ...[30,45,60,75,90,105].map((frame,i)=>({frame,file:'tick.wav',volume:.12,pan:0})),
 {frame:90,file:'riser.wav',volume:.22,pan:0},{frame:90,file:'impact.wav',volume:.42,pan:0},{frame:120,file:'whoosh_r.wav',volume:.3,pan:1},
 ...[120,180,240,300].map((frame,i)=>({frame,file:'impact.wav',volume:.3,pan:i%2?1:-1})),
 {frame:360,file:'thud.wav',volume:.5,pan:-.4},{frame:385,file:'thud.wav',volume:.5,pan:.4},{frame:410,file:'thud.wav',volume:.55,pan:0},{frame:425,file:'chime.wav',volume:.25,pan:0},
 {frame:550,file:'scan.wav',volume:.17,pan:-.5},{frame:700,file:'chime.wav',volume:.3,pan:.4},
 ...[840,900,960,1020].map((frame,i)=>({frame,file:'ui_click.wav',volume:.18,pan:i%2?1:-1})),{frame:1010,file:'ping.wav',volume:.23,pan:0},
 {frame:1080,file:'impact.wav',volume:.25,pan:0},{frame:1130,file:'ui_click.wav',volume:.25,pan:0},{frame:1200,file:'rewind.wav',volume:.3,pan:0},{frame:1260,file:'lock.wav',volume:.42,pan:0},{frame:1280,file:'chime.wav',volume:.25,pan:0},
 {frame:1410,file:'buzz.wav',volume:.2,pan:1},{frame:1440,file:'ping.wav',volume:.3,pan:1},{frame:1480,file:'blip.wav',volume:.2,pan:1},{frame:1510,file:'ui_click.wav',volume:.2,pan:1},{frame:1560,file:'whoosh_l.wav',volume:.18,pan:-1},
 ...[1620,1626,1632,1638,1644,1650].map((frame,i)=>({frame,file:'whoosh_r.wav',volume:.14,pan:i%2?1:-1})),{frame:1740,file:'thud.wav',volume:.4,pan:0},{frame:1755,file:'chime.wav',volume:.25,pan:0}
];
