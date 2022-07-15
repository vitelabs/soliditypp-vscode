import * as vscode from 'vscode';
import * as path from "path";
import * as cp from "child_process";
import { promisify } from "util";

import { Ctx, Cmd } from "./ctx";
import * as toolchain from "./toolchain";
import { isSolppEditor, isSolppDocument } from "./util";

const exec = promisify(cp.exec);
export const TASK_TYPE = 'solppc';
export const TASK_SOURCE = 'soliditypp';

export interface SolppcTaskDefinition extends vscode.TaskDefinition {
  command: string;
  args?: string[];
  cwd?: string;
  env?: { [key: string]: string };
  id?: string
}

class SolppcTaskProvider implements vscode.TaskProvider {

  private diagnosticCollection = vscode.languages.createDiagnosticCollection(TASK_TYPE);
  private contractTaskMap = new Map<string, vscode.Task>();

  constructor(private readonly ctx: Ctx) {
  }

  async provideTasks(): Promise<vscode.Task[]> {
    // Add @vite/solppc into PATH
    const envPATH:string = [
      vscode.Uri.joinPath(this.ctx.extensionUri, "node_modules", "@vite", "solppc").fsPath,
      process.env.PATH
    ].join(":");
    process.env.PATH = envPATH;
    const solppcPath = await toolchain.getPathForExecutable(this.ctx.config.solppcCompiler);
    const solppcPathMap = new Map<string, string>();

    // contracts in workspaceFolders
    const contracts = [
      ...(await vscode.workspace.findFiles("**/*.sol", "**/node_modules/**")),
      ...(await vscode.workspace.findFiles("**/*.solpp", "**/node_modules/**")),
    ];

    // contracts without workspace
    for (const doc of vscode.workspace.textDocuments) {
      if (isSolppDocument(doc)) {
        const found = contracts.findIndex(x => x.fsPath === doc.uri.fsPath);
        if (found === -1) {
          contracts.push(doc.uri);
        }
      }
    }

    const tasks: vscode.Task[] = [];
    for(const contract of contracts) {
      // build new task
      let task: vscode.Task;
      const workspaceTarget = vscode.workspace.getWorkspaceFolder(contract);
      if (workspaceTarget) {
        const localEnvPATH: string = [
          `${workspaceTarget?.uri.fsPath}`,
          vscode.Uri.joinPath(workspaceTarget.uri, "node_modules", "@vite", "solppc").fsPath,
          process.env.PATH
        ].join(":");
        let localSolppcPath = solppcPathMap.get(workspaceTarget.uri.fsPath);
        if (localSolppcPath === undefined) {
          // add workspace into PATH
          process.env.PATH = localEnvPATH;
          localSolppcPath = await toolchain.getPathForExecutable(this.ctx.config.solppcCompiler);
          solppcPathMap.set(workspaceTarget.uri.fsPath, localSolppcPath);
        }

        const fileName = vscode.workspace.asRelativePath(contract, false);
        const args = [fileName, "--standard-json", this.ctx.config.solppcOutputSelection.join(","), "--base-path", workspaceTarget.uri.fsPath, `1> ${fileName}.json`];
        const definition: SolppcTaskDefinition  = {
          type: TASK_TYPE,
          command: localSolppcPath,
          args, 
          env: {
            /* eslint-disable-next-line */ 
            "PATH": localEnvPATH
          },
          id: contract.fsPath,
        };
        task = buildSolppcTask(
          definition,
          workspaceTarget,
          `compile ${fileName}`,
          args,
        );
      } else {
        const fileName = path.basename(contract.fsPath);
        const dirname = path.dirname(contract.fsPath);
        const args = [fileName, "--standard-json", this.ctx.config.solppcOutputSelection.join(","), "--base-path", dirname, `1> ${contract.fsPath}.json`];
        const definition: SolppcTaskDefinition = {
          type: TASK_TYPE,
          command: solppcPath,
          args,
          env: {
            /* eslint-disable-next-line */
            "PATH": envPATH
          },
          id: contract.fsPath,
        };

        // TODO Global tasks are currently not supported.
        task = buildSolppcTask(
          definition,
          vscode.TaskScope.Global,
          `compile ${fileName}`,
          definition.args ?? [],
        );
      }

      task.group = vscode.TaskGroup.Build;
      task.presentationOptions = {
        reveal: vscode.TaskRevealKind.Silent,
        showReuseMessage: false,
      };
      tasks.push(task);
      // cache task
      this.contractTaskMap.set(contract.fsPath, task);
      // watch file for diagnostics
      this.watchFile(contract);
    }

    // NOTE there is no good way to sort tasks
    this.ctx.log.debug(`${tasks.length} tasks provided`);
    return tasks;
  }

