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

    return [];
  }
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