import * as vscode from 'vscode';
import * as Net from 'net';
import SolidityppDebugSession from './debugSession'

export default class SolidityppDebugAdapterDescriptorFactory implements vscode.DebugAdapterDescriptorFactory {

	private server?: Net.Server;

	createDebugAdapterDescriptor(session: vscode.DebugSession, executable: vscode.DebugAdapterExecutable | undefined): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
        
		if (!this.server) {
			// start listening on a random port
			this.server = Net.createServer(socket => {
				const session = new SolidityppDebugSession();
				session.setRunAsServer(true);
				session.start(socket, socket);
			}).listen(0);
		}

		// make VS Code connect to debug server
		return new vscode.DebugAdapterServer(this.server.address().port);
	}

	dispose() {
		if (this.server) {
			this.server.close();
		}
	}
}
