import React from "react";
import {Audio, Sequence, staticFile} from "remotion";

export type AudioCue = {
  id: string;
  atFrame: number;
  src: string;
  volume: number;
  durationInFrames: number;
};

export const AudioCues: React.FC<{cues: readonly AudioCue[]}> = ({cues}) => {
  return (
    <>
      {cues.map((cue) => (
        <Sequence
          key={cue.id}
          name={cue.id}
          from={cue.atFrame}
          durationInFrames={cue.durationInFrames}
        >
          <Audio src={staticFile(cue.src)} volume={cue.volume} />
        </Sequence>
      ))}
    </>
  );
};
