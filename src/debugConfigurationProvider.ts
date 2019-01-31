'use strict';
import * as path from 'path';
import * as vscode from 'vscode';

export class SolidityConfigurationProvider implements vscode.DebugConfigurationProvider {
    resolveDebugConfiguration(folder: vscode.WorkspaceFolder | undefined, config: vscode.DebugConfiguration, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration> {
    
		// if launch.json is missing or empty
		if (!config.type && !config.request && !config.name) {
			const editor = vscode.window.activeTextEditor;
			if (editor && editor.document.languageId === 'soliditypp') {
				config.type = 'soliditypp';
				config.name = 'Soliditypp Debug';
				config.request = 'launch';
				config.program = '${file}';
				config.debugServer = 4711;
			}
		}

		if (!config.program) {
            let workspaceDir = vscode.workspace.rootPath
            if (workspaceDir) {
                config.program = path.resolve(workspaceDir, "index.solpp")
            }
		}

		return config;
    }
}