import * as vscode from "vscode";
const vuilder = require("@vite/vuilder");

import { getWebviewContent } from "./webview";
import { MessageEvent, ViteNode, ViteNodeStatus } from "../types/types";
import { Ctx } from "../ctx";

export class NetworkViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "ViteNetworkView";
  private _webviewView?: vscode.WebviewView;
  private disposables: vscode.Disposable[] = [];
  private _onDidDispose = new vscode.EventEmitter<void>();
  readonly onDidDispose: vscode.Event<void> = this._onDidDispose.event;
  private _onDidChangeNode = new vscode.EventEmitter<ViteNode>();
  readonly onDidChangeNode: vscode.Event<ViteNode> = this._onDidChangeNode.event;
  private localNodePid: any;

  constructor(private readonly ctx: Ctx) {
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._webviewView = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    let timer: any;
    webviewView.onDidDispose(() => {
      if (timer) {
        clearInterval(timer);
      }
      this._onDidDispose.fire();
      this.dispose();
    }, null, this.disposables);

    webviewView.webview.onDidReceiveMessage(async(event: MessageEvent) => {
      switch (event.command) {
        case "log":
          const method = event.subCommand as "info" | "debug" | "warn" | "error" | "log";
          const msg: [unknown, ...unknown[]] = event.message;
          this.ctx.log[method](...msg, `[${this.constructor.name}]`);
          break;
        case "mounted":
          {
            const viteNodesList = [];
            for (const item of this.ctx.viteNodeMap.values()) {
              viteNodesList.push(item);
            }
            await this.postMessage({
              command: "setViteNode",
              message: {
                viteNodesList,
              }
            });
            if (this.ctx.config.localGoViteAutoStart) {
              await this.startLocalViteNode();
            }
            await this.updateSnapshotChainHeight();
            timer = setInterval(async() => {
              await this.updateSnapshotChainHeight();
            }, 6000);
          }
          break;
        case "startLocalViteNode":
          await this.startLocalViteNode();
          await this.updateSnapshotChainHeight();
          break;
        case "stopLocalViteNode":
          await this.stopLocalViteNode();
          break;
        case "reconnect":
          {
            const { name } = event.message;
            const node = this.ctx.viteNodeMap.get(name);
            delete node?.error;
            node!.status = ViteNodeStatus.Syncing;
            this.ctx.resetProvider(name);
            await this.updateSnapshotChainHeight();
          }
          break;
        case "saveCustomNode":
          {
            const { name, url, network, target } = event.message;
            if (name && url && network) {
              const found = this.ctx.config.viteCustomNodes.findIndex(item => item.name === name);
              if (found === -1) {
                // push new node
                this.ctx.config.updateConfig("vite.customNodes", [{ name, url, network }, ...this.ctx.config.viteCustomNodes], target === "Global");
              } else {
                // update node
                this.ctx.config.updateConfig("vite.customNodes", this.ctx.config.viteCustomNodes.map(item => {
                  if (item.name === name) {
                    return { name, url, network };
                  } else {
                    return item;
                  }
                }), target === "Global");
              }
            }
          }
          break;
      }
    }, null, this.disposables);

    webviewView.webview.html = getWebviewContent(webviewView.webview, this.ctx.extensionUri, "network");
  }

  public async postMessage(message: any): Promise<boolean> {
    if (this._webviewView) {
      return this._webviewView.webview.postMessage(message);
    } else {
      this.ctx.log.debug(this.constructor.name, "webviewView is null");
      return false;
    }
  }

  public dispose() {
    this.localNodePid.stop();
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  public async startLocalViteNode() {
    const node = this.ctx.viteNodeMap.get("local");
    delete node?.error;
    await this.postMessage({
      command: "updateViteNode",
      message: {
        ...node,
        status: ViteNodeStatus.Syncing
      },
    });
    const nodeConfig = {
      "nodes": {
        "local": {
          "name": "gvite",
          "version": node!.version,
          "http": node!.url
        }
      },
      "defaultNode": "local"
    };
    this.localNodePid = await vuilder.startLocalNetwork(nodeConfig);
    node!.status = ViteNodeStatus.Syncing;
    this._onDidChangeNode.fire(node!);
    return this.localNodePid;
  }

  public async stopLocalViteNode() {
    const node = this.ctx.viteNodeMap.get("local");
    delete node?.error;
    node!.status = ViteNodeStatus.Stopped;

    this.postMessage({
      command: "updateViteNode",
      message: node,
    });

    this._onDidChangeNode.fire(node!);
    await this.localNodePid.stop();
  }

  private async updateSnapshotChainHeight(): Promise<void> {
    for (const node of this.ctx.getViteNodesList()) {
      if (node.status === ViteNodeStatus.Running || node.status === ViteNodeStatus.Syncing) {
        const provider = this.ctx.getProvider(node.name);
        try {
          const height = await provider.request("ledger_getSnapshotChainHeight");
          if (node.status === ViteNodeStatus.Syncing) {
            node.status = ViteNodeStatus.Running;
            await this.postMessage({
              command: "updateViteNode",
              message: node,
            });
            this._onDidChangeNode.fire(node);
          }
          await this.postMessage({
            command: "updateSnapshotChainHeight",
            message: {
              nodeName: node.name,
              height,
            },
          });
        } catch (error: any) {
          node.status = ViteNodeStatus.Timeout;
          if (error.code) {
            node.error = error;
          } else {
            node.error = error.message;
          }
          await this.postMessage({
            command: "updateViteNode",
            message: node,
          });
          this._onDidChangeNode.fire(node);
        }
      }
    }
  }
}