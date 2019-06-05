import vscode from 'global/vscode';

const COMMAND_PREFIX = 'view2extension.';

export default function throwError (err) {
    let body = err.toString();
    if (!body || body === '[object Object]') {
        body = JSON.stringify(err);
    }

    vscode.postMessage({
        command: COMMAND_PREFIX + 'error',
        body
    });
    throw new Error(err);
}