/**
 * Fonts used by the pipeline.
 *
 * Both faces are loaded through @remotion/google-fonts (already in this repo)
 * and are licensed under the SIL Open Font License 1.1.
 *
 * - Instrument Serif: https://fonts.google.com/specimen/Instrument+Serif
 * - IBM Plex Sans: https://fonts.google.com/specimen/IBM+Plex+Sans
 * - Heebo: https://fonts.google.com/specimen/Heebo
 *
 * Heebo is the motion-template face. Existing projects keep their current fonts.
 */
export const FONT_CATALOG = {
  "instrument-serif": {
    cssName: "Instrument Serif",
    license: "SIL Open Font License 1.1",
    source: "Google Fonts via @remotion/google-fonts/InstrumentSerif",
  },
  "ibm-plex-sans": {
    cssName: "IBM Plex Sans",
    license: "SIL Open Font License 1.1",
    source: "Google Fonts via @remotion/google-fonts/IBMPlexSans",
  },
  heebo: {
    cssName: "Heebo",
    license: "SIL Open Font License 1.1",
    source: "Google Fonts via @remotion/google-fonts/Heebo",
  },
} as const;

export type FontId = keyof typeof FONT_CATALOG;
