import { getConfig } from "../config";
import { FFProbeAudioCodecs, FFProbeVideoCodecs } from "../ffmpeg/ffprobe";
import Scene from "../types/scene";
import { BasicTranscoder, FFmpegOption, TranscodeOptions } from "./transcoder";

export class WebmTranscoder extends BasicTranscoder {
  validateRequirements(scene: Scene): true | Error {
    return true;
  }

  mimeType(): string {
    return "video/webm";
  }

  videoEncoder(): string {
    return "libvpx-vp9";
  }

  audioEncoder(): string {
    return "libopus";
  }

  isVideoValidForContainer(videoCodec: FFProbeVideoCodecs): boolean {
    return [FFProbeVideoCodecs.VP8, FFProbeVideoCodecs.VP9].includes(videoCodec);
  }

  isAudioValidForContainer(audioCodec: FFProbeAudioCodecs): boolean {
    return [FFProbeAudioCodecs.VORBIS, FFProbeAudioCodecs.OPUS].includes(audioCodec);
  }

  getBitrateParams(scene: Scene): FFmpegOption[] {
    return [
      "-b:v 0", // Bitrate must be 0 to use constant quality (like x264) instead of constrained quality
    ];
  }

  getTranscodeOptions(scene: Scene & { path: string }): TranscodeOptions {
    const { inputOptions, outputOptions, mimeType } = super.getTranscodeOptions(scene);
    const webmConfig = getConfig().transcode.webm;

    outputOptions.push(
      "-f webm",
      `-deadline ${webmConfig.deadline}`,
      `-cpu-used ${webmConfig.cpuUsed}`,
      "-row-mt 1", // Enable tile row multithreading
      `-crf ${webmConfig.crf}`,
      ...this.getBitrateParams(scene)
    );

    return {
      inputOptions,
      outputOptions,
      mimeType,
    };
  }
}
