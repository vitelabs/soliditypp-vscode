import * as vscode from "vscode";
const vuilder = require("@vite/vuilder");
const vite = require("@vite/vitejs");
import { Ctx } from "../ctx";
import { getAmount } from "../util";
import { getWebviewContent } from "./webview";
import {
  MessageEvent,
  DeployInfo,
  ViteNetwork,
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

  private currentNetwork: ViteNetwork = ViteNetwork.DebugNet;
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
            this.ctx.vmLog.info(`[${network}][${contractName}][send()][from=${fromAddress}][to=${toAddress}][amount=${ctor.amount}]`);
            // create AccountBlock
            const ab = new vite.accountBlock.AccountBlock({
              blockType: vite.constant.BlockType.TransferRequest,
              address: fromAddress,
              toAddress,
              tokenId: vite.constant.Vite_TokenId,
              amount: ctor.amount,
              data: "",
            });
            // get provider
            const provider = this.ctx.getProviderByNetwork(network);
            if (network === ViteNetwork.Bridge) {
              try {
                const signedBlock = await provider.sendCustomRequest({
                  method: "vite_signAndSendTx",
                  params: {
                    block: ab.accountBlock,
                  }
                });
                this.ctx.vmLog.info(`[${network}][${contractName}][send()][signedBlock=${signedBlock.hash}]`, signedBlock);
                await this.updateAddressList();
              } catch (error) {
                this.ctx.vmLog.error(`[${network}][${contractName}][send()]`, error);
              }
            } else {
              // set provider
              ab.setProvider(provider);
              // set private key
              const addressObj = this.ctx.getAddressObj(fromAddress);
              ab.setPrivateKey(addressObj!.privateKey);
              try {
                // sign and send
                let sendBlock = ab.autoSend();
                // get account block
                await vuilder.utils.waitFor(async () => {
                  const blocks = await provider.request("ledger_getAccountBlocksByAddress", fromAddress, 0, 3);
                  for (const block of blocks) {
                    if (block.previousHash === sendBlock.previousHash) {
                      sendBlock = block;
                      this.ctx.vmLog.info(`[${network}][${contractName}][send()][sendBlock=${sendBlock.hash}]`, sendBlock);
                      return true;
                    }
                  }
                  return false;
                });

                // waiting confirmed
                await vuilder.utils.waitFor(async () => {
                  if (sendBlock.confirmedHash) {
                    this.ctx.vmLog.info(`[${network}][${contractName}][send()][confirmed=${sendBlock.confirmedHash}]`, sendBlock);
                    this.postMessage({
                      command: "sendResult",
                      message: {
                        sendBlock,
                        ctor,
                        contractAddress: toAddress,
                      }
                    });
                    return true;
                  }
                  sendBlock = await provider.request("ledger_getAccountBlockByHash", sendBlock.hash);
                  return false;
                });

                await this.updateAddressList();
              } catch (error: any) {
                this.ctx.vmLog.error(`[${network}][${contractName}][send()]`, error);
              }
            }
            ContractConsoleViewPanel._onDidCallContract.fire(event);
          }
          break;
        case "query":
          {
            const { fromAddress, toAddress, network, contractFile, func } = event.message;
            const contractName = contractFile.fragment;
            // get inputs value
            const params = func.inputs.map((x: any) => x.value);
            const data = vite.abi.encodeFunctionCall(func, params);
            this.ctx.vmLog.info(`[${network}][${contractName}][query ${func.name}()][request]`, {
              params,
              contractAddress: toAddress,
              network,
            });
            // get provider
            let provider: any;
            if (network === ViteNetwork.Bridge) {
              provider = this.ctx.getProviderByNetwork(this.ctx.bridgeNode.backendNetwork!);
            } else {
              provider = this.ctx.getProviderByNetwork(network);
            }

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
                  this.ctx.vmLog.info(`[${network}][${contractName}][query ${func.name}()][response]`, ret);
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
              this.ctx.vmLog.error(`[${network}][${contractName}][query ${func.name}()]`, error);
            }
            ContractConsoleViewPanel._onDidCallContract.fire(event);
          }
          break;
        case "call":
          {
            const { fromAddress, toAddress, network, contractFile, func } = event.message;
            const contractName = contractFile.fragment;
            // get inputs value
            const params = func.inputs.map((x: any) => x.value);
            const amount = getAmount(func.amount, func.amountUnit ?? "VITE");

            this.ctx.vmLog.info(`[${network}][${contractName}][call ${func.name}()][request]`, {
              params,
              amount,
              network,
              operator: fromAddress,
              contractAddress: toAddress,
            });

            // create AccountBlock
            const data = vite.accountBlock.utils.getCallContractData({
              abi: func,
              params,
            });
            const ab = new vite.accountBlock.AccountBlock({
              blockType: vite.constant.BlockType.TransferRequest,
              address: fromAddress,
              toAddress,
              tokenId: vite.constant.Vite_TokenId,
              amount,
              data,
            });
            // get provider
            const provider = this.ctx.getProviderByNetwork(network);
            if (network === ViteNetwork.Bridge) {
              const signedBlock = await provider.sendCustomRequest({
                method: "vite_signAndSendTx",
                params: {
                  block: ab.accountBlock,
                }
              });
              this.ctx.vmLog.info(`[${network}][${contractName}][call ${func.name}()][signedBlock=${signedBlock.hash}]`, signedBlock);
            } else {
              // set provider
              ab.setProvider(provider);
              // set private key
              const addressObj = this.ctx.getAddressObj(fromAddress);
              ab.setPrivateKey(addressObj!.privateKey);
              try {
                // sign and send
                let sendBlock = await ab.autoSend();
                this.ctx.vmLog.info(`[${network}][${contractName}][call ${func.name}()][sendBlock=${sendBlock.hash}]`, sendBlock);

                // waiting confirmed
                await vuilder.utils.waitFor(async() => {
                  try {
                    sendBlock = await provider.request("ledger_getAccountBlockByHash", sendBlock.hash);
                    if (!sendBlock.confirmedHash || !sendBlock.receiveBlockHash) {
                      return false;
                    }
                    this.ctx.vmLog.info(`[${network}][${contractName}][call ${func.name}()][sendBlock][confirmed=${sendBlock.confirmedHash}]`, sendBlock);
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
                    this.ctx.vmLog.error(`[${network}][${contractName}][call ${func.name}()][sendBlock=${sendBlock.hash}]`, error);
                    return true;
                  }
                });
                // get receive block
                let receiveBlock = await provider.request("ledger_getAccountBlockByHash", sendBlock.receiveBlockHash);
                this.ctx.vmLog.info(`[${network}][${contractName}][call ${func.name}()][receiveBlock=${receiveBlock.hash}]`, receiveBlock);

                // waiting confirmed
                await vuilder.utils.waitFor(async () => {
                  if (receiveBlock.confirmedHash) {
                    this.ctx.vmLog.info(`[${network}][${contractName}][call ${func.name}()][receiveBlock][confirmed=${receiveBlock.confirmedHash}]`, receiveBlock);
                    return true;
                  }
                  receiveBlock = await provider.request("ledger_getAccountBlockByHash", receiveBlock.hash);
                  return false;
                });

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
                this.ctx.vmLog.error(`[${network}][${contractName}][call ${func.name}()]`, error); 
              }
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
    let provider;
    if (this.currentNetwork === ViteNetwork.Bridge) {
      provider = this.ctx.getProviderByNetwork(this.ctx.bridgeNode.backendNetwork!);
    } else {
      provider = this.ctx.getProviderByNetwork(this.currentNetwork);
    }
    const message: any[] = [];
    for (const address of list) {
      const quotaInfo = await provider.request('contract_getQuotaByAccount', address);
      const balanceInfo = await provider.getBalanceInfo(address);
      const balance = balanceInfo.balance.balanceInfoMap?.[vite.constant.Vite_TokenId]?.balance;
      message.push({
        address,
        network: this.currentNetwork,
        quota: quotaInfo.currentQuota,
        balance: balance ? balance.slice(0, balance.length - vite.constant.Vite_Token_Info.decimals) : '0',
      });
    }
    this.postMessage({
      command: "setAddressList",
      message,
    });
  }

  private clear() {
    this.deployeInfoMap.clear();
    let provider;
    if (this.currentNetwork === ViteNetwork.Bridge) {
      provider = this.ctx.getProviderByNetwork(this.ctx.bridgeNode.backendNetwork!);
    } else {
      provider = this.ctx.getProviderByNetwork(this.currentNetwork);
    }
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


    let provider;
    if (deployInfo.network === ViteNetwork.Bridge) {
      provider = this.ctx.getProviderByNetwork(this.ctx.bridgeNode.backendNetwork!);
    } else {
      provider = this.ctx.getProviderByNetwork(deployInfo.network);
    }

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
          this.ctx.vmLog.info(`[${deployInfo.network}][${deployInfo.contractName}][subscribe][newVmLog=${deployInfo.address}]`, event);
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
              this.ctx.vmLog.info(`[${deployInfo.network}][${deployInfo.contractName}][subscribe][newVmLog=${deployInfo.address}][decode]`, ret);
            }
          }
        }
      });

    } catch (error) {
      this.ctx.vmLog.error(`[${deployInfo.network}][subscribe][newVmLog=${deployInfo.contractName}]`, error);
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