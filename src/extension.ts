import * as vscode from 'vscode';
import { readFileSync } from 'fs';
import * as path from 'path';
import { SolidityConfigurationProvider } from './debugConfigurationProvider';

const DEBUGGER_TYPE = "soliditypp"
const VIEW_TO_DA_COMMAND_PREFIX = "view2debugAdapter."

export function activate(context: vscode.ExtensionContext) {

    var debuggerPanel:vscode.WebviewPanel | undefined;
    var debuggerViewColumn:vscode.ViewColumn = vscode.ViewColumn.Two

    const provider = new SolidityConfigurationProvider();
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('soliditypp', provider));

    function initDebuggerPanel () {
        debuggerPanel = vscode.window.createWebviewPanel(
            'soliditypp',
            'Soliditypp',
            debuggerViewColumn,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );
        debuggerPanel.webview.html = getWebviewContent();
        debuggerPanel.webview.onDidReceiveMessage(
            message => {
                if (message.command.indexOf(VIEW_TO_DA_COMMAND_PREFIX) == 0) {
                    // proxy
                    let activeDebugSession = vscode.debug.activeDebugSession
                    if (activeDebugSession) {
                        activeDebugSession.customRequest(message.command, message.body).then(function (args) {
                            let response = {
                                id: message.id,
                                body: args
                            }
                            if (debuggerPanel) {
                                debuggerPanel.webview.postMessage(response)
                            }
                        }, function (err) {
                            let response = {
                                id: message.id,
                                error: err
                            }
                            if (debuggerPanel) {
                                debuggerPanel.webview.postMessage(response)
                            }
                        });
                    }
                }
            },
            undefined,
            context.subscriptions
        )

        debuggerPanel.onDidDispose(
            () => {
                setTimeout(() => {
                    let debugSession = vscode.debug.activeDebugSession
                    if (debugSession && debuggerPanel) {
                        initDebuggerPanel()
                    }
                }, 200)
                
            },
            null,
            context.subscriptions
        );
    }

    vscode.debug.onDidStartDebugSession(function (event) {
        if (event.type != DEBUGGER_TYPE) {
            return
        }
        
        initDebuggerPanel()
    });

    vscode.debug.onDidTerminateDebugSession(function (event) {
        if (event.type != DEBUGGER_TYPE) {
            return
        }

        if (debuggerPanel) {
            debuggerPanel.dispose()
            debuggerPanel = undefined
        }
    });

    console.log('Congratulations, your extension "soliditypp" is now active!');
}

export function deactivate() {
    console.log('Your extension "soliditypp" is now deactive!');
}

let webviewContent: string = ""
function getWebviewContent() :string {
    if (!webviewContent) {
        webviewContent = readFileSync(path.join(__dirname, "./view/index.html")).toString();
    }

    return webviewContent
}