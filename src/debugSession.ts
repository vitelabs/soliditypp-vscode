import {
    DebugSession
} from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import ViewRequestProcessor from './viewRequestProcessor';
import { readFileSync } from 'fs';

interface LaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
	/** An absolute path to the "program" to debug. */
	program: string;
}

const VIEW_COMMAND_PREFIX = "view2debugAdapter."

export class SolidityppDebugSession extends DebugSession {
    private viewRequestProcessor: ViewRequestProcessor

    // the initial (and one and only) file we are 'debugging'
	private _sourceFilePath: string = "";
	public get sourceFile() {
		return this._sourceFilePath;
    }

    private _sourceFileContent: string = "";
    public get sourceFileContent() {
		return this._sourceFileContent;
    }
    
    private _bytecodes: string[] | undefined;
    public get bytecodes() {
		return this._bytecodes;
    }

    private _abiList: string[] | undefined
    public get abiList() {
		return this._abiList;
    }

    public constructor() {
        super()
        this.viewRequestProcessor = new ViewRequestProcessor(this)
        return this;
    }

    protected async customRequest(command: string, response: DebugProtocol.Response, args: any): Promise<void> {
        if (command.indexOf(VIEW_COMMAND_PREFIX) === 0) {
            let actualCommand = command.replace(VIEW_COMMAND_PREFIX, "");
            this.sendResponse(await this.viewRequestProcessor.serve(actualCommand, response, args));
        }
    }

    protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments):void {
        this.sendResponse(response);
    }

    protected async launchRequest(response: DebugProtocol.LaunchResponse, args: LaunchRequestArguments) {
        this.loadSource(args.program)
        this.compileSource()
        this.sendResponse(response);
    }
    
	private loadSource(file: string) {
		if (this._sourceFilePath !== file) {
			this._sourceFilePath = file;
			this._sourceFileContent = readFileSync(this._sourceFilePath).toString();
		}
    }
    

    private compileSource () {
        if (!this.sourceFileContent) {
            return
        }

        // TODO need compile source
        this._bytecodes = [this.sourceFileContent + "mock bytecodes"]
        this._abiList = ["mock abi"]
    }

}