import * as vscode from "vscode";
import * as process from "process";
import * as os from "os";
import * as path from "path";

export const extensionId = "ViteLabs.soliditypp";

let _extensionPath = "";
let extension = vscode.extensions.getExtension(extensionId);
if (extension) {
  _extensionPath = extension.extensionPath;
}
export const extensionPath = _extensionPath;

export const debuggerType = "soliditypp";
export const languageId = "soliditypp";
export const BIN_DIR = path.resolve(extensionPath, "bin/");
export const VITE_DIR = path.resolve(BIN_DIR, "vite/");
export const SOLPPC_DIR = path.resolve(BIN_DIR, "solppc/");
export const PLATFORM_ERROR = "don't support win32";
export const GVITE_VERSION = "v2.2.0";
export const SOLPPC_VERSION = "v0.4.3";

export enum OS_PLATFORM {
  WIN32 = 1,
  WIN64 = 2,
  DARWIN = 3,
  LINUX = 4
}
export function getOsPlatform(): OS_PLATFORM {
  let platform = process.platform;
  let arch = os.arch();
  if (platform === "darwin") {
    return OS_PLATFORM.DARWIN;
  } else if (platform === "win32") {
    if (arch === "ia32") {
      return OS_PLATFORM.WIN32;
    } else if (arch === "x64") {
      return OS_PLATFORM.WIN64;
    }
  }
  return OS_PLATFORM.LINUX;
}
export function getGviteName(): string {
  let osPlatform = getOsPlatform();

  if (osPlatform === OS_PLATFORM.WIN32 || osPlatform === OS_PLATFORM.WIN64) {
    return "gvite.exe";
  } else {
    return "gvite";
  }
}

function getSolppcName(): string {
  let osPlatform = getOsPlatform();

  if (osPlatform === OS_PLATFORM.WIN32 || osPlatform === OS_PLATFORM.WIN64) {
    return "solppc.exe";
  } else {
    return "solppc";
  }
}

export function getSolppcPath(): string {
  return path.resolve(SOLPPC_DIR, getSolppcName());
}
