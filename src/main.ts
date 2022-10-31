import * as vscode from "vscode";

import { Config } from "./config";
import { Ctx } from "./ctx";
import { activateTaskProvider } from "./task";
import { activateCodeActionProvider } from "./code_action";
import { activateCompleteProvider } from "./complete";
import { activateContractView } from "./view";
import * as commands from "./commands";

export async function activate(context: vscode.ExtensionContext) {
  const config = new Config(context);
  const ctx = await Ctx.create(config, context);
  
  // deploy webiew
  activateContractView(ctx);

  // Add tasks
  activateTaskProvider(ctx);

  // Add codeAction
  activateCodeActionProvider(ctx);

  // Add complete
  activateCompleteProvider(ctx);

  // Actually ABI file is json format
  await vscode.workspace.getConfiguration().update("files.associations", {"*.abi": "json"}, vscode.ConfigurationTarget.Workspace);

  ctx.registerCommand("stake", commands.stake);

  ctx.registerCommand("load", commands.loadContract);
}

export async function deactivate() {
}