import {colors} from "../tokens";

/** Shared lockup layers (same crop / dimensions). */
export const SAILTRU_LOGO_HULL = "brand/sailtru-logo-hull.png";
export const SAILTRU_LOGO_MONO_MASK = "brand/sailtru-logo-mono-mask.png";

/** Width / height of the raster lockup assets. */
export const SAILTRU_LOGO_ASPECT = 773 / 198;

export const sailtruLogoMono = (surface: "light" | "dark") =>
  surface === "light" ? colors.ink : colors.cream;
