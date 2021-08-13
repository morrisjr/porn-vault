import args from "./args";
import { ensureBinaries } from "./binaries";
import { deleteIzzy } from "./binaries/izzy";
import { checkConfig, findAndLoadConfig, getConfig } from "./config";
import { IConfig } from "./config/schema";
import { loadEnv } from "./env";
import { applyExitHooks } from "./exit";
import { generateImageThumbnails } from "./generate_image_thumbnails";
import { queueLoop } from "./queue_loop";
import startServer from "./server";
import { handleError, logger } from "./utils/logger";
import { printMaxMemory } from "./utils/mem";

export async function startup() {
  loadEnv();

  logger.debug("Startup...");
  logger.debug(args);

  printMaxMemory();

  let config: IConfig;

  try {
    const shouldRestart = await findAndLoadConfig();
    if (shouldRestart) {
      process.exit(0);
    }

    config = getConfig();
    checkConfig(config);
  } catch (err) {
    return handleError(`Error during startup`, err, true);
  }

  if (args["generate-image-thumbnails"]) {
    await generateImageThumbnails();
  }

  if (args["process-queue"]) {
    await queueLoop(config);
  } else {
    if (args["update-izzy"]) {
      await deleteIzzy();
    }

    try {
      await ensureBinaries();
      applyExitHooks();
      await startServer();
    } catch (err) {
      handleError(`Startup error`, err, true);
    }
  }
}
