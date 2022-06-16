import type { WebviewApi } from "vscode-webview";

export class Log {
  constructor(private readonly outputChannel: string) {
  }
  debug(...msg: [unknown, ...unknown[]]): void {
    vscode.postMessage({
      command: this.outputChannel,
      subCommand: "debug",
      message: msg
    });
  }

  info(...msg: [unknown, ...unknown[]]): void {
    vscode.postMessage({
      command: this.outputChannel,
      subCommand: "info",
      message: msg
    });
  }
  log(...msg: [unknown, ...unknown[]]): void {
    vscode.postMessage({
      command: this.outputChannel,
      subCommand: "log",
      message: msg
    });
  }
}

export const log = new Log('log');

class VSCodeAPIWrapper {
  private readonly vsCodeApi: WebviewApi<unknown> | undefined;
  public log: Log = log;

  constructor() {
    if (typeof acquireVsCodeApi === "function") {
      this.vsCodeApi = acquireVsCodeApi();
    }
  }

  public postMessage(message: unknown) {
    if (this.vsCodeApi) {
      this.vsCodeApi.postMessage(message);
    } else {
      console.log(message);
    }
  }

  public getState(): unknown | undefined {
    if (this.vsCodeApi) {
      return this.vsCodeApi.getState();
    } else {
      const state = localStorage.getItem("vscodeState");
      return state ? JSON.parse(state) : undefined;
    }
  }

  public setState<T extends unknown | undefined>(newState: T): T {
    if (this.vsCodeApi) {
      return this.vsCodeApi.setState(newState);
    } else {
      localStorage.setItem("vscodeState", JSON.stringify(newState));
      return newState;
    }
  }
}

// Exports class singleton to prevent multiple invocations of acquireVsCodeApi.
export const vscode = new VSCodeAPIWrapper();