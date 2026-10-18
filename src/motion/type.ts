import {colors} from "../tokens";

/** Heebo roles. Sizes are for a 1080-wide vertical frame. */
export const typeRole = {
  wordmark: {
    fontSize: 28,
    fontWeight: 500,
    letterSpacing: "-0.03em",
    lineHeight: 1,
    color: colors.ink,
  },
  hook: {
    fontSize: 76,
    fontWeight: 400,
    letterSpacing: "-0.038em",
    lineHeight: 1,
    color: colors.ink,
  },
  provider: {
    fontSize: 104,
    fontWeight: 700,
    letterSpacing: "-0.05em",
    lineHeight: 0.92,
    color: colors.ink,
  },
  tail: {
    fontSize: 64,
    fontWeight: 500,
    letterSpacing: "-0.036em",
    lineHeight: 1.08,
    color: colors.ink,
  },
  pulse: {
    fontSize: 108,
    fontWeight: 800,
    letterSpacing: "-0.055em",
    lineHeight: 0.94,
    color: "#FFFFFF",
  },
  statement: {
    fontSize: 72,
    fontWeight: 800,
    letterSpacing: "-0.05em",
    lineHeight: 1,
    color: "#FFFFFF",
  },
  descriptor: {
    fontSize: 34,
    fontWeight: 500,
    letterSpacing: "0.04em",
    lineHeight: 1.2,
    color: "rgba(255,255,255,0.82)",
  },
  cta: {
    fontSize: 48,
    fontWeight: 700,
    letterSpacing: "-0.03em",
    lineHeight: 1,
    color: colors.ink,
  },
  line: {
    fontSize: 60,
    fontWeight: 400,
    letterSpacing: "-0.036em",
    lineHeight: 1,
    color: colors.ink,
  },
  emphasis: {
    fontSize: 76,
    fontWeight: 800,
    letterSpacing: "-0.048em",
    lineHeight: 0.92,
    color: colors.ink,
  },
  support: {
    fontSize: 28,
    fontWeight: 500,
    letterSpacing: "0.06em",
    lineHeight: 1.2,
    color: colors.inkMuted,
  },
} as const;

export type TypeRole = keyof typeof typeRole;
