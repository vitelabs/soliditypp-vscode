<template>
    <div class="app-wrapper">
        <deploy-list class="deploy-list" v-if="compileResult" :compile-result="compileResult"></deploy-list>
    </div>
</template>

<script>
import getCompileResult from 'services/compile';
import * as vite from 'global/vite';

import deployList from 'components/deployList';
import postError from 'utils/postError';

export default {
    components: {
        deployList
    },

    data() {
        return {
            // contracts: [],
            compileResult: undefined
            // contractAddress: undefined
        };
    },

    async created() {
        try {
            let compileResult = await getCompileResult();
            this.compileResult = compileResult;
            await vite.init(compileResult);
        } catch (err) {
            postError(err);
        }

        await this.subscribeSnapshotBlocks();

        // var newRandomAccount = async () => {
        //     try {
        //         this.selectedAccount = await vite.createAccount();
        //     } catch (err) {
        //         await new Promise(resolve => {
        //             setTimeout(() => {
        //                 resolve();
        //             }, 200);
        //         }).then(() => newRandomAccount());
        //     }
        // };

    // await newRandomAccount();
    },
    methods: {
        async subscribeSnapshotBlocks() {
            let client = vite.getVite();
            let listener;

            try {
                listener = await client.subscribe('newSnapshotBlocks');
            } catch (err) {
                postError(err);
                return;
            }

            listener.on(async resultList => {
                let lastSnapshotBlock = resultList[resultList.length - 1];
                this.$store.commit('updateSnapshotHeight', {
                    snapshotHeight: lastSnapshotBlock.height
                });
            });
        }
    //     deployed(contractBlock, abi, contractName, offchainCode) {
    //         this.contracts.push({
    //             contractAddress: contractBlock.toAddress,
    //             contractBlock,
    //             abi,
    //             contractName,
    //             offchainCode
    //         });
    //     }
    }
};
</script>

<style lang="scss" scoped>
.app-wrapper,
.deploy-list {
  height: 100%;
}
</style>