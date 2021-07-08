import { VP8Transcoder } from './vp8';

export class VP9Transcoder extends VP8Transcoder {
  videoEncoder(): string {
    return "libvpx-vp9";
  }

}
