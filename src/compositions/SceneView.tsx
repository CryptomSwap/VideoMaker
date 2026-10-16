import React from "react";
import {AbsoluteFill} from "remotion";
import type {Project, Scene} from "../pipeline/schema";
import {BackgroundLayer} from "./layers/BackgroundLayer";
import {ContrastLayer} from "./layers/ContrastLayer";
import {CtaLayer} from "./layers/CtaLayer";
import {LogoLayer} from "./layers/LogoLayer";
import {SafeAreaGuides} from "./layers/SafeAreaGuides";
import {TextOverlay} from "./layers/TextOverlay";

export const SceneView: React.FC<{
  project: Project;
  scene: Scene;
  showSafeArea: boolean;
  headlineFont: string;
  bodyFont: string;
}> = ({project, scene, showSafeArea, headlineFont, bodyFont}) => {
  const sceneIndex = project.scenes.findIndex((entry) => entry.id === scene.id);
  const scenePath = `scenes[${sceneIndex}]`;
  return (
    <AbsoluteFill>
      <BackgroundLayer project={project} scene={scene} />
      {scene.contrast ? <ContrastLayer contrast={scene.contrast} /> : null}
      <TextOverlay
        name="Headline"
        fieldPath={`${scenePath}.headline`}
        block={scene.headline}
        project={project}
        fontFamily={headlineFont}
        fontWeight={400}
        role="headline"
        showOverflowBadge={showSafeArea}
        failOnOverflow={!showSafeArea}
      />
      {scene.supporting ? (
        <TextOverlay
          name="Supporting"
          fieldPath={`${scenePath}.supporting`}
          block={scene.supporting}
          project={project}
          fontFamily={bodyFont}
          fontWeight={500}
          role="supporting"
          showOverflowBadge={showSafeArea}
          failOnOverflow={!showSafeArea}
        />
      ) : null}
      {scene.cta ? (
        <CtaLayer block={scene.cta} project={project} fontFamily={bodyFont} />
      ) : null}
      {scene.showLogo ? (
        <LogoLayer
          project={project}
          placement={scene.logoPlacement}
          fontFamily={bodyFont}
        />
      ) : null}
      {showSafeArea ? <SafeAreaGuides safeArea={project.safeArea} /> : null}
    </AbsoluteFill>
  );
};