  resolveTask(_task: vscode.Task): vscode.Task | undefined {
    const definition = _task.definition as SolppcTaskDefinition;
    if (definition.type === TASK_TYPE) {
      const args = definition.args ?? [];
      const task = buildSolppcTask(
        definition,
        _task.scope,
        _task.name,
        args,
      );
      if (definition.id) {
        this.contractTaskMap.set(definition.id, task);
        this.watchFile(vscode.Uri.parse(definition.id));
      }
      this.ctx.log.debug(`resolve task ${_task.name}`);
      return task;
    }

    return undefined;
  }

  public fetchGlobalTasks(): vscode.Task[] {
    const tasks: vscode.Task[] = [];
    for (const task of this.contractTaskMap.values()) {
      if (task.scope === vscode.TaskScope.Global) {
        tasks.push(task);
      }
    }
    return tasks;
  }

  public clearDiagnostics(file: vscode.Uri) {
    this.diagnosticCollection.delete(file);
  }

  public async executeTask(file: vscode.Uri) {
    if (this.contractTaskMap.has(file.fsPath)) {
      const task = this.contractTaskMap.get(file.fsPath) as vscode.Task;
      if (task.scope === vscode.TaskScope.Global) {
        const execution = task.execution as vscode.ShellExecution;
        if (execution.commandLine) {
          // log.debug(execution.commandLine)
          // const terminal = vscode.window.createTerminal({
          //   name: "Run global Tasks",
          //   env: process.env
          // });
          // terminal.sendText(execution.commandLine);
          await exec(execution.commandLine);
          await this.problemMatcher(file);
          await vscode.commands.executeCommand("soliditypp.refreshContractTree", file);
          // terminal.dispose();
        }
      } else {
        return await vscode.tasks.executeTask(task);
      }
    }
  }

  private watchFile(file: vscode.Uri) {
    const output = `${file.fsPath}.json`;

    const outputWatcher = vscode.workspace.createFileSystemWatcher(output);

    let timer: NodeJS.Timer;
    outputWatcher.onDidChange(async() =>{
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(async()=>{
        await this.problemMatcher(file);
        await vscode.commands.executeCommand("soliditypp.refreshContractTree", file);
      }, 1000);

    });
    outputWatcher.onDidCreate(async() => {
      await this.problemMatcher(file);
      await vscode.commands.executeCommand("soliditypp.refreshContractTree", file);
    });
    outputWatcher.onDidDelete(async() => {
      await vscode.commands.executeCommand("soliditypp.refreshContractTree", file);
      outputWatcher.dispose();
    });

    this.ctx.pushCleanup(outputWatcher);

    const contractWatcher = vscode.workspace.createFileSystemWatcher(file.fsPath);

    contractWatcher.onDidChange(async() => {
      this.diagnosticCollection.delete(file);
      if (this.ctx.config.solppcWatchMode) {
        await this.executeTask(file);
      }
    });

    contractWatcher.onDidDelete(() => {
      this.diagnosticCollection.delete(file);
      contractWatcher.dispose();
    });

    this.ctx.pushCleanup(contractWatcher);
  }

  async problemMatcher(file: vscode.Uri) {
    const outputPath = `${file.fsPath}.json`;
    const output = vscode.Uri.parse(outputPath);
    try {
      await vscode.workspace.fs.stat(output);
    } catch (error) {
      return;
    }
    const ret = await vscode.workspace.fs.readFile(output);
    const compileResult = JSON.parse(ret.toString());
    let diagnostics: vscode.Diagnostic[] = [];

    for (const err of compileResult.errors ?? []) {
      try {
        const errSeverity = err.severity === 'error' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;
        const pos = err.formattedMessage.match(/^.*:(\d+):(\d+).*$/m) ?? [0,1,1];
        const line = pos[1]-1;
        const column = pos[2]-1;
        const loc = err.sourceLocation ?? {start: 0, end: 0};
        const diagnostic: vscode.Diagnostic = {
          severity: errSeverity,
          range: new vscode.Range(
            new vscode.Position(line, column),
            new vscode.Position(line, column + loc.end - loc.start),
          ),
          message: err.formattedMessage
        };
        diagnostics.push(diagnostic);
      } catch (error) {
        this.ctx.log.error(error);
      }
    }
    this.diagnosticCollection.set(file, diagnostics);
    // save abi to file
    if (compileResult.contracts) {
      const abiObj: any = {};
      for (const fileName in compileResult.contracts) {
        const contractObj = compileResult.contracts[fileName];
        for (const contractName in contractObj) {
          abiObj[contractName] = contractObj[contractName].abi;
        }
      }
      const abiFile = `${file.fsPath}.abi.json`;
      const writeData = Buffer.from(JSON.stringify(abiObj, null, 4), "utf8");
      vscode.workspace.fs.writeFile(vscode.Uri.parse(abiFile), writeData);
    }
  }
}

