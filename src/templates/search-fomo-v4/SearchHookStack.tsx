import React from "react";
import {Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {heeboFamily} from "../../motion/fonts";
import {typeRole} from "../../motion/type";
import {colors} from "../../tokens";
import {providerLayerAt} from "../../pipeline/providerRotation";
import {
  providerLogoSrc,
  providerMonochrome,
  searchProviderRotation,
} from "../search-fomo-v2/template";
import {hookStack} from "./layout";

export const SearchHookStack: React.FC<{
  lead: string;
  tail: string;
}> = ({lead, tail}) => {
  const frameIndex = useCurrentFrame();
  const layers = providerLayerAt(searchProviderRotation, frameIndex);
  const hook = typeRole.hook;
  const providerType = typeRole.provider;
  const tailType = typeRole.tail;
  const {searchField} = hookStack;

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
            backgroundColor: "transparent",
          }}
        />
      </Sequence>
      <Sequence name="Hook lead" layout="none">
        <div
          style={{
            position: "absolute",
            left: hookStack.padX,
            top: hookStack.leadTop,
            width: 1080 - hookStack.padX * 2,
            fontFamily: heeboFamily,
            fontSize: hook.fontSize * 0.88,
            fontWeight: hook.fontWeight,
            letterSpacing: hook.letterSpacing,
            lineHeight: hook.lineHeight,
            color: colors.ink,
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
            left: hookStack.padX,
            top: hookStack.providerTop,
            width: 1080 - hookStack.padX * 2,
            height: 120,
            overflow: "hidden",
          }}
        >
          {layers.map((layer) => {
            if (layer.opacity <= 0) {
              return null;
            }
            const src = providerLogoSrc[layer.provider.logoAssetId];
            const logoHeight = (layer.provider.logoDisplayHeight ?? 72) * 0.9;
            return (
              <div
                key={layer.provider.id}
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
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
                    fontSize: providerType.fontSize * 0.88,
                    fontWeight: providerType.fontWeight,
                    letterSpacing: providerType.letterSpacing,
                    lineHeight: providerType.lineHeight,
                    color: colors.ink,
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
            left: hookStack.padX,
            top: hookStack.tailTop,
            width: 1080 - hookStack.padX * 2,
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: heeboFamily,
            fontSize: tailType.fontSize * 0.92,
            fontWeight: tailType.fontWeight,
            letterSpacing: tailType.letterSpacing,
            lineHeight: tailType.lineHeight,
            color: colors.ink,
            whiteSpace: "nowrap",
          }}
        >
          {tail}
          <span
            style={{
              display: "inline-block",
              width: 3,
              height: 40,
              backgroundColor: colors.blue,
              opacity: Math.floor(frameIndex / 8) % 2 === 0 ? 1 : 0,
              flexShrink: 0,
            }}
          />
        </div>
      </Sequence>
    </>
  );
};
