import React from "react";
import {Img, staticFile, useCurrentFrame} from "remotion";
import {heeboFamily} from "../../motion/fonts";
import {colors} from "../../tokens";
import {chatgptLogoSrc} from "../search-fomo-v3/template";
import {
  typedPrefix,
  typingCompleteFrame,
  USER_QUESTION,
} from "../search-fomo-v3/typeQuestion";
import {
  assistantTokens,
  generatingCursorVisible,
  visibleWordCount,
} from "../search-fomo-v3/wordReveal";
import {hookStack} from "./layout";
import {
  ANSWER_FROM,
  SUBMIT_AT,
  THINK_FROM,
  TYPE_FROM,
} from "./template";

const ui = {
  ink: "#0D0D0D",
  muted: "#8F8F8F",
  bubble: "#F4F4F4",
  line: "#E8E8E8",
  sendOff: "#D9D9E3",
};

const Header: React.FC = () => (
  <div
    style={{
      height: 76,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      borderBottom: `1px solid ${ui.line}`,
      flexShrink: 0,
    }}
  >
    <svg width={26} height={26} viewBox="0 0 28 28">
      <path d="M5 8h18M5 14h18M5 20h18" stroke={ui.ink} strokeWidth={1.8} />
    </svg>
    <div style={{display: "flex", alignItems: "center", gap: 8}}>
      <Img
        src={staticFile(chatgptLogoSrc)}
        name="ChatGPT mark"
        style={{width: 26, height: 26, objectFit: "contain", filter: "brightness(0)"}}
      />
      <div
        style={{
          fontFamily: heeboFamily,
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.04em",
          color: ui.ink,
        }}
      >
        ChatGPT
      </div>
    </div>
    <svg width={26} height={26} viewBox="0 0 28 28">
      <path d="M8 20V9l9 5.5L8 20Z" fill="none" stroke={ui.ink} strokeWidth={1.6} />
    </svg>
  </div>
);

const Cursor: React.FC<{on: boolean}> = ({on}) =>
  on ? (
    <span
      style={{
        display: "inline-block",
        width: 2,
        height: "0.9em",
        marginLeft: 2,
        backgroundColor: ui.ink,
        verticalAlign: "-0.1em",
      }}
    />
  ) : null;

export const ChatGPTPanel: React.FC = () => {
  const local = useCurrentFrame();
  const typeLocal = local - TYPE_FROM;
  const typing = typedPrefix(typeLocal);
  const typedDone = typeLocal >= typingCompleteFrame();
  const submitted = local >= SUBMIT_AT;
  const thinking = local >= THINK_FROM && local < ANSWER_FROM;
  const answering = local >= ANSWER_FROM;
  const {chat} = hookStack;

  return (
    <div
      style={{
        position: "absolute",
        left: chat.left,
        right: chat.right,
        top: chat.top,
        bottom: chat.bottom,
        borderRadius: chat.radius,
        backgroundColor: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 16px 48px rgba(20, 20, 20, 0.12)",
        border: `1px solid ${colors.inkLine}`,
      }}
    >
      <Header />
      <div style={{flex: 1, padding: "6px 22px 0", overflow: "hidden"}}>
        {submitted ? (
          <div style={{display: "flex", justifyContent: "flex-end", marginTop: 16}}>
            <div
              style={{
                maxWidth: "88%",
                backgroundColor: ui.bubble,
                borderRadius: 22,
                padding: "14px 18px",
                fontFamily: heeboFamily,
                fontSize: 24,
                fontWeight: 500,
                lineHeight: 1.28,
                color: ui.ink,
              }}
            >
              {USER_QUESTION}
            </div>
          </div>
        ) : null}
        {thinking ? (
          <div style={{display: "flex", gap: 12, marginTop: 20, alignItems: "center"}}>
            <Img
              src={staticFile(chatgptLogoSrc)}
              style={{width: 28, height: 28, filter: "brightness(0)"}}
            />
            <div style={{display: "flex", gap: 6}}>
              {[0, 1, 2].map((dot) => (
                <div
                  key={dot}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 99,
                    backgroundColor: ui.ink,
                    opacity: Math.floor(local / 6) % 3 === dot ? 0.9 : 0.25,
                  }}
                />
              ))}
            </div>
          </div>
        ) : null}
        {answering ? (
          <div style={{display: "flex", gap: 12, marginTop: 20, alignItems: "flex-start"}}>
            <Img
              src={staticFile(chatgptLogoSrc)}
              style={{width: 28, height: 28, filter: "brightness(0)", marginTop: 2}}
            />
            <div
              style={{
                fontFamily: heeboFamily,
                fontSize: 24,
                lineHeight: 1.36,
                color: ui.ink,
                flex: 1,
              }}
            >
              {assistantTokens.map((token, index) => {
                const count = visibleWordCount(local - ANSWER_FROM);
                if (index >= count) {
                  return null;
                }
                const isLast = index === count - 1;
                return (
                  <span key={`${token.text}-${index}`}>
                    {token.breakBefore ? <span style={{display: "block", height: 12}} /> : null}
                    {index > 0 && !token.breakBefore ? " " : null}
                    <span style={{fontWeight: token.weight}}>{token.text}</span>
                    {isLast ? (
                      <Cursor
                        on={
                          generatingCursorVisible(local - ANSWER_FROM) &&
                          Math.floor(local / 8) % 2 === 0
                        }
                      />
                    ) : null}
                  </span>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
      <div style={{padding: "12px 16px 16px", flexShrink: 0}}>
        <div
          style={{
            minHeight: 64,
            borderRadius: 32,
            border: `1.5px solid ${!submitted && local >= TYPE_FROM - 4 ? colors.ink : ui.line}`,
            display: "flex",
            alignItems: "center",
            padding: "0 8px 0 14px",
            gap: 10,
          }}
        >
          <div
            style={{
              flex: 1,
              fontFamily: heeboFamily,
              fontSize: 22,
              color: typing || submitted ? ui.ink : ui.muted,
            }}
          >
            {submitted ? "Message ChatGPT" : typing || "Message ChatGPT"}
            {!submitted && local >= TYPE_FROM - 4 ? (
              <Cursor on={Math.floor(local / 8) % 2 === 0} />
            ) : null}
          </div>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 99,
              backgroundColor: typedDone && !submitted ? ui.ink : ui.sendOff,
            }}
          />
        </div>
      </div>
    </div>
  );
};
