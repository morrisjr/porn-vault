import { logger } from "../utils/logger";
import { ensureIzzyExists } from "./izzy";

export async function ensureBinaries(): Promise<void> {
  let downloadedBins = 0;
  downloadedBins += await ensureIzzyExists();
  if (downloadedBins > 0) {
    logger.warn("Binaries downloaded. Please restart.");
    process.exit(0);
  }
}
