import * as vscode from "vscode";
import { createHash } from "crypto";
import * as path from "path";
import * as fs from "fs";
import { Connector }  from "./vite-connect-client/core";
import * as cryptoLib from './vite-connect-client/webCrypto';
const vite = require("@vite/vitejs");
const viteConnectHandler = require("@vite/vitejs/es5/viteAPI/connectHandler");
import { Config } from "./config";
import {
  ViteNetwork,
  ViteNode,
  ViteNodeStatus,
  AddressObj,
  Address,
  CompileResult,
} from "./types/types";
import { log, vmLog, Log, readContractJsonFile } from "./util";
import { debugWalletMneonic } from "./view/debug_wallet";

export const WALLET_KEY = {
  [ViteNetwork.DebugNet]: `vite.wallet.${ViteNetwork.DebugNet}`,
  [ViteNetwork.TestNet]: `vite.wallet.${ViteNetwork.TestNet}`,
  [ViteNetwork.MainNet]: `vite.wallet.${ViteNetwork.MainNet}`,
};

export const ADDRESS_LIST_KEY = {
  [ViteNetwork.DebugNet]: `vite.address.${ViteNetwork.DebugNet}`,
  [ViteNetwork.TestNet]: `vite.address.${ViteNetwork.TestNet}`,
  [ViteNetwork.MainNet]: `vite.address.${ViteNetwork.MainNet}`,
  [ViteNetwork.Bridge]: `vite.address.${ViteNetwork.Bridge}`,
};

export class Ctx {
  private cache = new Map<string, any>();
  private viteNodeMap: Map<string, ViteNode>;
  public readonly log: Log = log;
  public readonly vmLog: Log = vmLog;

  private constructor(
    readonly config: Config,
    private readonly extCtx: vscode.ExtensionContext,
  ) {
    // init default vite nodes
    this.viteNodeMap = new Map([
      ["local", {
        name: "local",
        network: ViteNetwork.DebugNet,
        url: config.viteDebugNet,
        version: config.localGoViteVersion,
        status: ViteNodeStatus.Stopped,
        type: "local",
        isDefault: true,
      }],
      ["buidl", {
        name: "buidl",
        network: ViteNetwork.TestNet,
        url: config.viteTestNet,
        status: ViteNodeStatus.Syncing,
        type: "remote",
        isDefault: true,
      }],
      ["main", {
        name: "main",
        network: ViteNetwork.MainNet,
        url: config.viteMainNet,
        status: ViteNodeStatus.Syncing,
        type: "remote",
        isDefault: true,
      }],
      ["viteConnect", {
        name: "viteConnect",
        network: ViteNetwork.Bridge,
        backendNetwork: ViteNetwork.MainNet,
        url: config.viteConnectBridge,
        status: ViteNodeStatus.Disconnected,
        type: "remote",
        isDefault: true,
      }],
    ]);
    // get custom nodes
    for (const node of this.config.viteCustomNodes) {
      node.status = ViteNodeStatus.Syncing;
      this.viteNodeMap.set(node.name, node);
    }
  }

  static async create(
    config: Config,
    extCtx: vscode.ExtensionContext,
  ): Promise<Ctx> {
    const ctx = new Ctx(config, extCtx);
    await ctx.initWallet();
    return ctx;
  }

  registerCommand(name: string, factory: (ctx: Ctx) => Cmd) {
    const fullName = `soliditypp.${name}`;
    const cmd = factory(this);
    const d = vscode.commands.registerCommand(fullName, cmd);
    this.pushCleanup(d);
  }

  get extensionPath(): string {
    return this.extCtx.extensionPath;
  }

  get extensionUri() {
    return this.extCtx.extensionUri;
  }

  get globalState(): vscode.Memento {
    return this.extCtx.globalState;
  }

  get secrets(): vscode.SecretStorage {
    return this.extCtx.secrets;
  }

