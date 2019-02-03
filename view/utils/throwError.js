import vscode from 'global/vscode';

const COMMAND_PREFIX = 'view2extension.';

export default function throwError (err) {
    vscode.postMessage({
        command: COMMAND_PREFIX + 'error',
        body: err.stack
    });
    throw new Error(err);
}