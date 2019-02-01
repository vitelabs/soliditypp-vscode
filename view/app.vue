<template>
    <div>
        <h1>Soliditypp, hello world</h1>
        <h2>{{abiList}}</h2>
    </div>
</template>

<script>
import getCompileResult from 'services/compile';
import WsProvider  from '@vite/vitejs/dist/es5/provider/WS';
import * as Vitejs from '@vite/vitejs';

export default {
    data () {
        return {
            abiList: []
        };
    },
    async created () { 
        try {
            let compileResult = await getCompileResult();

            this.abiList = compileResult.abiList;

            let wsRpc = new WsProvider('ws://localhost:41420', 30 * 1000);

            let vite = new Vitejs.client(wsRpc, function () {
                console.log('Already connected.');
            });

            const VITE_TOKEN_ID = 'tti_5649544520544f4b454e6e40';
            
            let keyPair = Vitejs.utils.ed25519.keyPair();
            const GenesisAccount = new Vitejs.wallet.account({
                privateKey: '7488b076b27aec48692230c88cbe904411007b71981057ea47d757c1e7f7ef24f4da4390a6e2618bec08053a86a6baf98830430cbefc078d978cf396e1c43e3a',
                client: vite
            });
            // on road
            let blocks = await vite.onroad.getOnroadBlocksByAddress(GenesisAccount.address, 0, 10);
            for (let i =0 ;i < blocks.length; i++) {
                let block = blocks[i];
                // receive on road
                await GenesisAccount.receiveTx({
                    fromBlockHash: block.hash
                });
            }

            const TestAccount = new Vitejs.wallet.account({
                privateKey: keyPair.secretKey,
                client: vite
            });
            
            await GenesisAccount.sendTx({
                toAddress: TestAccount.address,
                tokenId: VITE_TOKEN_ID,
                amount: '1'
            });

            // on road
            let sentToTestAccountBlocks = await vite.onroad.getOnroadBlocksByAddress(TestAccount.address, 0, 10);
            for (let i =0 ;i < sentToTestAccountBlocks.length; i++) {
                let block = sentToTestAccountBlocks[i];
                // receive on road
                await TestAccount.receiveTx({
                    fromBlockHash: block.hash
                });
            }


            let latestSnapshotHash = await vite.ledger.getLatestSnapshotChainHash();

            let createContractBlock = await vite.buildinTxBlock.createContract({
                accountAddress: TestAccount.address,
                tokenId: VITE_TOKEN_ID,
                amount: '0',
                fee: '10000000000000000000',
                hexCode: compileResult.bytecodes[0],
                abi: JSON.stringify(compileResult.abiList[0]),
                snapshotHash: latestSnapshotHash,
                params: [TestAccount.address]
            });

            console.log(createContractBlock);

            await TestAccount.sendRawTx(createContractBlock);

            console.log(await vite.ledger.getSnapshotChainHeight());
        } catch (err) {
            console.log(err);
        }

    }
};
</script>