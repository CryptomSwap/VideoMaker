import React from "react";
import {Img, staticFile} from "remotion";
import {assetUrl} from "../../pipeline/paths";
import type {Placement, Project} from "../../pipeline/schema";
import {findAsset} from "../../pipeline/timing";
import {resolvePlacement} from "./placement";

export const LogoLayer: React.FC<{
  project: Project;
  placement: Placement | null;
  fontFamily: string;
}> = ({project, placement, fontFamily}) => {
  const usedPlacement =
    placement ??
    ({
      x: 0.5,
      y: 0.91,
      width: 0.5,
      height: 0.08,
      anchor: "bottom-center",
      safeInset: true,
    } satisfies Placement);
  const box = resolvePlacement(project, usedPlacement);
  const logo = project.brand.logoAssetId
    ? findAsset(project, project.brand.logoAssetId)
    : null;

  return (
    <div
      style={{
        position: "absolute",
        left: box.left,
        top: box.top,
        width: box.width,
        display: "flex",
        justifyContent:
          box.textAlign === "center"
            ? "center"
            : box.textAlign === "right"
              ? "flex-end"
              : "flex-start",
        alignItems: "center",
        gap: 14,
      }}
    >
      {logo ? (
        <Img
          src={staticFile(assetUrl(project.id, logo.src))}
          name="Logo"
          style={{height: 56, objectFit: "contain"}}
        />
      ) : (
        <Wordmark accent={project.brand.accent} ink={project.brand.ink} fontFamily={fontFamily} />
      )}
    </div>
  );
};

const Wordmark: React.FC<{accent: string; ink: string; fontFamily: string}> = ({
  accent,
  ink,
  fontFamily,
}) => {
  return (
    <div style={{display: "flex", alignItems: "center", gap: 12}}>
      <div
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          backgroundColor: accent,
        }}
      />
      <div
        style={{
          fontFamily,
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: "0.08em",
          color: ink,
        }}
      >
        SailTru
      </div>
    </div>
  );
};
