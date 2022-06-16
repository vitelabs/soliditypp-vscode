import * as vscode from "vscode";
const vuilder = require("@vite/vuilder");
/* eslint-disable-next-line */
import { Ctx } from "../ctx";
import { newAccount, getAmount } from "../util";
import { getWebviewContent } from "./webview";
import {
  DeployInfo,
  MessageEvent,
  ViteNetwork,
  ViteNodeStatus,
  ViteNode,
} from "../types/types";
import { ContractItem } from "./contract_tree";
import * as path from "path";
import { ContractConsoleViewPanel } from "./contract_console";

export class ContractDeploymentViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "ViteContractDeploymentView";
  private _webviewView?: vscode.WebviewView;
  private disposables: vscode.Disposable[] = [];
  private _onDidDispose = new vscode.EventEmitter<void>();
  readonly onDidDispose: vscode.Event<void> = this._onDidDispose.event;
  private _onDidChangeNetwork = new vscode.EventEmitter<ViteNetwork>();
  readonly onDidChangeNetwork: vscode.Event<ViteNetwork> = this._onDidChangeNetwork.event;
  public selectedNetwork: ViteNetwork = ViteNetwork.Debug;

  constructor(private readonly ctx: Ctx) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._webviewView = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
    };

    webviewView.onDidDispose(() => {
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
          await vscode.commands.executeCommand("contract.refresh");
          this.updateDeps();
          break;
        case "changeNetwork":
          {
            if (this.selectedNetwork !== event.message) {
              this.selectedNetwork = event.message;
              this.updateDeps();
              this._onDidChangeNetwork.fire(event.message);
            }
          }
          break;
        case "deployContract":
          {
            this.ctx.log.debug(event);
            const {
              selectedNode,
              selectedAddress,
              selectedContract,
              params,
            } = event.message;
            // get node again
            if (selectedNode.status !== ViteNodeStatus.Running) {
              vscode.window.showErrorMessage(`Vite node[${selectedNode.url}] is not running`);
              break;
            }
            const contractFile = vscode.Uri.parse(selectedContract.fsPath).with({ fragment: selectedContract.name });
            const compileResult: any = await this.ctx.getCompileResult(contractFile);
            const abi = compileResult?.abi;
            const bytecode = compileResult?.bytecode;
            if (!abi || !bytecode) {
              vscode.window.showErrorMessage("ABI and/or bytecode are missing in the compilation result");
              return;
            }

            // create contract
            const contract = new vuilder.Contract(
              selectedContract.name,
              bytecode,
              abi,
            );

            const provider = this.ctx.getProvider(selectedNode.name);
            const addressObj = this.ctx.getAddressObj(selectedAddress);
            const deployer = newAccount(addressObj!, provider);
            // const deployer = new vite.account.Account(addressObj!.address).setPrivateKey(addressObj!.privateKey).setProvider(provider);

            // set account and provider
            contract.setDeployer(deployer).setProvider(provider);

            const amount = getAmount(params.amount, params.unit);
            try {
              const ret = await contract.deploy({
                responseLatency: params.responseLatency,
                quotaMultiplier: params.quotaMultiplier,
                randomDegree: params.randomDegree,
                amount,
              });
              this.ctx.vmLog.info(`Deployed ${selectedContract.name} at ${ret.address} on ${selectedNode.network}`);
              const deployinfo: DeployInfo = {
                contractName: selectedContract.name,
                address: ret.address,
                contractFsPath: selectedContract.fsPath,
                sourceFsPath: selectedContract.sourcefsPath,
                network: selectedNode.network,
                abi,
              };
              this.ctx.updateDeploymentRecord(contractFile, this.selectedNetwork, ret.address);
              // render console webview
              ContractConsoleViewPanel.render(this.ctx, deployinfo);
            } catch (error) {
              this.ctx.vmLog.error(error);
            }
          }
          break;
      }

    }, null, this.disposables);

    webviewView.webview.html = getWebviewContent(webviewView.webview, this.ctx.extensionUri, "deployment");
  }

  public async postMessage(message: any): Promise<boolean> {
    if (this._webviewView) {
      return await this._webviewView.webview.postMessage(message);
    } else {
      this.ctx.log.debug(this.constructor.name, "webviewView is null");
      return false;
    }
  }

  public dispose() {
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  public updateContractsList(contractsList: ContractItem[]) {
    const message = [];
    for (const contract of contractsList) {
      const file = contract.resourceUri as vscode.Uri;
      const sourceFileName = path.basename(file.fsPath, ".json");
      const contractInfo = {
        name: file.fragment,
        fsPath: file.fsPath,
        sourceFileName,
        sourcefsPath: path.join(path.dirname(file.fsPath), sourceFileName),
      };
      message.push(contractInfo);
    }
    message.sort((a, b) => {
      const aName = a.sourceFileName.toLowerCase();
      const bName = b.sourceFileName.toLowerCase();
      if (aName < bName) {
        return -1;
      } else if (aName > bName) {
        return 1;
      } else {
        return 0;
      }
    });
    return this.postMessage({
      command: "updateContractsList",
      message,
    });
  }

  public updateDeps() {
    return this.postMessage({
      command: "updateDeps",
      message: {
        nodesList: this.ctx.getViteNodesList(),
        addressesList: this.ctx.getAddressList(this.selectedNetwork),
      },
    });
  }
}
