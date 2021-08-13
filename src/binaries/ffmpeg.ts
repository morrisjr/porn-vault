import ffmpeg from "fluent-ffmpeg";
import { existsSync } from "fs";
import * as os from "os";
import path from "path";

import { IConfig } from "../config/schema";
import { logger } from "../utils/logger";

const FFMpegVersions: Record<string, Record<string, string>> = {
  Linux: {
    ia32: "https://github.com/kribblo/node-ffmpeg-installer/raw/master/platforms/linux-ia32/ffmpeg",
    x64: "https://github.com/kribblo/node-ffmpeg-installer/raw/master/platforms/linux-x64/ffmpeg",
  },
  Windows_NT: {
    ia32: "https://github.com/kribblo/node-ffmpeg-installer/raw/master/platforms/win32-ia32/ffmpeg.exe",
    x64: "https://github.com/kribblo/node-ffmpeg-installer/raw/master/platforms/win32-x64/ffmpeg.exe",
  },
  Darwin: {
    x64: "https://github.com/kribblo/node-ffmpeg-installer/raw/master/platforms/darwin-x64/ffmpeg",
  },
};

const FFProbeVersions: Record<string, Record<string, string>> = {
  Linux: {
    ia32: "https://github.com/SavageCore/node-ffprobe-installer/raw/master/platforms/linux-ia32/ffprobe",
    x64: "https://github.com/SavageCore/node-ffprobe-installer/raw/master/platforms/linux-x64/ffprobe",
  },
  Windows_NT: {
    ia32: "https://github.com/SavageCore/node-ffprobe-installer/raw/master/platforms/win32-ia32/ffprobe.exe",
    x64: "https://github.com/SavageCore/node-ffprobe-installer/raw/master/platforms/win32-x64/ffprobe.exe",
  },
  Darwin: {
    x64: "https://github.com/SavageCore/node-ffprobe-installer/raw/master/platforms/darwin-x64/ffprobe",
  },
};

export function getFFMpegURL(): string {
  const sys = os.type();
  const arch = os.arch();
  return FFMpegVersions[sys][arch];
}

export function getFFProbeURL(): string {
  const sys = os.type();
  const arch = os.arch();
  return FFProbeVersions[sys][arch];
}

export function setFfmpegBinaryPaths(config: IConfig): void {
  const ffmpegPath = path.resolve(config.binaries.ffmpeg);
  const ffprobePath = path.resolve(config.binaries.ffprobe);

  ffmpeg.setFfmpegPath(ffmpegPath);
  ffmpeg.setFfprobePath(ffprobePath);

  logger.verbose(`FFMPEG set to "${ffmpegPath}"`);
  logger.verbose(`FFPROBE set to "${ffprobePath}"`);
}

export function validateFFMPEGPaths(config: IConfig): void {
  if (config.binaries.ffmpeg) {
    const found = existsSync(config.binaries.ffmpeg);
    if (!found) {
      throw new Error(
        `FFMPEG binary not found at "${config.binaries.ffmpeg}" for "config.binaries.ffmpeg"`
      );
    }
  } else {
    throw new Error(`No FFMPEG path defined in config.json for "config.binaries.ffmpeg"`);
  }

  if (config.binaries.ffprobe) {
    const found = existsSync(config.binaries.ffprobe);
    if (!found) {
      throw new Error(
        `FFPROBE binary not found at "${config.binaries.ffprobe}" for "config.binaries.ffprobe"`
      );
    }
  } else {
    throw new Error(`No FFPROBE path defined in config.json for "config.binaries.ffprobe"`);
  }
}
