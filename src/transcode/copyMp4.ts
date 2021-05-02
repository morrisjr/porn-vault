import { getConfig } from "../config";
import { FFProbeAudioCodecs, FFProbeVideoCodecs } from "../ffmpeg/ffprobe";
import Scene from "../types/scene";
import { BasicTranscoder, FFmpegOption, TranscodeOptions } from "./transcoder";

export class CopyMP4Transcoder extends BasicTranscoder {
  validateRequirements(scene: Scene): true | Error {
    // If the video codec is not valid for mp4, that means we can't just copy
    // the video stream. We should just transcode with webm
    if (!scene.meta.videoCodec || !this.isVideoValidForContainer(scene.meta.videoCodec)) {
      return new Error(`Video codec "${scene.meta.videoCodec}" is not valid for mp4`);
    }
    return true;
  }

  isVideoValidForContainer(videoCodec: FFProbeVideoCodecs): boolean {
    return [FFProbeVideoCodecs.H264, FFProbeVideoCodecs.H265, FFProbeVideoCodecs.VP9].includes(
      videoCodec
    );
  }

  isAudioValidForContainer(audioCodec: FFProbeAudioCodecs): boolean {
    return [FFProbeAudioCodecs.AAC, FFProbeAudioCodecs.MP3, FFProbeAudioCodecs.OPUS].includes(
      audioCodec
    );
  }

  mimeType(): string {
    return "video/mp4";
  }

  videoEncoder(): string {
    return "copy";
  }

  audioEncoder(): string {
    return "aac";
  }

  getBitrateParams(scene: Scene): FFmpegOption[] {
    return [];
  }

  getTranscodeOptions(scene: Scene & { path: string }): TranscodeOptions {
    const { inputOptions, outputOptions, mimeType } = super.getTranscodeOptions(scene);
    const h264Config = getConfig().transcode.h264;

    outputOptions.push(
      "-movflags frag_keyframe+empty_moov+faststart",
      `-preset ${h264Config.preset ?? "veryfast"}`,
      `-crf ${h264Config.crf ?? 23}`,
      ...this.getBitrateParams(scene)
    );

    return {
      inputOptions,
      outputOptions,
      mimeType,
    };
  }
}