export function buildSolppcTask(
  definition: SolppcTaskDefinition,
  scope: vscode.WorkspaceFolder | vscode.TaskScope | undefined,
  name: string,
  args: string[],
): vscode.Task {
  let exec: vscode.ProcessExecution | vscode.ShellExecution | undefined = undefined;

  const isJSON = args.findIndex(x => /--standard-json/.test(x));
  let commandLine;
  if (isJSON === -1) {
    commandLine = [definition.command, ...args];
  } else {
    // const outputSelection = args.splice(isJSON + 1, 1)[0].split(",");
    const outputSelection = args[isJSON+1].split(",");
    const input = toolchain.solppcInput(args[0], {
      "outputSelection": {
        "*": {
          "*": outputSelection,
        }
      }
    });
    commandLine = [`echo ${JSON.stringify(input)} |`, definition.command, ...args.slice(1)];
  }

  exec = new vscode.ShellExecution(commandLine.join(' '), definition);

  return new vscode.Task(
    definition,
    scope ?? vscode.TaskScope.Workspace,
    name,
    TASK_SOURCE,
    exec,
    ["$solppc"],
  );
}


export function activateTaskProvider(ctx: Ctx): void {

  const taskProvider = new SolppcTaskProvider(ctx);

  const tmpDisposables: vscode.Disposable[] = [];
  async function fetchTasks() {
    await vscode.tasks.fetchTasks();
    // NOTE workaround for global tasks
    const globalTasks = taskProvider.fetchGlobalTasks();
    if (globalTasks.length > 0 && tmpDisposables.length === 0) {
      tmpDisposables.push(
        vscode.workspace.onDidChangeTextDocument((ev) => {
          taskProvider.clearDiagnostics(ev.document.uri);
        }, null, ctx.subscriptions)
      );
      tmpDisposables.push(
        vscode.workspace.onDidSaveTextDocument(async (doc) => {
          if (ctx.config.solppcWatchMode && isSolppDocument(doc)) {
            await taskProvider.executeTask(doc.uri);
          }
        }, null, ctx.subscriptions)
      );
    } else {
      while (tmpDisposables.length) {
        const disposable = tmpDisposables.pop();
        if (disposable) {
          disposable.dispose();
        }
      }
    }
  }

  setTimeout(async() => {
    // prefetch tasks for auto compile if enable watch mode
    await fetchTasks();
  }, 0);

  // fetch tasks when creating/deleteing contract source files
  vscode.workspace.onDidCreateFiles(async() => {
    await fetchTasks();
  }, null, ctx.subscriptions);
  vscode.workspace.onDidDeleteFiles(async()=>{
    await fetchTasks();
  }, null, ctx.subscriptions);
  vscode.workspace.onDidRenameFiles(async() => {
    await fetchTasks();
  }, null, ctx.subscriptions);
  vscode.window.onDidChangeActiveTextEditor(async(editor) => {
    if (editor && isSolppEditor(editor)) {
      await fetchTasks();
    }
  }, null, ctx.subscriptions);

  ctx.pushCleanup(
    vscode.tasks.registerTaskProvider(TASK_TYPE, taskProvider)
  );

  ctx.registerCommand("enableWatchMode", (ctx: Ctx) => {
    return () => {
      ctx.config.updateConfig("solppc.watch", true);
    };
  });

  ctx.registerCommand("disableWatchMode", (ctx: Ctx) => {
    return () => {
      ctx.config.updateConfig("solppc.watch", false);
    };
  });


  ctx.registerCommand("compile", (ctx: Ctx) => {
    return async (target: vscode.Uri | vscode.TreeItem | string | undefined) => {
      let file: vscode.Uri;
      if (target === undefined) {
        const editor = vscode.window.activeTextEditor;
        if (editor && isSolppEditor(editor)) {
          file = editor.document.uri;
        } else {
          const ret = await vscode.window.showOpenDialog({
            title: "Select a contract file to compile",
            filters: {
              "soliditypp": ["sol", "solpp"],
            }
          });
          if (ret) {
            file = ret[0];
          } else {
            return vscode.window.showInformationMessage("Please open a contract file, then compile");
          }
        }
      } else if (target instanceof vscode.TreeItem) {
        file = target.resourceUri as vscode.Uri;
      } else if (target instanceof vscode.Uri) {
        file = target;
      } else {
        file = vscode.Uri.parse(target);
      }
      await taskProvider.executeTask(file);
    };
  });

  ctx.registerCommand("problemMatcher", (ctx: Ctx) => {
    return async (uri: vscode.Uri) => {
      taskProvider.problemMatcher(uri);
    };
  });
}