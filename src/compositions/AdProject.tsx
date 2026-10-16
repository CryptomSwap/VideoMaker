import React from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Sequence,
  Series,
  staticFile,
} from "remotion";
import {FONT_CATALOG} from "../pipeline/fontCatalog";
import {fetchAndValidateProject} from "../pipeline/loadProject";
import {assetUrl} from "../pipeline/paths";
import type {AdCompositionProps, Project} from "../pipeline/schema";
import {adCompositionSchema} from "../pipeline/schema";
import {findAsset, totalDurationInFrames} from "../pipeline/timing";
import {blockingIssues, formatReport} from "../pipeline/validate";
import {SceneView} from "./SceneView";

export {adCompositionSchema};

export const calculateAdMetadata: CalculateMetadataFunction<
  AdCompositionProps
> = async ({props}) => {
  try {
    const {project, report} = await fetchAndValidateProject(props.projectId);
    const blocking = blockingIssues(report, {
      allowOverflow: props.showSafeArea,
    });
    if (blocking.length > 0) {
      throw new Error(
        formatReport({
          ok: false,
          issues: blocking,
        }),
      );
    }

    return {
      durationInFrames: totalDurationInFrames(project),
      fps: project.fps,
      width: project.width,
      height: project.height,
      props: {
        ...props,
        project,
      },
    };
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};

export const AdProject: React.FC<AdCompositionProps> = ({
  projectId,
  showSafeArea,
  project,
}) => {
  if (!project) {
    return (
      <AbsoluteFill
        style={{
          backgroundColor: "#111",
          color: "#fff",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 42,
          padding: 80,
        }}
      >
        Loading {projectId}…
      </AbsoluteFill>
    );
  }

  return <AdProjectBody project={project} showSafeArea={showSafeArea} />;
};

const AdProjectBody: React.FC<{project: Project; showSafeArea: boolean}> = ({
  project,
  showSafeArea,
}) => {
  const audioAsset = project.audio
    ? findAsset(project, project.audio.assetId)
    : null;
  const headlineFont = FONT_CATALOG[project.brand.headlineFont].cssName;
  const bodyFont = FONT_CATALOG[project.brand.bodyFont].cssName;

  return (
    <AbsoluteFill style={{backgroundColor: project.brand.paper}}>
      <Series>
        {project.scenes.map((scene) => (
          <Series.Sequence
            key={scene.id}
            name={scene.id}
            durationInFrames={scene.durationInFrames}
          >
            <SceneView
              project={project}
              scene={scene}
              showSafeArea={showSafeArea}
              headlineFont={headlineFont}
              bodyFont={bodyFont}
            />
          </Series.Sequence>
        ))}
      </Series>
      {project.audio && audioAsset ? (
        <Sequence from={project.audio.startFrame} name="Audio">
          <Audio
            src={staticFile(assetUrl(project.id, audioAsset.src))}
            name="Audio"
            volume={project.audio.volume}
            trimBefore={Math.round(project.audio.trimStartSeconds * project.fps)}
          />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
