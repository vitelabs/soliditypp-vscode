import * as vscode from 'vscode';

const DEBUGGER_TYPE = "soliditypp"

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "soliditypp" is now active!');


    var debuggerPanel:vscode.WebviewPanel | undefined;
    var debuggerViewColumn:vscode.ViewColumn = vscode.ViewColumn.Two

    function initDebuggerPanel () {
        debuggerPanel = vscode.window.createWebviewPanel(
            'soliditypp',
            'Soliditypp',
            debuggerViewColumn,
            {
                enableScripts: true
            }
        );
        debuggerPanel.webview.html = getWebviewContent();

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
}

export function deactivate() {
    console.log('Your extension "soliditypp" is now deactive!');
}

function getWebviewContent() {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
</head>
<body>
    <h1>Hello, soliditypp</h1>
</body>
</html>`;
}