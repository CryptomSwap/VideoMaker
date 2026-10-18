import type {SpringConfig} from "remotion";

/**
 * Damped springs. No overshoot — SaaS type should settle, not bounce.
 * `settle` is the default entrance. `snap` is for short UI marks (the rule).
 */
export const springs = {
  settle: {
    damping: 200,
    stiffness: 120,
    mass: 1,
  },
  snap: {
    damping: 200,
    stiffness: 180,
    mass: 0.8,
  },
} as const satisfies Record<string, Partial<SpringConfig>>;
