import {Composition, Folder} from "remotion";
import {
  AdProject,
  adCompositionSchema,
  calculateAdMetadata,
} from "./compositions/AdProject";
import "./fonts";
import {SailTruManualWork} from "./SailTruManualWork";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Pipeline">
        <Composition
          id="AdProject"
          component={AdProject}
          durationInFrames={180}
          fps={30}
          width={1080}
          height={1920}
          schema={adCompositionSchema}
          defaultProps={{
            projectId: "sailtru-first-ad",
            showSafeArea: true,
          }}
          calculateMetadata={calculateAdMetadata}
        />
      </Folder>
      <Folder name="Reference">
        <Composition
          id="SailTruManualWork"
          component={SailTruManualWork}
          durationInFrames={150}
          fps={30}
          width={1080}
          height={1920}
          defaultProps={{
            headline: "Still doing this manually?",
          }}
        />
      </Folder>
    </>
  );
};
