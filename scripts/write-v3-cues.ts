import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {encodeToneWav} from "../src/motion/cueWav";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "public", "motion", "cues");
fs.mkdirSync(dir, {recursive: true});

const write = (name: string, buffer: Buffer) => {
  const filePath = path.join(dir, name);
  if (fs.existsSync(filePath)) {
    return;
  }
  fs.writeFileSync(filePath, buffer);
  console.log(`wrote ${name}`);
};

write(
  "type.wav",
  encodeToneWav({seconds: 0.22, frequency: 1680, volume: 0.18, decay: 28}),
);
write(
  "click.wav",
  encodeToneWav({seconds: 0.06, frequency: 420, overtone: 1260, volume: 0.4, decay: 40}),
);
write(
  "think.wav",
  encodeToneWav({seconds: 0.2, frequency: 220, endFrequency: 340, volume: 0.28, decay: 8}),
);
write(
  "fomo.wav",
  encodeToneWav({seconds: 0.28, frequency: 160, endFrequency: 90, volume: 0.42, decay: 7}),
);
