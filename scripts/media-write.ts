import {crc32, deflateSync} from "node:zlib";
import fs from "node:fs";

const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const chunk = (type: string, data: Buffer): Buffer => {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0);
  return Buffer.concat([length, typeBuf, data, crc]);
};

export type Rgb = readonly [number, number, number];

export const writePng = (
  filePath: string,
  width: number,
  height: number,
  colorAt: (x: number, y: number) => Rgb,
): void => {
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 3);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const rgb = colorAt(x, y);
      const i = row + 1 + x * 3;
      raw[i] = rgb[0];
      raw[i + 1] = rgb[1];
      raw[i + 2] = rgb[2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const png = Buffer.concat([
    pngSignature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, {level: 9})),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  fs.writeFileSync(filePath, png);
};

const writeWavPcm16 = (
  filePath: string,
  sampleRate: number,
  samples: Int16Array,
): void => {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    data.writeInt16LE(samples[i], i * 2);
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
  fs.writeFileSync(filePath, Buffer.concat([header, data]));
};

export const writeWavSine = (
  filePath: string,
  durationSeconds: number,
  frequency: number,
): void => {
  const sampleRate = 44100;
  const samples = Math.round(sampleRate * durationSeconds);
  const pcm = new Int16Array(samples);
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const fadeIn = Math.min(1, t / 0.04);
    const fadeOut = Math.min(1, (durationSeconds - t) / 0.08);
    const env = fadeIn * fadeOut;
    const value = Math.sin(2 * Math.PI * frequency * t) * env * 0.28;
    pcm[i] = Math.round(value * 32767);
  }
  writeWavPcm16(filePath, sampleRate, pcm);
};

export const writeWavOnsetClick = (
  filePath: string,
  options: {
    durationSeconds: number;
    onsetSeconds?: number;
    burstSeconds?: number;
    frequency?: number;
    sampleRate?: number;
  },
): void => {
  const sampleRate = options.sampleRate ?? 48000;
  const onsetSeconds = options.onsetSeconds ?? 0;
  const burstSeconds = options.burstSeconds ?? 0.04;
  const frequency = options.frequency ?? 2000;
  const count = Math.round(sampleRate * options.durationSeconds);
  const onset = Math.round(onsetSeconds * sampleRate);
  const burst = Math.round(burstSeconds * sampleRate);
  const pcm = new Int16Array(count);

  for (let i = 0; i < burst && onset + i < count; i++) {
    const env = Math.exp(-i / (sampleRate * 0.008));
    const value = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * env;
    pcm[onset + i] = Math.round(value * 30000);
  }

  writeWavPcm16(filePath, sampleRate, pcm);
};

const readAscii = (buffer: Buffer, offset: number, length: number): string => {
  return buffer.subarray(offset, offset + length).toString("ascii");
};

export const measureWavOnsetSeconds = (
  filePath: string,
  peakRatio = 0.12,
): number | null => {
  const buffer = fs.readFileSync(filePath);
  if (readAscii(buffer, 0, 4) !== "RIFF" || readAscii(buffer, 8, 4) !== "WAVE") {
    throw new Error(`Not a WAV file: ${filePath}`);
  }

  let offset = 12;
  let channels = 1;
  let sampleRate = 48000;
  let bitsPerSample = 16;
  let dataOffset = -1;
  let dataBytes = 0;

  while (offset + 8 <= buffer.length) {
    const chunkId = readAscii(buffer, offset, 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const start = offset + 8;
    if (chunkId === "fmt ") {
      channels = buffer.readUInt16LE(start + 2);
      sampleRate = buffer.readUInt32LE(start + 4);
      bitsPerSample = buffer.readUInt16LE(start + 14);
    } else if (chunkId === "data") {
      dataOffset = start;
      dataBytes = chunkSize;
      break;
    }
    offset = start + chunkSize + (chunkSize % 2);
  }

  if (dataOffset < 0) {
    throw new Error(`WAV has no data chunk: ${filePath}`);
  }
  if (bitsPerSample !== 16) {
    throw new Error(`Expected 16-bit PCM WAV, got ${bitsPerSample}-bit`);
  }

  const frameSize = channels * 2;
  const frames = Math.floor(dataBytes / frameSize);
  let peak = 1;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < channels; c++) {
      const sample = Math.abs(
        buffer.readInt16LE(dataOffset + i * frameSize + c * 2),
      );
      if (sample > peak) {
        peak = sample;
      }
    }
  }

  const threshold = peak * peakRatio;
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < channels; c++) {
      const sample = Math.abs(
        buffer.readInt16LE(dataOffset + i * frameSize + c * 2),
      );
      if (sample >= threshold) {
        return i / sampleRate;
      }
    }
  }

  return null;
};

export const hexRgb = (hex: string): Rgb => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
