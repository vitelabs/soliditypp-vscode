const RECEIVE_PER_ROUND = 10;

export default async function receiveAllOnroadTx(viteClient, account) {
    let blocks = await viteClient.request('ledger_getUnreceivedBlocksByAddress', account.address, 0, RECEIVE_PER_ROUND);
    for (let i =0 ;i < blocks.length; i++) {
        let block = blocks[i];
        // receive on road
        await account.receiveTx({
            sendBlockHash: block.hash
        });
    }
    if (blocks.length >= RECEIVE_PER_ROUND) {
        await receiveAllOnroadTx(viteClient, account);
    }
}