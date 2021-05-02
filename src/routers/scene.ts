import { Request, Response, Router } from "express";
import ffmpeg from "fluent-ffmpeg";
import path from "path";

import { getConfig } from "../config";
import { sceneCollection } from "../database";
import Scene from "../types/scene";
import { handleError, logger } from "../utils/logger";
import { HardwareAccelerationDriver } from "./../config/schema";
import {
  audioIsValidForContainer,
  FFProbeContainers,
  getDirectPlayMimeType,
  videoIsValidForContainer,
} from "./../ffmpeg/ffprobe";

export enum SceneStreamTypes {
  DIRECT = "direct",
  MP4_DIRECT = "mp4_direct",
  MP4_TRANSCODE = "mp4_transcode",
  WEBM_TRANSCODE = "webm_transcode",
}

const TranscodeCodecs = {
  [SceneStreamTypes.MP4_DIRECT]: {
    video: "-c:v libx264",
    audio: "-c:a aac",
  },
  [SceneStreamTypes.WEBM_TRANSCODE]: {
    video: "-c:v libvpx-vp9",
    audio: "-c:a libopus",
  },
};

interface TranscodeOptions {
  inputOptions: string[];
  outputOptions: string[];
  mimeType: string;
}

function getVideoBitrateParam(scene: Scene, codec: string): string[] {
  if (!scene.meta.bitrate) {
    return [];
  }

  if (codec === "libx264") {
    return [`-maxrate ${scene.meta.bitrate}`, `-bufsize ${scene.meta.bitrate * 2}`];
  }

  return [
    `-b:v ${scene.meta.bitrate}`,
    `-maxrate ${scene.meta.bitrate}`,
    `-bufsize ${scene.meta.bitrate * 2}`,
  ];
}

function streamTranscode(
  scene: Scene & { path: string },
  req: Request,
  res: Response,
  options: TranscodeOptions
): void {
  res.writeHead(200, {
    "Accept-Ranges": "bytes",
    Connection: "keep-alive",
    "Transfer-Encoding": "chunked",
    "Content-Disposition": "inline",
    "Content-Transfer-Enconding": "binary",
    "Content-Type": options.mimeType,
  });

  const startQuery = (req.query as { start?: string }).start || "0";
  const startSeconds = Number.parseFloat(startQuery);
  if (Number.isNaN(startSeconds)) {
    res.status(400).send(`Could not parse start query as number: ${startQuery}`);
    return;
  }

  options.inputOptions.unshift(`-ss ${startSeconds}`);

  // Time out the request after 2mn to prevent accumulating
  // too many ffmpeg processes. After that, the user should reload the page
  req.setTimeout(2 * 60 * 1000);

  let command: ffmpeg.FfmpegCommand | null = null;

  command = ffmpeg(scene.path)
    .inputOptions(options.inputOptions)
    .outputOptions(options.outputOptions)
    .on("start", (commandLine: string) => {
      logger.verbose(`Spawned Ffmpeg with command: ${commandLine}`);
    })
    .on("end", () => {
      logger.verbose(`Scene "${scene.path}" has been converted successfully`);
    })
    .on("error", (err) => {
      handleError(
        `Request finished or an error happened while transcoding scene "${scene.path}"`,
        err
      );
    });

  res.on("close", () => {
    logger.verbose("Stream request closed, killing transcode");
    command?.kill("SIGKILL");
  });

  command.pipe(res, { end: true });
}

function streamDirect(scene: Scene & { path: string }, _: Request, res: Response): Response | void {
  const resolved = path.resolve(scene.path);
  return res.sendFile(resolved);
}

function transcodeWebm(
  scene: Scene & { path: string },
  req: Request,
  res: Response
): Response | void {
  const transcodeOpts = getConfig().transcode.webm;

  const webmOptions: string[] = [
    "-f webm",
    `-deadline ${transcodeOpts.deadline}`,
    `-cpu-used ${transcodeOpts.cpuUsed}`,
    "-row-mt 1", // Enable tile row multithreading
    `-crf ${transcodeOpts.crf}`,
    "-b:v 0", // Bitrate must be 0 to use constant quality (like x264) instead of constrained quality
  ];

  if (
    scene.meta.videoCodec &&
    videoIsValidForContainer(FFProbeContainers.WEBM, scene.meta.videoCodec)
  ) {
    webmOptions.push("-c:v copy");
  } else {
    webmOptions.push(TranscodeCodecs[SceneStreamTypes.WEBM_TRANSCODE].video);
  }
  if (
    scene.meta.audioCodec &&
    audioIsValidForContainer(FFProbeContainers.WEBM, scene.meta.audioCodec)
  ) {
    webmOptions.push("-c:a copy");
  } else {
    webmOptions.push(TranscodeCodecs[SceneStreamTypes.WEBM_TRANSCODE].audio);
  }

  return streamTranscode(scene, req, res, {
    inputOptions: [],
    outputOptions: webmOptions,
    mimeType: getDirectPlayMimeType(FFProbeContainers.WEBM),
  });
}

