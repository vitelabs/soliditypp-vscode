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
  ABIItem,
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
            this.postMessage({
              command: "pushContract",
              message: deployInfo,
            });
          }
          break;
        case "getAddressList":
          await this.updateAddressList(event.message);
          break;
        case "send":
          {
            this.ctx.vmLog.debug(event);
            const { fromAddress, toAddress, network, ctor } = event.message;
            const provider = this.ctx.getProviderByNetwork(network);
            const addressObj = this.ctx.getAddressObj(fromAddress);
            const operator = newAccount(addressObj!, provider);
            const amount = getAmount(ctor.amount);
            try {
              const ret = await operator.sendToken(toAddress, amount, ctor.tokenId);
              this.ctx.vmLog.info(ret);

              await this.updateAddressList(network);
            } catch (error) {
              this.ctx.vmLog.error(error); 
            }
            ContractConsoleViewPanel._onDidCallContract.fire(event);
          }
          break;
        case "query":
          {
            this.ctx.vmLog.debug(event);
            const { fromAddress, toAddress, network, contractFile, func } = event.message;
            // get provider and operator
            const provider = this.ctx.getProviderByNetwork(network);
            const addressObj = this.ctx.getAddressObj(fromAddress);
            const operator = newAccount(addressObj!, provider);

            // get abi and bytecode
            const file = vscode.Uri.parse(contractFile.fsPath).with({ fragment: contractFile.fragment });
            const compileResult: any = await this.ctx.getCompileResult(file);

            // create contract
            const contract = new vuilder.Contract(
              contractFile.fragment,
              compileResult.bytecode,
              compileResult.abi,
            );

            // attach contract address
            contract.attach(toAddress);
            // set operator and provider
            contract.setDeployer(operator).setProvider(provider);

            try {
              const ret = await contract.query(func.name);
              this.postMessage({
                command: "queryResult",
                message: {
                  ret,
                  func,
                  contractAddress: toAddress,
                }
              });
              await this.updateAddressList(network);
            } catch (error) {
              this.ctx.vmLog.error(error); 
            }
            ContractConsoleViewPanel._onDidCallContract.fire(event);
          }
          break;
        case "call":
          {
            this.ctx.vmLog.debug(event);
            const { fromAddress, toAddress, network, contractFile, func } = event.message;
            // get provider and operator
            const provider = this.ctx.getProviderByNetwork(network);
            const addressObj = this.ctx.getAddressObj(fromAddress);
            const operator = newAccount(addressObj!, provider);

            // get abi and bytecode
            const file = vscode.Uri.parse(contractFile.fsPath).with({ fragment: contractFile.fragment });
            const compileResult: any = await this.ctx.getCompileResult(file);

            // create contract
            const contract = new vuilder.Contract(
              contractFile.fragment,
              compileResult.bytecode,
              compileResult.abi,
            );

            // attach contract address
            contract.attach(toAddress);
            // set operator and provider
            contract.setDeployer(operator).setProvider(provider);
            // get inputs value
            const params = func.inputs.map((x: any) => x.value);
            const amount = getAmount(func.amount);

            try {
              const ret = await contract.call(func.name, params, { amount });
              this.ctx.vmLog.info(ret);
              await this.updateAddressList(network);
            } catch (error) {
              this.ctx.vmLog.error(error); 
            }
            ContractConsoleViewPanel._onDidCallContract.fire(event);
          }
          break;
      }
    }, null, this._disposables);

    this._panel.webview.html = getWebviewContent(this._panel.webview, ctx.extensionUri, "console");
  }

  public static render(ctx: Ctx, deployInfo: DeployInfo) {
    const column = ctx.config.consoleViewColumn ?? vscode.window.activeTextEditor?.viewColumn;

    if (ContractConsoleViewPanel.currentPanel) {
      ContractConsoleViewPanel.currentPanel._panel.reveal(column, true);
      ContractConsoleViewPanel.currentPanel._panel.title = `${deployInfo.contractName} Console`;
      ContractConsoleViewPanel.currentPanel.postMessage({
        command: "pushContract",
        message: deployInfo,
      });
    } else {
      const panel = vscode.window.createWebviewPanel(
        ContractConsoleViewPanel.viewType,
        `${deployInfo.contractName} Console`,
        {
          viewColumn: column ?? vscode.ViewColumn.One,
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

  public static clearView() {
    if (ContractConsoleViewPanel.currentPanel) {
      ContractConsoleViewPanel.currentPanel.postMessage({
        command: "clear",
      });
      ContractConsoleViewPanel.currentPanel._panel.title = `Contract Console`;
    }
  }

  private async updateAddressList(network: ViteNetwork) {
    const list = this.ctx.getAddressList(network);
    const provider = this.ctx.getProviderByNetwork(network);
    const message: any[] = [];
    for (const address of list) {
      const quotaInfo = await provider.request('contract_getQuotaByAccount', address);
      const balanceInfo = await provider.getBalanceInfo(address);
      const balance = balanceInfo.balance.balanceInfoMap?.[Vite_TokenId]?.balance;
      message.push({
        address,
        network,
        quota: quotaInfo.currentQuota,
        balance: balance ? balance.slice(0, balance.length - Vite_Token_Info.decimals) : '0',
      });
    }
    this.postMessage({
      command: "setAddressList",
      message,
    });
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
