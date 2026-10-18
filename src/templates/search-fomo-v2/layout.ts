/** Shared coordinates for the 1080×1920 ad. The search field is the hinge. */
export const frame = {
  padX: 72,
  wordmarkTop: 132,
  ruleY: 1024,
  ruleWidth: 936,
  ruleHeight: 4,
} as const;

export const searchField = {
  left: 48,
  top: 400,
  width: 984,
  height: 456,
  radius: 28,
} as const;

export const searchLayout = {
  leadTop: 436,
  providerTop: 534,
  tailTop: 710,
} as const;