  get workspaceState(): vscode.Memento {
    return this.extCtx.workspaceState;
  }

  get subscriptions(): Disposable[] {
    return this.extCtx.subscriptions;
  }

  pushCleanup(d: Disposable) {
    this.extCtx.subscriptions.push(d);
  }

  getViteNode(nodeName: string): ViteNode | undefined {
    return this.viteNodeMap.get(nodeName);
  }

  getViteNodesList(network?: ViteNetwork): ViteNode[] {
    const nodesList:ViteNode[] = [];
    for (const node of this.viteNodeMap.values()) {
      if(!network || node.network === network) {
        nodesList.push(node);
      }
    }
    return nodesList.sort((a, b) => {
      if (a.network === ViteNetwork.DebugNet) {
        return -1;
      }
      if (b.network === ViteNetwork.DebugNet) {
        return 1;
      }
      if (a.network === ViteNetwork.TestNet) {
        return -1;
      }
      if (b.network === ViteNetwork.TestNet) {
        return 1;
      }
      if (a.network === ViteNetwork.MainNet) {
        return -1;
      }
      if (b.network === ViteNetwork.MainNet) {
        return 1;
      }
      return 0;
    });
  }

  getProvider(nodeName: string) {
    const id = `vite.provider.${nodeName}`;
    const cached = this.cache.get(id);
    if (cached) {
      return cached;
    }
    const node = this.viteNodeMap.get(nodeName);
    if (!node) {
      return this.log.error("getProvider: node not found", nodeName);
    }
    let provider: any;
    if (node.network === ViteNetwork.Bridge) {
      provider = new Connector(
        cryptoLib,
        { bridge: this.config.viteConnectBridge },
        {
          bridgeVersion: 2,
          description: "Solidity++ extension for Visual Studio Code",
          url: `VS Code: ${this.config.package.displayName}`,
          icons: [],
          name: "Solidity++ Debugger",
        }
      );
      provider.on("open", () => {
        this.log.info("New Vite bridge provider from", node.url);
        node.status = ViteNodeStatus.Syncing;
      });
      provider.on("connect", () => {
        node.status = ViteNodeStatus.Connected;
      });
      provider.on("disconnect", () => {
        this.log.info("The Vite bridge provider closed", node.url);
        node.status = ViteNodeStatus.Disconnected;
        this.cache.delete(id);
      });
    } else {
      if (node.url.startsWith("http")) {
        provider = new vite.ViteAPI(new vite.HTTP_RPC(node.url), () => {
          this.log.info("New Vite provider from", node.url);
        });
      } else {
        provider = new vite.ViteAPI(new vite.WS_RPC(node.url), () => {
          this.log.info("New Vite provider from", node.url);
        }, new viteConnectHandler.RenewSubscription(Number.MAX_VALUE));
      }
    }
    this.cache.set(id, provider);
    return provider;
  }

  getProviderByNetwork(network: ViteNetwork) {
    let provider;
    for (const node of this.viteNodeMap.values()) {
      if (node.network === network) {
        if (node.status === ViteNodeStatus.Running || node.status === ViteNodeStatus.Connected) {
          return this.getProvider(node.name);
        } else {
          provider = this.getProvider(node.name);
        }
      }
    }
    return provider;
  }

  resetProvider(nodeName: string) {
    const id = `vite.provider.${nodeName}`;
    this.cache.delete(id);
  }

  get bridgeNode(): ViteNode {
    return this.viteNodeMap.get("viteConnect")!;
  }

  get bridgeProvider() {
    return this.getProvider("viteConnect");
  }


  get debugWallet() {
    return vite.wallet.getWallet(debugWalletMneonic);
  }

  get testNetWallet(): any {
    const cached = this.cache.get(WALLET_KEY[ViteNetwork.TestNet]);
    if (cached) {
      return cached;
    }

    const newWallet = vite.wallet.createWallet();
    this.secrets.store(WALLET_KEY[ViteNetwork.TestNet], newWallet.mnemonics);
    this.cache.set(WALLET_KEY[ViteNetwork.TestNet], newWallet);
    return newWallet;
  }

