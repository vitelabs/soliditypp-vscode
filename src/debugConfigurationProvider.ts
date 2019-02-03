'use strict';

import { languageId } from './constant';
import * as vscode from 'vscode';

export default class SolidityConfigurationProvider implements vscode.DebugConfigurationProvider {
    resolveDebugConfiguration(folder: vscode.WorkspaceFolder | undefined, config: vscode.DebugConfiguration, token?: vscode.CancellationToken): vscode.ProviderResult<vscode.DebugConfiguration> {

		// if launch.json is missing or empty
		if (!config.type) {
            config.type = 'soliditypp';
        }
        if (!config.request) {
            config.request = 'launch';
        } 
        if (!config.name) {
            config.name = 'Soliditypp Debug';
		}

		if (!config.program) {
            const editor = vscode.window.activeTextEditor;
            if (!editor || 
                !editor.document || 
                editor.document.languageId !== languageId) {
                vscode.window.showErrorMessage(
                    'Can\'t find soliditypp file! You can set the value of "program" to soliditypp file path in ".vscode/launch.json" , or open and focus on soliditypp file'
                )
                return null    
            }
            config.program = '${file}';
		}    

		return config;
    }
}