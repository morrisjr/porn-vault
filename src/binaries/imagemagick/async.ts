/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import gm from "gm";
import stream from "stream";
import { promisify } from "util";

gm.prototype.sizeAsync = promisify(gm.prototype.size);

gm.prototype.writeAsync = function writeAsync(filename: string) {
  return new Promise((resolve, reject) => {
    this.write(
      filename,
      (
        err: Error | null,
        ...res: [stdout: stream.Readable, stderr: stream.Readable, cmd: string]
      ) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(res);
        }
      }
    );
  });
};