  set testNetWallet(mnemonic: string) {
    try {
      const wallet = vite.wallet.getWallet(mnemonic);
      this.cache.set(WALLET_KEY[ViteNetwork.TestNet], wallet);
      this.secrets.store(WALLET_KEY[ViteNetwork.TestNet], mnemonic);
    } catch (error: any) {
      vscode.window.showErrorMessage(error.message);
    }
  }

  get mainNetWallet(): any {
    const cached = this.cache.get(WALLET_KEY[ViteNetwork.MainNet]);
    if (cached) {
      return cached;
    }

    const newWallet = vite.wallet.createWallet();
    this.secrets.store(WALLET_KEY[ViteNetwork.MainNet], newWallet.mnemonics);
    this.cache.set(WALLET_KEY[ViteNetwork.MainNet], newWallet);
    return newWallet;
  }

  set mainNetWallet(mnemonic: string) {
    try {
      const wallet = vite.wallet.getWallet(mnemonic);
      this.cache.set(WALLET_KEY[ViteNetwork.MainNet], wallet);
      this.secrets.store(WALLET_KEY[ViteNetwork.MainNet], mnemonic);
    } catch (error: any) {
      vscode.window.showErrorMessage(error.message);
    }
  }

  async initWallet() {
    const testNetWalletMnemonic = await this.secrets.get(WALLET_KEY[ViteNetwork.TestNet]);
    if (testNetWalletMnemonic) {
      this.testNetWallet = testNetWalletMnemonic;
    }
    const mainNetWalletMnemonic = await this.secrets.get(WALLET_KEY[ViteNetwork.MainNet]);
    if (mainNetWalletMnemonic) {
      this.mainNetWallet = mainNetWalletMnemonic;
    }
  }

  getWallet(network: ViteNetwork) {
    switch (network) {
      case ViteNetwork.DebugNet:
        return this.debugWallet;
      case ViteNetwork.TestNet:
        return this.testNetWallet;
      case ViteNetwork.MainNet:
        return this.mainNetWallet;
    }
  }

  deriveAddress(network: ViteNetwork, index: number): AddressObj {
    const wallet = this.getWallet(network);
    const addressObj: AddressObj = wallet.deriveAddress(index);
    this.cache.set(`vite.address.${addressObj.address}`, addressObj);
    const id = ADDRESS_LIST_KEY[network];
    const addressList = this.cache.get(id) ?? [];
    const found = addressList.find((x: Address) => x === addressObj.address);
    if (!found) {
      this.cache.set(id, [...addressList, addressObj.address]);
    }
    return addressObj;
  }

  setAddress(network: ViteNetwork, addressObj: AddressObj) {
    this.cache.set(`vite.address.${addressObj.address}`, addressObj);
    const id = ADDRESS_LIST_KEY[network];
    const addressList = this.cache.get(id) ?? [];
    const found = addressList.find((x: Address) => x === addressObj.address);
    if (!found) {
      this.cache.set(id, [...addressList, addressObj.address]);
    }
  }

  getAddressList(network: ViteNetwork): Address[] {
    return this.cache.get(ADDRESS_LIST_KEY[network]) ?? [];
  }

  clearAddressList(network: ViteNetwork) {
    const list = this.getAddressList(network);
    for (const address of list) {
      this.cache.delete(`vite.address.${address}`);
    }
    this.cache.delete(ADDRESS_LIST_KEY[network]);
  }

  getAddressObj(address: string): AddressObj | undefined {
    return this.cache.get(`vite.address.${address}`);
  }

  updateCompileResult(contractFile: vscode.Uri, ret: CompileResult) {
    this.cache.set(`vite.compile.result.${contractFile.toString(true)}`, ret);
  }

