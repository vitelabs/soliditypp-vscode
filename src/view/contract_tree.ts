import * as vscode from 'vscode';

import { isSolppDocument } from "../util";
import { Ctx } from "../ctx";
import { CONTRACT_SCHEME, ViteNetwork, Address } from "../types/types";

type ContractItemChangeEvent = ContractItem | undefined | null | void;
export enum ContractContextValue {
  Folder = "Folder",
  ContractSource = "ContractSource",
  Contract = "Contract",
  ContractCompileError = "ContractCompileError",
  ContractDeployed = "ContractDeployed",
};

const CONTRACT_COMPILE_ERROR = "CONTRACT_COMPILE_ERROR";

export class ContractTreeDataProvider implements vscode.TreeDataProvider<ContractItem> {
  public static readonly viewType = "ContractTreeDataView";

  private _onDidChangeTreeData = new vscode.EventEmitter<ContractItemChangeEvent>();
  readonly onDidChangeTreeData: vscode.Event<ContractItemChangeEvent> = this._onDidChangeTreeData.event;

  public contractItemFlatMap = new Map<string, ContractItem>();

  constructor(private readonly ctx: Ctx) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ContractItem): ContractItem {
    if (element.resourceUri) {
      this.contractItemFlatMap.set(element.resourceUri.toString(true), element);
    }
    return element;
  }

  async getChildren(element?: ContractItem): Promise<vscode.TreeItem[]> {
    if (element === undefined) {
      let items: ContractItem[] = [];
      const workspaces = vscode.workspace.workspaceFolders ?? [];
      if (workspaces.length > 1) {
        items = workspaces.map(x => {
          return new ContractItem(x);
        });
      } else {
        const contracts = [
          ...(await vscode.workspace.findFiles("**/*.sol")),
          ...(await vscode.workspace.findFiles("**/*.solpp")),
        ];
        for (const contract of contracts) {
          items.push(new ContractItem(contract));
        }
      }

      // contracts file without workspace, just show it
      for (const doc of vscode.workspace.textDocuments) {
        if (isSolppDocument(doc)) {
          const workspaceTarget = vscode.workspace.getWorkspaceFolder(doc.uri);
          if (workspaceTarget === undefined) {
            const item = new ContractItem(doc.uri);
            items.push(item);
          }
        }
      }
      // items sort by file basename of item.resourceUri.fsPath, case insensitive
      return items.sort(sortByFilenName);
    } else if (element.contextValue === ContractContextValue.Folder) {
      const contracts = [
        ...(await vscode.workspace.findFiles("**/*.sol")),
        ...(await vscode.workspace.findFiles("**/*.solpp")),
      ];
      const items: ContractItem[] = [];
      for (const contract of contracts) {
        const workspace = vscode.workspace.getWorkspaceFolder(contract);
        if (workspace?.name === element.label) {
          items.push(new ContractItem(contract));
        }
      }
      return items.sort(sortByFilenName);
    } else if (element.contextValue === ContractContextValue.ContractSource && element.resourceUri) {
      // TODO support ABI and bin
      const contractJsonFile = vscode.Uri.parse(`${element.resourceUri.fsPath}.json`);
      let ret: Uint8Array;
      try {
        await vscode.workspace.fs.stat(contractJsonFile);
        ret = await vscode.workspace.fs.readFile(contractJsonFile);
      } catch (e) {
        const item = new vscode.TreeItem("Uncompiled");
        item.iconPath = new vscode.ThemeIcon("tools");
        return [
          item
        ];
      }
      try {
        const compileResult = JSON.parse(ret.toString());
        let hasError = false;
        let hasWarning = false;
        for (const err of compileResult.errors ?? []) {
          if (err.severity === 'error') {
            hasError = true;
          }
          if (err.severity === 'warning') {
            hasWarning = true; 
          }
        }
        if (hasError) {
          return [
            new ContractItem(contractJsonFile, CONTRACT_COMPILE_ERROR)
          ];
        }
        if (compileResult.contracts) {
          const items: ContractItem[] = [];
          for (const fileName in compileResult.contracts) {
            const contractObj = compileResult.contracts[fileName];
            for (const contractName in contractObj) {
              // const contractInfo: JSONValue = contractObj[contractName];
              items.push(new ContractItem(contractJsonFile, contractName));
            }
          }
          return items.reverse();
        } else {
          return [
            new ContractItem(contractJsonFile, CONTRACT_COMPILE_ERROR)
          ];
        }
      } catch (e) {
        const errItem = new vscode.TreeItem("Something wrong");
        errItem.iconPath = new vscode.ThemeIcon("bracket-error");
        errItem.tooltip = JSON.stringify(e);
        return [
          errItem
        ];
      }
    } else if (element.contextValue === ContractContextValue.Contract && element.resourceUri) {
      const items: ContractItem[] = [];
      for (const str in ViteNetwork) {
        const network: ViteNetwork = ViteNetwork[str as keyof typeof ViteNetwork];
        const address = await this.ctx.getLatestDeploymentRecord(element.resourceUri, network);
        if (address) {
          items.push(new ContractItem(element.resourceUri, element.resourceUri.fragment, network, address));
        }
      }
      if (items.length > 0) {
        return items;
      } else {
        const item = new vscode.TreeItem("Undeployed");
        item.iconPath = new vscode.ThemeIcon("compass-dot");
        return [
          item
        ];
      }
    }
    return [];
  }

  getParent(element: ContractItem) {
    return null;
  }
}

