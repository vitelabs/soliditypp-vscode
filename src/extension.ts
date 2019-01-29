import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "soliditypp" is now active!');

    const panel = vscode.window.createWebviewPanel(
        'soliditypp',
        'Soliditypp',
        vscode.ViewColumn.One,
        {},
    )
    panel.webview.html = getWebviewContent();
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