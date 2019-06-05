import { DebugProtocol } from 'vscode-debugprotocol';
import SolidityppDebugSession from './debugSession';


export default class ExtensionRequestProcessor {
    debugSession: SolidityppDebugSession
    public constructor (debugSession: SolidityppDebugSession) {
        this.debugSession = debugSession;
        return this
    }

    public async serve (command: string, response: DebugProtocol.Response, args: any): Promise<DebugProtocol.Response> {
        switch(command) {
            case "terminate": {
                this.debugSession.terminateSession()
            }
        }
        
        return response
    }

    public getCompileResult ():any {
        return {
            bytecodesList: this.debugSession.bytecodesList,
            offchainCodesList: this.debugSession.offchainCodesList,
            abiList: this.debugSession.abiList
        }

    }

}