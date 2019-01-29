import {
    DebugSession
} from 'vscode-debugadapter';

export class SolidityppDebugSession extends DebugSession {
    public constructor() {
        super()
        console.log("debug session as")
    }
}