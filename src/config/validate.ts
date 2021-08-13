import { setFfmpegBinaryPaths, validateFFMPEGPaths } from "../binaries/ffmpeg";
import { IConfig } from "../config/schema";
import { checkUnusedPlugins, prevalidatePlugins } from "../plugins/validate";
import { logger } from "../utils/logger";
import { isRegExp } from "../utils/types";

/**
 * Does extra validation on the config.
 * Exits if invalid.
 * Sets the ffmpeg binary paths to the ones in the config
 *
 * @param config - the config the check
 * @throws
 */
export function validateConfigExtra(config: IConfig): void {
  prevalidatePlugins(config);
  checkUnusedPlugins(config);

  logger.info(`Registered plugins: ${JSON.stringify(Object.keys(config.plugins.register))}`);
  logger.debug("Loaded config:");
  logger.debug(config);

  if (config.scan.excludeFiles && config.scan.excludeFiles.length) {
    for (const regStr of config.scan.excludeFiles) {
      if (!isRegExp(regStr)) {
        throw new Error(`Invalid regex: "${regStr}" at "config.scan.excludeFiles".`);
      }
    }
  }

  validateFFMPEGPaths(config);
  setFfmpegBinaryPaths(config);
}
