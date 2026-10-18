import React from "react";
import {Img, OffthreadVideo, staticFile} from "remotion";
import {chatBackground} from "./template";

/**
 * FAL take when imported; still plate until then.
 * Never Ken Burns the still as a substitute for generation.
 */
export const FalPlate: React.FC = () => {
  if (chatBackground.videoSrc) {
    return (
      <OffthreadVideo
        src={staticFile(chatBackground.videoSrc)}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    );
  }

  return (
    <Img
      src={staticFile(chatBackground.imageSrc)}
      name="Laptop environment"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  );
};
