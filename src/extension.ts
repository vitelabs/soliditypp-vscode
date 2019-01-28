import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "soliditypp" is now active!');
}

export function deactivate() {
    console.log('Your extension "soliditypp" is now deactive!');
}