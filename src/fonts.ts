import {loadFont as loadSans} from "@remotion/google-fonts/IBMPlexSans";
import {loadFont as loadSerif} from "@remotion/google-fonts/InstrumentSerif";
import {cancelRender, continueRender, delayRender} from "remotion";

export const serif = loadSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export const sans = loadSans("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

export const fonts = {
  serif: serif.fontFamily,
  sans: sans.fontFamily,
};

const handle = delayRender("Loading fonts");

Promise.all([serif.waitUntilDone(), sans.waitUntilDone()])
  .then(() => continueRender(handle))
  .catch((err) => {
    cancelRender(err);
  });
