import React from "react";
import {
  AbsoluteFill,
  Img,
  Loop,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {assetUrl} from "../../pipeline/paths";
import type {Crop, Project, Scene, StillPanZoom} from "../../pipeline/schema";
import {findAsset, usableVideoFrames} from "../../pipeline/timing";

export const BackgroundLayer: React.FC<{
  project: Project;
  scene: Scene;
}> = ({project, scene}) => {
  const asset = findAsset(project, scene.background.assetId);
  if (!asset) {
    return <AbsoluteFill style={{backgroundColor: project.brand.paper}} />;
  }

  const src = staticFile(assetUrl(project.id, asset.src));
  const crop = scene.background.crop;

  if (scene.background.type === "image") {
    return (
      <StillBackground
        src={src}
        crop={crop}
        panZoom={scene.background.stillPanZoom}
      />
    );
  }

  const usable = usableVideoFrames(project, scene);
  const startFrame = Math.round(scene.background.trimStartSeconds * project.fps);
  const usableFrames = usable?.frames ?? scene.durationInFrames;
  const mute = scene.background.mute;
  const ifShort = scene.background.ifShort;

  return (
    <VideoBackground
      src={src}
      crop={crop}
      startFrame={startFrame}
      usableFrames={usableFrames}
      sceneFrames={scene.durationInFrames}
      ifShort={ifShort}
      mute={mute}
    />
  );
};

const mediaStyle = (crop: Crop, extraZoom: number): React.CSSProperties => {
  return {
    position: "absolute",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: `${crop.x * 100}% ${crop.y * 100}%`,
    scale: crop.zoom * extraZoom,
  };
};

const StillBackground: React.FC<{
  src: string;
  crop: Crop;
  panZoom: StillPanZoom | null;
}> = ({src, crop, panZoom}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const extraZoom = panZoom
    ? interpolate(frame, [0, durationInFrames - 1], [panZoom.fromZoom, panZoom.toZoom], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;
  const x = panZoom
    ? interpolate(frame, [0, durationInFrames - 1], [panZoom.fromX, panZoom.toX], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : crop.x;
  const y = panZoom
    ? interpolate(frame, [0, durationInFrames - 1], [panZoom.fromY, panZoom.toY], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : crop.y;

  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      <Img
        src={src}
        name="Still background"
        style={mediaStyle({x, y, zoom: crop.zoom}, extraZoom)}
      />
    </AbsoluteFill>
  );
};

const VideoBackground: React.FC<{
  src: string;
  crop: {x: number; y: number; zoom: number};
  startFrame: number;
  usableFrames: number;
  sceneFrames: number;
  ifShort: "loop" | "freeze" | null;
  mute: boolean;
}> = ({src, crop, startFrame, usableFrames, sceneFrames, ifShort, mute}) => {
  const style = mediaStyle(crop, 1);
  const video = (
    <OffthreadVideo
      src={src}
      name="Video background"
      muted={mute}
      trimBefore={startFrame}
      durationInFrames={usableFrames}
      style={style}
    />
  );

  if (usableFrames >= sceneFrames) {
    return <AbsoluteFill style={{overflow: "hidden"}}>{video}</AbsoluteFill>;
  }

  if (ifShort === "loop") {
    return (
      <AbsoluteFill style={{overflow: "hidden"}}>
        <Loop durationInFrames={usableFrames}>{video}</Loop>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      <Sequence durationInFrames={usableFrames}>{video}</Sequence>
      <Sequence from={usableFrames} durationInFrames={sceneFrames - usableFrames}>
        <OffthreadVideo
          src={src}
          name="Video freeze frame"
          muted={mute}
          trimBefore={startFrame + usableFrames - 1}
          durationInFrames={1}
          style={style}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
