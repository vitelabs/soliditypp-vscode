import WS_RPC from '@vite/vitejs-ws';
import { utils, wallet } from '@vite/vitejs';
import { abi as abiutils } from '@vite/vitejs';
import { ViteAPI } from '@vite/vitejs';
import receiveAllOnroadTx from 'utils/receiveAllOnroadTx';

const BigNumber = require('bignumber.js');

import Account from './Account';

const VITE_TOKEN_ID = 'tti_5649544520544f4b454e6e40';
const WS_SERVER = 'ws://localhost:23457';
const GENESIS_PRIVATEKEY =
    '7488b076b27aec48692230c88cbe904411007b71981057ea47d757c1e7f7ef24f4da4390a6e2618bec08053a86a6baf98830430cbefc078d978cf396e1c43e3a';
const VITE_DECIMAL = new BigNumber('1e18');
export const ACCOUNT_INIT_AMOUNT = VITE_DECIMAL.multipliedBy(1000);

let viteClient;
let genesisAccount;
let mnemonicsDeriveIndex = 0;

export function setupNode(server = WS_SERVER, cb) {
    server = server || WS_SERVER;
    let provider = new WS_RPC(server, 30 * 1000, {
        retryInterval: 100,
        retryTimes: 100
    });

    viteClient = new ViteAPI(provider, cb);
    return viteClient;
}

export async function init() {
    genesisAccount = new Account({
        privateKey: GENESIS_PRIVATEKEY,
        client: viteClient
    });

    // genesis account receive onroad blocks
    await receiveAllOnroadTx(viteClient, genesisAccount);
}

export function getVite() {
    return viteClient;
}

export function getGenesisAccount() {
    return genesisAccount;
}

export function createAccount(mnemonics, index = mnemonicsDeriveIndex) {
    const { privateKey } = wallet.deriveAddress({
        mnemonics,
        index
    });
    let account = new Account({
        privateKey
    });
    mnemonicsDeriveIndex = index + 1;
    return account;
}

export async function initBalance(account, balance) {
    let genesisAccount = getGenesisAccount();
    // send money to test accout
    await genesisAccount.sendTx({
        toAddress: account.address,
        tokenId: VITE_TOKEN_ID,
        amount: balance
    });

    await receiveAllOnroadTx(viteClient, account);
}

export async function createContract(
    account,
    contract,
    amount,
    responseLatency,
    quotaMultiplier,
    randomDegree,
    params
) {
    let createContractBlock = await account.createContract({
        amount: amount.toString(),
        code: contract.bytecodes,
        quotaMultiplier,
        responseLatency,
        randomDegree,
        abi: contract.abi,
        params: params
    });
    return createContractBlock;
}

export async function sendContractTx(
    account,
    contractAddress,
    abi,
    amount = 0,
    params,
    tokenId = VITE_TOKEN_ID
) {
    console.log(params);
    let callContractBlock = await account.callContract({
        tokenId,
        amount: amount.toString(),
        abi: abi,
        params: params,
        toAddress: contractAddress
    });
    return callContractBlock;
}

export async function callOffchainMethod(
    contractAddress,
    abi,
    offchaincode,
    params
) {
    let data = abiutils.encodeFunctionCall(abi, params);
    let dataBase64 = Buffer.from(data, 'hex').toString('base64');
    let result = await viteClient.request('contract_callOffChainMethod', {
        selfAddr: contractAddress,
        offChainCode: offchaincode,
        data: dataBase64
    });
    if (result) {
        let resultBytes = Buffer.from(result, 'base64').toString('hex');
        let outputs = [];
        for (let i = 0; i < abi.outputs.length; i++) {
            outputs.push(abi.outputs[i].type);
        }
        let offchainDecodeResult = abiutils.decodeParameters(
            outputs,
            resultBytes
        );
        let resultList = [];
        for (let i = 0; i < abi.outputs.length; i++) {
            if (abi.outputs[i].name) {
                resultList.push({
                    name: abi.outputs[i].name,
                    value: offchainDecodeResult[i]
                });
            } else {
                resultList.push({
                    name: '',
                    value: offchainDecodeResult[i]
                });
            }
        }
        return resultList;
    }
    return '';
}

export async function queryVmLogList(contractBlock, abi) {
    if (!contractBlock.logHash) {
        return;
    }

    let vmLogList = await viteClient.request(
        'ledger_getVmLogList',
        contractBlock.hash
    );
    let vmLogs = [];
    if (vmLogList) {
        vmLogList.forEach(vmLog => {
            let topics = vmLog.topics;
            for (let j = 0; j < abi.length; j++) {
                let abiItem = abi[j];

                if (abiutils.encodeLogSignature(abiItem) === topics[0]) {
                    let dataBytes = '';
                    if (vmLog.data) {
                        dataBytes = utils._Buffer.from(vmLog.data, 'base64');
                    }
                    let log = {
                        topic: topics[0],
                        args: abiutils.decodeLog(
                            abiItem.inputs,
                            dataBytes.toString('hex'),
                            topics.slice(1)
                        ),
                        event: abiItem.name
                    };
                    vmLogs.push(log);
                    break;
                }
            }
        });
    }
    return vmLogs;
}

export function transformViteBalance(amount, units) {
    let transformedAmount = amount;
    switch (units) {
    case 'vite':
        transformedAmount = new BigNumber(transformedAmount)
            .multipliedBy(VITE_DECIMAL)
            .toFixed();
        break;
    case 'attov':
        break;
    }
    return transformedAmount;
}

export function transformTokenAmount(amount, units) {
    return new BigNumber(amount)
        .multipliedBy(new BigNumber(`1e${units || 0}`))
        .toFixed();
}

export function isSendBlock(blockType) {
    return (
        blockType === 1 || blockType === 2 || blockType === 3 || blockType === 6
    );
}

export function isReceiveBlock(blockType) {
    return blockType === 4 || blockType === 5 || blockType === 7;
}

export async function transfer(account, amount) {
    const sendTx = await genesisAccount.sendTx({
        toAddress: account.address,
        tokenId: VITE_TOKEN_ID,
        amount: amount
    });

    await receiveAllOnroadTx(viteClient, account);

    return sendTx;
}
