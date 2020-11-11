import * as http from 'http';
import * as path from 'path';

import * as express from 'express';
const opn = require('opn');
const getPort = require('get-port');

const app = express();

export class HTTPServer {
	private httpServer: http.Server | undefined;
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

        getPort({port: getPort.makeRange(9000, 9800)}).then((port: any) => {
            if (this.httpServer)
			this.httpServer.close();

		    this.httpServer = http.createServer(app);

        
		    this.httpServer.listen(port, host, () => this.onHTTPServerListening(`${host}:${port}`));
        });
	}

	private onHTTPServerListening(address: string): void {
        console.log(address);
		address = address === "0.0.0.0" ? "127.0.0.1" : address

		opn("http://" + address + "/#/debug");
	}

}