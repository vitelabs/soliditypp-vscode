import * as vscode from 'vscode';
import { OutputEvent, DebugSession } from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import ViewRequestProcessor from './viewRequestProcessor';

import { getSolppcPath, VITE_DIR, EXEC_SUFFIX, inWindows } from './constant';
import { HTTPServer } from './httpServer';

import * as os from 'os';

import { ChildProcess, spawnSync, exec, execSync } from 'child_process';
import ExtensionRequestProcessor from './extensionRequestProcessor';

import createGvite from './createGvite';
import createSolppc from './createSolppc';
import { linesParser } from './utils/linesParser';
const httpServer = new HTTPServer();

interface LaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
    /** An absolute path to the "program" to debug. */
    program: string;
}

const VIEW_COMMAND_PREFIX = 'view2debugAdapter.';
const EXTENSION_COMMAND_PREFIX = 'extension2debugAdapter.';

export default class SolidityppDebugSession extends DebugSession {
    private viewRequestProcessor: ViewRequestProcessor;
    private extensionRequestProcessor: ExtensionRequestProcessor;

    // the initial (and one and only) file we are 'debugging'
    private _sourceFilePath: string = '';
    public get sourceFilePath() {
        return this._sourceFilePath;
    }

    private _asmList: string[] = [];
    public get asmList() {
        return this._asmList;
    }
    private _offAsmList: string[] = [];
    public get offAsmList() {
        return this._offAsmList;
    }
    private _contractNameList: string[] = [];
    public get contractNameList() {
        return this._contractNameList;
    }

    private _bytecodesList: string[] = [];
    public get bytecodesList() {
        return this._bytecodesList;
    }

    private _offchainCodesList: string[] = [];
    public get offchainCodesList() {
        return this._offchainCodesList;
    }

    private _abiList: any[][] = [];
    public get abiList() {
        return this._abiList;
    }

    private _viteChildProcess: ChildProcess | undefined;

    public constructor() {
        super();
        this.viewRequestProcessor = new ViewRequestProcessor(this);
        this.extensionRequestProcessor = new ExtensionRequestProcessor(this);
        return this;
    }

    protected async customRequest(
        command: string,
        response: DebugProtocol.Response,
        args: any
    ): Promise<void> {
        if (command.indexOf(VIEW_COMMAND_PREFIX) === 0) {
            let actualCommand = command.replace(VIEW_COMMAND_PREFIX, '');
            this.sendResponse(
                await this.viewRequestProcessor.serve(
                    actualCommand,
                    response,
                    args
                )
            );
        } else if (command.indexOf(EXTENSION_COMMAND_PREFIX) === 0) {
            let actualCommand = command.replace(EXTENSION_COMMAND_PREFIX, '');
            this.sendResponse(
                await this.extensionRequestProcessor.serve(
                    actualCommand,
                    response,
                    args
                )
            );
        }
    }

    protected initializeRequest(
        response: DebugProtocol.InitializeResponse,
        args: DebugProtocol.InitializeRequestArguments
    ): void {
        response.body = <DebugProtocol.Capabilities>{
            supportsTerminateRequest: true
        };

        this.sendResponse(response);
    }

    protected async launchRequest(
        response: DebugProtocol.LaunchResponse,
        args: LaunchRequestArguments
    ) {
        try {
            await vscode.commands.executeCommand(
                'workbench.debug.panel.action.clearReplAction'
            );

            this.sendEvent(new OutputEvent('Preparing vite...\n', 'stdout'));

            await createGvite(this);
            await createSolppc((s, p) => {
                this.sendEvent(new OutputEvent(`${s} ${p}% \n`, 'stdout'));
            });

            // set source file path
            this._sourceFilePath = args.program;

            if (!(await this.compileSource())) {
                return;
            }

            this.initVite();
            httpServer.setup({
                bytecodesList: this._bytecodesList,
                offchainCodesList: this._offchainCodesList,
                abiList: this._abiList,
                contractNameList: this._contractNameList,
                asmList:this._asmList,
                offAsmList:this._offAsmList
            });
            this.sendEvent(new OutputEvent('Vite is ready!\n', 'stdout'));
            this.sendResponse(response);
        } catch (err) {
            this.sendEvent(new OutputEvent('Vite is terminated!\n', 'stdout'));

            let msg = err.stack;
            if (!msg) {
                msg = JSON.stringify(err);
            }
            this.aborted(msg, 1);
        }
    }

    private async compileSource(): Promise<boolean> {
        let result;
        try {
            result = String(
                execSync(
                    `${getSolppcPath()} --asm --bin --abi ${this.sourceFilePath}`
                )
            );
        } catch (err) {
            this.aborted('Compile failed: \n' + err.toString(), 1);
            return false;
        }

        // TODO need compile source
        let lines = result.split(os.EOL);
        const parseRes = linesParser(lines);
        this._contractNameList.push(...(parseRes.name || []));
        this._asmList.push(...(parseRes.asm || []));
        this._offAsmList.push(...(parseRes.offAsm || []));
        this._bytecodesList.push(...(parseRes.bin || []));
        this._offchainCodesList.push(...(parseRes.offBin || []));
        this._abiList.push(...(parseRes.abi || []).map(s => JSON.parse(s)));

        return true;
    }

    private initVite() {
        this.cleanVite();

        let execCmd = `startup.${EXEC_SUFFIX}`;

        if (!inWindows()) {
            execCmd = `./${execCmd}`;
        }

        this._viteChildProcess = exec(
            execCmd,
            {
                cwd: VITE_DIR
            },
            () => {}
        );

        this._viteChildProcess.stderr.on('data', stderr => {
            // init vite failed
            this.aborted(
                `An error occurred with gvite , error is ${stderr}`,
                1
            );
        });

        this._viteChildProcess.stdout.on('data', data => {
            this.sendEvent(new OutputEvent(`${data}`, 'stdout'));
        });

        this._viteChildProcess.on('close', code => {
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

            this.terminateSession(code);
        });
    }

    private cleanVite() {
        if (this._viteChildProcess && !this._viteChildProcess.killed) {
            if (inWindows()) {
                exec('taskkill /pid ' + this._viteChildProcess.pid + ' /T /F');
            } else {
                // kill shell
                this._viteChildProcess.kill('SIGKILL');
            }
        }

        let execCmd = `clean.${EXEC_SUFFIX}`;

        if (!inWindows()) {
            execCmd = `./${execCmd}`;
        }

        spawnSync(execCmd, [], {
            cwd: VITE_DIR,
            shell: true
        });
    }

    protected terminateRequest(
        response: DebugProtocol.TerminateResponse,
        args: DebugProtocol.TerminateArguments
    ) {
        this.terminateSession();
        this.sendResponse(response);
    }

    protected disconnectRequest(
        response: DebugProtocol.DisconnectResponse,
        args: DebugProtocol.DisconnectArguments
    ) {
        this.cleanVite();
        this.sendResponse(response);
    }

    public aborted(errorMsg: string = '', code: number = 0) {
        this.sendEvent(<DebugProtocol.OutputEvent>{
            event: 'output',
            body: {
                category: 'stderr',
                output: errorMsg
            }
        });
        this.terminateSession(code);
    }

    public terminateSession(code: number = 0) {
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
