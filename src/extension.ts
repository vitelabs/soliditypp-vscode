import { readFileSync } from "fs";

import * as vscode from "vscode";
import * as path from "path";

import SolidityConfigurationProvider from "./debugConfigurationProvider";
import SolidityppDebugAdapterDescriptorFactory from "./debugAdapterDescriptorFactory";
import { debuggerType } from "./constant";
import { completeItemList } from "./autoComplete";
import { extensionPath, getOsPlatform, getSolppcPath, OS_PLATFORM } from "./constant";

import createSolppc, { checkSolppcAvailable } from "./createSolppc";
import * as fs from "fs";
const child_process = require("child_process");

const VIEW_TO_DA_COMMAND_PREFIX = "view2debugAdapter.";
const VIEW_TO_EXTENSION_COMMAND_PREFIX = "view2extension.";
const EXTENSION_TO_DA_COMMAND_PREFIX = "extension2debugAdapter.";
enum DEBUGGER_STATUS {
  STOPPING = 1,
  STOPPED = 2,
  STARTING = 3,
  STARTED = 4
}

let diagnosticCollection: vscode.DiagnosticCollection;

export async function activate(context: vscode.ExtensionContext) {
  // check solppc
  await installSolppc();

  let debuggerPanel: vscode.WebviewPanel | undefined;
  let debuggerViewColumn: vscode.ViewColumn = vscode.ViewColumn.Two;
  let debuggerStatus: DEBUGGER_STATUS = DEBUGGER_STATUS.STOPPED;

  const provider = new SolidityConfigurationProvider();
  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider(debuggerType, provider)
  );

  const factory = new SolidityppDebugAdapterDescriptorFactory();
  context.subscriptions.push(
    vscode.debug.registerDebugAdapterDescriptorFactory(debuggerType, factory)
  );
  context.subscriptions.push(factory);

  // auto complete
  let staticProvider = vscode.languages.registerCompletionItemProvider(
    "soliditypp",
    {
      provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
      ) {
        return completeItemList;
      }
    }
  );
  context.subscriptions.push(staticProvider);

  // compile on save
  diagnosticCollection = vscode.languages.createDiagnosticCollection(
    "soliditypp auto compile"
  );
  context.subscriptions.push(diagnosticCollection);
  vscode.workspace.onDidSaveTextDocument(compileSource);

  // generate test code
  context.subscriptions.push(
    vscode.commands.registerCommand("soliditypp.generateHelloWorld", () => {
      let workspaceFolders = vscode.workspace.workspaceFolders;
      if (workspaceFolders && workspaceFolders.length > 0) {
        let newFile = path.join(
          workspaceFolders[0].uri.path,
          "HelloWorld.solpp"
        );
        fs.copyFile(
          path.resolve(extensionPath, "bin/vite/HelloWorld.solpp"),
          newFile,
          function(err) {
            if (err) {
              console.log(err);
              return false;
            }
          }
        );
        let uri = vscode.Uri.file(newFile);
        vscode.workspace
          .openTextDocument(uri)
          .then(doc => vscode.window.showTextDocument(doc));
      }
    })
  );

  function initDebuggerPanel() {
    debuggerPanel = vscode.window.createWebviewPanel(
      "soliditypp",
      "Soliditypp",
      debuggerViewColumn,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    debuggerPanel.webview.html = getWebviewContent();

    debuggerPanel.webview.onDidReceiveMessage(
      async message => {
        if (message.command.indexOf(VIEW_TO_DA_COMMAND_PREFIX) === 0) {
          // proxy
          let activeDebugSession = vscode.debug.activeDebugSession;
          if (activeDebugSession) {
            activeDebugSession
              .customRequest(message.command, message.body)
              .then(
                function(args) {
                  let response = {
                    id: message.id,
                    body: args
                  };
                  if (debuggerPanel) {
                    debuggerPanel.webview.postMessage(response);
                  }
                },
                function(err) {
                  let response = {
                    id: message.id,
                    error: err
                  };
                  if (debuggerPanel) {
                    debuggerPanel.webview.postMessage(response);
                  }
                }
              );
          }
        } else if (
          message.command.indexOf(VIEW_TO_EXTENSION_COMMAND_PREFIX) === 0
        ) {
          let actualCommand = message.command.replace(
            VIEW_TO_EXTENSION_COMMAND_PREFIX,
            ""
          );
          switch (actualCommand) {
            case "error":
              let debugConsole = vscode.debug.activeDebugConsole;
              if (debugConsole) {
                debugConsole.appendLine(
                  "Soliditypp debugger error:\n" + message.body
                );
              }
              break;
          }
        }
      },
      undefined,
      context.subscriptions
    );

    debuggerPanel.onDidDispose(
      async () => {
        if (debuggerStatus === DEBUGGER_STATUS.STARTING) {
          return;
        }
        await terminateDA();
      },
      null,
      context.subscriptions
    );
  }

  async function terminateDA() {
    let debugSession = vscode.debug.activeDebugSession;
    if (debugSession) {
      await debugSession.customRequest(
        EXTENSION_TO_DA_COMMAND_PREFIX + "terminate"
      );
    }
  }

  function terminateDebuggerPanel() {
    if (debuggerPanel) {
      debuggerPanel.dispose();
      debuggerPanel = undefined;
    }
  }

  vscode.debug.onDidStartDebugSession(function(event) {
    if (event.type != debuggerType) {
      return;
    }

    debuggerStatus = DEBUGGER_STATUS.STARTING;

    terminateDebuggerPanel();

    initDebuggerPanel();

    debuggerStatus = DEBUGGER_STATUS.STARTED;
  });

  vscode.debug.onDidTerminateDebugSession(function(event) {
    if (event.type != debuggerType) {
      return;
    }
    debuggerStatus = DEBUGGER_STATUS.STOPPING;

    terminateDebuggerPanel();
    debuggerStatus = DEBUGGER_STATUS.STOPPED;
  });

  console.log('Congratulations, your extension "soliditypp" is now active!');
}

