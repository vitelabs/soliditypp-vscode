
import * as process from 'process';
import * as os from 'os';
import * as path from 'path';
import { extensionPath } from './constant';
import * as fs from 'fs';
import * as decompress from 'decompress';
const decompressUnzip = require( 'decompress-unzip');
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

function getGvitePath () :string{
    let osPlatform = checkOsPlatform();
    let gvitePath = "";
    if (osPlatform === OS_PLATFORM.WIN32 || osPlatform === OS_PLATFORM.WIN64) {
        gvitePath = path.resolve(VITE_DIR, "gvite.exe");
    } else {
        gvitePath = path.resolve(VITE_DIR, "gvite");
    }
    return gvitePath
}

function checkGviteIsExisted() :boolean{
    return fs.existsSync(getGvitePath());
}

async function uncompressGvite () {
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


 
    await decompress(compressedFilePath, VITE_DIR, {
        plugins: [
            decompressUnzip()
        ]
    });
}

export default async function createGvite () {
    if (checkGviteIsExisted()) {
        return
    }

    await uncompressGvite();
}