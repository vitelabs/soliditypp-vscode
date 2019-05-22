import WS_RPC from '@vite/vitejs-ws';
import { account as viteaccount} from '@vite/vitejs';
import { abi as abiutils } from '@vite/vitejs';
import { utils } from '@vite/vitejs';
import { client } from '@vite/vitejs';
import receiveAllOnroadTx from 'utils/receiveAllOnroadTx';

const VITE_TOKEN_ID = 'tti_5649544520544f4b454e6e40';
const WS_SERVER = 'ws://localhost:23457';
const GENESIS_PRIVATEKEY = '7488b076b27aec48692230c88cbe904411007b71981057ea47d757c1e7f7ef24f4da4390a6e2618bec08053a86a6baf98830430cbefc078d978cf396e1c43e3a';

let viteClient;
let genesisAccount;

export async function init() {
    let provider = new WS_RPC(WS_SERVER, 30 * 1000);

    viteClient = new client(provider, () => {
        console.log('Already connected.');
    });
    
    genesisAccount = new viteaccount({
        privateKey: GENESIS_PRIVATEKEY,
        client: viteClient
    });
    
    // genesis account receive onroad blocks
    await receiveAllOnroadTx(viteClient, genesisAccount);

    return viteClient;
}

export function getVite () {
    return viteClient;
}

export function getGenesisAccount () {
    return genesisAccount;
}

export async function createAccount () {
    let genesisAccount = getGenesisAccount();

    let keyPair = utils.ed25519.keyPair();
    let account = new viteaccount({
        privateKey: keyPair.secretKey,
        client: viteClient
    });
            
    // send money to test accout
    await genesisAccount.sendTx({
        toAddress: account.address,
        tokenId: VITE_TOKEN_ID,
        amount: '1'
    });
    
    await receiveAllOnroadTx(viteClient, account);
    return account;
}

export async function createContract (account, contract, amount, params) {
    let createContractBlock = await account.createContract({
        amount: amount.toString(),
        hexCode: contract.bytecodes,
        times:10,
        confirmTimes:1,
        abi: contract.abi,
        params: params
    });
    return createContractBlock;
}

export async function sendContractTx (account,contractAddress, abi, amount, params) {
    let callContractBlock = await account.callContract({
        tokenId: VITE_TOKEN_ID,
        amount: amount.toString(),
        abi: abi,
        params: params,
        toAddress: contractAddress
    });
    return callContractBlock;
}

export async function queryVmLogList (contractBlock, abi) {
    if (!contractBlock.logHash) {
        return;
    }
    
    let vmLogList = await viteClient.request('ledger_getVmLogList', contractBlock.hash);
    let vmLogs = [];
    if (vmLogList) {
        vmLogList.forEach(vmLog => {
            let topics = vmLog.topics;
            for (let j = 0; j < abi.length; j++) {
                let abiItem = abi[j];
                

                if (abiutils.encodeLogSignature(abiItem) === topics[0]) { 
                    let dataBytes = utils._Buffer.from(vmLog.data, 'base64');
                    let log ={
                        topic: topics[0],
                        args: abiutils.decodeLog(abiItem.inputs, dataBytes.toString('hex'), topics.slice(1)),
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