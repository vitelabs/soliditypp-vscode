import * as vscode from "vscode";
import { createHash } from "crypto";
import * as path from "path";
import * as fs from "fs";
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
  [ViteNetwork.Debug]: `vite.wallet.${ViteNetwork.Debug}`,
  [ViteNetwork.TestNet]: `vite.wallet.${ViteNetwork.TestNet}`,
  [ViteNetwork.MainNet]: `vite.wallet.${ViteNetwork.MainNet}`,
};

export const ADDRESS_LIST_KEY = {
  [ViteNetwork.Debug]: `vite.address.${ViteNetwork.Debug}`,
  [ViteNetwork.TestNet]: `vite.address.${ViteNetwork.TestNet}`,
  [ViteNetwork.MainNet]: `vite.address.${ViteNetwork.MainNet}`,
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
        network: ViteNetwork.Debug,
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
    ]);
    // get custom nodes
    for (const node of this.config.viteCustomNodes) {
      if (node.type === "local") {
        node.status = ViteNodeStatus.Stopped;
      } else {
        node.status = ViteNodeStatus.Syncing;
      }
      this.viteNodeMap.set(node.name, node);
    }
    this.log.debug("Vite nodes", this.viteNodeMap.values());
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
    const fullName = `solidytpp.${name}`;
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

  getProvider(nodeName: string) {
    const id = `vite.provider.${nodeName}`;
    const cached = this.cache.get(id);
    if (cached) {
      return cached;
    }
    const node = this.viteNodeMap.get(nodeName);
    const url = node?.url ?? nodeName;
    let provider;
    if (url.startsWith("http")) {
      provider = new vite.ViteAPI(new vite.HTTP_RPC(url), () => {
        this.log.debug(url, "Connected");
      });
    } else {
      provider = new vite.ViteAPI(new vite.WS_RPC(url), () => {
        this.log.debug(url, "Connected");
      }, new viteConnectHandler.RenewSubscription(Number.MAX_VALUE));
    }
    this.cache.set(id, provider);
    return provider;
  }

  getProviderByNetwork(network: ViteNetwork) {
    let provider;
    for (const node of this.viteNodeMap.values()) {
      if (node.network === network) {
        if (node.status === ViteNodeStatus.Running) {
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
      if (a.network === ViteNetwork.Debug) {
        return -1;
      }
      if (b.network === ViteNetwork.Debug) {
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
      case ViteNetwork.Debug:
        return this.debugWallet;
      case ViteNetwork.TestNet:
        return this.testNetWallet;
      case ViteNetwork.MainNet:
        return this.mainNetWallet;
    }
  }

  deriveAddress(wallet: any, index: number): AddressObj {
    const addressObj: AddressObj = wallet.deriveAddress(index);
    this.cache.set(`vite.address.${addressObj.address}`, addressObj);
    let id = "";
    if (wallet.entropy === this.debugWallet.entropy) {
      id = ADDRESS_LIST_KEY.Debug;
    } else if (wallet.entropy === this.testNetWallet.entropy) {
      id = ADDRESS_LIST_KEY.TestNet;
    } else if (wallet.entropy === this.mainNetWallet.entropy) {
      id = ADDRESS_LIST_KEY.MainNet;
    }
    const addressList = this.cache.get(id);
    this.cache.set(id, [...(addressList ?? []), addressObj.address]);
    return addressObj;
  }

  getAddressList(network: ViteNetwork): Address[] {
    return this.cache.get(ADDRESS_LIST_KEY[network]);
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
    if (network !== ViteNetwork.Debug) {
      try {
        const outputFsPath = path.join(path.dirname(contractFile.fsPath), path.basename(contractFile.fsPath, ".json") + ".txt");
        const outputFile = fs.createWriteStream(outputFsPath, { flags: "a" });
        outputFile.write(`${id} ${address}\n`);
        outputFile.end();
      } catch (error) {
        this.log.debug(error);
      }
    }
    vscode.commands.executeCommand("contract.refresh");
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
    try {
      const md5sum = createHash("md5").update(bytecode).digest("hex");
      const targetId = `${contractName}:${md5sum}:${network}`;
      let ret: Address | undefined = this.cache.get(targetId);
      // read from txt file
      if (!ret && network !== ViteNetwork.Debug) {
      // if (!ret) {
        const outputFsPath = path.join(path.dirname(contractFile.fsPath), path.basename(contractFile.fsPath, ".json") + ".txt");
        const outputFile = vscode.Uri.parse(outputFsPath);
        await vscode.workspace.fs.stat(outputFile);
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
    } catch (error) {
    }
    return;
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