export class ContractItem extends vscode.TreeItem {
  children?: ContractItem[];

  constructor(file: vscode.Uri | vscode.WorkspaceFolder, contractName?:string, network?: ViteNetwork, address?: Address) {
    if (contractName) {
      file = file as vscode.Uri;
      if (contractName === CONTRACT_COMPILE_ERROR) {
        const label = "compile error";
        const itemLabel: vscode.TreeItemLabel = {
          label,
          highlights: [[0, label.length]]
        };
        super(itemLabel);
        this.iconPath = new vscode.ThemeIcon("close");
        this.contextValue = ContractContextValue.ContractCompileError;
        this.tooltip = file.fsPath;
        this.resourceUri = file.with({ scheme: CONTRACT_SCHEME, fragment: contractName });
      } else if (network && address) {
        super(`${network}: ${address.slice(0,10)}...${address.slice(50)}`);
        this.iconPath = new vscode.ThemeIcon("compass");
        this.contextValue = ContractContextValue.ContractDeployed;
        this.tooltip = `Deployed at ${address} on ${network} network`;
        this.resourceUri = file.with({ scheme: CONTRACT_SCHEME, fragment: contractName, query: `network=${network}&address=${address}` });
      } else {
        super(contractName);
        this.iconPath = new vscode.ThemeIcon("file-code");
        this.contextValue = ContractContextValue.Contract;
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        this.tooltip = file.fsPath;
        this.resourceUri = file.with({ scheme: CONTRACT_SCHEME, fragment: contractName });
      }
    } else {
      if (file instanceof vscode.Uri) {
        super(file);
        this.tooltip = file.fsPath;
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.iconPath = new vscode.ThemeIcon("file");
        this.contextValue = ContractContextValue.ContractSource;
        this.resourceUri = file;
        vscode.commands.executeCommand("soliditypp.problemMatcher", file);
      } else {
        super(file.uri);
        this.label = file.name;
        this.tooltip = file.uri.fsPath;
        this.collapsibleState = vscode.TreeItemCollapsibleState.Expanded;
        this.contextValue = ContractContextValue.Folder;
        this.resourceUri = file.uri;
      }
    }
    this.command = {
      title: "Opens the provided resource in the editor",
      command: "soliditypp.openContract",
      tooltip: "Opens the provided resource in the editor",
      arguments: [this.resourceUri, network, address]
    };
  }
}

function sortByFilenName(a: ContractItem, b: ContractItem) {
  const aName = a.resourceUri!.fsPath.toLowerCase();
  const bName = b.resourceUri!.fsPath.toLowerCase();
  if (aName < bName) {
    return -1;
  }
  if (aName > bName) {
    return 1;
  }
  return 0;
};