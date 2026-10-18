import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {heeboFamily} from "../../motion/fonts";
import {
  INCOMING_ONE,
  INCOMING_ONE_AT,
  INCOMING_TWO,
  INCOMING_TWO_AT,
  OUTGOING_TEXT,
  SEND_AT,
  isTyping,
  outgoingTypedAt,
  showIncomingOne,
  showIncomingTwo,
  showOutgoingBubble,
} from "./template";

const ui = {
  bg: "#000000",
  ink: "#FFFFFF",
  incoming: "#262628",
  outgoing: "#0A84FF",
  composer: "#1C1C1E",
  composerBorder: "#3A3A3C",
  muted: "#8E8E93",
  link: "#0A84FF",
};

const bubblePop = (local: number, appearAt: number): number => {
  if (local < appearAt) {
    return 0;
  }
  return interpolate(local, [appearAt, appearAt + 8], [0.88, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

const Bubble: React.FC<{
  align: "left" | "right";
  children: React.ReactNode;
  scale: number;
}> = ({align, children, scale}) => {
  const bg = align === "left" ? ui.incoming : ui.outgoing;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: align === "left" ? "flex-start" : "flex-end",
        marginBottom: 8,
        transform: `scale(${scale})`,
        transformOrigin: align === "left" ? "left bottom" : "right bottom",
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          padding: "10px 14px",
          borderRadius: 18,
          backgroundColor: bg,
          fontFamily: heeboFamily,
          fontSize: 28,
          lineHeight: 1.28,
          color: ui.ink,
          letterSpacing: "-0.01em",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Cursor: React.FC<{on: boolean}> = ({on}) => {
  if (!on) {
    return null;
  }
  return (
    <span
      style={{
        display: "inline-block",
        width: 2,
        height: 26,
        marginLeft: 2,
        backgroundColor: ui.link,
        verticalAlign: "text-bottom",
      }}
    />
  );
};

export const IMessageScreen: React.FC = () => {
  const local = useCurrentFrame();
  const typing = isTyping(local);
  const draft = outgoingTypedAt(local);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: ui.bg,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          paddingTop: 14,
          paddingBottom: 10,
          borderBottom: `0.5px solid ${ui.composerBorder}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: heeboFamily,
            fontSize: 15,
            color: ui.muted,
            textAlign: "center",
            marginBottom: 4,
          }}
        >
          iMessage
        </div>
        <div
          style={{
            fontFamily: heeboFamily,
            fontSize: 22,
            fontWeight: 600,
            color: ui.ink,
            textAlign: "center",
          }}
        >
          Friend
        </div>
      </div>

      <div style={{flex: 1, padding: "14px 12px 8px", overflow: "hidden"}}>
        {showIncomingOne(local) ? (
          <Bubble align="left" scale={bubblePop(local, INCOMING_ONE_AT)}>
            {INCOMING_ONE}
          </Bubble>
        ) : null}
        {showOutgoingBubble(local) ? (
          <Bubble align="right" scale={bubblePop(local, SEND_AT)}>
            {OUTGOING_TEXT}
          </Bubble>
        ) : null}
        {showIncomingTwo(local) ? (
          <Bubble align="left" scale={bubblePop(local, INCOMING_TWO_AT)}>
            {INCOMING_TWO}
          </Bubble>
        ) : null}
      </div>

      <div style={{padding: "8px 10px 12px", flexShrink: 0}}>
        <div
          style={{
            minHeight: 40,
            borderRadius: 20,
            border: `1px solid ${typing ? ui.link : ui.composerBorder}`,
            backgroundColor: ui.composer,
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
            gap: 8,
          }}
        >
          <div
            style={{
              flex: 1,
              fontFamily: heeboFamily,
              fontSize: 22,
              color: draft ? ui.ink : ui.muted,
              minHeight: 28,
              display: "flex",
              alignItems: "center",
            }}
          >
            {typing ? (
              <>
                {draft}
                <Cursor on={Math.floor(local / 7) % 2 === 0} />
              </>
            ) : (
              "iMessage"
            )}
          </div>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 99,
              backgroundColor: draft && typing ? ui.outgoing : ui.composerBorder,
              flexShrink: 0,
            }}
          />
        </div>
      </div>
    </div>
  );
};
