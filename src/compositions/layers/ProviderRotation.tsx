import React from "react";
import {Img, staticFile, useCurrentFrame} from "remotion";
import {assetUrl} from "../../pipeline/paths";
import {providerLayerAt} from "../../pipeline/providerRotation";
import type {Project, ProviderRotation as ProviderRotationConfig} from "../../pipeline/schema";
import {findAsset} from "../../pipeline/timing";
import {resolvePlacement} from "./placement";

export const ProviderRotation: React.FC<{
  project: Project;
  rotation: ProviderRotationConfig;
  fontFamily: string;
}> = ({project, rotation, fontFamily}) => {
  const frame = useCurrentFrame();
  const box = resolvePlacement(project, rotation.placement);
  const layers = providerLayerAt(rotation, frame);
  const color = rotation.color ?? project.brand.ink;

  return (
    <div
      style={{
        position: "absolute",
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
      }}
    >
      {layers.map((layer) => {
        if (layer.opacity <= 0) {
          return null;
        }

        const logo = findAsset(project, layer.provider.logoAssetId);
        const logoHeight = layer.provider.logoDisplayHeight ?? 72;

        return (
          <div
            key={layer.provider.id}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: box.textAlign === "center" ? "center" : "flex-start",
              gap: 20,
              opacity: layer.opacity,
              transform: `scale(${layer.scale})`,
            }}
          >
            {logo ? (
              <Img
                src={staticFile(assetUrl(project.id, logo.src))}
                name={`${layer.provider.label} logo`}
                style={{
                  height: logoHeight,
                  width: "auto",
                  maxWidth: 140,
                  objectFit: "contain",
                }}
              />
            ) : null}
            <div
              style={{
                color,
                fontFamily,
                fontWeight: 600,
                fontSize: rotation.fontSize,
                lineHeight: 1,
                letterSpacing: "-0.04em",
                whiteSpace: "nowrap",
              }}
            >
              {layer.provider.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
