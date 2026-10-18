import React from "react";
import {Img, Sequence, interpolate, interpolateColors, staticFile, useCurrentFrame} from "remotion";
import {fillTopAt} from "./ExpandingField";
import {heeboFamily} from "../../motion/fonts";
import {typeRole} from "../../motion/type";
import {colors} from "../../tokens";
import {providerLayerAt} from "../../pipeline/providerRotation";
import {useFieldProgress} from "./fieldToLockup";
import {frame, searchField, searchLayout} from "./layout";
import {
  providerLogoSrc,
  providerMonochrome,
  SEARCH_FRAMES,
  searchProviderRotation,
  TRANSITION_FRAMES,
} from "./template";

export const SearchScene: React.FC<{
  lead: string;
  tail: string;
}> = ({lead, tail}) => {
  const frameIndex = useCurrentFrame();
  const {leave} = useFieldProgress();
  const layers = providerLayerAt(searchProviderRotation, frameIndex);
  const hook = typeRole.hook;
  const providerType = typeRole.provider;
  const tailType = typeRole.tail;
  const fillStart = SEARCH_FRAMES - TRANSITION_FRAMES;
  const localFill = frameIndex - fillStart;
  const floodTop = fillTopAt(localFill);
  const inkToWhite = (y: number): string => {
    const t = interpolate(floodTop, [y - 4, y + 40], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return interpolateColors(t, [0, 1], [colors.ink, "#FFFFFF"]);
  };
  const chromeOut = interpolate(frameIndex, [fillStart, fillStart + 6], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const typeOut = interpolate(frameIndex, [fillStart + 8, fillStart + 12], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const leadColor = inkToWhite(searchLayout.leadTop);
  const providerColor = inkToWhite(searchLayout.providerTop);
  const tailColor = inkToWhite(searchLayout.tailTop);

  return (
    <>
      <Sequence name="Search field chrome" layout="none">
        <div
          style={{
            position: "absolute",
            left: searchField.left,
            top: searchField.top,
            width: searchField.width,
            height: searchField.height,
            borderRadius: searchField.radius,
            border: `2px solid ${colors.ink}`,
            opacity: chromeOut,
            backgroundColor: "transparent",
          }}
        />
      </Sequence>
      <Sequence name="Hook lead" layout="none">
        <div
          style={{
            position: "absolute",
            left: frame.padX,
            top: searchLayout.leadTop,
            width: 1080 - frame.padX * 2,
            opacity: typeOut,
            translate: `0px ${-24 * leave}px`,
            fontFamily: heeboFamily,
            fontSize: hook.fontSize,
            fontWeight: hook.fontWeight,
            letterSpacing: hook.letterSpacing,
            lineHeight: hook.lineHeight,
            color: leadColor,
            whiteSpace: "nowrap",
          }}
        >
          {lead}
        </div>
      </Sequence>
      <Sequence name="Provider" layout="none">
        <div
          style={{
            position: "absolute",
            left: frame.padX,
            top: searchLayout.providerTop,
            width: 1080 - frame.padX * 2,
            height: 128,
            overflow: "hidden",
            opacity: typeOut,
          }}
        >
          {layers.map((layer) => {
            if (layer.opacity <= 0) {
              return null;
            }
            const src = providerLogoSrc[layer.provider.logoAssetId];
            const logoHeight = layer.provider.logoDisplayHeight ?? 72;
            return (
              <div
                key={layer.provider.id}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 22,
                  opacity: layer.opacity,
                  scale: String(layer.scale),
                  translate: `0px ${layer.shiftY}px`,
                }}
              >
                {src ? (
                  <Img
                    src={staticFile(src)}
                    name={`${layer.provider.label} logo`}
                    style={{
                      height: logoHeight,
                      width: logoHeight,
                      objectFit: "contain",
                      filter: providerMonochrome.has(layer.provider.id)
                        ? "brightness(0)"
                        : undefined,
                    }}
                  />
                ) : null}
                <div
                  style={{
                    fontFamily: heeboFamily,
                    fontSize: providerType.fontSize,
                    fontWeight: providerType.fontWeight,
                    letterSpacing: providerType.letterSpacing,
                    lineHeight: providerType.lineHeight,
                    color: providerColor,
                    whiteSpace: "nowrap",
                  }}
                >
                  {layer.provider.label}
                </div>
              </div>
            );
          })}
        </div>
      </Sequence>
      <Sequence name="Hook tail" layout="none">
        <div
          style={{
            position: "absolute",
            left: frame.padX,
            top: searchLayout.tailTop,
            width: 1080 - frame.padX * 2,
            display: "flex",
            alignItems: "center",
            gap: 10,
            opacity: typeOut,
            translate: `0px ${-12 * leave}px`,
            fontFamily: heeboFamily,
            fontSize: tailType.fontSize,
            fontWeight: tailType.fontWeight,
            letterSpacing: tailType.letterSpacing,
            lineHeight: tailType.lineHeight,
            color: tailColor,
            whiteSpace: "nowrap",
          }}
        >
          {tail}
          <span
            style={{
              display: "inline-block",
              width: 3,
              height: 44,
              backgroundColor: floodTop < searchLayout.tailTop ? "#FFFFFF" : colors.blue,
              opacity: Math.floor(frameIndex / 8) % 2 === 0 ? 1 : 0,
              flexShrink: 0,
            }}
          />
        </div>
      </Sequence>
    </>
  );
};
