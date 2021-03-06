import * as fs from "fs";
import {
  SOLPPC_DIR,
  SOLPPC_VERSION,
  getOsPlatform,
  getSolppcPath,
  OS_PLATFORM,
  PLATFORM_ERROR
} from "./constant";
import uri from "./uri";
import * as path from "path";

import * as request from "request";

const decompress = require("decompress");
const decompressTargz = require("decompress-targz");

function getSolppcCompressedPath(): string {
  let osPlatform = getOsPlatform();
  let compressedFilePath = "";
  switch (osPlatform) {
    case OS_PLATFORM.DARWIN: {
      compressedFilePath = path.resolve(SOLPPC_DIR, "solppc_darwin.tar.gz");
      break;
    }
    case OS_PLATFORM.LINUX: {
      compressedFilePath = path.resolve(SOLPPC_DIR, "solppc_linux.tar.gz");
      break;
    }
    case OS_PLATFORM.WIN64: {
      compressedFilePath = path.resolve(SOLPPC_DIR, "solppc_win.tar.gz");
      break;
    }
    case OS_PLATFORM.WIN32: {
      throw PLATFORM_ERROR;
    }
  }
  return compressedFilePath;
}

async function downloadSolppc(
  print: ((s: string, progress: number, downloadUrl: string) => void) | null
) {
  let osPlatform = getOsPlatform();
  let downloadUri = "";

  switch (osPlatform) {
    case OS_PLATFORM.DARWIN: {
      downloadUri = uri.createSolppcDownload(SOLPPC_VERSION, "darwin");
      break;
    }
    case OS_PLATFORM.LINUX: {
      // compressedFilePath = path.resolve(VITE_DIR, "gvite-linux.zip");
      downloadUri = uri.createSolppcDownload(SOLPPC_VERSION, "linux");
      break;
    }
    case OS_PLATFORM.WIN64: {
      downloadUri = uri.createSolppcDownload(SOLPPC_VERSION, "win");
      // compressedFilePath = path.resolve(VITE_DIR, "gvite-win64.zip");
      break;
    }
    case OS_PLATFORM.WIN32: {
      throw PLATFORM_ERROR;
      // compressedFilePath = path.resolve(VITE_DIR, "gvite-win32.zip");
    }
  }

  // download
  await new Promise(function(resolve, reject) {
    let runTask = () => {
      print &&
        print(`Prepare to download solppc from ${downloadUri}`, 0, downloadUri);

      let requestStrem = request.get(downloadUri, {
        timeout: 15000
      });
      let fsStream = fs.createWriteStream(getSolppcCompressedPath());

      let downloadedSize = 0;
      let totalSize = 0;
      requestStrem
        .on("error", function(err: any) {
          if (err.code === "ETIMEDOUT" || err.code === "ESOCKETTIMEDOUT") {
            print && print(`Download solppc timeout, retrying`, 0, downloadUri);
            runTask();
            return;
          }
          reject(err);
        })
        .on("response", function(response: any) {
          if (response.statusCode != 200) {
            return reject(response);
          }

          totalSize = Number(response.headers["content-length"]);
        })
        .on("data", function(d: any) {
          downloadedSize += d.length;

          print &&
            print(
              "Downloading solppc",
              Number(((downloadedSize / totalSize) * 100).toFixed(2)),
              downloadUri
            );
        })
        .pipe(fsStream);

      fsStream.on("finish", function() {
        print && print("Solppc downloaded complete", 100, downloadUri);

        resolve();
      });
    };
    runTask();
  });
}

async function uncompressSolppc() {
  let files = await decompress(getSolppcCompressedPath(), SOLPPC_DIR, {
    plugins: [decompressTargz()]
  });

  if (getOsPlatform() === OS_PLATFORM.WIN64) {
    for (let i = 0; i < files.length; i++) {
      let file = files[i];
      let basename =  path.basename(file.path)
      if (file.type !== 'file' || basename.indexOf('.') === 0) {
        continue;
      }
      fs.renameSync(path.join(SOLPPC_DIR, file.path), path.join(SOLPPC_DIR, basename))
  
    }
  }
}

function checkSolppcIsExisted(): boolean {
  return fs.existsSync(getSolppcPath());
}

export function checkSolppcAvailable(): boolean {
  return checkSolppcIsExisted();
}

export default async function(
  print: ((s: string, progress: number, downloadUrl: string) => void) | null
) {
  if (checkSolppcAvailable()) {
    return;
  }

  await downloadSolppc(print);

  await uncompressSolppc();
}