function copyMp4(scene: Scene & { path: string }, req: Request, res: Response): Response | void {
  const config = getConfig();

  const isMP4VideoValid =
    scene.meta.videoCodec && videoIsValidForContainer(FFProbeContainers.MP4, scene.meta.videoCodec);
  const isMP4AudioValid =
    scene.meta.audioCodec && audioIsValidForContainer(FFProbeContainers.MP4, scene.meta.audioCodec);

  // If the video codec is not valid for mp4, that means we can't just copy
  // the video stream. We should just transcode with webm
  if (!isMP4VideoValid) {
    return res.status(400).send(`Video codec "${scene.meta.videoCodec}" is not valid for mp4`);
  }

  const mp4Options = [
    "-f mp4",
    "-c:v copy",
    "-movflags frag_keyframe+empty_moov+faststart",
    `-preset ${config.transcode.h264.preset ?? "veryfast"}`,
    `-crf ${config.transcode.h264.crf ?? 23}`,
  ];

  mp4Options.push(
    isMP4AudioValid ? "-c:a copy" : TranscodeCodecs[SceneStreamTypes.MP4_DIRECT].audio
  );

  return streamTranscode(scene, req, res, {
    inputOptions: [],
    outputOptions: mp4Options,
    mimeType: getDirectPlayMimeType(FFProbeContainers.MP4),
  });
}

function transcodeMp4(
  scene: Scene & { path: string },
  req: Request,
  res: Response
): Response | void {
  const config = getConfig();
  const transcode = config.transcode;

  const inputOptions: string[] = [];
  const outputOptions: string[] = [];
  let vCodec = "";

  if (
    !transcode.hwaDriver ||
    !Object.values(HardwareAccelerationDriver.enum).includes(transcode.hwaDriver)
  ) {
    vCodec = "libx264";
  } else {
    switch (transcode.hwaDriver) {
      case HardwareAccelerationDriver.enum.vaapi:
        vCodec = "h264_vaapi";
        inputOptions.push(`-hwaccel vaapi`, `-hwaccel_output_format vaapi`);

        if (transcode.vaapiDevice) {
          inputOptions.push(
            `-init_hw_device vaapi=hwdev:${transcode.vaapiDevice}`,
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

  outputOptions.push(
    "-f mp4",
    `-c:v ${vCodec}`,
    "-movflags frag_keyframe+empty_moov+faststart",
    `-preset ${transcode.h264.preset ?? "veryfast"}`,
    `-crf ${transcode.h264.crf ?? 23}`,
    ...getVideoBitrateParam(scene, vCodec)
  );

  const isMP4AudioValid =
    scene.meta.audioCodec && audioIsValidForContainer(FFProbeContainers.MP4, scene.meta.audioCodec);
  outputOptions.push(
    isMP4AudioValid ? "-c:a copy" : TranscodeCodecs[SceneStreamTypes.MP4_DIRECT].audio
  );

  return streamTranscode(scene, req, res, {
    inputOptions,
    outputOptions,
    mimeType: "video/mp4",
  });
}

const router = Router();

router.get("/:scene", async (req, res, next) => {
  const sc = await Scene.getById(req.params.scene);
  if (!sc || !sc.path) {
    return next(404);
  }
  const scene = sc as Scene & { path: string };

  const streamType = (req.query as { type?: SceneStreamTypes }).type;

  if (!streamType || streamType === SceneStreamTypes.DIRECT) {
    return streamDirect(scene, req, res);
  }

  try {
    if (!scene.meta.container || !scene.meta.videoCodec || !scene.meta.bitrate) {
      logger.verbose(
        `Scene ${scene._id} doesn't have codec information to determine supported transcodes, running ffprobe`
      );
      await Scene.runFFProbe(scene);

      // Doesn't matter if this fails
      await sceneCollection.upsert(scene._id, scene).catch((err) => {
        handleError("Failed to update scene after updating codec information", err);
      });
    }
  } catch (err) {
    handleError("Error getting video codecs for transcode", err);
    return res.status(500).send("Could not determine video codecs for transcoding");
  }

  switch (streamType) {
    case SceneStreamTypes.MP4_DIRECT:
      return copyMp4(scene, req, res);
    case SceneStreamTypes.MP4_TRANSCODE:
      return transcodeMp4(scene, req, res);
    case SceneStreamTypes.WEBM_TRANSCODE:
      return transcodeWebm(scene, req, res);
    default:
      return res.sendStatus(400);
  }
});

export default router;
