import React from "react";
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {endCardBackgroundSrc, END_FRAMES} from "./template";
import {WaveEndCard} from "./WaveEndCard";

export const EndScene: React.FC = () => {
  const local = useCurrentFrame();
  const ken = interpolate(local, [0, END_FRAMES], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(ken, [0, 1], [1.04, 1.11]);
  const translateX = interpolate(ken, [0, 1], [0, -28]);
  const translateY = interpolate(ken, [0, 1], [0, -22]);

  return (
    <AbsoluteFill style={{backgroundColor: "#F8F9FC", overflow: "hidden"}}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
        }}
      >
        <Img
          src={staticFile(endCardBackgroundSrc)}
          name="End card background"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
          }}
        />
      </div>
      <WaveEndCard />
    </AbsoluteFill>
  );
};
