import { IM } from "./cli";

let _opts: IM.Options = {
  bin: "",
};

export function ImageMagick(filename: string): IM.State {
  return new IM.State(_opts, filename);
}

export function setImageMagickOptions(opts: IM.Options): void {
  _opts = opts;
}
