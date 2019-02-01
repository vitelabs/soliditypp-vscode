import {
    DebugSession
} from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import ViewRequestProcessor from './viewRequestProcessor';
import { exec }  from 'shelljs';
import * as path from 'path';
import * as os from 'os';
import { ChildProcess, spawn, spawnSync} from 'child_process';

interface LaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
	/** An absolute path to the "program" to debug. */
	program: string;
}

const VIEW_COMMAND_PREFIX = "view2debugAdapter."

export class SolidityppDebugSession extends DebugSession {
    private viewRequestProcessor: ViewRequestProcessor

    // the initial (and one and only) file we are 'debugging'
	private _sourceFilePath: string = "";
	public get sourceFilePath() {
		return this._sourceFilePath;
    }
    
    private _bytecodes: string[] = [];
    public get bytecodes() {
		return this._bytecodes;
    }

    private _abiList: any[][] = [];
    public get abiList() {
		return this._abiList;
    }

    private _viteChildProcess: ChildProcess | undefined

    public constructor() {
        super();
        this.viewRequestProcessor = new ViewRequestProcessor(this);
        console.log('constructor');
        return this;
    }

    protected async customRequest(command: string, response: DebugProtocol.Response, args: any): Promise<void> {
        if (command.indexOf(VIEW_COMMAND_PREFIX) === 0) {
            let actualCommand = command.replace(VIEW_COMMAND_PREFIX, "");
            this.sendResponse(await this.viewRequestProcessor.serve(actualCommand, response, args));
        }
    }

    protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments):void {
        console.log('initializeRequest');
        response.body = <DebugProtocol.Capabilities> {
            supportsTerminateRequest: true
        }

        this.sendResponse(response);
    }

    protected async launchRequest(response: DebugProtocol.LaunchResponse, args: LaunchRequestArguments) {
        console.log('launchRequest');
        // set source file path
        this._sourceFilePath = args.program

        if (!(await this.compileSource())) {
            return;
        }

        this.initVite()
        this.sendResponse(response);
    }
    
    private async compileSource ():Promise<boolean> {
        const { code, stdout, stderr } = await exec(`${path.resolve(process.cwd(), 'bin/solc')} --bin --abi ${this.sourceFilePath}`)
        console.log('Exit code:', code);
        console.log('Program output:', stdout);
        console.log('Program stderr:', stderr);

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
                 this._bytecodes.push(lines[i+1])
            } else if (line.startsWith("Contract JSON ABI")) {
                this._abiList.push(JSON.parse(lines[i+1]))
            }
        }

        return true
    }

    private initVite (){
        this.cleanVite()
        this._viteChildProcess = spawn('./run.sh', [], {
            cwd: path.resolve(process.cwd(), 'bin/vite/')
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
        spawnSync('./clean.sh', [], {
            cwd: path.resolve(process.cwd(), 'bin/vite/')
        })
    }

    protected terminateRequest(response: DebugProtocol.TerminateResponse, args: DebugProtocol.TerminateArguments) {
        this.terminateSession()
        this.sendResponse(response)
    }

    private terminateSession (code:number = 0) {
        if (this._viteChildProcess && !this._viteChildProcess.killed) {
            this._viteChildProcess.kill('SIGKILL')
        }
        this.cleanVite()

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