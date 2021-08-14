import * as gm from "gm";
import stream from "stream";

declare module "gm" {
  interface State {
    append(image: string[], ltr?: boolean): State;
    resize(width: number | null, height: number, option?: ResizeOption): State;
    sizeAsync: (opts?: gm.GetterOptions) => Promise<gm.Dimensions | undefined>;
    writeAsync: (
      filename: string
    ) => Promise<[stdout: stream.Readable, stderr: stream.Readable, cmd: string]>;
  }
}
