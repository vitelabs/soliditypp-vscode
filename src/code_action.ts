import * as vscode from "vscode";
import { Ctx } from "./ctx";
import { isSolppDocument } from "./util";

export class SolppcCodeActionProvider implements vscode.CodeActionProvider {

  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix
  ];

  provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext): vscode.CodeAction[] | undefined {

    if (!isSolppDocument(document)) {
      return;
    }

    // TODO
    return context.diagnostics
      .filter(diagnostic => diagnostic.source === "soliditypp")
      .map(() => this.clearDiagnostic());
  }

  private clearDiagnostic(): vscode.CodeAction {
    const action = new vscode.CodeAction(`Clear diagnosic`, vscode.CodeActionKind.QuickFix);
    action.command = { command: "solppc.clear", title: "Clear Diagnostics"};
    return action;
  }

  /*
  private createCommand(): vscode.CodeAction {
		const action = new vscode.CodeAction('Recompile', vscode.CodeActionKind.QuickFix);
		action.command = { command: "solppc.compile", title: 'Recompile this file'};
		return action;
	}
  */
}

export function activateCodeActionProvider(ctx: Ctx): void {
  const provider = new SolppcCodeActionProvider();
  let sel: vscode.DocumentSelector = { scheme: 'file', language: 'soliditypp' };
  ctx.pushCleanup(
    vscode.languages.registerCodeActionsProvider(sel, provider, {
      providedCodeActionKinds: SolppcCodeActionProvider.providedCodeActionKinds
    })
  );
}
