import { accountBlock, utils, wallet } from '@vite/vitejs';

import * as vite from './vite';

const { createAccountBlock } = accountBlock;

export default class Account {
    constructor({ privateKey }) {
        if (!privateKey) {
            privateKey = utils._Buffer.from(utils.ed25519.keyPair().privateKey).toString('hex');
        }

        this.privateKey = privateKey;
        this.address = wallet.createAddressByPrivateKey(privateKey).address;
    }

    _createAccountBlock(type, params) {
        let _accountBlock = createAccountBlock(type, {
            address: this.address,
            ...params
        });
        _accountBlock.setProvider(vite.getVite()).setPrivateKey(this.privateKey);
        return _accountBlock;
    }

    async _send(_accountBlock) {
        await _accountBlock.autoSetPreviousAccountBlock();
        console.log('toaddress: ');
        console.log(_accountBlock.toAddress);
        let result = await _accountBlock.sign().send();
        console.log(JSON.stringify(result, null, 4));
        return result;
    }

    async receiveTx({ sendBlockHash }) {
        const _accountBlock = this._createAccountBlock('receive', {
            sendBlockHash
        });

        return this._send(_accountBlock);
    }

    async sendTx({ toAddress, tokenId, amount }) {
        let _accountBlock = this._createAccountBlock('send', {
            toAddress,
            tokenId,
            amount
        });

        return this._send(_accountBlock);
    }

    async createContract({ amount, hexCode, quotaMultiplier, responseLatency, randomDegree, abi, params }) {
        console.log('randomDegree: ');
        console.log(randomDegree);
        let _accountBlock = this._createAccountBlock('createContract', {
            abi,
            code: hexCode,
            responseLatency,
            params,
            quotaMultiplier,
            randomDegree
        });
        _accountBlock.amount = amount;
        return this._send(_accountBlock);
    }

    async callContract({ tokenId, amount, abi, params, toAddress }) {
        let _accountBlock = this._createAccountBlock('callContract', {
            tokenId,
            amount,
            abi,
            params,
            toAddress
        });
        return this._send(_accountBlock);
    }

    async getBalance() {
        return vite.getVite().getBalanceInfo(this.address);
    }
}