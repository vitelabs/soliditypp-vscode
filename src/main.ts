import * as vscode from "vscode";

import { Config } from "./config";
import { Ctx } from "./ctx";
import { activateTaskProvider } from "./task";
import { activateCodeActionProvider } from "./code_action";
import { activateCompleteProvider } from "./complete";
import { activateContractView } from "./view";

export async function activate(context: vscode.ExtensionContext) {
  const config = new Config(context);
  const ctx = await Ctx.create(config, context);

  // Add tasks
  activateTaskProvider(ctx);

  // Add codeAction
  activateCodeActionProvider(ctx);

  // Add complete
  activateCompleteProvider(ctx);
  
  // deploy webiew
  activateContractView(ctx);

  // Actually ABI file is json format
  await vscode.workspace.getConfiguration().update("files.associations", {"*.abi": "json"}, vscode.ConfigurationTarget.Workspace);
}

export async function deactivate() {
}