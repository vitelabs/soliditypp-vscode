import * as vscode from "vscode";
import * as path from "path";
import { strict as nativeAssert } from "assert";
import { spawnSync } from "child_process";
import { inspect } from "util";
import { AddressObj } from "@vite/vitejs/distSrc/utils/type";
const vuilder = require("@vite/vuilder");

/* eslint-disable-next-line */
const BigNumber = require('bignumber.js');
const VITE_DECIMAL = new BigNumber('1e18');

export function assert(condition: boolean, explanation: string): asserts condition {
  try {
    nativeAssert(condition, explanation);
  } catch (err) {
    log.error(`Assertion failed:`, explanation);
    throw err;
  }
}

export class Log {
  private enabled = true;
  private enabledDebugger = true;
  private readonly output: vscode.OutputChannel;

  constructor(outputName: string) {
    this.output = vscode.window.createOutputChannel(outputName);
  }

  setEnabled(yes: boolean): void {
    this.enabled = yes;
  }

  setDebugger(yes: boolean): void {
    this.enabledDebugger = yes;
  }

  debug(...msg: [unknown, ...unknown[]]): void {
    /* eslint-disable-next-line */
    if (!this.enabled) return;
    this.write("DEBUG", ...msg);
  }

  info(...msg: [unknown, ...unknown[]]): void {
    this.write("INFO", ...msg);
  }

  warn(...msg: [unknown, ...unknown[]]): void {
    if(this.enabledDebugger) {
      debugger;
    }
    this.write("WARN", ...msg);
  }

  error(...msg: [unknown, ...unknown[]]): void {
    if(this.enabledDebugger) {
      debugger;
    }
    this.write("ERROR", ...msg);
    this.output.show(true);
  }

  log(...msg: [unknown, ...unknown[]]): void {
    const message = msg.map(this.stringify).join(" ");
    this.output.appendLine(`${message}`);
  }

  private write(label: string, ...messageParts: unknown[]): void {
    const message = messageParts.map(this.stringify).join(" ");
    const dateTime = new Date().toLocaleString();
    this.output.appendLine(`${label} [${dateTime}]: ${message}`);
  }

  private stringify(val: unknown): string {
    /* eslint-disable-next-line */
    if (typeof val === "string") return val;
    return inspect(val, {
      colors: false,
      depth: 6, // heuristic
    });
  }
}

export const log = new Log("Soliditypp Debugger Client");
export const vmLog = new Log("VITE VM Log");

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type SolppDocument = vscode.TextDocument & { languageId: "soliditypp" };
export type SolppEditor = vscode.TextEditor & { document: SolppDocument };

export function isSolppFile(file: vscode.Uri): boolean {
  if ([".sol", ".solpp"].includes(path.extname(file.fsPath))) {
    return true;
  }
  return false;
}

export function isSolppDocument(document: vscode.TextDocument): document is SolppDocument {
  return document.languageId === "soliditypp" && document.uri.scheme === "file";
}

export function isSolppEditor(editor: vscode.TextEditor): editor is SolppEditor {
  return isSolppDocument(editor.document);
}

export function isValidExecutable(path: string): boolean {
  log.debug("Checking availability of a binary at", path);

  const res = spawnSync(path, ["--version"], { encoding: "utf8"});

  const printOutput = res.error && (res.error as any).code !== "ENOENT" ? log.warn : log.debug;
  printOutput(path, "--version:", res);

  return res.status === 0;
}

/**
 * Returns a higher-order function that caches the results of invoking the
 * underlying async function.
 */
export function memoizeAsync<Ret, TThis, Param extends string>(
  func: (this: TThis, arg: Param) => Promise<Ret>
) {
  const cache = new Map<string, Ret>();

  return async function (this: TThis, arg: Param) {
    const cached = cache.get(arg);
    /* eslint-disable-next-line */
    if (cached) return cached;

    const result = await func.call(this, arg);
    cache.set(arg, result);

    return result;
  };
}

export function getUri(webview: vscode.Webview, extensionUri: vscode.Uri, pathList: string[]) {
  return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));
}

export async function readContractJsonFile(file: vscode.Uri): Promise<any> {
  file = file.with({ scheme: "file" });
  const ret: Uint8Array = await vscode.workspace.fs.readFile(file);
  const compileResult = JSON.parse(ret.toString());
  let errors;
  if (compileResult.errors) {
    errors = compileResult.errors;
  }
  let contract;
  for (const fileName in compileResult.contracts) {
    const contractObj = compileResult.contracts[fileName];
    for (const contractName in contractObj) {
      if (contractName === file.fragment) {
        contract = contractObj[contractName];
      }
    }
  }
  if (contract) {
    return {
      errors,
      ...contract,
    };
  } else {
    return compileResult;
  }
}

export function newAccount(addressObj: AddressObj, provider: any) {
  let a = new vuilder.UserAccount(addressObj.address);
  a.setPrivateKey(addressObj.privateKey);
  a._setProvider(provider);
  return a;
}

export function getAmount(amount: string, unit = "VITE") {
  if (amount && unit.toUpperCase() === "VITE") {
    return new BigNumber(amount).multipliedBy(VITE_DECIMAL).toFixed();
  } else {
    return amount ?? '0';
  }
}

export function formatAmount(amount: string, unit = "VITE") {
  if (unit.toUpperCase() === "VITE") {
    return new BigNumber(amount).dividedBy(VITE_DECIMAL).toFixed();
  } else {
    return amount;
  }
}