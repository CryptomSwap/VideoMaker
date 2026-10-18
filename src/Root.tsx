import {Composition, Folder} from "remotion";
import {
  AdProject,
  adCompositionSchema,
  calculateAdMetadata,
} from "./compositions/AdProject";
import "./fonts";
import "./motion/fonts";
import {SailTruManualWork} from "./SailTruManualWork";
import {
  SearchFomoV2,
  searchFomoV2AProps,
  searchFomoV2BProps,
  searchFomoV2DefaultProps,
  searchFomoV2Schema,
} from "./templates/search-fomo-v2/SearchFomoV2";
import {searchFomoDuration, searchFomoV2Template} from "./templates/search-fomo-v2/template";
import {
  SearchFomoV3,
  searchFomoV3DefaultProps,
  searchFomoV3Schema,
} from "./templates/search-fomo-v3/SearchFomoV3";
import {
  searchFomoV3Duration,
  searchFomoV3Template,
} from "./templates/search-fomo-v3/template";
import {
  AnswerPreview,
  ANSWER_PREVIEW_FRAMES,
} from "./templates/search-fomo-v3/AnswerPreview";
import {
  EndCardPreview,
  END_CARD_PREVIEW_FRAMES,
} from "./templates/search-fomo-v4/EndCardPreview";
import {
  SearchFomoV4,
  searchFomoV4DefaultProps,
  searchFomoV4Schema,
} from "./templates/search-fomo-v4/SearchFomoV4";
import {
  searchFomoV4Duration,
  searchFomoV4Template,
} from "./templates/search-fomo-v4/template";
import {IMessageHook} from "./templates/imessage-hook/IMessageHook";
import {
  SCENE_FRAMES,
  imessageHookTemplate,
} from "./templates/imessage-hook/template";

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
      <Folder name="Templates">
        <Composition
          id="SearchFomoV2"
          component={SearchFomoV2}
          durationInFrames={searchFomoDuration}
          fps={searchFomoV2Template.fps}
          width={searchFomoV2Template.width}
          height={searchFomoV2Template.height}
          schema={searchFomoV2Schema}
          defaultProps={searchFomoV2DefaultProps}
        />
        <Composition
          id="SearchFomoV2A"
          component={SearchFomoV2}
          durationInFrames={searchFomoDuration}
          fps={searchFomoV2Template.fps}
          width={searchFomoV2Template.width}
          height={searchFomoV2Template.height}
          schema={searchFomoV2Schema}
          defaultProps={searchFomoV2AProps}
        />
        <Composition
          id="SearchFomoV2B"
          component={SearchFomoV2}
          durationInFrames={searchFomoDuration}
          fps={searchFomoV2Template.fps}
          width={searchFomoV2Template.width}
          height={searchFomoV2Template.height}
          schema={searchFomoV2Schema}
          defaultProps={searchFomoV2BProps}
        />
        <Composition
          id="SearchFomoV3"
          component={SearchFomoV3}
          durationInFrames={searchFomoV3Duration}
          fps={searchFomoV3Template.fps}
          width={searchFomoV3Template.width}
          height={searchFomoV3Template.height}
          schema={searchFomoV3Schema}
          defaultProps={searchFomoV3DefaultProps}
        />
        <Composition
          id="SearchFomoV3Answer"
          component={AnswerPreview}
          durationInFrames={ANSWER_PREVIEW_FRAMES}
          fps={searchFomoV3Template.fps}
          width={searchFomoV3Template.width}
          height={searchFomoV3Template.height}
        />
        <Composition
          id="SearchFomoV4"
          component={SearchFomoV4}
          durationInFrames={searchFomoV4Duration}
          fps={searchFomoV4Template.fps}
          width={searchFomoV4Template.width}
          height={searchFomoV4Template.height}
          schema={searchFomoV4Schema}
          defaultProps={searchFomoV4DefaultProps}
        />
        <Composition
          id="SearchFomoV4EndPreview"
          component={EndCardPreview}
          durationInFrames={END_CARD_PREVIEW_FRAMES}
          fps={searchFomoV4Template.fps}
          width={searchFomoV4Template.width}
          height={searchFomoV4Template.height}
        />
        <Composition
          id="IMessageHook"
          component={IMessageHook}
          durationInFrames={SCENE_FRAMES}
          fps={imessageHookTemplate.fps}
          width={imessageHookTemplate.width}
          height={imessageHookTemplate.height}
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
