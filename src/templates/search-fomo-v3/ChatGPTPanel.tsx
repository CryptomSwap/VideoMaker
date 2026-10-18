import React from "react";
import {Img, interpolate, staticFile, useCurrentFrame} from "remotion";
import {heeboFamily} from "../../motion/fonts";
import {colors} from "../../tokens";
import {
  ANSWER_FROM,
  chatgptLogoSrc,
  SUBMIT_AT,
  THINK_FROM,
  TYPE_FROM,
} from "./template";
import {typedPrefix, typingCompleteFrame, USER_QUESTION} from "./typeQuestion";
import {
  assistantTokens,
  generatingCursorVisible,
  visibleWordCount,
} from "./wordReveal";

const ui = {
  ink: "#0D0D0D",
  muted: "#8F8F8F",
  bubble: "#F4F4F4",
  line: "#E8E8E8",
  sendOff: "#D9D9E3",
};

const Header: React.FC = () => {
  return (
    <div
      style={{
        height: 88,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        borderBottom: `1px solid ${ui.line}`,
        flexShrink: 0,
      }}
    >
      <svg width={28} height={28} viewBox="0 0 28 28">
        <path d="M5 8h18M5 14h18M5 20h18" stroke={ui.ink} strokeWidth={1.8} />
      </svg>
      <div style={{display: "flex", alignItems: "center", gap: 10}}>
        <Img
          src={staticFile(chatgptLogoSrc)}
          name="ChatGPT mark"
          style={{
            width: 28,
            height: 28,
            objectFit: "contain",
            filter: "brightness(0)",
          }}
        />
        <div
          style={{
            fontFamily: heeboFamily,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "-0.04em",
            color: ui.ink,
          }}
        >
          ChatGPT
        </div>
        <svg width={16} height={16} viewBox="0 0 16 16">
          <path d="M3 6l5 5 5-5" fill="none" stroke={ui.ink} strokeWidth={1.6} />
        </svg>
      </div>
      <svg width={28} height={28} viewBox="0 0 28 28">
        <path
          d="M8 20V9l9 5.5L8 20Z"
          fill="none"
          stroke={ui.ink}
          strokeWidth={1.6}
        />
      </svg>
    </div>
  );
};

const Cursor: React.FC<{on: boolean; color?: string}> = ({
  on,
  color = ui.ink,
}) => {
  if (!on) {
    return null;
  }
  return (
    <span
      style={{
        display: "inline-block",
        width: 2,
        height: "0.9em",
        marginLeft: 2,
        backgroundColor: color,
        verticalAlign: "-0.1em",
      }}
    />
  );
};

