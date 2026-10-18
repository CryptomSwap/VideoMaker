import React from "react";
import {AbsoluteFill, Img, staticFile} from "remotion";
import {AudioCues} from "../../motion/AudioCues";
import {IMessageScreen} from "./IMessageScreen";
import {
  PHONE_WIDTH_PX,
  SCREEN_INSET,
  imessageHookTemplate,
  iphonePlateSrc,
} from "./template";

export const IMessageHook: React.FC = () => {
  const phoneHeight = PHONE_WIDTH_PX * (4 / 3);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#1a1c20",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AudioCues cues={imessageHookTemplate.audioCues} />
      <div
        style={{
          position: "relative",
          width: PHONE_WIDTH_PX,
          height: phoneHeight,
        }}
      >
        <Img
          src={staticFile(iphonePlateSrc)}
          style={{
            width: PHONE_WIDTH_PX,
            height: phoneHeight,
            objectFit: "contain",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: `${SCREEN_INSET.top * 100}%`,
            left: `${SCREEN_INSET.left * 100}%`,
            right: `${SCREEN_INSET.right * 100}%`,
            bottom: `${SCREEN_INSET.bottom * 100}%`,
            borderRadius: 28,
            overflow: "hidden",
          }}
        >
          <IMessageScreen />
        </div>
      </div>
    </AbsoluteFill>
  );
};
