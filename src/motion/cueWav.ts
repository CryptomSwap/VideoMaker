/** 16-bit mono PCM WAV. Used for short UI cues, not music. */
export const encodeToneWav = (options: {
  seconds: number;
  frequency: number;
  volume: number;
  sampleRate?: number;
  overtone?: number;
  endFrequency?: number;
  decay?: number;
}): Buffer => {
  const sampleRate = options.sampleRate ?? 44100;
  const count = Math.max(1, Math.floor(sampleRate * options.seconds));
  const data = Buffer.alloc(count * 2);
  const decay = options.decay ?? (options.seconds < 0.08 ? 48 : 10);

  for (let index = 0; index < count; index++) {
    const time = index / sampleRate;
    const progress = count === 1 ? 1 : index / (count - 1);
    const frequency =
      options.endFrequency === undefined
        ? options.frequency
        : options.frequency + (options.endFrequency - options.frequency) * progress;
    const envelope = Math.exp(-time * decay);
    const fundamental = Math.sin(2 * Math.PI * frequency * time);
    const overtone = options.overtone
      ? Math.sin(2 * Math.PI * options.overtone * time) * 0.35
      : 0;
    const sample = Math.max(
      -1,
      Math.min(1, (fundamental + overtone) * options.volume * envelope),
    );
    data.writeInt16LE(Math.round(sample * 32767), index * 2);
  }

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
};
