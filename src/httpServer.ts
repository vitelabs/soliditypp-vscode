import { appendFile, readFileSync } from "fs";
import * as http from 'http';
import * as net from 'net';
import * as path from 'path';


import * as express from "express";
import * as vscode from 'vscode';
import * as opn from "opn";

function getAvailablePort (startingAt: any) {
    function getNextAvailablePort (currentPort, cb) {
        const server = net.createServer()
        server.listen(currentPort, _ => {
            server.once('close', _ => {
                cb(currentPort)
            })
            server.close()
        })
        server.on('error', _ => {
            getNextAvailablePort(++currentPort, cb)
        })
    }

    return new Promise(resolve => {
        getNextAvailablePort(startingAt, resolve)
    })
}

const app = express();

export class HTTPServer {
	private httpServer: http.Server;
	private contractData: any;

	constructor() {
		app.use(express.static(path.join(__dirname, '../out_view')));
		app.use("/contractData", (request: any, response: any) => {
			response.json(this.contractData);
		});
	}

	public setup(contractData: any): void {
		this.contractData = contractData;
		this.setupServer();
	}

	private setupServer(): void {
        const host: any = '127.0.0.1';

        getAvailablePort(3000).then(port => {
            if (this.httpServer)
			this.httpServer.close();

		    this.httpServer = http.createServer(app);

        
		    this.httpServer.listen(port, host, () => this.onHTTPServerListening(`${host}:${port}`));
        });
	}

	private onHTTPServerListening(address: string): void {
        console.log(address);
		address = address === "0.0.0.0" ? "127.0.0.1" : address

		opn("http://" + address);
	}

}