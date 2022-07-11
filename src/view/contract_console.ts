import * as vscode from "vscode";
const vuilder = require("@vite/vuilder");
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
  private contractMap: Map<Address, any> = new Map();

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
            // const amount = getAmount(ctor.amount);
            try {
              const ret = await operator.sendToken(toAddress, ctor.amount, ctor.tokenId);
              this.ctx.vmLog.info(`[${contractName}][send()][previousHash=${ret.previousHash}]`);

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
            // get provider and operator
            const provider = this.ctx.getProviderByNetwork(network);
            const addressObj = this.ctx.getAddressObj(fromAddress);
            const operator = newAccount(addressObj!, provider);

            // get contract
            const contract = this.contractMap.get(toAddress);
            // set operator and provider
            contract.setDeployer(operator).setProvider(provider);

            // get inputs value
            const params = func.inputs.map((x: any) => x.value);

            try {
              const ret = await contract.query(func.name, params);
              this.ctx.vmLog.info(`[${contractName}][query ${func.name}()]`, ret);
              this.postMessage({
                command: "queryResult",
                message: {
                  ret,
                  func,
                  contractAddress: toAddress,
                }
              });
              await this.updateAddressList();
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

            // get contract
            const contract = this.contractMap.get(toAddress);
            // set operator and provider
            contract.setDeployer(operator).setProvider(provider);

            // get inputs value
            const params = func.inputs.map((x: any) => x.value);
            const amount = getAmount(func.amount, func.amountUnit ?? "VITE");

            try {
              const ret = await contract.call(func.name, params, { amount });
              this.ctx.vmLog.info(`[${contractName}][call ${func.name}()][hash=${ret.hash}]`);
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
    this.contractMap.clear();
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

    if (this.contractMap.has(deployInfo.address)) {
      return;
    }

    const contractFile = vscode.Uri.parse(deployInfo.contractFsPath).with({ fragment: deployInfo.contractName });
    const compileResult: any = await this.ctx.getCompileResult(contractFile);

    // create contract
    const contract = new vuilder.Contract(
      deployInfo.contractName,
      compileResult.bytecode,
      compileResult.abi,
    );

    contract.attach(deployInfo.address);
    this.contractMap.set(deployInfo.address, contract);

    // push to webview
    await this.postMessage({
      command: "pushContract",
      message: deployInfo,
    });

    // subscribe vmlog
    try {
      const provider = this.ctx.getProviderByNetwork(deployInfo.network);
      // const listener = await provider.subscribe("newAccountBlock");
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
          this.ctx.vmLog.info(`[${deployInfo.contractName}]`, event);
        }
      });
    } catch (error) {
      this.ctx.vmLog.error(`[${deployInfo.contractName}]`, error);
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