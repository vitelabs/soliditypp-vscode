import * as vscode from 'vscode';

export const extensionId = "ViteLabs.soliditypp";

let _extensionPath = "";
let extension = vscode.extensions.getExtension(extensionId);
if (extension) {
    _extensionPath  = extension.extensionPath    
}
export const extensionPath = _extensionPath;

export const debuggerType = "soliditypp"
export const languageId = "soliditypp"
