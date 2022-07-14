import * as vscode from "vscode";
const vuilder = require("@vite/vuilder");
const vite = require("@vite/vitejs");
import { Ctx } from "../ctx";
import { newAccount, getAmount } from "../util";
import { getWebviewContent } from "./webview";
import {
  MessageEvent,
  DeployInfo,
  ViteNetwork,
  Vite_TokenId,
  Vite_Token_Info,
  Address,
} from "../types/types";

export class ContractConsoleViewPanel {
  public static currentPanel: ContractConsoleViewPanel | undefined;
  public static readonly viewType = 'contractConsoleView';
  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];

  private static _onDidDispose = new vscode.EventEmitter<void>();
  static readonly onDidDispose: vscode.Event<void> = this._onDidDispose.event;

  private static _onDidCallContract = new vscode.EventEmitter<any>();
  static readonly onDidCallContract: vscode.Event<any> = this._onDidCallContract.event;

  private currentNetwork: ViteNetwork = ViteNetwork.Debug;
  private deployeInfoMap: Map<Address, DeployInfo> = new Map();

  private constructor(panel: vscode.WebviewPanel, private readonly ctx: Ctx, deployInfo: DeployInfo) {
    this._panel = panel;

    this._panel.onDidDispose(this.dispose, this, this._disposables);
    this._panel.onDidDispose(() => {
      ContractConsoleViewPanel._onDidDispose.fire();
    }, null, this._disposables);

    this._panel.webview.onDidReceiveMessage(async (event: MessageEvent) => {
      switch (event.command) {
        case "log":
          const method = event.subCommand as "info" | "debug" | "warn" | "error" | "log";
          const msg: [unknown, ...unknown[]] = event.message;
          this.ctx.log[method](...msg);
          break;

        case "mounted":
          {
            await this.postMessage({
              command: "viewStyle",
              message: this.ctx.config.consoleViewStyle,
            });
            this.updateContractMap(deployInfo);
          }
          break;
        case "getAddressList":
          await this.updateAddressList();
          break;
        case "send":
          {
            const { fromAddress, toAddress, network, ctor, contractFile } = event.message;
            const contractName = contractFile.fragment;
            const provider = this.ctx.getProviderByNetwork(network);
            const addressObj = this.ctx.getAddressObj(fromAddress);
            const operator = newAccount(addressObj!, provider);
            try {
              const ret = await operator.sendToken(toAddress, ctor.amount, ctor.tokenId);
              this.ctx.vmLog.info(`[${contractName}][send()][previousHash=${ret.previousHash}]`, ret);

              await this.updateAddressList();
            } catch (error: any) {
              this.ctx.vmLog.error(`[${contractName}][send()]`, error);
            }
            ContractConsoleViewPanel._onDidCallContract.fire(event);
          }
          break;
        case "query":
          {
            const { fromAddress, toAddress, network, contractFile, func } = event.message;
            const contractName = contractFile.fragment;
            // get provider
            const provider = this.ctx.getProviderByNetwork(network);
            // get inputs value
            const params = func.inputs.map((x: any) => x.value);
            const data = vite.abi.encodeFunctionCall(func, params);
            this.ctx.vmLog.info(`[${contractName}][query ${func.name}()][request]`, {
              params,
              contractAddress: toAddress,
              network,
            });

            try {
              await vuilder.utils.waitFor(async() => {
                const rawRet = await provider.request("contract_query", {
                  address: toAddress,
                  data: Buffer.from(data, "hex").toString("base64"),
                });
                if (rawRet) {
                  const ret = vite.abi.decodeParameters(
                    func.outputs.map((x: any)=>x.type),
                    Buffer.from(rawRet, "base64").toString("hex"),
                  );
                  this.ctx.vmLog.info(`[${contractName}][query ${func.name}()][response]`, ret);
                  this.postMessage({
                    command: "queryResult",
                    message: {
                      ret,
                      func,
                      contractAddress: toAddress,
                    }
                  });
                  await this.updateAddressList();
                  return true;
                } else {
                  return false;
                }
              }, "", 500);
            } catch (error:any) {
              this.ctx.vmLog.error(`[${contractName}][query ${func.name}()]`, error); 
            }
            ContractConsoleViewPanel._onDidCallContract.fire(event);
          }
          break;
        case "call":
          {
            const { fromAddress, toAddress, network, contractFile, func } = event.message;
            const contractName = contractFile.fragment;
            // get provider and operator
            const provider = this.ctx.getProviderByNetwork(network);
            const addressObj = this.ctx.getAddressObj(fromAddress);
            const operator = newAccount(addressObj!, provider);
            // get inputs value
            const params = func.inputs.map((x: any) => x.value);
            const amount = getAmount(func.amount, func.amountUnit ?? "VITE");

            this.ctx.vmLog.info(`[${contractName}][call ${func.name}()][request]`, {
              params,
              amount,
              network,
              operator: fromAddress,
              contractAddress: toAddress,
            });

            try {
              let sendBlock = operator.callContract({
                abi: func,
                toAddress,
                params,
                tokenId: Vite_TokenId,
                amount,
              });
              sendBlock = await sendBlock.autoSend();
              this.ctx.vmLog.info(`[${contractName}][call ${func.name}()][sendBlock=${sendBlock.hash}]`, sendBlock);

              // waiting confirmed
              await vuilder.utils.waitFor(async() => {
                try {
                  sendBlock = await provider.request("ledger_getAccountBlockByHash", sendBlock.hash);
                  if (!sendBlock.confirmedHash || !sendBlock.receiveBlockHash) {
                    return false;
                  }
                  this.ctx.vmLog.info(`[${contractName}][call ${func.name}()][sendBlock][confirmed=${sendBlock.confirmedHash}]`, sendBlock);
                  this.postMessage({
                    command: "callResult",
                    message: {
                      sendBlock,
                      func,
                      contractAddress: toAddress,
                    }
                  });
                  return true;
                } catch (error) {
                  this.ctx.vmLog.error(`[${contractName}][call ${func.name}()][sendBlock=${sendBlock.hash}]`, error);
                  return true;
                }
              });
              // get receive block
              const receiveBlock = await provider.request("ledger_getAccountBlockByHash", sendBlock.receiveBlockHash);

              if(!receiveBlock) {
                throw new Error("receive block not found");
              } else {
                this.ctx.vmLog.info(`[${contractName}][call ${func.name}()][receiveBlock=${receiveBlock.hash}]`, receiveBlock);
              }
              if (receiveBlock.blockType !== 4 && receiveBlock.blockType !== 5 || !receiveBlock.data) {
                throw new Error("bad recieve block");
              }
              const data = receiveBlock.data;
              const bytes = Buffer.from(data, "base64");
              if (bytes.length !== 33) {
                throw new Error("bad data in recieve block");
              }
              // parse error code from data in receive block
              const errorCode = bytes[32];
              switch (errorCode) {
                case 1:
                  throw new Error(`revert, methodName: ${func.name}`); // @todo: need error descriptions and debug info from RPC
                case 2:
                  throw new Error(`maximum call stack size exceeded, methodName: ${func.name}`);
              }

              await this.updateAddressList();
            } catch (error:any) {
              this.ctx.vmLog.error(`[${contractName}][call ${func.name}()]`, error); 
            }
            ContractConsoleViewPanel._onDidCallContract.fire(event);
          }
          break;
      }
    }, null, this._disposables);

    this._panel.webview.html = getWebviewContent(this._panel.webview, ctx.extensionUri, "console");
  }

  public static render(ctx: Ctx, deployInfo: DeployInfo) {
    const column = ctx.config.consoleViewColumn ?? vscode.ViewColumn.One;

    if (ContractConsoleViewPanel.currentPanel) {
      ContractConsoleViewPanel.currentPanel._panel.reveal(column, true);
      ContractConsoleViewPanel.currentPanel._panel.title = `${deployInfo.contractName} Console`;
      ContractConsoleViewPanel.currentPanel.updateContractMap(deployInfo);
    } else {
      const panel = vscode.window.createWebviewPanel(
        ContractConsoleViewPanel.viewType,
        `${deployInfo.contractName} Console`,
        {
          viewColumn: column,
          preserveFocus: true,
        },
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );
      panel.iconPath = vscode.Uri.joinPath(ctx.extensionUri, "assets", "dashboard.svg");

      ContractConsoleViewPanel.currentPanel = new ContractConsoleViewPanel(panel, ctx, deployInfo);
    }
  }

  public static updateDeps(){
    if (ContractConsoleViewPanel.currentPanel) {
      ContractConsoleViewPanel.currentPanel.updateAddressList();
    }
  }

  public async updateAddressList() {
    const list = this.ctx.getAddressList(this.currentNetwork);
    const provider = this.ctx.getProviderByNetwork(this.currentNetwork);
    const message: any[] = [];
    for (const address of list) {
      const quotaInfo = await provider.request('contract_getQuotaByAccount', address);
      const balanceInfo = await provider.getBalanceInfo(address);
      const balance = balanceInfo.balance.balanceInfoMap?.[Vite_TokenId]?.balance;
      message.push({
        address,
        network: this.currentNetwork,
        quota: quotaInfo.currentQuota,
        balance: balance ? balance.slice(0, balance.length - Vite_Token_Info.decimals) : '0',
      });
    }
    this.postMessage({
      command: "setAddressList",
      message,
    });
  }

  private clear() {
    this.deployeInfoMap.clear();
    const provider = this.ctx.getProviderByNetwork(this.currentNetwork);
    provider.unsubscribeAll();
  }

  public async updateContractMap(deployInfo: DeployInfo) {
    if (this.currentNetwork !== deployInfo.network) {
      this.clear();
      if (this._panel) {
        this._panel.webview.postMessage({
          command: "clear",
        });
      }
      this.currentNetwork = deployInfo.network;
    }

    // push to webview
    await this.postMessage({
      command: "pushContract",
      message: deployInfo,
    });

    if (this.deployeInfoMap.has(deployInfo.address)) {
      return;
    }

    // store to map
    this.deployeInfoMap.set(deployInfo.address, deployInfo);


    const provider = this.ctx.getProviderByNetwork(deployInfo.network);

    // subscribe vmlog
    try {
      const listener = await provider.subscribe("newVmLog", {
        "addressHeightRange":{
          [deployInfo.address]:{
            "fromHeight":"0",
            "toHeight":"0"
          }
        }
      });
      listener.on(async (events: any[]) => {
        for (const event of events) {
          this.ctx.vmLog.info(`[${deployInfo.contractName}][subscribe][newVmLog=${deployInfo.address}]`, event);
          const topics = event.vmlog?.topics;
          for (let abiItem of deployInfo.abi) {
            let signature = vite.abi.encodeLogSignature(abiItem);
            if (abiItem.type === "event" && signature === topics[0]) { 
              let dataHex;
              if (event.vmlog.data) {
                dataHex = Buffer.from(event.vmlog.data, "base64").toString("hex");
              }
              let ret = vite.abi.decodeLog(
                abiItem,
                dataHex,
                topics
              );
              this.postMessage({
                command: "eventResult",
                message: {
                  ret,
                  event: abiItem,
                  contractAddress: deployInfo.address,
                }
              });
              this.ctx.vmLog.info(`[${deployInfo.contractName}][subscribe][newVmLog=${deployInfo.address}][decode]`, ret);
            }
          }
        }
      });

    } catch (error) {
      this.ctx.vmLog.error(`[subscribe][newVmLog=${deployInfo.contractName}]`, error);
    }
  }

  public async postMessage(message: any): Promise<boolean> {
    if (this._panel) {
      return this._panel.webview.postMessage(message);
    } else {
      this.ctx.log.debug(this.constructor.name, "webviewView is null");
      return false;
    }
  }

  public dispose() {
    this.clear();

    ContractConsoleViewPanel.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  public get webViewPanel(): vscode.WebviewPanel {
    return this._panel;
  }
}