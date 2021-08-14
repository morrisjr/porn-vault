import { logger } from "../utils/logger";
import { ensureImageMagickExists } from "./imagemagick";
import { ensureIzzyExists } from "./izzy";

export async function ensureBinaries(): Promise<void> {
  let downloadedBins = 0;
  downloadedBins += await ensureIzzyExists();
  downloadedBins += await ensureImageMagickExists();
  if (downloadedBins > 0) {
    logger.warn("Binaries downloaded. Please restart.");
    process.exit(0);
  }
}
