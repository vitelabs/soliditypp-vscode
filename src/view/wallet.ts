import * as vscode from "vscode";
const vite = require("@vite/vitejs");
import { getWebviewContent } from "./webview";
import { Address, MessageEvent, ViteNetwork, ViteNodeStatus, Vite_TokenId, Vite_Token_Info } from "../types/types";
import { Ctx } from "../ctx";
import { newAccount, getAmount } from "../util";

export class ViteWalletViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "ViteWalletView";
  private _webviewView?: vscode.WebviewView;
  private disposables: vscode.Disposable[] = [];
  private _onDidDispose = new vscode.EventEmitter<void>();
  readonly onDidDispose: vscode.Event<void> = this._onDidDispose.event;
  private _onDidDeriveAddress = new vscode.EventEmitter<void>();
  readonly onDidDeriveAddress: vscode.Event<void> = this._onDidDeriveAddress.event;

  constructor(private readonly ctx: Ctx) {}

  public async resolveWebviewView(
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

    webviewView.webview.onDidReceiveMessage(async (event: MessageEvent) => {
      switch (event.command) {
        case "log":
          const method = event.subCommand as "info" | "debug" | "warn" | "error" | "log";
          const msg: [unknown, ...unknown[]] = event.message;
          this.ctx.log[method](...msg, `[${this.constructor.name}]`);
          break;
        case "mounted":
          {
            const addressList = [
              {
                address: this.ctx.deriveAddress(this.ctx.debugWallet, 0).address,
                network: ViteNetwork.Debug,
              },
              {
                address: this.ctx.deriveAddress(this.ctx.testNetWallet, 0).address,
                network: ViteNetwork.TestNet,
              },
              {
                address: this.ctx.deriveAddress(this.ctx.mainNetWallet, 0).address,
                network: ViteNetwork.MainNet,
              }
            ];
            await this.postMessage({
              command: "setAddress",
              message: addressList,
            });

            setInterval(()=> {
              for (const network of [ViteNetwork.Debug, ViteNetwork.TestNet, ViteNetwork.MainNet]) {
                this.updateAddressInfo(network);
              }
            }, 5000);

            this._onDidDeriveAddress.fire();
          }
          break;
        case "deriveAddress":
          {
            const { network, index } = event.message;
            const wallet = this.ctx.getWallet(network);
            let addressObj = this.ctx.deriveAddress(wallet, index);
            await this.postMessage({
              command: "addAddress",
              message: {
                address: addressObj.address,
                network,
              }
            });
            await this.updateAddressInfo(network, addressObj.address);
            this._onDidDeriveAddress.fire();
          }
          break;
        case "renewWallet":
          {
            const wallet = vite.wallet.createWallet();
            await this.postMessage({
              command: "setMnemonic",
              message: wallet.mnemonics,
            });
          }
          break;
        case "getMnemonic":
          {
            const { network } = event.message;
            const wallet = this.ctx.getWallet(network);
            await this.postMessage({
              command: "setMnemonic",
              message: wallet.mnemonics,
            });
          }
          break;
        case "setMnemonic":
          {
            this.ctx.log.debug(event);
            const { network, mnemonic } = event.message;
            if (network === ViteNetwork.TestNet) {
              this.ctx.testNetWallet = mnemonic;
            } else if (network === ViteNetwork.MainNet) {
              this.ctx.mainNetWallet = mnemonic;
            }
            const wallet = this.ctx.getWallet(network);
            await this.postMessage({
              command: "setAddress",
              message: [
                {
                  address: this.ctx.deriveAddress(wallet, 0).address,
                  network,
                },
              ]
            });
            this._onDidDeriveAddress.fire();
          }
          break;
        case "copyToClipboard":
          await vscode.env.clipboard.writeText(event.message);
          break;
        case "sendTx":
          {
            const { fromAddress, toAddress, amount, network } = event.message;
            // get provider and operator
            const provider = this.ctx.getProviderByNetwork(network);
            const senderAddressObj = this.ctx.getAddressObj(fromAddress);
            const sender = newAccount(senderAddressObj!, provider);

            try {
              if (amount) {
                const ret = await sender.sendToken(toAddress, getAmount(amount));
                this.ctx.vmLog.info(`[sendToken]`,`[previousHash=${ret.previousHash}]`);
              }
              const receiverAddressObj = this.ctx.getAddressObj(toAddress);
              if (receiverAddressObj) {
                const receiver = newAccount(receiverAddressObj!, provider);
                await receiver.receiveAll();
                this._onDidDeriveAddress.fire();
              }
            } catch (error:any) {
              this.ctx.vmLog.error(error.message);
            }
          }
          break;
        case "receiveTx":
          {
            const { address, network } = event.message;
            const provider = this.ctx.getProviderByNetwork(network);
            const receiverAddressObj = this.ctx.getAddressObj(address);
            this.ctx.log.debug(receiverAddressObj);
            const receiver = newAccount(receiverAddressObj!, provider);
            try {
              await receiver.receiveAll();
            } catch (error:any) {
              this.ctx.vmLog.error(error.message);
            }
          }
          break;
      }

    }, null, this.disposables);

    webviewView.webview.html = getWebviewContent(webviewView.webview, this.ctx.extensionUri, "wallet");
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
    while (this.disposables.length) {
      const disposable = this.disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  async updateAddressInfo(network: ViteNetwork, address?: Address) {
    const nodesList = this.ctx.getViteNodesList(network);
    let provider;
    for (const node of nodesList) {
      if (node.status === ViteNodeStatus.Running) {
        provider = this.ctx.getProvider(node.name);
      }
    }

    if (!provider) {
     return;
    }

    let addressList = [];
    if (address) {
      addressList.push(address);
    } else {
      addressList = this.ctx.getAddressList(network);
    }
    for (const address of addressList) {
      try {
        const quotaInfo = await provider.request('contract_getQuotaByAccount', address);
        const balanceInfo = await provider.getBalanceInfo(address);
        const balance = balanceInfo.balance.balanceInfoMap?.[Vite_TokenId]?.balance;
        this.postMessage({
          command: "updateAddressInfo",
          message: {
            address,
            network,
            quota: quotaInfo.currentQuota,
            balance: balance ? balance.slice(0, balance.length - Vite_Token_Info.decimals) : '0',
          }
        });
      } catch (error) {
        this.ctx.log.debug(error);
      }
    }
  }
}