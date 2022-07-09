// import * as cp from "child_process";
import * as os from "os";
import * as path from "path";
// import * as readline from "readline";
import * as vscode from "vscode";

interface SolppcSettings  {
  outputSelection?: {
    [key:string]: {
      [key:string]: string[];
    };
  };
  [key:string]: any;
};

export function solppcInput(sourcePath: string, settings?: SolppcSettings): string {
  // https://docs.soliditylang.org/en/v0.8.14/using-the-compiler.html#compiler-input-and-output-json-description
  const input = {
    language: "Solidity",
    sources: {
      [sourcePath]: {
        urls: [
          sourcePath,
        ]
      }
    },
    settings: settings ?? {
      "outputSelection": {
        "*": {
          "*": ["abi", "evm.assembly", "evm.bytecode", "metadata", "storageLayout"]
        }
      },
    }
  };
  return JSON.stringify(input);
}

export async function getPathForExecutable(executableName: string): Promise<string> {
  const envVar = process.env[executableName.toUpperCase()];
  if (envVar) return envVar;

  if (await lookupInPath(executableName)) return executableName;

  return executableName;
}

async function lookupInPath(exec: string): Promise<boolean> {
  const paths = process.env.PATH ?? "";

  const candidates = paths.split(path.delimiter).flatMap((dirInPath) => {
    const candidate = path.join(dirInPath, exec);
    return os.type() === "Windows_NT" ? [candidate, `${candidate}.exe`] : [candidate];
  });

  for await (const isFile of candidates.map(isFileAtPath)) {
    if (isFile) {
      return true;
    }
  }
  return false;
}

async function isFileAtPath(path: string): Promise<boolean> {
  return isFileAtUri(vscode.Uri.file(path));
}

async function isFileAtUri(uri: vscode.Uri): Promise<boolean> {
  try {
    return ((await vscode.workspace.fs.stat(uri)).type & vscode.FileType.File) !== 0;
  } catch {
    return false;
  }
}