const UserBubble: React.FC<{text: string}> = ({text}) => {
  return (
    <div style={{display: "flex", justifyContent: "flex-end", marginTop: 28}}>
      <div
        style={{
          maxWidth: "86%",
          backgroundColor: ui.bubble,
          borderRadius: 26,
          padding: "18px 22px",
          fontFamily: heeboFamily,
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: "-0.03em",
          lineHeight: 1.28,
          color: ui.ink,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Thinking: React.FC<{frame: number}> = ({frame}) => {
  return (
    <div style={{display: "flex", gap: 14, marginTop: 32, alignItems: "center"}}>
      <Img
        src={staticFile(chatgptLogoSrc)}
        name="Assistant"
        style={{
          width: 32,
          height: 32,
          objectFit: "contain",
          filter: "brightness(0)",
          flexShrink: 0,
        }}
      />
      <div style={{display: "flex", gap: 8, alignItems: "center", height: 32}}>
        {[0, 1, 2].map((dot) => {
          const phase = Math.floor(frame / 6) % 3;
          const on = phase === dot;
          return (
            <div
              key={dot}
              style={{
                width: 8,
                height: 8,
                borderRadius: 99,
                backgroundColor: ui.ink,
                opacity: on ? 0.9 : 0.25,
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

const AssistantAnswer: React.FC<{local: number}> = ({local}) => {
  const answerLocal = local - ANSWER_FROM;
  const count = visibleWordCount(answerLocal);
  const blink = Math.floor(local / 8) % 2 === 0;
  const cursor = generatingCursorVisible(answerLocal) && blink;

  return (
    <div style={{display: "flex", gap: 14, marginTop: 32, alignItems: "flex-start"}}>
      <Img
        src={staticFile(chatgptLogoSrc)}
        name="Assistant"
        style={{
          width: 32,
          height: 32,
          objectFit: "contain",
          filter: "brightness(0)",
          flexShrink: 0,
          marginTop: 4,
        }}
      />
      <div
        style={{
          fontFamily: heeboFamily,
          fontSize: 28,
          letterSpacing: "-0.03em",
          lineHeight: 1.38,
          color: ui.ink,
          flex: 1,
        }}
      >
        {assistantTokens.map((token, index) => {
          if (index >= count) {
            return null;
          }
          const isLast = index === count - 1;
          const space =
            index > 0 && !token.breakBefore ? " " : null;
          return (
            <span key={`${token.text}-${index}`}>
              {token.breakBefore ? <span style={{display: "block", height: 16}} /> : null}
              {space}
              <span style={{fontWeight: token.weight}}>{token.text}</span>
              {isLast ? <Cursor on={cursor} /> : null}
            </span>
          );
        })}
      </div>
    </div>
  );
};

const InputBar: React.FC<{
  draft: string;
  focused: boolean;
  sendReady: boolean;
  local: number;
}> = ({draft, focused, sendReady, local}) => {
  const blink = Math.floor(local / 8) % 2 === 0;
  return (
    <div style={{padding: "18px 20px 22px", flexShrink: 0}}>
      <div
        style={{
          minHeight: 72,
          borderRadius: 36,
          border: `1.5px solid ${focused ? colors.ink : ui.line}`,
          display: "flex",
          alignItems: "center",
          padding: "0 10px 0 18px",
          gap: 12,
          backgroundColor: "#FFFFFF",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 99,
            border: `1.5px solid ${ui.line}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: ui.muted,
            fontSize: 26,
            flexShrink: 0,
          }}
        >
          +
        </div>
        <div
          style={{
            flex: 1,
            fontFamily: heeboFamily,
            fontSize: 24,
            fontWeight: 400,
            letterSpacing: "-0.03em",
            lineHeight: 1.25,
            color: draft ? ui.ink : ui.muted,
            whiteSpace: "normal",
            overflow: "hidden",
          }}
        >
          {draft || "Message ChatGPT"}
          {focused ? <Cursor on={blink} /> : null}
        </div>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 99,
            backgroundColor: sendReady ? ui.ink : ui.sendOff,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            scale: sendReady && local === SUBMIT_AT ? "0.92" : "1",
          }}
        >
          <svg width={18} height={18} viewBox="0 0 18 18">
            <path d="M9 14V4M4 9l5-5 5 5" fill="none" stroke="#fff" strokeWidth={1.8} />
          </svg>
        </div>
      </div>
    </div>
  );
};

export const ChatGPTPanel: React.FC = () => {
  const local = useCurrentFrame();
  const typeLocal = local - TYPE_FROM;
  const typing = typedPrefix(typeLocal);
  const typedDone = typeLocal >= typingCompleteFrame();
  const submitted = local >= SUBMIT_AT;
  const thinking = local >= THINK_FROM && local < ANSWER_FROM;
  const answering = local >= ANSWER_FROM;

  const enter = interpolate(local, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 48,
        right: 48,
        top: 196,
        bottom: 88,
        borderRadius: 36,
        backgroundColor: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 24px 80px rgba(8,16,48,0.35)",
        opacity: enter,
        scale: String(0.98 + 0.02 * enter),
      }}
    >
      <Header />
      <div style={{flex: 1, padding: "8px 28px 0", overflow: "hidden"}}>
        {submitted ? <UserBubble text={USER_QUESTION} /> : null}
        {thinking ? <Thinking frame={local} /> : null}
        {answering ? <AssistantAnswer local={local} /> : null}
      </div>
      <InputBar
        draft={submitted ? "" : typing}
        focused={!submitted && local >= TYPE_FROM - 4}
        sendReady={typedDone && !submitted}
        local={local}
      />
    </div>
  );
};
