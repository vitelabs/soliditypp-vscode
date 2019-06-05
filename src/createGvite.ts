import * as process from 'process';
import * as os from 'os';
import * as path from 'path';
import { extensionPath } from './constant';
import * as fs from 'fs';
import  uri from './uri';
import * as request from 'request';
import * as decompress from 'decompress';
import SolidityppDebugSession from './debugSession';
import {
    OutputEvent
} from 'vscode-debugadapter';

// const decompressUnzip = require( 'decompress-unzip');
const decompressTargz = require('decompress-targz');


const VITE_DIR = path.resolve(extensionPath, "bin/vite/");

enum OS_PLATFORM {
    WIN32 = 1,
    WIN64 = 2,
    DARWIN=3,
    LINUX = 4,
}

function checkOsPlatform ():OS_PLATFORM {
    let platform = process.platform;
    let arch = os.arch()
    if(platform === 'darwin') {
        return OS_PLATFORM.DARWIN
    } else if (platform === 'win32') {
        if (arch === 'ia32') {
            return OS_PLATFORM.WIN32
        } else if (arch === 'x64') {
            return OS_PLATFORM.WIN64
        }
    } 
    return OS_PLATFORM.LINUX
}

function getGviteName ():string {
    let osPlatform = checkOsPlatform();

    if (osPlatform === OS_PLATFORM.WIN32 || osPlatform === OS_PLATFORM.WIN64) {
        return "gvite.exe"
    } else {
        return "gvite"
    }
}

function getGvitePath () :string {
    return path.resolve(VITE_DIR, getGviteName())
}


function getGviteCompressedPath () :string{
    let osPlatform = checkOsPlatform();
    let compressedFilePath = ''
    switch (osPlatform) {
        case OS_PLATFORM.DARWIN: {
            compressedFilePath = path.resolve(VITE_DIR, "gvite-darwin.zip");
            break;
        }
        case OS_PLATFORM.LINUX: {
            compressedFilePath = path.resolve(VITE_DIR, "gvite-linux.zip");
            break;

        }
        case OS_PLATFORM.WIN64: {
            compressedFilePath = path.resolve(VITE_DIR, "gvite-win64.zip");                 
            break;

        }
        case OS_PLATFORM.WIN32: {
            compressedFilePath = path.resolve(VITE_DIR, "gvite-win32.zip");                    
            break;

        }
    }
    return compressedFilePath
}

function checkGviteIsExisted() :boolean{
    return fs.existsSync(getGvitePath());
}

function checkCompressedGviteIsExisted() :boolean{
    return fs.existsSync(getGviteCompressedPath());
}


// function showDownloadProgress () {

// }

// function hideDownloadProgress () {
    
// }

// async function uncompressGvite () {
//     let osPlatform = checkOsPlatform();
//     let compressedFilePath = ''
//     switch (osPlatform) {
//         case OS_PLATFORM.DARWIN: {
//             compressedFilePath = path.resolve(VITE_DIR, "gvite-darwin.zip");
//             break;
//         }
//         case OS_PLATFORM.LINUX: {
//             // compressedFilePath = path.resolve(VITE_DIR, "gvite-linux.zip");
//             throw PLATFORM_ERROR            
//             break;

//         }
//         case OS_PLATFORM.WIN64: {
//             // compressedFilePath = path.resolve(VITE_DIR, "gvite-win64.zip");
//             throw PLATFORM_ERROR                        
//             break;

//         }
//         case OS_PLATFORM.WIN32: {
//             // compressedFilePath = path.resolve(VITE_DIR, "gvite-win32.zip");
//             throw PLATFORM_ERROR                        
//             break;

//         }
//     }


 

// }


async function downloadGvite (ds: SolidityppDebugSession) {
    let osPlatform = checkOsPlatform();
    let downloadUri = ""

    switch (osPlatform) {
        case OS_PLATFORM.DARWIN: {
            downloadUri = uri.gviteDownload.darwin
            break;
        }
        case OS_PLATFORM.LINUX: {
            // compressedFilePath = path.resolve(VITE_DIR, "gvite-linux.zip");
            downloadUri = uri.gviteDownload.linux
            break;

        }
        case OS_PLATFORM.WIN64: {
            downloadUri = uri.gviteDownload.win64
            // compressedFilePath = path.resolve(VITE_DIR, "gvite-win64.zip");                      
            break;

        }
        case OS_PLATFORM.WIN32: {
            downloadUri = uri.gviteDownload.win32
            // compressedFilePath = path.resolve(VITE_DIR, "gvite-win32.zip");                
            break;
        }
    }

    // download
    await new Promise(function (resolve, reject) {
         ds.sendEvent(new OutputEvent('Downloading vite...\n', 'stdout'))

        let requestStrem = request(downloadUri)
        let fsStream = fs.createWriteStream(getGviteCompressedPath())

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
            ds.sendEvent(new OutputEvent(`Downloading vite: ${((downloadedSize / totalSize) * 100).toFixed(2)}%\n`, 'stdout'))
        }).pipe(fsStream)

        fsStream.on("finish", function () {
             ds.sendEvent(new OutputEvent('Vite downloaded complete\n', 'stdout'))
             resolve()  
        })
    })
}

async function uncompressGvite () {
    await decompress(getGviteCompressedPath(), VITE_DIR, {
        plugins: [
            decompressTargz()
        ]
    }).then(files => {
        let gviteName = getGviteName()
        let directory = files[0].path
        for (let i = 1; i < files.length; i++) {
            let filePath = files[i].path
            let fileName = filePath.replace(directory, "")
            if (fileName === gviteName) {
                fs.renameSync(path.join(VITE_DIR, filePath), path.join(VITE_DIR, fileName))
                break;
            }
        }
        return files;
    });


}

export default async function createGvite (ds: SolidityppDebugSession) {
    if (checkGviteIsExisted()) {
        return
    }

    // if (!checkCompressedGviteIsExisted()) {
    // }
    await downloadGvite(ds);

    await uncompressGvite();
}