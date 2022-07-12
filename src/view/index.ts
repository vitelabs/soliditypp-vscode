import * as vscode from "vscode";
import * as path from "path";

import { Ctx } from "../ctx";
import { isSolppEditor, readContractJsonFile } from "../util";
import { CONTRACT_SCHEME, ViteNetwork, ViteNode, ViteNodeStatus, DeployInfo, Address } from "../types/types";
import { NetworkViewProvider } from "./network";
import { ViteWalletViewProvider } from "./wallet";
import { ContractDeploymentViewProvider } from "./contract_deployment";

import {
  ContractTreeDataProvider,
  ContractContextValue,
  ContractItem,
} from "./contract_tree";
import { ContractConsoleViewPanel } from "./contract_console";

class ContractTextDocumentContentProvider implements vscode.TextDocumentContentProvider {
  onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
  onDidChange = this.onDidChangeEmitter.event;

/*
  custom a virtual document of contract, "scheme://contract/file/path#contractName"
*/
  async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    const file = vscode.Uri.parse(uri.query).with({ fragment: uri.fragment });
    const ret = await readContractJsonFile(file);
    return JSON.stringify(ret, null, 4);
  }
};

export function activateContractView(ctx: Ctx): void {

  // register contract text document content provider
  ctx.pushCleanup(
    vscode.workspace.registerTextDocumentContentProvider(CONTRACT_SCHEME, new ContractTextDocumentContentProvider())
  );

  /* 
     Contract Tree Data Provider
   */
  const treeDataProvider = new ContractTreeDataProvider(ctx);
  const treeViewer = vscode.window.createTreeView(ContractTreeDataProvider.viewType, {
    treeDataProvider: treeDataProvider,
    showCollapseAll: true,
  });
  ctx.pushCleanup(treeViewer);

  const workspaces = vscode.workspace.workspaceFolders ?? [];
  if (workspaces.length === 1) {
    treeViewer.title = workspaces[0].name;
  } else if (workspaces.length > 1) {
    treeViewer.title = "WORKSPACE";
  }

  // watch workspace changes
  vscode.workspace.onDidCreateFiles(() => {
    treeDataProvider.refresh();
  }, null, ctx.subscriptions);
  vscode.workspace.onDidDeleteFiles(() => {
    treeDataProvider.refresh();
  }, null, ctx.subscriptions);
  vscode.workspace.onDidRenameFiles(() => {
    treeDataProvider.refresh();
  }, null, ctx.subscriptions);
  vscode.window.onDidChangeActiveTextEditor((editor) =>{
    if (editor && isSolppEditor(editor)) {
      treeDataProvider.refresh();
    }
  }, null, ctx.subscriptions);

  /*
     Contract Deployment webview
   */

  const contractDeploymentProvider = new ContractDeploymentViewProvider(ctx);
  // register Contract Deployment webview
  ctx.pushCleanup(
    vscode.window.registerWebviewViewProvider(
      ContractDeploymentViewProvider.viewType,
      contractDeploymentProvider,
    )
  );

  /*
     Vite Wallet webview
   */
  const walletProvider = new ViteWalletViewProvider(ctx);
  // register Vite Wallet webview
  ctx.pushCleanup(
    vscode.window.registerWebviewViewProvider(
      ViteWalletViewProvider.viewType,
      walletProvider
    )
  );

  /*
     Vite Network webview
   */
  const networkProvider = new NetworkViewProvider(ctx);
  // register Vite Network webview
  ctx.pushCleanup(
    vscode.window.registerWebviewViewProvider(
      NetworkViewProvider.viewType,
      networkProvider
    )
  );

  /*
    sync message in each webview
  */
  async function getContractsList(contextValue: ContractContextValue, item?: ContractItem): Promise<ContractItem[]> {
    const contractsList: ContractItem[] = [];
    const ret = await treeDataProvider.getChildren(item);
    for (const item of ret) {
      if (item.contextValue === contextValue) {
        contractsList.push(item);
      } else {
        contractsList.push(...await getContractsList(contextValue, item));
      }
    }
    return contractsList;
  }
  
  // sync contract
  ctx.pushCleanup(
    treeDataProvider.onDidChangeTreeData(async () => {
      contractDeploymentProvider.updateContractsList(await getContractsList(ContractContextValue.Contract));
    })
  );
  // sync address
  ctx.pushCleanup(
    walletProvider.onDidDeriveAddress(async () => {
      contractDeploymentProvider.updateDeps();
      ContractConsoleViewPanel.updateDeps();
    })
  );
  // sync node
  ctx.pushCleanup(
    networkProvider.onDidChangeNode(async (node) => {
      contractDeploymentProvider.updateDeps();
      if (node.network === ViteNetwork.Debug && node.status === ViteNodeStatus.Stopped) {
        const contractsList = await getContractsList(ContractContextValue.ContractDeployed);
        for (const contract of contractsList) {
          ctx.clearCachedDeploymentRecord(contract.resourceUri!, node.network);
        }
        treeDataProvider.refresh();
      }
    })
  );
  // sync call contract event
  ctx.pushCleanup(
    ContractConsoleViewPanel.onDidCallContract(async (event: any) => {
      await walletProvider.updateAddressInfo(event.message.network);
    })
  );

  // network changed
  // ctx.pushCleanup(
  //   contractDeploymentProvider.onDidChangeNetwork(async (network) => {
  //   })
  // ) ;

  // commands
  ctx.pushCleanup(
    vscode.commands.registerCommand("contract.open", async(target: vscode.Uri | ContractItem) => {
      if (target instanceof vscode.Uri) {
        const found = treeDataProvider.contractItemFlatMap.get(target.toString(true));
        if (found) {
          target = found;
        } else {
          return;
        }
      }

      if (target instanceof ContractItem) {
        const file = target.resourceUri!;
        if (target.contextValue === ContractContextValue.ContractSource) {
          await vscode.commands.executeCommand("vscode.open", target.resourceUri);
        } else if (target.contextValue === ContractContextValue.Contract) {
          const fileName = path.basename(file.fsPath);
          const contractFile = vscode.Uri.file(`#${file.fragment} ${fileName}`).with({
            scheme: file.scheme,
            query: file.fsPath,
            fragment: file.fragment,
          });
          const doc = await vscode.workspace.openTextDocument(contractFile);
          await vscode.window.showTextDocument(doc, { preview: true });
        } else if (target.contextValue === ContractContextValue.ContractCompileError) {
          const doc = await vscode.workspace.openTextDocument(file.with({ scheme: "file" }));
          await vscode.window.showTextDocument(doc, { preview: true });
        } else if (target.contextValue === ContractContextValue.ContractDeployed) {
          // parse a url query string to object
          let address: Address, network: ViteNetwork;
          const query = file.query.split("&");
          for (const item of query) {
            const [key, value] = item.split("=");
            if (key === "address") {
              address = value;
            } else if (key === "network") {
              network = value as ViteNetwork;
            }
          }
          const sourceFsPath = path.join(path.dirname(file.fsPath), path.basename(file.fsPath, ".json"));
          const compileRet:any = await ctx.getCompileResult(vscode.Uri.parse(file.fsPath).with({fragment: file.fragment}));
          const deployinfo: DeployInfo = {
            contractName: file.fragment,
            address: address!,
            contractFsPath: file.fsPath,
            sourceFsPath: sourceFsPath,
            network: network!,
            abi: compileRet.abi,
          };
          // render console webview
          ContractConsoleViewPanel.render(ctx, deployinfo);
        }
      }

      // TODO there is no API to collapse, maybe replace item can work
      await treeViewer.reveal(target, {
        expand: true,
      });
    })
  );

  ctx.pushCleanup(
    vscode.commands.registerCommand("contract.openCompileResult", async(target: vscode.Uri | ContractItem) => {
      if (target instanceof ContractItem) {
        target = target.resourceUri!;
      }
      const fileName = path.basename(target.fsPath);
      const contractFile = vscode.Uri.file(`#${target.fragment} ${fileName}`).with({
        scheme: target.scheme,
        query: target.fsPath,
        fragment: target.fragment,
      });
      const doc = await vscode.workspace.openTextDocument(contractFile);
      await vscode.window.showTextDocument(doc, { preview: true });
    })
  );
  ctx.pushCleanup(
    vscode.commands.registerCommand("contract.refresh", () => {
      treeDataProvider.refresh();
    })
  );

  ctx.pushCleanup(
    vscode.commands.registerCommand("contract.startLocalViteNode", async() => {
      await networkProvider.startLocalViteNode();
    })
  );
  ctx.pushCleanup(
    vscode.commands.registerCommand("contract.stopLocalViteNode", async()=>{
      await networkProvider.stopLocalViteNode();
    })
  );

  ctx.pushCleanup(
    vscode.commands.registerCommand("wallet.refresh", ()=>{
      for (const network of [ViteNetwork.Debug, ViteNetwork.TestNet, ViteNetwork.MainNet]) {
        walletProvider.refresh(network);
      }
    })
  );
}
