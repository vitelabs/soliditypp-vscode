import WS_RPC from '@vite/vitejs-ws';
import {
    account as viteAccount
} from '@vite/vitejs';
import {
    abi as abiutils
} from '@vite/vitejs';
import {
    utils
} from '@vite/vitejs';
import {
    client
} from '@vite/vitejs';
import receiveAllOnroadTx from 'utils/receiveAllOnroadTx';

const BigNumber = require('bignumber.js');

const VITE_TOKEN_ID = 'tti_5649544520544f4b454e6e40';
const WS_SERVER = 'ws://localhost:23457';
const GENESIS_PRIVATEKEY =
  '7488b076b27aec48692230c88cbe904411007b71981057ea47d757c1e7f7ef24f4da4390a6e2618bec08053a86a6baf98830430cbefc078d978cf396e1c43e3a';
const VITE_DECIMAL = new BigNumber('1e18');
export const ACCOUNT_INIT_AMOUNT = VITE_DECIMAL.multipliedBy(1000);

let viteClient;
let genesisAccount;

export async function init() {
    let provider = new WS_RPC(WS_SERVER, 30 * 1000);

    viteClient = new client(provider, () => {
        console.log('Already connected.');
    });

    genesisAccount = new viteAccount({
        privateKey: GENESIS_PRIVATEKEY,
        client: viteClient
    });

    // genesis account receive onroad blocks
    await receiveAllOnroadTx(viteClient, genesisAccount);

    return viteClient;
}

export function getVite() {
    return viteClient;
}

export function getGenesisAccount() {
    return genesisAccount;
}

export function createAccount() {
    let keyPair = utils.ed25519.keyPair();
    let account = new viteAccount({
        privateKey: keyPair.secretKey,
        client: viteClient
    });

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
    confirmTime,
    quotaRatio,
    seedCount,
    params
) {
    console.log(seedCount);
    let createContractBlock = await account.createContract({
        amount: amount.toString(),
        hexCode: contract.bytecodes,
        quotaRatio: quotaRatio,
        confirmTime: confirmTime,
        seedCount: seedCount,
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
    params
) {
    let callContractBlock = await account.callContract({
        tokenId: VITE_TOKEN_ID,
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
        let offchainDecodeResult = abiutils.decodeParameters(outputs, resultBytes);
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