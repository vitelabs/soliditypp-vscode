import {
    DebugSession
} from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import ViewRequestProcessor from './viewRequestProcessor';
import { exec }  from 'shelljs';
import * as path from 'path';
import * as os from 'os';
import { ChildProcess, spawn, spawnSync} from 'child_process';
import { Readable, Writable } from 'stream';
import ExtensionRequestProcessor from './extensionRequestProcessor';
import { extensionPath } from './constant';

interface LaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
	/** An absolute path to the "program" to debug. */
	program: string;
}

const VIEW_COMMAND_PREFIX = "view2debugAdapter."
const EXTENSION_COMMAND_PREFIX = "extension2debugAdapter."

export default class SolidityppDebugSession extends DebugSession {
    private viewRequestProcessor: ViewRequestProcessor
    private extensionRequestProcessor: ExtensionRequestProcessor

    // the initial (and one and only) file we are 'debugging'
	private _sourceFilePath: string = "";
	public get sourceFilePath() {
		return this._sourceFilePath;
    }
    
    private _bytecodesList: string[] = [];
    public get bytecodesList() {
		return this._bytecodesList;
    }

    private _abiList: any[][] = [];
    public get abiList() {
		return this._abiList;
    }

    private _viteChildProcess: ChildProcess | undefined

    public constructor() {
        super();
        
        this.viewRequestProcessor = new ViewRequestProcessor(this);
        this.extensionRequestProcessor = new ExtensionRequestProcessor(this);
        return this;
    }

    protected async customRequest(command: string, response: DebugProtocol.Response, args: any): Promise<void> {
        if (command.indexOf(VIEW_COMMAND_PREFIX) === 0) {
            let actualCommand = command.replace(VIEW_COMMAND_PREFIX, "");
            this.sendResponse(await this.viewRequestProcessor.serve(actualCommand, response, args));
        } else if (command.indexOf(EXTENSION_COMMAND_PREFIX) === 0) {
            let actualCommand = command.replace(EXTENSION_COMMAND_PREFIX, "");
            this.sendResponse(await this.extensionRequestProcessor.serve(actualCommand, response, args));
        }
    }

    protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments):void {
        response.body = <DebugProtocol.Capabilities> {
            supportsTerminateRequest: true
        }

        this.sendResponse(response);
    }

    protected async launchRequest(response: DebugProtocol.LaunchResponse, args: LaunchRequestArguments) {
        // set source file path
        this._sourceFilePath = args.program

        if (!(await this.compileSource())) {
            return;
        }

        this.initVite()
        this.sendResponse(response);
    }
    
    private async compileSource ():Promise<boolean> {
        const { code, stdout, stderr } = await exec(`${path.resolve(extensionPath, 'bin/solc')} --bin --abi ${this.sourceFilePath}`)

        if (code > 0) {
            // compile failed   
            this.sendEvent(<DebugProtocol.OutputEvent>{
                event: 'output',
                body: {
                    category: 'stderr',
                    output: stderr
                }
            });
            this.terminateSession(code)
            return false
        }
        // TODO need compile source
        let lines = stdout.split(os.EOL)

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i]
            if (line.startsWith("Binary:")) {
                 this._bytecodesList.push(lines[i+1])
            } else if (line.startsWith("Contract JSON ABI")) {
                this._abiList.push(JSON.parse(lines[i+1]))
            }
        }

        return true
    }

    private initVite (){
        this.cleanVite()
        this._viteChildProcess = spawn('./run.sh', [], {
            cwd: path.resolve(extensionPath, 'bin/vite/')
        })

        this._viteChildProcess.stderr.on('data', (stderr) => {
            // init vite failed
            this.sendEvent(<DebugProtocol.OutputEvent>{
                event: 'output',
                body: {
                    category: 'stderr',
                    output: `Init vite faild, error is ${stderr}`
                }
            });
            this.terminateSession(1)
        })

        this._viteChildProcess.on('close', (code) => {
            // init vite failed
            if (code > 0) {
                this.sendEvent(<DebugProtocol.OutputEvent>{
                    event: 'output',
                    body: {
                        category: 'stderr', 
                        output: `vite exited with code ${code}`
                    }
                });
            } 
           
            this.terminateSession(code)
        })
    }

    private cleanVite () {
        if (this._viteChildProcess && !this._viteChildProcess.killed) {
            this._viteChildProcess.kill('SIGKILL')
        }

        spawnSync('./clean.sh', [], {
            cwd: path.resolve(extensionPath, 'bin/vite/')
        })
    }

    protected terminateRequest(response: DebugProtocol.TerminateResponse, args: DebugProtocol.TerminateArguments) {
        this.terminateSession();
        this.sendResponse(response);
    }

    protected disconnectRequest(response: DebugProtocol.DisconnectResponse, args: DebugProtocol.DisconnectArguments) {   
        this.cleanVite();
        this.sendResponse(response);
    }

    public terminateSession (code:number = 0) {
        this.cleanVite();

        this.sendEvent(<DebugProtocol.TerminatedEvent>{
            event: 'terminated'
        });


        this.sendEvent(<DebugProtocol.ExitedEvent>{
            event: 'exited',
            body: {
                exitCode: code
            }
        });
    }
}