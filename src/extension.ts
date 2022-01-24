import * as vscode from "vscode";
import * as path from "path";

import SolidityConfigurationProvider from "./debugConfigurationProvider";
import SolidityppDebugAdapterDescriptorFactory from "./debugAdapterDescriptorFactory";
import { debuggerType } from "./constant";
import { completeItemList } from "./autoComplete";
import { extensionPath, getOsPlatform, OS_PLATFORM } from "./constant";
import * as Compiler from "./compiler";
import * as fs from "fs-extra";

// enum DEBUGGER_STATUS {
//   STOPPING = 1,
//   STOPPED = 2,
//   STARTING = 3,
//   STARTED = 4
// }

let diagnosticCollection: vscode.DiagnosticCollection;

export async function activate(context: vscode.ExtensionContext) {

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

  context.subscriptions.push(
    vscode.commands.registerCommand("soliditypp.generateExamples", () => {
      console.log('visit https://github.com/vitelabs/soliditypp-examples');

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

  let fileName = textDocument.fileName;
  if (getOsPlatform() === OS_PLATFORM.WIN64) { 
    fileName = fileName.replace(/\\/g, '/')
  }

  const compileResult = await Compiler.compile(fileName);
  
  for (const err of compileResult.errors) {
    const location = err.sourceLocation;
    const start = textDocument.positionAt(location.start);
    const end = textDocument.positionAt(location.end);
    const errSeverity = err.severity === 'error' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning;
    let diagnostics: vscode.Diagnostic[] = [];
    let diagnosic: vscode.Diagnostic = {
      severity: errSeverity,
      range: new vscode.Range(
        start,
        end
      ),
      message:  err.formattedMessage
    };
    diagnostics.push(diagnosic);
    diagnosticCollection.set(textDocument.uri, diagnostics);
  }
}

