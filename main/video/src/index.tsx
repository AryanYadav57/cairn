import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {CairnLaunch} from './CairnLaunch';
export const RemotionRoot: React.FC = () => <Composition id="CairnLaunch" component={CairnLaunch} durationInFrames={1800} fps={30} width={1920} height={1080} />;
registerRoot(RemotionRoot);
