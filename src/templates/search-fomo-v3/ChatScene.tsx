import React from "react";
import {AbsoluteFill} from "remotion";
import {ChatGPTPanel} from "./ChatGPTPanel";
import {FalPlate} from "./FalPlate";
import {FomoWarning} from "./FomoWarning";

export const ChatScene: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: "#081028", overflow: "hidden"}}>
      <FalPlate />
      <ChatGPTPanel />
      <FomoWarning />
    </AbsoluteFill>
  );
};
