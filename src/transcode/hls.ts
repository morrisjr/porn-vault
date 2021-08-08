import { MP4Transcoder } from "./mp4";
import { TranscodeOptions } from "./transcoder";

const SEGMENT_DURATION = 10;

export class HLSTranscoder extends MP4Transcoder {
  masterPlaylist(segmentBaseUrl: string, start: number) {
    const duration = this.scene.meta.duration! - start;
    let timeLeft = duration;
    let segmentStart = start;

    const segments: string[][] = [];
    const digits = Math.max(Math.ceil(duration / SEGMENT_DURATION / 10), 0);
    while (timeLeft) {
      const segmentLength = timeLeft < SEGMENT_DURATION ? timeLeft : SEGMENT_DURATION;

      segments.push([
        `#EXTINF:${segmentLength.toFixed(6)},`,
        `${segmentBaseUrl}/hls/segment_${segments.length
          .toString()
          .padStart(digits, "0")}.ts?start=${segmentStart}`,
      ]);

      segmentStart += segmentLength;
      timeLeft -= segmentLength;
    }

    return `#EXTM3U
#EXT-X-PLAYLIST-TYPE:VOD
#EXT-X-TARGETDURATION:${SEGMENT_DURATION}
#EXT-X-VERSION:4
#EXT-X-MEDIA-SEQUENCE:0
${segments.flat().join("\n")}
#EXT-X-ENDLIST`;
  }

  mimeType(): string {
    return "application/x-mpegURL";
  }

  getTranscodeOptions(): TranscodeOptions {
    const opts = super.getTranscodeOptions();
    opts.inputOptions.push(`-t ${SEGMENT_DURATION}`);
    // Copy timestamps so that start of a segment uses the same
    // timestamp instead of starting at 0
    opts.outputOptions.push("-copyts", "-f mpegts");
    return opts;
  }
}
