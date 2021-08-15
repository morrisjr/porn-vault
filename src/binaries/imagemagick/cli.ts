import { exec } from "child_process";
import { type } from "os";

import { logger } from "../../utils/logger";

export namespace IM {
  export const EXECUTABLE: string = type() === "Windows_NT" ? `magick.exe` : "magick";

  export interface Options {
    bin: string;
  }

  export type Dimensions = { width: number; height: number } | undefined;

  export enum ResizeOption {
    /** Width and height are specified in percents */
    PERCENTAGE = "percentage",
    /** Specify maximum area in pixels */
    AREA = "area",
    /** Ignore aspect ratio */
    IGNORE_RATIO = "ignore_ratio",
    /** Width and height are minimum values */
    MIN_VALUES = "min_values",
    /** Change dimensions only if image is smaller than width or height */
    UPSCALE = "upscale",
    /** Change dimensions only if image is larger than width or height */
    DOWNSCALE = "downscale",
  }

  export const ResizeMap: { [key in ResizeOption]: string } = {
    [ResizeOption.PERCENTAGE]: "%",
    [ResizeOption.AREA]: "@",
    [ResizeOption.IGNORE_RATIO]: "!",
    [ResizeOption.MIN_VALUES]: "^",
    [ResizeOption.UPSCALE]: "<",
    [ResizeOption.DOWNSCALE]: ">",
  };

  export enum AppendDirection {
    VERTICAL = "-append",
    HORIZONTAL = "+append",
  }

  export class State {
    private _executable: string;
    private _inFile: string;

    private _subCommand: [subCommand?: string, inFile?: string] = [];
    private _commands: string[][] = [];
    private _outFile: string | null = null;

    constructor(opts: Options, filename: string) {
      if (opts.bin) {
        this._executable = `${opts.bin}${opts.bin.endsWith("/") ? "" : "/"}${IM.EXECUTABLE}`;
      } else {
        this._executable = IM.EXECUTABLE;
      }

      this._inFile = `"${filename}"`;
    }

    private _setSubCommand(subCommand: string, inFile?: string): void {
      this._subCommand = [subCommand, inFile];
    }

    private _addCommand(...args: string[]): void {
      this._commands.push([...args]);
    }

    private _clearArgs(): void {
      this._subCommand = [];
      this._commands = [];
      this._outFile = null;
    }

    args() {
      const args = [...this._subCommand.filter(Boolean), ...this._commands.flat()];
      if (this._outFile) {
        args.push(`"${this._outFile}"`);
      }
      return args;
    }

    private _exec(): Promise<string> {
      return new Promise((resolve, reject) => {
        const cmd = `${this._executable} ${this.args().join(" ")}`;

        logger.verbose(`Executing ImageMagick: ${cmd}`);

        exec(cmd, (error, stdout, stderr) => {
          // Clear args so another command can be executed after this one
          // using the same input file
          this._clearArgs();

          if (error) {
            return reject(error);
          }
          if (stderr) {
            return reject(stderr);
          }
          return resolve(stdout);
        });
      });
    }

    async size(): Promise<IM.Dimensions> {
      this._setSubCommand("identify");
      this._addCommand("-format", `"%wx%h"`, this._inFile);
      const val = await this._exec();

      if (!val) {
        return undefined;
      }

      // We only want the size of the first frame.
      // Each frame is separated by a space.
      const split = val.split(" ")[0].split("x") ?? null;
      if (!split) {
        return undefined;
      }

      const width = parseInt(split[0], 10);
      const height = parseInt(split[1], 10);

      if (Number.isNaN(width) || Number.isNaN(height)) {
        return undefined;
      }

      return {
        width: width,
        height: height,
      };
    }

    resize(width: number | null, height: number | null, opt?: ResizeOption): IM.State {
      let size = "";
      if (width !== null && height === null) {
        size = `${width}`;
      } else if (width !== null && height !== null) {
        size = `${width}x${height}`;
      } else if (width === null && height !== null) {
        size = `x${height}`;
      }
      if (opt) {
        size = `${size}${ResizeMap[opt]}`;
      }

      // Enclose in quotes to preserve special characters (<>^)
      size = `'${size}'`;

      this._setSubCommand("convert", this._inFile);
      this._addCommand("-resize", size);

      return this;
    }

    append(filenames: string[], direction: AppendDirection = AppendDirection.VERTICAL): IM.State {
      this._setSubCommand("convert", this._inFile);
      this._addCommand(...filenames.map((f) => `"${f}"`), direction);

      return this;
    }

    crop(left: number, top: number, width: number, height: number): IM.State {
      const numberWithSign = (n: number): string => (n >= 0 ? `+${n}` : n.toString());

      const crop = `${width}x${height}${numberWithSign(left)}${numberWithSign(top)}`;

      this._setSubCommand("convert", this._inFile);
      this._addCommand("-crop", crop);

      return this;
    }

    async write(filename: string): Promise<string> {
      this._outFile = filename;
      return this._exec();
    }
  }
}
