import {
    DebugSession
} from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import { readFileSync } from 'fs';

interface LaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
	/** An absolute path to the "program" to debug. */
	program: string;
}

export class SolidityppDebugSession extends DebugSession {
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

    private _abi: string[] | undefined
    public get abi() {
		return this._abi;
    }

    public constructor() {
        super()
        console.log("debug session as")
    }

    protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments):void {
        response.body = response.body || {};

        this.sendResponse(response);
        console.log("Initialized");
    }

    protected async launchRequest(response: DebugProtocol.LaunchResponse, args: LaunchRequestArguments) {
        this.loadSource(args.program)
        this.compileSource()
        this.sendResponse(response);
        console.log(this.sourceFileContent);
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
        this._abi = ["mock abi"]
    }

}