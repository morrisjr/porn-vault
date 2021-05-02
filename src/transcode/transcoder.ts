import { FFProbeAudioCodecs, FFProbeVideoCodecs } from "../ffmpeg/ffprobe";
import Scene from "../types/scene";

export enum SceneStreamTypes {
  DIRECT = "direct",
  MP4_DIRECT = "mp4_direct",
  MP4_TRANSCODE = "mp4_transcode",
  WEBM_TRANSCODE = "webm_transcode",
}

export type FFmpegOption = string;

export interface TranscodeOptions {
  inputOptions: FFmpegOption[];
  outputOptions: FFmpegOption[];
  mimeType: string;
}

export interface Transcoder {
  validateRequirements(scene: Scene): true | Error;
  isVideoValidForContainer(videoCodec: FFProbeVideoCodecs): boolean;
  isAudioValidForContainer(audioCodec: FFProbeAudioCodecs): boolean;
  mimeType(): string;
  videoEncoder(): string;
  audioEncoder(): string;
  getBitrateParams(scene: Scene): FFmpegOption[];
  getTranscodeOptions(scene: Scene & { path: string }): TranscodeOptions;
}

export abstract class BasicTranscoder implements Transcoder {
  abstract validateRequirements(scene: Scene): true | Error;
  abstract isVideoValidForContainer(videoCodec: FFProbeVideoCodecs): boolean;
  abstract isAudioValidForContainer(audioCodec: FFProbeAudioCodecs): boolean;
  abstract mimeType(): string;
  abstract videoEncoder(): string;
  abstract audioEncoder(): string;
  abstract getBitrateParams(scene: Scene): FFmpegOption[];

  getTranscodeOptions(scene: Scene & { path: string }): TranscodeOptions {
    const outputOptions: string[] = [];

    if (scene.meta.videoCodec && this.isVideoValidForContainer(scene.meta.videoCodec)) {
      outputOptions.push("-c:v copy");
    } else {
      outputOptions.push(`-c:v ${this.videoEncoder()}`);
    }
    if (scene.meta.audioCodec && this.isAudioValidForContainer(scene.meta.audioCodec)) {
      outputOptions.push("-c:a copy");
    } else {
      outputOptions.push(`-c:a ${this.audioEncoder()}`);
    }

    return {
      inputOptions: [],
      outputOptions,
      mimeType: this.mimeType(),
    };
  }
}
