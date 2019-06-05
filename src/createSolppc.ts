import * as fs from 'fs';
import { SOLPPC_DIR, getOsPlatform, getSolppcPath, OS_PLATFORM, PLATFORM_ERROR } from './constant';
import  uri from './uri';
import * as path from 'path';
import * as request from 'request';
import SolidityppDebugSession from './debugSession';
import * as decompress from 'decompress';
import {
    OutputEvent
} from 'vscode-debugadapter';

const decompressTargz = require('decompress-targz');




function getSolppcCompressedPath () :string{
    let osPlatform = getOsPlatform();
    let compressedFilePath = ''
    switch (osPlatform) {
        case OS_PLATFORM.DARWIN: {
            compressedFilePath = path.resolve(SOLPPC_DIR, "solppc_darwin.zip");
            break;
        }
        case OS_PLATFORM.LINUX: {
            compressedFilePath = path.resolve(SOLPPC_DIR, "solppc_linux.zip");
            break;

        }
        case OS_PLATFORM.WIN64: {
            compressedFilePath = path.resolve(SOLPPC_DIR, "solppc_win.zip");                 
            break;

        }
        case OS_PLATFORM.WIN32: {
            throw PLATFORM_ERROR

        }
    }
    return compressedFilePath
}

function checkGviteIsExisted() :boolean{
    return fs.existsSync(getSolppcPath());
}

async function downloadSolppc (ds: SolidityppDebugSession) {
    let osPlatform = getOsPlatform();
    let downloadUri = ""

    switch (osPlatform) {
        case OS_PLATFORM.DARWIN: {
            downloadUri = uri.solppcDownload.darwin
            break;
        }
        case OS_PLATFORM.LINUX: {
            // compressedFilePath = path.resolve(VITE_DIR, "gvite-linux.zip");
            downloadUri = uri.solppcDownload.linux
            break;

        }
        case OS_PLATFORM.WIN64: {
            downloadUri = uri.solppcDownload.win64
            // compressedFilePath = path.resolve(VITE_DIR, "gvite-win64.zip");                      
            break;

        }
        case OS_PLATFORM.WIN32: {
            throw PLATFORM_ERROR
            // compressedFilePath = path.resolve(VITE_DIR, "gvite-win32.zip");
        }
    }

    // download
    await new Promise(function (resolve, reject) {
         ds.sendEvent(new OutputEvent('Downloading solppc...\n', 'stdout'))

        let requestStrem = request(downloadUri)
        let fsStream = fs.createWriteStream(getSolppcCompressedPath())

        let downloadedSize = 0
        let totalSize = 0 
        requestStrem.on('error', function (err) {
            reject(err)
        }).on('response', function (response) {
            if (response.statusCode != 200) {
                return reject(response)
            }

            totalSize = Number(response.headers["content-length"])
        }).on('data', function (d) {
            downloadedSize += d.length
            ds.sendEvent(new OutputEvent(`Downloading solppc: ${((downloadedSize / totalSize) * 100).toFixed(2)}%\n`, 'stdout'))
        }).pipe(fsStream)

        fsStream.on("finish", function () {
             ds.sendEvent(new OutputEvent('Solppc downloaded complete\n', 'stdout'))
             resolve()  
        })
    })
}

async function uncompressSolppc () {
    await decompress(getSolppcCompressedPath(), SOLPPC_DIR, {
        plugins: [
            decompressTargz()
        ]
    })
}

export default async function (ds: SolidityppDebugSession) {
    if (checkGviteIsExisted()) {
        return
    }

    await downloadSolppc(ds);

    await uncompressSolppc();
}