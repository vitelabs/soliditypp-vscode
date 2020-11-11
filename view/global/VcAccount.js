import { accountBlock as accountBlockUtils } from '@vite/vitejs';
import * as vite from './vite';


import Account from './Account';
import { sendVcTx } from 'services/vc';

const { createAccountBlock } = accountBlockUtils;

export default class VcAccount extends Account {
    constructor({ address }) {
        super({});
        if (!address) {
            throw new Error('address should not be empty');
        }
        this.address = address;
        this.privateKey = null;
        this.type = 'vc';
    }

    _createAccountBlock(type, params) {
        let _accountBlock = createAccountBlock(type, {
            address: this.address,
            ...params
        });
        _accountBlock.setProvider(vite.getVite());
        return _accountBlock;
    }

    async _send(_accountBlock, abi) {
        return sendVcTx({
            block: _accountBlock.accountBlock,
            abi
        });
    }

    async createContract({ amount, hexCode, quotaMultiplier, responseLatency, randomDegree, abi, params }) {
        let _accountBlock = this._createAccountBlock('createContract', {
            abi,
            code: hexCode,
            responseLatency,
            params,
            quotaMultiplier,
            randomDegree
        });
        _accountBlock.amount = amount;
        await _accountBlock.autoSetPreviousAccountBlock();
        return sendVcTx({
            block: _accountBlock.accountBlock,
        });
    }
}