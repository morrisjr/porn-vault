import { Request, Response } from "express";
import ffmpeg from "fluent-ffmpeg";
import path from "path";

import Scene from "../types/scene";
import { formatMessage, handleError, logger } from "../utils/logger";
import {
  audioIsValidForContainer,
  FFProbeContainers,
  getDirectPlayMimeType,
  videoIsValidForContainer,
} from "./ffprobe";

export enum StreamTypes {
  DIRECT = "direct",
  MP4 = "mp4",
  MKV = "mkv",
  WEBM = "webm",
}

const TranscodeCodecs = {
  [StreamTypes.MP4]: {
    video: "-c:v libx264",
    audio: "-c:a aac",
  },
  [StreamTypes.WEBM]: {
    video: "-c:v libvpx-vp9",
    audio: "-c:a libopus",
  },
};

function streamTranscode(
  scene: Scene & { path: string },
  req: Request,
  res: Response,
  outputOptions: string[],
  mimeType: string
): void {
  res.writeHead(200, {
    "Accept-Ranges": "bytes",
    Connection: "keep-alive",
    "Transfer-Encoding": "chunked",
    "Content-Disposition": "inline",
    "Content-Transfer-Enconding": "binary",
    "Content-Type": mimeType,
  });

  const startQuery = (req.query as { start?: string }).start || "0";
  const startSeconds = Number.parseFloat(startQuery);
  if (Number.isNaN(startSeconds)) {
    res.status(400).send(`Could not parse start query as number: ${startQuery}`);
    return;
  }

  outputOptions.unshift(`-ss ${startSeconds}`);

  // Time out the request after 2mn to prevent accumulating
  // too many ffmpeg processes. After that, the user should reload the page
  req.setTimeout(2 * 60 * 1000);

  let command: ffmpeg.FfmpegCommand | null = null;
  let didEnd = false;

  command = ffmpeg(scene.path)
    .outputOption(outputOptions)
    .on("start", (commandLine: string) => {
      logger.verbose(`Spawned Ffmpeg with command: ${commandLine}`);
    })
    .on("end", () => {
      logger.verbose(`Scene "${scene.path}" has been converted successfully`);
      didEnd = true;
    })
    .on("error", (err) => {
      if (!didEnd) {
        handleError(
          `Request finished or an error happened while transcoding scene "${scene.path}"`,
          err
        );
      }
    });

  res.on("close", () => {
    logger.verbose("Stream request closed, killing transcode");
    command?.kill("SIGKILL");
    didEnd = true;
  });

  command.pipe(res, { end: true });
}

export function streamDirect(
  scene: Scene & { path: string },
  _: Request,
  res: Response
): Response | void {
  const resolved = path.resolve(scene.path);
  return res.sendFile(resolved);
}

export function transcodeWebm(
  scene: Scene & { path: string },
  req: Request,
  res: Response
): Response | void {
  const webmOptions: string[] = [
    "-f webm",
    "-deadline realtime",
    "-cpu-used 5",
    "-row-mt 1",
    "-crf 30",
    "-b:v 0",
  ];
  if (
    scene.meta.videoCodec &&
    videoIsValidForContainer(FFProbeContainers.WEBM, scene.meta.videoCodec)
  ) {
    webmOptions.push("-c:v copy");
  } else {
    webmOptions.push(TranscodeCodecs[StreamTypes.WEBM].video);
  }
  if (
    scene.meta.audioCodec &&
    audioIsValidForContainer(FFProbeContainers.WEBM, scene.meta.audioCodec)
  ) {
    webmOptions.push("-c:a copy");
  } else {
    webmOptions.push(TranscodeCodecs[StreamTypes.WEBM].audio);
  }
  return streamTranscode(
    scene,
    req,
    res,
    webmOptions,
    getDirectPlayMimeType(FFProbeContainers.WEBM)
  );
}

export function transcodeMkv(
  scene: Scene & { path: string },
  req: Request,
  res: Response
): Response | void {
  if (FFProbeContainers.MKV !== scene.meta.container) {
    return res.status(400).send("Scene is not an mkv file");
  }

  const isMP4VideoValid =
    scene.meta.videoCodec && videoIsValidForContainer(FFProbeContainers.MP4, scene.meta.videoCodec);
  const isMP4AudioValid =
    scene.meta.audioCodec && audioIsValidForContainer(FFProbeContainers.MP4, scene.meta.audioCodec);

  // If any of the video codecs are not valid for mp4, we don't want to transcode mp4 (use webm instead)
  if (!isMP4VideoValid) {
    return res.status(400).send(`Video codec "${scene.meta.videoCodec}" is not valid for mp4`);
  }

  const mp4Options = [
    "-f mp4",
    "-c:v copy",
    "-movflags frag_keyframe+empty_moov+faststart",
    "-preset veryfast",
    "-crf 18",
  ];

  mp4Options.push(isMP4AudioValid ? "-c:a copy" : TranscodeCodecs[StreamTypes.MP4].audio);

  return streamTranscode(scene, req, res, mp4Options, getDirectPlayMimeType(FFProbeContainers.MP4));
}
