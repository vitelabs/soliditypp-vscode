import * as vscode from "vscode";
import * as path from "path";

import SolidityConfigurationProvider from "./debugConfigurationProvider";
import SolidityppDebugAdapterDescriptorFactory from "./debugAdapterDescriptorFactory";
import { debuggerType } from "./constant";
import { completeItemList } from "./autoComplete";
import { extensionPath, getOsPlatform, getSolppcPath, OS_PLATFORM } from "./constant";

import createSolppc, { checkSolppcAvailable } from "./createSolppc";
// import * as fs from "fs";
import * as fs from "fs-extra";
const child_process = require("child_process");

// enum DEBUGGER_STATUS {
//   STOPPING = 1,
//   STOPPED = 2,
//   STARTING = 3,
//   STARTED = 4
// }

let diagnosticCollection: vscode.DiagnosticCollection;

export async function activate(context: vscode.ExtensionContext) {
  // check solppc
  await installSolppc();

  let debuggerPanel: vscode.WebviewPanel | undefined;
  // let debuggerStatus: DEBUGGER_STATUS = DEBUGGER_STATUS.STOPPED;

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

  // generate examples code
  
  // context.subscriptions.push(
  //   vscode.commands.registerCommand("soliditypp.generateHelloWorld", () => {
  //     let workspaceFolders = vscode.workspace.workspaceFolders;
  //     if (workspaceFolders && workspaceFolders.length > 0) {
  //       let newFile = path.join(
  //         workspaceFolders[0].uri.path,
  //         "HelloWorld.solpp"
  //       );
  //       fs.copyFile(
  //         path.resolve(extensionPath, "bin/vite/HelloWorld.solpp"),
  //         newFile,
  //         function(err) {
  //           if (err) {
  //             console.log(err);
  //             return false;
  //           }
  //         }
  //       );
  //       let uri = vscode.Uri.file(newFile);
  //       vscode.workspace
  //         .openTextDocument(uri)
  //         .then(doc => vscode.window.showTextDocument(doc));
  //     }
  //   })
  // );

  context.subscriptions.push(
    vscode.commands.registerCommand("soliditypp.generateExamples", () => {
      let workspaceFolders = vscode.workspace.workspaceFolders;

      if (workspaceFolders && workspaceFolders.length > 0) {
        let newPath = path.join(
          workspaceFolders[0].uri.path,
          "examples"
        );
        fs.pathExists(newPath, (err, exists) => {
          if (!err && !exists) {
            fs.copySync(
              path.resolve(extensionPath, "examples"),
              newPath
            );
            console.log("Examples generated in 'examples' directory.");
          } else {
            console.log("The 'example' directory exists, rename it and try again!");
          }
        });
      }
    })
  );


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

    // debuggerStatus = DEBUGGER_STATUS.STARTING;

    terminateDebuggerPanel();


    // debuggerStatus = DEBUGGER_STATUS.STARTED;
  });

  vscode.debug.onDidTerminateDebugSession(function(event) {
    if (event.type != debuggerType) {
      return;
    }
    // debuggerStatus = DEBUGGER_STATUS.STOPPING;

    terminateDebuggerPanel();
    // debuggerStatus = DEBUGGER_STATUS.STOPPED;
  });

  console.log('Congratulations, your extension "soliditypp" is now active!');
}

export function deactivate() {
  console.log('Your extension "soliditypp" is now deactive!');
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
    (progress) => {
      return new Promise((resolve) => {
        createSolppc(function(s, p) {
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
