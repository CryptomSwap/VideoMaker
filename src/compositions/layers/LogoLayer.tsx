import React from "react";
import {Img, staticFile} from "remotion";
import {SailtruLogo} from "../../brand/SailtruLogo";
import {sailtruLogoMono} from "../../brand/sailtru";
import {assetUrl} from "../../pipeline/paths";
import type {Placement, Project} from "../../pipeline/schema";
import {findAsset} from "../../pipeline/timing";
import {colors} from "../../tokens";
import {resolvePlacement} from "./placement";

const isSailtruBrandLogo = (logo: {id: string; src: string}) =>
  logo.id === "sailtru-logo" || logo.src.includes("sailtru-logo");

export const LogoLayer: React.FC<{
  project: Project;
  placement: Placement | null;
  fontFamily: string;
  heightPx?: number;
}> = ({project, placement, heightPx}) => {
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
        isSailtruBrandLogo(logo) ? (
          <SailtruLogo
            height={heightPx ?? 56}
            mono={
              project.brand.ink === colors.ink
                ? sailtruLogoMono("light")
                : project.brand.ink
            }
          />
        ) : (
          <Img
            src={staticFile(assetUrl(project.id, logo.src))}
            name="Logo"
            style={{
              height: heightPx ?? 56,
              maxWidth: "100%",
              objectFit: "contain",
            }}
          />
        )
      ) : (
        <SailtruLogo
          height={heightPx ?? 56}
          mono={sailtruLogoMono("light")}
        />
      )}
    </div>
  );
};
