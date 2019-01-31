const EventEmitter = require('events');
const COMMAND_PREFIX = 'soliditypp.da.';
const vscode = acquireVsCodeApi();

let latestRequestId = 1;
let ee = new EventEmitter();

window.addEventListener('message', event => {
    const message = event.data;
    if (!message.id) {
        return;
    }
    
    ee.emit(message.id.toString(), message);
});


function request (command, body) {
    let messageId = latestRequestId;
    latestRequestId += 1;

    return new Promise(function (resolve, reject) {
        vscode.postMessage({
            command: COMMAND_PREFIX + command,
            body: body,
            id: messageId
        });

        ee.once(messageId.toString(), function (res) {

            if (res.error) {
                return reject(res.error);
            }
            return resolve(res.body);
        });
    });
}

module.exports = request;
