import decompress from "decompress";
import { access, chmod, mkdir } from "fs/promises";
import { arch, type } from "os";
import path from "path";

import { downloadFile } from "../../utils/download";
import { logger } from "../../utils/logger";
import { configPath } from "../../utils/path";
import { setImageMagickOptions } from ".";
import { IM } from "./cli";

const CONTAINER_DIR = configPath("imagemagick");

const binaries: { [x: string]: { url: string; unzip: boolean; bin: string } } = {
  Windows_NT: {
    url: "https://mirror.dogado.de/imagemagick/binaries/ImageMagick-7.1.0-4-portable-Q8-x64.zip",
    unzip: true,
    bin: `${CONTAINER_DIR}/`,
  },
  Linux: {
    url: "https://mirror.dogado.de/imagemagick/binaries/magick",
    unzip: false,
    bin: `${CONTAINER_DIR}/`,
  },
  Darwin: {
    url: "https://mirror.dogado.de/imagemagick/binaries/ImageMagick-x86_64-apple-darwin20.1.0.tar.gz",
    unzip: true,
    bin: `${CONTAINER_DIR}/ImageMagick-7.0.10/bin/`,
  },
};

const _config = binaries[type()];
if (_config) {
  setImageMagickOptions({ bin: _config.bin });
}

async function downloadImageMagick() {
  if (arch() !== "x64") {
    throw new Error(`Unsupported architecture ${arch()}`);
  }

  const binaryConfig = binaries[type()];
  if (!binaryConfig) {
    throw new Error(`Unsupported os ${type()}`);
  }

  if (
    !(await access(CONTAINER_DIR)
      .then(() => true)
      .catch(() => false))
  ) {
    await mkdir(CONTAINER_DIR);
  }

  const filename = binaryConfig.url.substring(binaryConfig.url.lastIndexOf("/") + 1);
  const downloadPath = path.join(CONTAINER_DIR, filename);
  logger.verbose(`Downloading ImageMagick from ${binaryConfig.url} to ${downloadPath}`);
  // eslint-disable-next-line camelcase
  if (binaryConfig.unzip) {
    await downloadFile(binaryConfig.url, downloadPath);
    await new Promise((resolve) => setTimeout(resolve, 200));
    await decompress(downloadPath, path.resolve(CONTAINER_DIR));
  } else {
    await downloadFile(binaryConfig.url, downloadPath);
  }
}

export async function ensureImageMagickExists(): Promise<0 | 1> {
  const binaryConfig = binaries[type()];
  if (!binaryConfig) {
    throw new Error(`Unsupported os ${type()}`);
  }

  const executable = path.join(binaryConfig.bin, IM.EXECUTABLE);

  const exists = await access(executable)
    .then(() => true)
    .catch(() => false);

  if (exists) {
    logger.verbose(`ImageMagick binary found at ${executable}`);
    setImageMagickOptions({ bin: binaryConfig.bin });
    await chmod(executable, "511");
    return 0;
  } else {
    logger.verbose("Downloading latest ImageMagick binary...");
    await downloadImageMagick();
    setImageMagickOptions({ bin: binaryConfig.bin });
    await chmod(executable, "511");
    return 1;
  }
}
