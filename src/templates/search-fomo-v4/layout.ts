import {frame} from "../search-fomo-v2/layout";

/** Hook question + ChatGPT stack on cream. */
export const hookStack = {
  padX: frame.padX,
  searchField: {
    left: 48,
    top: 120,
    width: 984,
    height: 400,
    radius: 28,
  },
  leadTop: 156,
  providerTop: 236,
  tailTop: 360,
  chat: {
    left: 96,
    right: 96,
    top: 548,
    bottom: 200,
    radius: 28,
  },
} as const;