export function deactivate() {
  console.log('Your extension "soliditypp" is now deactive!');
}

let webviewContent: string = "";
function getWebviewContent(): string {
  if (process.env.NODE_ENV !== "production" || !webviewContent) {
    try {
      webviewContent = readFileSync(
        path.join(__dirname, "../out_view/index.html")
      ).toString();
    } catch (err) {
      console.log(err.stack);
    }
  }

  return webviewContent;
}

async function compileSource(textDocument: vscode.TextDocument) {
  if (textDocument.languageId != "soliditypp") {
    return;
  }
  diagnosticCollection.clear();

  try {
    await child_process.execSync(
      `${getSolppcPath()} --bin --abi ${textDocument.fileName}`
    );
  } catch (err) {
    let errStr = err.output[2].toString();

    let filename = textDocument.fileName
    if (getOsPlatform() === OS_PLATFORM.WIN64) { 
      filename = filename.replace(/\\/g, '/')
    }

    let lines = errStr.split(filename + ":");
    if (lines && lines.length > 1) {
      lines = lines[1].split(":");
      if (lines && lines.length > 1) {
        let lineNum = +lines[0] - 1;
        let columnNum = +lines[1] - 1;
        let line = textDocument.lineAt(lineNum);
        let diagnostics: vscode.Diagnostic[] = [];
        let diagnosic: vscode.Diagnostic = {
          severity: vscode.DiagnosticSeverity.Error,
          range: new vscode.Range(
            lineNum,
            columnNum,
            lineNum,
            line.range.end.character
          ),
          message: errStr
        };
        diagnostics.push(diagnosic);
        diagnosticCollection.set(textDocument.uri, diagnostics);
        return;
      }
    }
  }
}

function installSolppc() {
  if (checkSolppcAvailable()) {
    return;
  }
  return vscode.window.withProgress(
    {
      cancellable: false,
      location: vscode.ProgressLocation.Notification,
      title: "Download solppc"
    },
    (progress, cancelable) => {
      return new Promise((resolve, reject) => {
        createSolppc(function(s, p, downloadUrl) {
          if (p >= 100) {
            resolve();
            return;
          }
          progress.report({
            message: `${p}%. ${s}. Solppc is the compiler of soliditypp language.`,
            increment: p / 10
          });
        });
      });
    }
  );
}