  async getCompileResult(contractFile: vscode.Uri): Promise<CompileResult | undefined> {
    let ret: CompileResult | undefined = this.cache.get(`vite.compile.result.${contractFile.toString(true)}`);
    if (!ret) {
      const compileRet: any = await readContractJsonFile(contractFile);
      if (compileRet) {
        ret = {
          abi: compileRet.abi,
          bytecode: compileRet.evm?.bytecode?.object,
        };
      }
      this.cache.set(`vite.compile.result.${contractFile.toString(true)}`, ret);
    }
    return ret;
  }

  deleteCompileResult(contractFile: vscode.Uri) {
    this.cache.delete(`vite.compile.result.${contractFile.toString(true)}`);
  }

  async updateDeploymentRecord(contractFile: vscode.Uri, network: ViteNetwork, address: Address): Promise<boolean> {
    // contractName:md5(bytecode):network address
    const contractName = contractFile.fragment;
    if (!contractName) {
      return false;
    }

    const compileRet = await this.getCompileResult(contractFile);
    const bytecode = compileRet?.bytecode;
    if (!bytecode) {
      return false;
    }

    const md5sum = createHash("md5").update(bytecode).digest("hex");
    const id = `${contractName}:${md5sum}:${network}`;
    // save to cache
    this.cache.set(id, address);
    // save to txt file
    this.vmLog.debug(network, ViteNetwork.DebugNet, network !== ViteNetwork.DebugNet);
    if (network !== ViteNetwork.DebugNet) {
      try {
        const outputFsPath = path.join(path.dirname(contractFile.fsPath), path.basename(contractFile.fsPath, ".json") + ".txt");
        const outputFile = fs.createWriteStream(outputFsPath, { flags: "a" });
        outputFile.write(`${id} ${address}\n`);
        outputFile.end();
      } catch (error) {
        this.log.error(error);
      }
    }
    vscode.commands.executeCommand("soliditypp.refreshContractTree");
    return true;
  }

  async getLatestDeploymentRecord(contractFile: vscode.Uri, network: ViteNetwork): Promise<Address | undefined> {
    const contractName = contractFile.fragment;
    if (!contractName) {
      return;
    }
    const compileRet = await this.getCompileResult(contractFile);
    const bytecode = compileRet?.bytecode;
    if (!bytecode) {
      return;
    }
    const md5sum = createHash("md5").update(bytecode).digest("hex");
    const targetId = `${contractName}:${md5sum}:${network}`;
    let ret: Address | undefined = this.cache.get(targetId);
    // read from txt file
    if (!ret && network !== ViteNetwork.DebugNet) {
      // if (!ret) {
      const outputFsPath = path.join(path.dirname(contractFile.fsPath), path.basename(contractFile.fsPath, ".json") + ".txt");
      const outputFile = vscode.Uri.parse(outputFsPath);
      try {
        await vscode.workspace.fs.stat(outputFile);
      } catch (error) {
        this.log.debug(error);
        return;
      }
      const buf = await vscode.workspace.fs.readFile(outputFile);
      const lines = buf.toString().split("\n");
      for (const line of lines) {
        const [id, address] = line.split(" ");
        if (id === targetId) {
          ret = address;
        }
      }
      if (ret) {
        // save to cache
        this.cache.set(targetId, ret);
      }
    }
    return ret;
  }

  async clearCachedDeploymentRecord(contractFile: vscode.Uri, network: ViteNetwork) {
    const contractName = contractFile.fragment;
    if (!contractName) {
      return;
    }
    const compileRet = await this.getCompileResult(contractFile);
    const bytecode = compileRet?.bytecode;
    if (!bytecode) {
      return;
    }
    const md5sum = createHash("md5").update(bytecode).digest("hex");
    const id = `${contractName}:${md5sum}:${network}`;
    this.cache.delete(id);
  }
}


export interface Disposable {
  dispose(): void;
}

export type Cmd = (...args: any[]) => unknown;
