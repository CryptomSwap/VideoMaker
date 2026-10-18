import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {colors} from "../../tokens";
import {ChatGPTPanel} from "./ChatGPTPanel";
import {FomoWarning} from "./FomoWarning";
import {fomoBlueHandoffT} from "./fomoToBlueHandoff";
import {SearchHookStack} from "./SearchHookStack";
import {CHAT_TO_BLUE, FOMO_READY_FOR_BLUE} from "./template";

export const HookChatScene: React.FC<{
  lead: string;
  tail: string;
}> = ({lead, tail}) => {
  const local = useCurrentFrame();
  const handoff = fomoBlueHandoffT(local, FOMO_READY_FOR_BLUE, CHAT_TO_BLUE);
  const demoOpacity = interpolate(handoff, [0, 0.38], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{backgroundColor: colors.paper, overflow: "hidden"}}>
      <AbsoluteFill style={{opacity: demoOpacity}}>
        <SearchHookStack lead={lead} tail={tail} />
        <ChatGPTPanel />
      </AbsoluteFill>
      <FomoWarning />
    </AbsoluteFill>
  );
};
