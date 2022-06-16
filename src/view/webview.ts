import * as vscode from 'vscode';
import { getUri } from "../util";

export function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri, entryName: string) {
  const codicon = getUri(webview, extensionUri, ["webview-ui", "public", "codicons", "codicon.css"]);
  const venderJS = getUri(webview, extensionUri, ["webview-ui", "build", "assets", "vendor.js"]);
  const entryCSS = getUri(webview, extensionUri, ["webview-ui", "build", "assets", `${entryName}.css`]);
  const entryJS = getUri(webview, extensionUri, ["webview-ui", "build", "assets", `${entryName}.js`]);

  // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
  return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" type="text/css" href="${codicon}">
        <link rel="stylesheet" type="text/css" href="${entryCSS}">
        <title>${entryName}</title>
      </head>
      <body>
        <div id="app"></div>
        <script type="module" src="${venderJS}"></script>
        <script type="module" src="${entryJS}"></script>
      </body>
    </html>
  `;
}
