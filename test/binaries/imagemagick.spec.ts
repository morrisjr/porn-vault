import { expect } from "chai";
import { rm } from "fs/promises";
import { before } from "mocha";
import path from "path";

import { ImageMagick } from "../../src/binaries/imagemagick";
import { IM } from "../../src/binaries/imagemagick/cli";
import { ensureImageMagickExists } from "../../src/binaries/imagemagick/ensure";
import { resizeFixtures, sizeFixtures, TEST_IMAGE } from "./imagemagick.fixtures";

describe("imagemagick", async function () {
  before(async () => {
    await ensureImageMagickExists();
  });

  describe("size", () => {
    for (const fixture of sizeFixtures) {
      it("should get correct size", async () => {
        try {
          const res = await ImageMagick(path.resolve(fixture.path)).size();
          expect(res).to.deep.equal(fixture.expected);
        } catch (err) {
          if (!fixture.throws) {
            throw err;
          }
        }
      });
    }
  });

  describe("resize", () => {
    const output = path.resolve("./test/fixtures/files/dynamic/resize.jpg");

    before(async () => {
      await rm(output, { force: true });
    });

    afterEach(async () => {
      await rm(output, { force: true });
    });

    for (const fixture of resizeFixtures) {
      it(`should resize: ${fixture.name}`, async () => {
        try {
          const _image = ImageMagick(path.resolve(fixture.path)).resize(
            fixture.opts.width,
            fixture.opts.height,
            fixture.opts.sizeOpt
          );

          expect(_image.args()).to.deep.equal(fixture.expectedArgs);
          await _image.write(output);

          const res = await ImageMagick(output).size();
          expect(res).to.deep.equal(fixture.expected);
        } catch (err) {
          if (!fixture.throws) {
            throw err;
          }
        }
      });
    }
  });

  describe("append", () => {
    const output = path.resolve("./test/fixtures/files/dynamic/append.jpg");

    before(async () => {
      await rm(output, { force: true });
    });

    afterEach(async () => {
      await rm(output, { force: true });
    });

    it("simple append default direction (vertical)", async () => {
      const _image = await ImageMagick(TEST_IMAGE.path).append([TEST_IMAGE.path]);

      expect(_image.args()).to.deep.equal([
        "convert",
        `"${TEST_IMAGE.path}"`,
        `"${TEST_IMAGE.path}"`,
        "-append",
      ]);
      await _image.write(output);

      const res = await ImageMagick(output).size();
      expect(res).to.deep.equal({
        width: TEST_IMAGE.width,
        height: TEST_IMAGE.height * 2,
      });
    });

    it("simple append horizontal direction ", async () => {
      const _image = ImageMagick(TEST_IMAGE.path).append(
        [TEST_IMAGE.path],
        IM.AppendDirection.HORIZONTAL
      );

      const args = _image.args();
      expect(args).to.deep.equal([
        "convert",
        `"${TEST_IMAGE.path}"`,
        `"${TEST_IMAGE.path}"`,
        "+append",
      ]);
      await _image.write(output);

      const res = await ImageMagick(output).size();
      expect(res).to.deep.equal({
        width: TEST_IMAGE.width * 2,
        height: TEST_IMAGE.height,
      });
    });
  });

  describe("crop", () => {
    const output = path.resolve("./test/fixtures/files/dynamic/crop.jpg");

    before(async () => {
      await rm(output, { force: true });
    });

    afterEach(async () => {
      await rm(output, { force: true });
    });

    it("simple crop", async () => {
      const _image = ImageMagick(TEST_IMAGE.path).crop(0, 0, 100, 100);

      expect(_image.args()).to.deep.equal([
        "convert",
        `"${TEST_IMAGE.path}"`,
        "-crop",
        "100x100+0+0",
      ]);
      await _image.write(output);

      const res = await ImageMagick(output).size();
      expect(res).to.deep.equal({
        width: 100,
        height: 100,
      });
    });
  });

  describe("crop+resize", () => {
    const output = path.resolve("./test/fixtures/files/dynamic/crop.jpg");

    before(async () => {
      await rm(output, { force: true });
    });

    afterEach(async () => {
      await rm(output, { force: true });
    });

    it("simple crop", async () => {
      const _image = ImageMagick(TEST_IMAGE.path).crop(0, 0, 100, 100).resize(200, 200);

      expect(_image.args()).to.deep.equal([
        "convert",
        `"${TEST_IMAGE.path}"`,
        "-crop",
        "100x100+0+0",
        "-resize",
        `'200x200'`,
      ]);
      await _image.write(output);

      const res = await ImageMagick(output).size();
      expect(res).to.deep.equal({
        width: 200,
        height: 200,
      });
    });
  });

  describe("chained commands", () => {
    const output = path.resolve("./test/fixtures/files/dynamic/chained.jpg");

    before(async () => {
      await rm(output, { force: true });
    });

    afterEach(async () => {
      await rm(output, { force: true });
    });

    it("multiple commands", async () => {
      const _image = ImageMagick(TEST_IMAGE.path);
      expect(_image.args()).to.deep.equal([]);

      await _image.size();
      expect(_image.args()).to.deep.equal([]);

      _image.append([TEST_IMAGE.path]);
      expect(_image.args()).to.deep.equal([
        "convert",
        `"${TEST_IMAGE.path}"`,
        `"${TEST_IMAGE.path}"`,
        "-append",
      ]);

      _image.crop(0, 0, 100, 100).resize(200, 200);
      expect(_image.args()).to.deep.equal([
        "convert",
        `"${TEST_IMAGE.path}"`,
        `"${TEST_IMAGE.path}"`,
        "-append",
        "-crop",
        "100x100+0+0",
        "-resize",
        `'200x200'`,
      ]);

      await _image.write(output);
      expect(_image.args()).to.deep.equal([]);

      _image.resize(100, 100, IM.ResizeOption.IGNORE_RATIO);
      expect(_image.args()).to.deep.equal([
        "convert",
        `"${TEST_IMAGE.path}"`,
        "-resize",
        "'100x100!'",
      ]);

      await _image.write(output);
      expect(_image.args()).to.deep.equal([]);
    });
  });
});
