import React from "react";

/** Approximate IG Reels chrome for review stills. Not in the paid MP4. */
export const ReelsChrome: React.FC = () => {
  return (
    <>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 132,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 268,
          background:
            "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 36,
          bottom: 300,
          width: 56,
          display: "flex",
          flexDirection: "column",
          gap: 28,
          alignItems: "center",
          color: "rgba(255,255,255,0.92)",
          fontSize: 22,
          fontWeight: 600,
        }}
      >
        <div>♡</div>
        <div>💬</div>
        <div>➤</div>
      </div>
    </>
  );
};
