import Jimp from "jimp";

import { izzyVersion, resetIzzy, spawnIzzy } from "./binaries/izzy";
import { collectionDefinitions, collections, loadStore } from "./database";
import { applyExitHooks } from "./exit";
import { isBlacklisted } from "./search/image";
import Image from "./types/image";
import { handleError, logger } from "./utils/logger";
import { libraryPath } from "./utils/path";

function skipImage(image: Image) {
  if (!image.path) {
    logger.warn(`Image ${image._id}: no path`);
    return true;
  }
  if (image.thumbPath) {
    return true;
  }
  if (isBlacklisted(image.name)) {
    return true;
  }
  return false;
}

export async function generateImageThumbnails(): Promise<void> {
  if (await izzyVersion().catch(() => false)) {
    logger.info("Izzy already running, clearing...");
    await resetIzzy();
  } else {
    await spawnIzzy();
  }
  await loadStore(collectionDefinitions.images);
  await collections.images.compact();
  applyExitHooks();

  const images = await Image.getAll();

  let i = 0;
  let amountImagesToBeProcessed = 0;

  images.forEach((image) => {
    if (!skipImage(image)) {
      amountImagesToBeProcessed++;
    }
  });

  for (const image of images) {
    try {
      if (skipImage(image)) {
        continue;
      }
      i++;
      const jimpImage = await Jimp.read(image.path!);
      // Small image thumbnail
      logger.verbose(
        `${i}/${amountImagesToBeProcessed}: Creating image thumbnail for ${image._id}`
      );
      if (jimpImage.bitmap.width > jimpImage.bitmap.height && jimpImage.bitmap.width > 320) {
        jimpImage.resize(320, Jimp.AUTO);
      } else if (jimpImage.bitmap.height > 320) {
        jimpImage.resize(Jimp.AUTO, 320);
      }
      image.thumbPath = libraryPath(`thumbnails/images/${image._id}.jpg`);
      await jimpImage.writeAsync(image.thumbPath);
      await collections.images.upsert(image._id, image);
    } catch (error) {
      handleError(`${image._id} (${image.path}) failed`, error);
    }
  }
  process.exit(0);
}
