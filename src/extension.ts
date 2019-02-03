import * as vscode from 'vscode';
import { readFileSync } from 'fs';
import * as path from 'path';
import SolidityConfigurationProvider from './debugConfigurationProvider';
import SolidityppDebugAdapterDescriptorFactory from './debugAdapterDescriptorFactory';
import {debuggerType} from './constant'

const VIEW_TO_DA_COMMAND_PREFIX = "view2debugAdapter.";
const VIEW_TO_EXTENSION_COMMAND_PREFIX = "view2extension.";
const EXTENSION_TO_DA_COMMAND_PREFIX = "extension2debugAdapter.";
enum DEBUGGER_STATUS {
    STOPPING = 1,
    STOPPED = 2,
    STARTING = 3,
    STARTED = 4
}

export function activate(context: vscode.ExtensionContext) {
    let debuggerPanel:vscode.WebviewPanel | undefined;
    let debuggerViewColumn:vscode.ViewColumn = vscode.ViewColumn.Two
    let debuggerStatus:DEBUGGER_STATUS= DEBUGGER_STATUS.STOPPED

    const provider = new SolidityConfigurationProvider();
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider(debuggerType, provider));


    const factory = new SolidityppDebugAdapterDescriptorFactory();
    context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory(debuggerType, factory));
    context.subscriptions.push(factory);

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
            async (message) => {
                if (message.command.indexOf(VIEW_TO_DA_COMMAND_PREFIX) === 0) {
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
                } else if (message.command.indexOf(VIEW_TO_EXTENSION_COMMAND_PREFIX) === 0) {
                    let actualCommand = message.command.replace(VIEW_TO_EXTENSION_COMMAND_PREFIX, "")
                    if (actualCommand === "error") {
                        let debugConsole = vscode.debug.activeDebugConsole
                        if (debugConsole) {
                            debugConsole.appendLine("Soliditypp debugger error:\n" + message.body)
                        }
                        
                        await terminateDA();
                    }
                }
            },
            undefined,
            context.subscriptions
        )

        debuggerPanel.onDidDispose(
            async () => {
                if (debuggerStatus === DEBUGGER_STATUS.STARTING) {
                    return
                }
                await terminateDA();
            },
            null,
            context.subscriptions
        );
    }

    async function terminateDA () {
        let debugSession = vscode.debug.activeDebugSession
        if (debugSession) {
            await debugSession.customRequest(EXTENSION_TO_DA_COMMAND_PREFIX + "terminate")
        }
    }

    function terminateDebuggerPanel() {
        if (debuggerPanel) {
            debuggerPanel.dispose()
            debuggerPanel = undefined
        }
    }

    vscode.debug.onDidStartDebugSession(function (event) {
        if (event.type != debuggerType) {
            return
        }
    
        debuggerStatus = DEBUGGER_STATUS.STARTING
        
    
        terminateDebuggerPanel()
    
        initDebuggerPanel()
        debuggerStatus = DEBUGGER_STATUS.STARTED
    });


    vscode.debug.onDidTerminateDebugSession(function (event) {
        if (event.type != debuggerType) {
            return
        }
        debuggerStatus = DEBUGGER_STATUS.STOPPING

        terminateDebuggerPanel()
        debuggerStatus = DEBUGGER_STATUS.STOPPED
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