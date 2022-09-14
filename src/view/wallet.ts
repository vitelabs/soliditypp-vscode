import * as vscode from "vscode";
const vite = require("@vite/vitejs");
const vuilder = require("@vite/vuilder");
import { getWebviewContent } from "./webview";
import { Address, MessageEvent, ViteNetwork, ViteNodeStatus } from "../types/types";
import { Ctx } from "../ctx";
import { getAmount } from "../util";

export class ViteWalletViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "ViteWalletView";
  private _webviewView?: vscode.WebviewView;
  private disposables: vscode.Disposable[] = [];
  private _onDidDispose = new vscode.EventEmitter<void>();
  readonly onDidDispose: vscode.Event<void> = this._onDidDispose.event;
  private _onDidDeriveAddress = new vscode.EventEmitter<void>();
  readonly onDidDeriveAddress: vscode.Event<void> = this._onDidDeriveAddress.event;
  private isSubViteConnectEvents = false;

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
      if (event.command !== "log") {
        this.ctx.log.debug(`[recevieMessage=${this.constructor.name}]`, event);
      }
      switch (event.command) {
        case "log":
          const method = event.subCommand as "info" | "debug" | "warn" | "error" | "log";
          const msg: [unknown, ...unknown[]] = event.message;
          this.ctx.log[method](...msg, `[${this.constructor.name}]`);
          break;
        case "mounted":
          {
            const message = [];
            const networkList = Object.values(ViteNetwork);
            for (const network of networkList) {
              message.push({
                network,
                addressList: this.ctx.getAddressList(network),
              });
            }
            await this.postMessage({
              command: "setAddress",
              message,
            });

            for (const network of networkList) {
              this.refresh(network);
            }

            this._onDidDeriveAddress.fire();
          }
          break;
        case "deriveAddress":
          {
            const { network, index } = event.message;
            let addressObj = this.ctx.deriveAddress(network, index);
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
            const { network, mnemonic } = event.message;
            if (network === ViteNetwork.TestNet) {
              this.ctx.testNetWallet = mnemonic;
            } else if (network === ViteNetwork.MainNet) {
              this.ctx.mainNetWallet = mnemonic;
            }
            await this.postMessage({
              command: "setAddress",
              message: [
                {
                  addressList: [this.ctx.deriveAddress(network, 0).address],
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
        case "createSession":
          {
            const provider = this.ctx.bridgeProvider;
            this.subToBridgeProviderEvents(provider);
            await provider.createSession();
            this.postMessage({
              command: "setViteConnectUri",
              message: provider.uri,
            });
          }
          break;
        case "killSession": 
          {
            await this.ctx.bridgeProvider.destroy();
            await this.postMessage({
              command: "setAddress",
              message: [{
                addressList: [],
                network: ViteNetwork.Bridge,
              }],
            });
          }
          break;
        case "changeBackendNetwork":
          {
            this.ctx.bridgeNode.backendNetwork = event.message;
            const addressesList = this.ctx.getAddressList(ViteNetwork.Bridge);
            for (const address of addressesList) {
              this.updateAddressInfo(ViteNetwork.Bridge, address);
            }
          }
          break;
        case "sendTx":
          {
            const { fromAddress, toAddress, amount, network } = event.message;
            if (!amount) {
              vscode.window.showWarningMessage("Please input amount");
              return;
            }
            // create AccountBlock
            const ab = new vite.accountBlock.AccountBlock({
              blockType: vite.constant.BlockType.TransferRequest,
              address: fromAddress,
              toAddress,
              tokenId: vite.constant.Vite_TokenId,
              amount: getAmount(amount),
              data: "",
            });
            this.ctx.vmLog.info(`[${network}][sendToken][from=${fromAddress}][to=${toAddress}][amount=${amount}]`, ab.accountBlock);
            // get provider and operator
            const provider = this.ctx.getProviderByNetwork(network);
            if (network === ViteNetwork.Bridge) {
              try {
                const sendBlock = await provider.sendCustomRequest({
                  method: "vite_signAndSendTx",
                  params: [{
                    block: ab.accountBlock,
                  }]
                });
                this.ctx.vmLog.info(`[${network}][sendToken][signedBlock=${sendBlock.hash}]`, sendBlock);
                await this.updateAddressInfo(network);
                await this.updateAddressInfo(this.ctx.bridgeNode.backendNetwork!);
                // NOTE: sync balance and quota
                this._onDidDeriveAddress.fire();
              } catch (error) {
                this.ctx.vmLog.info(`[${network}][sendToken]`, error);
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
                      this.ctx.vmLog.info(`[${network}][sendToken][sendBlock=${sendBlock.hash}]`, sendBlock);
                      return true;
                    }
                  }
                  return false;
                });

                // waiting confirmed
                await vuilder.utils.waitFor(async () => {
                  if (sendBlock.confirmedHash) {
                    this.ctx.vmLog.info(`[${network}][sendToken][sendBlock][confirmed=${sendBlock.confirmedHash}]`, sendBlock);
                    return true;
                  }
                  sendBlock = await provider.request("ledger_getAccountBlockByHash", sendBlock.hash);
                  return false;
                });

                await this.updateAddressInfo(network);
                await this.updateAddressInfo(ViteNetwork.Bridge);
                // NOTE: sync balance and quota
                this._onDidDeriveAddress.fire();
              } catch (error: any) {
                this.ctx.vmLog.info(`[${network}][sendToken]`, error);
              }
            }
          }
          break;
      }

    }, null, this.disposables);

    webviewView.webview.html = getWebviewContent(webviewView.webview, this.ctx.extensionUri, "wallet");
  }

  public async postMessage(message: any): Promise<boolean> {
    this.ctx.log.debug(`[postMessage=${this.constructor.name}]`, message);
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
      if (node.network === ViteNetwork.Bridge) {
        if (this.ctx.bridgeNode.status !== ViteNodeStatus.Connected) {
          break;
        }
        provider = this.ctx.getProviderByNetwork(node.backendNetwork!);
      } else if (node.status === ViteNodeStatus.Running) {
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
        const quotaInfo = await provider.request("contract_getQuotaByAccount", address);
        const balanceInfo = await provider.getBalanceInfo(address);
        const balance = balanceInfo.balance.balanceInfoMap?.[vite.constant.Vite_TokenId]?.balance;
        const unreceivedBlocks = await provider.request("ledger_getUnreceivedBlocksByAddress", address, 0, 10);
        this.postMessage({
          command: "updateAddressInfo",
          message: {
            address,
            network,
            quota: quotaInfo.currentQuota,
            balance: balance ? `${balance.slice(0, balance.length - vite.constant.Vite_Token_Info.decimals) || '0'}` : '0',
            unreceived: unreceivedBlocks.length,
          }
        });
        if (unreceivedBlocks.length > 0) {
          this.receiveTx(address, network);
        }
      } catch (error) {
        this.ctx.vmLog.error(`[${network}][getBalance][getQuota]`, error);
      }
    }
  }

  async receiveTx(address: Address, network: ViteNetwork) {
    if (network === ViteNetwork.Bridge) {
      return;
    }
    const provider = this.ctx.getProviderByNetwork(network);
    const receiverAddressObj = this.ctx.getAddressObj(address);
    if (receiverAddressObj) {
      const blocks = await provider.request("ledger_getUnreceivedBlocksByAddress", address, 0, 10);
      for (const block of blocks) {
        this.ctx.vmLog.info(`[${network}][receiveToken][UnreceivedBlock=${block.hash}]`, block);

        // create AccountBlock
        const ab = new vite.accountBlock.AccountBlock({
          blockType: vite.constant.BlockType.Response,
          address,
          sendBlockHash: block.hash,
        });
        // set provider
        ab.setProvider(provider);
        // set private key
        ab.setPrivateKey(receiverAddressObj.privateKey);
        let receiveBlock: any;
        let resend = false;
        try {
          receiveBlock = await ab.autoSendByPoW();
        } catch (error) {
          this.ctx.vmLog.error(`[${network}][receiveToken][autoSendByPoW]`, error);
          resend = true;
        }

        try {
          if (resend) {
            receiveBlock = await ab.autoSend();
          }
          this.ctx.vmLog.info(`[${network}][receiveToken][receiveBlock=${receiveBlock.hash}]`, receiveBlock);
          // waiting confirmed
          await vuilder.utils.waitFor(async () => {
            if (receiveBlock.confirmedHash) {
              this.ctx.vmLog.info(`[${network}][receiveToken][receiveBlock][confirmed=${receiveBlock.confirmedHash}]`, receiveBlock);
              return true;
            }
            receiveBlock = await provider.request("ledger_getAccountBlockByHash", receiveBlock.hash);
            return false;
          });
          this.updateAddressInfo(network, address);
        } catch (error: any) {
          this.ctx.vmLog.error(`[${network}][receiveToken][receiveBlock=${receiveBlock.hash}]`, error);
        }
      }
    }
  }

  async refresh(network: ViteNetwork, interval: number = 1000) {
    const nodesList = this.ctx.getViteNodesList(network);
    let hasRunningNode = false;
    for (const node of nodesList) {
      if (node.status === ViteNodeStatus.Running || node.status === ViteNodeStatus.Connected) {
        hasRunningNode = true;
      }
    }
    if (!hasRunningNode) {
      setTimeout(() => {
        this.refresh(network, interval > 10 * 1000 ? interval : interval * 2);
      } , interval);
      return;
    }

    const addressList = this.ctx.getAddressList(network);
    for (const address of addressList) {
      await this.receiveTx(address, network);
    }
    await this.updateAddressInfo(network);
  }

  private subToBridgeProviderEvents(provider: any) {
    if (this.isSubViteConnectEvents) {
      return;
    }
    this.isSubViteConnectEvents = true;
    provider.on("open", () => {
      this._onDidDeriveAddress.fire();
    });
    provider.on("disconnect", () => {
      this.isSubViteConnectEvents = false;
      this.ctx.clearAddressList(ViteNetwork.Bridge);
      this._onDidDeriveAddress.fire();
    });
    provider.on("connect", async (err: any, payload: any) => {
      if (err) {
        this.ctx.log.error(this.constructor.name, err);
        return;
      }
      // TODO: peerMeta should contain node url
      this.ctx.log.debug(this.constructor.name, "vite connect payload", payload);
      const { accounts } = payload.params[0];
      if (!accounts || !accounts[0]) {
        this.ctx.log.error(this.constructor.name, "address is null");
      } else {
        for (const address of accounts) {
          this.ctx.setAddress(ViteNetwork.Bridge, {
            publicKey: "",
            privateKey: "",
            originalAddress: "",
            address,
            path: "",
          });
          await this.postMessage({
            command: "setAddress",
            message: [{
              addressList: this.ctx.getAddressList(ViteNetwork.Bridge),
              network: ViteNetwork.Bridge,
            }],
          });
          this.updateAddressInfo(ViteNetwork.Bridge, address);
        }
        this._onDidDeriveAddress.fire();
      }
    });
  }
}