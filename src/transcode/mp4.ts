import { getConfig } from "../config";
import { HardwareAccelerationDriver } from "../config/schema";
import { FFProbeAudioCodecs, FFProbeVideoCodecs } from "../ffmpeg/ffprobe";
import Scene from "../types/scene";
import { BasicTranscoder, FFmpegOption, TranscodeOptions } from "./transcoder";

export class MP4Transcoder extends BasicTranscoder {
  currentVideoEncoder = this.videoEncoder();

  validateRequirements(scene: Scene): true | Error {
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
    return "libx264";
  }

  audioEncoder(): string {
    return "aac";
  }

  getBitrateParams(scene: Scene): FFmpegOption[] {
    if (!scene.meta.bitrate) {
      return [];
    }

    if (this.currentVideoEncoder === "libx264") {
      return [`-maxrate ${scene.meta.bitrate}`, `-bufsize ${scene.meta.bitrate * 2}`];
    }

    return [
      `-b:v ${scene.meta.bitrate}`,
      `-maxrate ${scene.meta.bitrate}`,
      `-bufsize ${scene.meta.bitrate * 2}`,
    ];
  }

  getTranscodeOptions(scene: Scene & { path: string }): TranscodeOptions {
    const { inputOptions, outputOptions, mimeType } = super.getTranscodeOptions(scene);
    const transcodeConfig = getConfig().transcode;

    let vCodec = this.videoEncoder();

    if (transcodeConfig.hwaDriver) {
      switch (transcodeConfig.hwaDriver) {
        case HardwareAccelerationDriver.enum.vaapi:
          vCodec = "h264_vaapi";
          inputOptions.push(`-hwaccel vaapi`, `-hwaccel_output_format vaapi`);

          if (transcodeConfig.vaapiDevice) {
            inputOptions.push(
              `-init_hw_device vaapi=hwdev:${transcodeConfig.vaapiDevice}`,
              "-hwaccel_device hwdev",
              "-filter_hw_device hwdev"
            );
            outputOptions.push("-vf format=nv12|vaapi,hwupload");
          }

          break;
        case HardwareAccelerationDriver.enum.qsv:
          vCodec = "h264_qsv";
          inputOptions.push(
            "-init_hw_device qsv=qsv:MFX_IMPL_hw_any",
            "-hwaccel qsv",
            "-filter_hw_device qsv"
          );

          break;
        case HardwareAccelerationDriver.enum.nvenc:
          vCodec = "h264_nvenc";
          inputOptions.push("-hwaccel nvenc", "-hwaccel_output_format cuda");
          break;
        case HardwareAccelerationDriver.enum.amf:
          vCodec = "h264_amf";
          inputOptions.push("-hwaccel d3d11va");
          break;
        case HardwareAccelerationDriver.enum.videotoolbox:
          vCodec = "h264_videotoolbox";
          inputOptions.push("-hwaccel videotoolbox");
          break;
      }
    }

    this.currentVideoEncoder = vCodec;

    outputOptions.push(
      "-f mp4",
      `-c:v ${vCodec}`,
      "-movflags frag_keyframe+empty_moov+faststart",
      `-preset ${transcodeConfig.h264.preset ?? "veryfast"}`,
      `-crf ${transcodeConfig.h264.crf ?? 23}`,
      ...this.getBitrateParams(scene)
    );

    return {
      inputOptions,
      outputOptions,
      mimeType,
    };
  }
}
