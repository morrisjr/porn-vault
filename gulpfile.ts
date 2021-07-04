import { exec, ExecOptions } from "child_process";
import { mkdir, rm } from "fs/promises";
import { dest, src } from "gulp";
import zip from "gulp-zip";
import yargs from "yargs";

import { version as packageVersion } from "./package.json";
import { version as assetsVersion } from "./assets/version.json";

const gulpArgs = yargs.string("build-version").argv;

/**
 * Usage with npm: npm run build:linux -- --build-version <version>
 * Usage with gulp: gulp buildWin --build-version <version>
 */

const RELEASE_DIR = "./releases";

const TARGET_GENERIC_SOURCE = "generic";

enum PkgBuildTargets {
  NODE14 = "node14",
  WINDOWS = "node14-win-x64",
  LINUX = "node14-linux-x64",
  MAC = "node14-macos-x64",
  ARMV7 = "node14-linux-armv7",
  ARM64 = "node14-linux-arm64",
  HOST = "host",
}

type Target = PkgBuildTargets | typeof TARGET_GENERIC_SOURCE;

const getOutDir = (pkgTarget: Target) => {
  const main = `${RELEASE_DIR}/${pkgTarget}`;
  if (gulpArgs["build-version"]) {
    return `${main}_${gulpArgs["build-version"]}`;
  }
  return main;
};

const BuildTargetNames = {
  [TARGET_GENERIC_SOURCE]: "generic",
  [PkgBuildTargets.NODE14]: "node14",
  [PkgBuildTargets.WINDOWS]: "windows",
  [PkgBuildTargets.LINUX]: "linux",
  [PkgBuildTargets.MAC]: "macos",
  [PkgBuildTargets.ARMV7]: "armv7",
  [PkgBuildTargets.ARM64]: "arm64",
  [PkgBuildTargets.HOST]: "host",
};

const MAIN_TARGETS: Target[] = [
  TARGET_GENERIC_SOURCE,
  PkgBuildTargets.WINDOWS,
  PkgBuildTargets.LINUX,
  PkgBuildTargets.MAC,
];

function checkVersion() {
  const buildVersion = gulpArgs["build-version"];
  if (!buildVersion) {
    console.log("WARN: did not receive version");
  } else if (buildVersion !== packageVersion) {
    throw new Error(
      `argument build version "${buildVersion}" is not the same as the version in package.json: "${packageVersion}"`
    );
  } else if (packageVersion !== assetsVersion) {
    throw new Error(
      `package.json version "${packageVersion}" is not the same as the version in assets/version.json: "${assetsVersion}"`
    );
  }
}

async function copy(source: string, target: string) {
  return new Promise((resolve, reject) => {
    src(source).pipe(dest(target)).on("end", resolve).on("error", reject);
  });
}

async function execAsync(cmd: string, opts: ExecOptions = {}) {
  return new Promise((resolve, reject) => {
    exec(cmd, opts, (err, stdout, stderr) => {
      console.log(stdout);
      console.error(stderr);
      if (err) {
        reject(err);
      } else {
        resolve(stdout || stderr);
      }
    });
  });
}

export async function installApp() {
  return execAsync("npm ci", { cwd: "./app" });
}

export async function buildApp() {
  return execAsync("npm run build", { cwd: "./app" });
}

async function runVersionScript() {
  return execAsync("node version");
}

async function transpileProd() {
  return execAsync("npm run transpile:prod");
}

async function packageServer(target: PkgBuildTargets, outPath: string) {
  return execAsync(
    `npx pkg . --targets ${target} --options max_old_space_size=8192 --out-path ${outPath}`
  );
}

async function buildServer(pkgTarget: Target, outDir: string) {
  await runVersionScript();
  await transpileProd();
  if (pkgTarget === TARGET_GENERIC_SOURCE) {
    await copy("./build/**/*", outDir);
  } else {
    await packageServer(pkgTarget, outDir);
  }
}

