import * as vscode from "vscode";
const vuilder = require("@vite/vuilder");
const vite = require("@vite/vitejs");
import { Ctx } from "../ctx";
import { getAmount } from "../util";
import { getWebviewContent } from "./webview";
import {
  DeployInfo,
  MessageEvent,
  ViteNetwork,
  ViteNodeStatus,
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
  public selectedNetwork: ViteNetwork = ViteNetwork.DebugNet;

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
          // sync compiled contract list
          await vscode.commands.executeCommand("soliditypp.refreshContractTree");
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
            const {
              selectedNode,
              selectedAddress,
              selectedContract,
              params,
            } = event.message;
            if (!(selectedNode.network === ViteNetwork.Bridge && selectedNode.status === ViteNodeStatus.Connected
               || selectedNode.status === ViteNodeStatus.Running)) {
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

            const amount = getAmount(params.amount, params.amountUnit);
            const paramsObj = {
              quotaMultiplier: params.quotaMultiplier.toString(),
              randomDegree: params.randomDegree.toString(),
              responseLatency: params.responseLatency.toString(),
              params: params.paramsStr.split(","),
            };

            this.ctx.vmLog.info(`[${this.selectedNetwork}][${selectedContract.name}][deploy][request]`, {
              params: paramsObj,
              amount,
              network: this.selectedNetwork,
              node: selectedNode.url,
              deployer: selectedAddress,
            });

            // create AccountBlock
            if (Number(paramsObj.responseLatency) < Number(paramsObj.randomDegree)) {
              this.ctx.vmLog.error(`[${this.selectedNetwork}][${selectedContract.name}][deploy][error]: responseLatency must >= randomDegree`);
            }
            const data = vite.accountBlock.utils.getCreateContractData({
              abi,
              code: bytecode,
              ...paramsObj,
            });
            const ab = new vite.accountBlock.AccountBlock({
              blockType: vite.constant.BlockType.CreateContractRequest,
              address: selectedAddress,
              data,
              fee: "10" +  "0".repeat(18),
              tokenId: vite.constant.Vite_TokenId
            });
            // set amount
            ab.amount = amount;

            // get provider
            const provider = this.ctx.getProvider(selectedNode.name);
            // deploy result
            const deployinfo: DeployInfo = {
              contractName: selectedContract.name,
              address: "",
              contractFsPath: selectedContract.fsPath,
              sourceFsPath: selectedContract.sourcefsPath,
              network: selectedNode.network,
              abi,
            };
            // sign and send
            if (selectedNode.network === ViteNetwork.Bridge) {
              try {
                const signedBlock = await provider.sendCustomRequest({
                  method: "vite_signAndSendTx",
                  params: {
                    block: ab.accountBlock,
                  }
                });
                this.ctx.vmLog.info(`[${this.selectedNetwork}][${selectedContract.name}][deploy][sendBlock=${signedBlock.hash}]`, signedBlock);
                this.ctx.vmLog.info(`[${this.selectedNetwork}][${selectedContract.name}][deploy][response]`, `contract deployed at ${signedBlock.toAddress}`);
                deployinfo.address = signedBlock.toAddress;
              } catch (error) {
                this.ctx.vmLog.error(`[${this.selectedNetwork}][${selectedContract.name}][deploy]`, error);
              }
            } else {
              // set provider
              ab.setProvider(provider);
              // set private key
              const addressObj = this.ctx.getAddressObj(selectedAddress);
              ab.setPrivateKey(addressObj!.privateKey);
              try {
                // sign and send
                let sendBlock = await ab.autoSend();
                this.ctx.vmLog.info(`[${this.selectedNetwork}][${selectedContract.name}][deploy][sendBlock=${sendBlock.hash}]`, sendBlock);
                // waiting confirmed
                await vuilder.utils.waitFor(async () => {
                  try {
                    sendBlock = await provider.request("ledger_getAccountBlockByHash", sendBlock.hash);
                    if (!sendBlock.confirmedHash || !sendBlock.receiveBlockHash) {
                      return false;
                    }
                    this.ctx.vmLog.info(`[${this.selectedNetwork}][${selectedContract.name}][deploy][sendBlock][confirmed=${sendBlock.confirmedHash}]`, sendBlock);
                    return true;
                  } catch (error) {
                    this.ctx.vmLog.error(`[${this.selectedNetwork}][${selectedContract.name}][deploy][sendBlock=${sendBlock.hash}]`, error);
                    return true;
                  }
                });
                // get receive block
                const receiveBlock = await provider.request("ledger_getAccountBlockByHash", sendBlock.receiveBlockHash);
                this.ctx.vmLog.info(`[${this.selectedNetwork}][${selectedContract.name}][deploy][receiveBlock=${receiveBlock.hash}]`, receiveBlock);
                if (receiveBlock?.blockType !== 4) {
                  this.ctx.vmLog.error(`[${this.selectedNetwork}][${selectedContract.name}]`, "contract deploy failed.");
                } else {
                  this.ctx.vmLog.info(`[${this.selectedNetwork}][${selectedContract.name}][deploy][response]`, `contract deployed at ${sendBlock.toAddress}`);
                  deployinfo.address = sendBlock.toAddress;
                }
              } catch (error) {
                this.ctx.vmLog.error(`[${this.selectedNetwork}][${selectedContract.name}][deploy]`, error);
              }
            }
            // render
            if (deployinfo.address) {
              this.ctx.updateDeploymentRecord(contractFile, this.selectedNetwork, deployinfo.address);
              // render console webview
              ContractConsoleViewPanel.render(this.ctx, deployinfo);
            }

            this.postMessage({
              command: "updateDeploymentStatus",
              message: {
                isDeploying: false,
              }
            });
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
