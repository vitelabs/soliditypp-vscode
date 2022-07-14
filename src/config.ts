import * as vscode from "vscode";
import { ViteNode } from "./types/types";
import { log, vmLog } from "./util";
// const vuilder = require("@vite/vuilder");

export class Config {
  readonly extensionId = "ViteLabs.solppdebugger";

  readonly rootSection = "solppdebugger";
  private readonly requiresReloadOpts = [
    "solppc",
    "vite",
    "console",
  ].map((opt) => `${this.rootSection}.${opt}`);

  readonly package: {
    version: string;
    releaseTag: string | null;
  } = vscode.extensions.getExtension(this.extensionId)!.packageJSON;

  readonly globalStorageUri: vscode.Uri;

  constructor(private readonly ctx: vscode.ExtensionContext) {
    this.globalStorageUri = ctx.globalStorageUri;

    vscode.workspace.onDidChangeConfiguration(
      this.onDidChangeConfiguration,
      this,
      ctx.subscriptions
    );
    this.refreshLogging();
  }

  private refreshLogging() {
    log.setEnabled(this.traceExtension);
    log.info("Extension version:", this.package.version);

    const cfg = Object.entries(this.cfg).filter(([_, val]) => !(val instanceof Function));
    log.info("Using configuration", Object.fromEntries(cfg));
    
    vmLog.setEnabled(this.traceExtension);

    setTimeout(async() => {
      await this.updateViteNodeConfig();
    }, 0);
  }

  private async onDidChangeConfiguration(event: vscode.ConfigurationChangeEvent) {
    this.refreshLogging();

    const requiresReloadOpt = this.requiresReloadOpts.find((opt) =>
      event.affectsConfiguration(opt)
    );

    /* eslint-disable-next-line */
    if (!requiresReloadOpt) return;

    const userResponse = await vscode.window.showInformationMessage(
      `Changing "${requiresReloadOpt}" requires a reload`,
      "Reload now"
    );

    if (userResponse === "Reload now") {
      await vscode.commands.executeCommand("workbench.action.reloadWindow");
    }
  }

  private get cfg(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(this.rootSection);
  }

  private get<T>(path: string): T {
    return this.cfg.get<T>(path)!;
  }

  updateConfig(path: string, value: any, isGlobal: boolean = false) {
    this.cfg.update(path, value, isGlobal);
  }
  
  private async updateViteNodeConfig() {
    const config =  {
      /* eslint-disable-next-line */
      "PublicModules": [
        "ledger",
        "contract",
        "subscribe"
      ],
      /* eslint-disable-next-line */
      "HttpPort": this.localGoViteHttpPort,
    };
    // update vite node config
    // TODO need vuilder to support
    // vuilder.updateNodeConfig();

    // workaround for vuilder
    const file = vscode.Uri.joinPath(this.ctx.extensionUri, "node_modules", "@vite", "vuilder", "bin", "node_config.json");
    const ret = await vscode.workspace.fs.readFile(file);
    const defaultConfig = JSON.parse(ret.toString());

    const newConfig = Object.assign({}, defaultConfig, config);
    const writeData = Buffer.from(JSON.stringify(newConfig, null, 2), "utf8");
    await vscode.workspace.fs.writeFile(file, writeData);
  }

  get traceExtension() {
    return this.get<boolean>("trace.extension");
  }

  get solppcCompiler() {
    return this.get<string>("solppc.compiler");
  }

  get solppcWatchMode() {
    return this.get<boolean>("solppc.watch");
  }

  get solppcOutputSelection() {
    const str = this.get<string>("solppc.outputSelection");
    return str.split(/[, ]+/);
  }

  get consoleViewColumn() {
    const col:string = this.get<string>("console.viewColumn");
    switch (col) {
      case "Beside":
        return vscode.ViewColumn.Beside;
      case "One":
        return vscode.ViewColumn.One;
      case "Two":
        return vscode.ViewColumn.Two;
      case "Three":
        return vscode.ViewColumn.Three;
      case "Four":
        return vscode.ViewColumn.Four;
    }
  }
  get consoleViewStyle() {
    return this.get<string>("console.viewStyle");
  }

  get deployedContractDisplay() {
    return this.get<string>("console.viewStyle");
  }

  get localGoViteVersion() {
    return this.get<string>("vite.localGoViteVersion");
  }

  get localGoViteHttpPort() {
    return this.get<number>("vite.localGoViteHttpPort");
  }

  get localGoViteAutoStart() {
    return this.get<boolean>("vite.localGoViteAutoStart");
  }

  get viteDebugNet() {
    return `http://127.0.0.1:${this.localGoViteHttpPort}`;
  }

  get viteTestNet() {
    return this.get<string>("vite.testNet");
  }

  get viteMainNet() {
    return this.get<string>("vite.mainNet");
  }

  get viteCustomNodes() {
    return this.get<ViteNode[]>("vite.customNodes");
  }

  addViteCusomNode(node: ViteNode, isGlobal: boolean = false) {
    const detail = this.cfg.inspect("vite.customNodes");
    const workspaceValue = (detail?.workspaceValue ?? []) as ViteNode[];
    const globalValue = (detail?.globalValue ?? []) as ViteNode[];
    let nodes = isGlobal ? globalValue : workspaceValue;

    let found = false;
    nodes = nodes.map(n => {
      if (n.name === node.name) {
        found = true;
        return node;
      } else {
        return n;
      }
    });
    if (!found) {
      nodes.push(node);
    }

    this.updateConfig("vite.customNodes", nodes, isGlobal);
  }
  deleteViteCusomNode(node: ViteNode) {
    const detail = this.cfg.inspect("vite.customNodes");
    const workspaceValue = (detail?.workspaceValue ?? []) as ViteNode[];
    const globalValue = (detail?.globalValue ?? []) as ViteNode[];
    for (const n of workspaceValue) {
      if (n.name === node.name) {
        this.updateConfig("vite.customNodes", workspaceValue.filter((n) => n.name !== node.name), false);
        return;
      }
    }
    for (const n of globalValue) {
      if (n.name === node.name) {
        this.updateConfig("vite.customNodes", globalValue.filter((n) => n.name !== node.name), true);
        return;
      }
    }
  }
}