async function buildPlatform(pkgTarget: Target) {
  checkVersion();

  const outDir = getOutDir(pkgTarget);

  await rm(outDir, { recursive: true, force: true });
  await mkdir(`${outDir}/app/dist`, { recursive: true });

  await Promise.all([
    copy("./views/**/*", `${outDir}/views`),
    copy("./assets/**/*", `${outDir}/assets`),
    (async () => {
      await buildApp();
      await copy("./app/dist/**/*", `${outDir}/app/dist`);
    })(),
    buildServer(pkgTarget, outDir),
  ]);
}

async function zipRelease(buildTarget: Target) {
  checkVersion();

  const friendlyTargetName = BuildTargetNames[buildTarget];

  const finalOutZip = gulpArgs["build-version"]
    ? `porn-vault_${gulpArgs["build-version"]}_${friendlyTargetName}.zip`
    : `porn-vault_${friendlyTargetName}.zip`;

  return new Promise((resolve, reject) => {
    src(`${getOutDir(buildTarget)}/**/*`)
      .pipe(zip(finalOutZip))
      .pipe(dest(RELEASE_DIR))
      .on("end", resolve)
      .on("error", reject);
  });
}

export const buildGeneric = () => buildPlatform(TARGET_GENERIC_SOURCE);
export const zipGeneric = () => zipRelease(TARGET_GENERIC_SOURCE);

export const buildNode14 = () => buildPlatform(PkgBuildTargets.NODE14);
export const zipNode14 = () => zipRelease(PkgBuildTargets.NODE14);

export const buildWindows = () => buildPlatform(PkgBuildTargets.WINDOWS);
export const zipWindows = () => zipRelease(PkgBuildTargets.WINDOWS);

export const buildLinux = () => buildPlatform(PkgBuildTargets.LINUX);
export const zipLinux = () => zipRelease(PkgBuildTargets.LINUX);

export const buildMac = () => buildPlatform(PkgBuildTargets.MAC);
export const zipMac = () => zipRelease(PkgBuildTargets.MAC);

export const buildArmv7 = () => buildPlatform(PkgBuildTargets.ARMV7);
export const zipArmv7 = () => zipRelease(PkgBuildTargets.ARMV7);

export const buildArm64 = () => buildPlatform(PkgBuildTargets.ARM64);
export const zipArm64 = () => zipRelease(PkgBuildTargets.ARM64);

export const buildHost = () => buildPlatform(PkgBuildTargets.HOST);
export const zipHost = () => zipRelease(PkgBuildTargets.HOST);

export async function buildAll() {
  checkVersion();

  await Promise.all(
    MAIN_TARGETS.map(async (pkgTarget) => {
      await rm(getOutDir(pkgTarget), { recursive: true, force: true });
      await mkdir(`${getOutDir(pkgTarget)}/app/dist`, { recursive: true });
    })
  );

  await Promise.all([
    ...MAIN_TARGETS.flatMap((pkgTarget) => [
      copy("./views/**/*", `${getOutDir(pkgTarget)}/views`),
      copy("./assets/**/*", `${getOutDir(pkgTarget)}/assets`),
    ]),
    (async () => {
      await buildApp();
      await Promise.all(
        MAIN_TARGETS.map((pkgTarget) => copy("./app/dist/**/*", `${getOutDir(pkgTarget)}/app/dist`))
      );
    })(),
    (async () => {
      await runVersionScript();
      await transpileProd();
      await Promise.all(
        MAIN_TARGETS.map((pkgTarget) =>
          pkgTarget === TARGET_GENERIC_SOURCE
            ? copy("./build/**/*", getOutDir(pkgTarget))
            : packageServer(pkgTarget, getOutDir(pkgTarget))
        )
      );
    })(),
  ]);
}

export async function zipAll() {
  await Promise.all(MAIN_TARGETS.map((pkgTarget) => zipRelease(pkgTarget)));
}
