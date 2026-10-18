import {
  typedPrefix,
  typingCompleteFrame,
} from "../search-fomo-v3/typeQuestion";

export const iphonePlateSrc = "projects/imessage-hook/assets/iphone-plate.jpg";

export const INCOMING_ONE = "Bar?";
export const OUTGOING_TEXT = "Cant.. have a ton of stuff to get to.";
export const INCOMING_TWO = "☹️";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

/** Phone width on canvas; image is centered vertically. */
export const PHONE_WIDTH_PX = 900;

/** Screen inset within the phone image (tune against plate). */
export const SCREEN_INSET = {
  top: 0.172,
  left: 0.082,
  right: 0.082,
  bottom: 0.09,
};

export const INCOMING_ONE_AT = 22;
export const TYPE_START = 48;
export const TYPE_DONE = TYPE_START + typingCompleteFrame(OUTGOING_TEXT);
export const SEND_AT = TYPE_DONE + 10;
export const INCOMING_TWO_AT = SEND_AT + 20;

export const SCENE_FRAMES = INCOMING_TWO_AT + 36;

export const imessageHookTemplate = {
  id: "imessage-hook",
  fps: FPS,
  width: WIDTH,
  height: HEIGHT,
  audioCues: [
    {
      id: "incoming-one",
      atFrame: INCOMING_ONE_AT,
      src: "motion/cues/tick.wav",
      volume: 0.28,
      durationInFrames: 10,
    },
    {
      id: "type-start",
      atFrame: TYPE_START,
      src: "motion/cues/type.wav",
      volume: 0.2,
      durationInFrames: 12,
    },
    {
      id: "send",
      atFrame: SEND_AT,
      src: "motion/cues/click.wav",
      volume: 0.32,
      durationInFrames: 8,
    },
    {
      id: "incoming-two",
      atFrame: INCOMING_TWO_AT,
      src: "motion/cues/tick.wav",
      volume: 0.26,
      durationInFrames: 10,
    },
  ],
} as const;

export const outgoingTypedAt = (localFrame: number): string => {
  if (localFrame < TYPE_START) {
    return "";
  }
  if (localFrame >= SEND_AT) {
    return OUTGOING_TEXT;
  }
  return typedPrefix(localFrame - TYPE_START, OUTGOING_TEXT);
};

export const isTyping = (localFrame: number): boolean => {
  return localFrame >= TYPE_START && localFrame < SEND_AT;
};

export const showOutgoingBubble = (localFrame: number): boolean => {
  return localFrame >= SEND_AT;
};

export const showIncomingOne = (localFrame: number): boolean => {
  return localFrame >= INCOMING_ONE_AT;
};

export const showIncomingTwo = (localFrame: number): boolean => {
  return localFrame >= INCOMING_TWO_AT;
};
