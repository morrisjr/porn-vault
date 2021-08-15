import path from "path";
import { IM } from "../../src/binaries/imagemagick/cli";

export const TEST_IMAGE = {
  path: path.resolve("./test/fixtures/files/dynamic_image001.jpg"),
  width: 200,
  height: 300,
};

export const sizeFixtures = [
  {
    path: TEST_IMAGE.path,
    expected: {
      width: TEST_IMAGE.width,
      height: TEST_IMAGE.height,
    },
    throws: false,
  },
  {
    path: "fake_image",
    expected: {},
    throws: true,
  },
];

export const resizeFixtures = [
  {
    name: "simple fit",
    path: TEST_IMAGE.path,
    opts: {
      width: 100,
      height: 100,
      sizeOpt: undefined,
    },
    // Fits to height 100
    expected: {
      width: 67,
      height: 100,
    },
    expectedArgs: ["convert", `"${TEST_IMAGE.path}"`, "-resize", "'100x100'"],
    throws: false,
  },
  {
    name: "area resize",
    path: TEST_IMAGE.path,
    opts: {
      width: 10000,
      height: null,
      sizeOpt: IM.ResizeOption.AREA,
    },
    // Resizes to 10000px^2 (preserving ratio)
    expected: {
      width: 81,
      height: 122,
    },
    expectedArgs: ["convert", `"${TEST_IMAGE.path}"`, "-resize", "'10000@'"],
    throws: false,
  },
  {
    name: "exact dimensions",
    path: TEST_IMAGE.path,
    opts: {
      width: 100,
      height: 100,
      sizeOpt: IM.ResizeOption.IGNORE_RATIO,
    },
    // Resizes exactly to specified dimensions
    expected: {
      width: 100,
      height: 100,
    },
    expectedArgs: ["convert", `"${TEST_IMAGE.path}"`, "-resize", "'100x100!'"],
    throws: false,
  },
  {
    name: "min values 1",
    path: TEST_IMAGE.path,
    opts: {
      width: TEST_IMAGE.width * 3,
      height: TEST_IMAGE.height * 2,
      sizeOpt: IM.ResizeOption.MIN_VALUES,
    },
    // Scaled to at least match width
    expected: {
      width: TEST_IMAGE.width * 3,
      height: TEST_IMAGE.height * 3,
    },
    expectedArgs: [
      "convert",
      `"${TEST_IMAGE.path}"`,
      "-resize",
      `'${TEST_IMAGE.width * 3}x${TEST_IMAGE.height * 2}^'`,
    ],
    throws: false,
  },
  {
    name: "min values 2",
    path: TEST_IMAGE.path,
    opts: {
      width: TEST_IMAGE.width * 2,
      height: TEST_IMAGE.height * 3,
      sizeOpt: IM.ResizeOption.MIN_VALUES,
    },
    // Scaled to at least match height
    expected: {
      width: TEST_IMAGE.width * 3,
      height: TEST_IMAGE.height * 3,
    },
    expectedArgs: [
      "convert",
      `"${TEST_IMAGE.path}"`,
      "-resize",
      `'${TEST_IMAGE.width * 2}x${TEST_IMAGE.height * 3}^'`,
    ],
    throws: false,
  },
  {
    name: "upscale with smaller dims",
    path: TEST_IMAGE.path,
    opts: {
      width: TEST_IMAGE.width / 2,
      height: TEST_IMAGE.height / 2,
      sizeOpt: IM.ResizeOption.UPSCALE,
    },
    // UPSCALE with smaller than original dimensions won't change
    expected: {
      width: TEST_IMAGE.width,
      height: TEST_IMAGE.height,
    },
    expectedArgs: [
      "convert",
      `"${TEST_IMAGE.path}"`,
      "-resize",
      `'${TEST_IMAGE.width / 2}x${TEST_IMAGE.height / 2}<'`,
    ],
    throws: false,
  },
  {
    name: "upscale with larger dims",
    path: TEST_IMAGE.path,
    opts: {
      width: TEST_IMAGE.width * 2,
      height: TEST_IMAGE.height * 2,
      sizeOpt: IM.ResizeOption.UPSCALE,
    },
    // UPSCALE with bigger than original dimensions will change
    expected: {
      width: TEST_IMAGE.width * 2,
      height: TEST_IMAGE.height * 2,
    },
    expectedArgs: [
      "convert",
      `"${TEST_IMAGE.path}"`,
      "-resize",
      `'${TEST_IMAGE.width * 2}x${TEST_IMAGE.height * 2}<'`,
    ],
    throws: false,
  },
  {
    name: "downscale with smaller dims",
    path: TEST_IMAGE.path,
    opts: {
      width: TEST_IMAGE.width / 2,
      height: TEST_IMAGE.height / 2,
      sizeOpt: IM.ResizeOption.DOWNSCALE,
    },
    // UPSCALE with smaller than original dimensions won't change
    expected: {
      width: TEST_IMAGE.width / 2,
      height: TEST_IMAGE.height / 2,
    },
    expectedArgs: [
      "convert",
      `"${TEST_IMAGE.path}"`,
      "-resize",
      `'${TEST_IMAGE.width / 2}x${TEST_IMAGE.height / 2}>'`,
    ],
    throws: false,
  },
  {
    name: "downscale with larger dims",
    path: TEST_IMAGE.path,
    opts: {
      width: TEST_IMAGE.width * 2,
      height: TEST_IMAGE.height * 2,
      sizeOpt: IM.ResizeOption.DOWNSCALE,
    },
    // UPSCALE with bigger than original dimensions will change
    expected: {
      width: TEST_IMAGE.width,
      height: TEST_IMAGE.height,
    },
    expectedArgs: [
      "convert",
      `"${TEST_IMAGE.path}"`,
      "-resize",
      `'${TEST_IMAGE.width * 2}x${TEST_IMAGE.height * 2}>'`,
    ],
    throws: false,
  },
];
