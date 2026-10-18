import {loadFont} from "@remotion/google-fonts/Heebo";
import {cancelRender, continueRender, delayRender} from "remotion";

/**
 * Heebo (SIL OFL 1.1). Weights used by the motion system:
 * 400 body, 500 medium, 700 provider names, 800 emphasis.
 */
export const heebo = loadFont("normal", {
  weights: ["400", "500", "700", "800"],
  subsets: ["latin"],
});

export const heeboFamily = heebo.fontFamily;

const handle = delayRender("Loading Heebo");

heebo
  .waitUntilDone()
  .then(() => continueRender(handle))
  .catch((error) => {
    cancelRender(error);
  });
