<template>
    <div>
        <transfer />

        <base-info  
            v-if="selectedAccount"
            @onSelectAccount="onSelectAccount"
            :selected-account="selectedAccount" 
            :contractAddress="contractAddress">
        </base-info>

        <deploy-list :account="selectedAccount" v-if="compileResult" :compile-result="compileResult" @deployed="deployed"></deploy-list>

        <contract-list ref="contractList" v-show="contracts && contracts.length > 0" :compile-result="compileResult" :contracts="contracts" :account="selectedAccount">
        </contract-list>
    </div>
</template>

<script>
import getCompileResult from 'services/compile';
import * as vite from 'global/vite';

import transfer from 'components/transfer.vue';
import baseInfo from 'components/baseInfo';
import contractList from 'components/contractList';
import deployList from 'components/deployList';
import throwError from 'utils/throwError';

export default {
    components: {
        transfer,
        baseInfo,
        contractList,
        deployList
    },

    data () {
        return {
            contracts: [],
            compileResult: undefined,
            selectedAccount: undefined,
            contractAddress: undefined
        };
    },

    async created () { 
        let compileResult = '';
        try {
            compileResult = await getCompileResult();
            await vite.init();
        } catch (err) {
            throwError(err);
        }

        var newRandomAccount = async () => {
            try {
                this.selectedAccount = await vite.createAccount();
            } catch (err) {
                await new Promise((resolve) => {
                    setTimeout(() => {
                        resolve();
                    }, 200);
                }).then(() => newRandomAccount());
            }
        };

        await newRandomAccount();

        try {
            this.compileResult = compileResult;
        } catch (err) {
            throwError(err);
        }

    },
    methods: {
        onSelectAccount (selectedAccount) {
            if (!selectedAccount) {
                return;
            }
            this.selectedAccount = selectedAccount;
        },
        deployed (contractBlock, abi, contractName, offchainCode) {
            this.contracts.push({
                contractAddress: contractBlock.toAddress,
                contractBlock,
                abi,
                contractName,
                offchainCode
            });
        }
    }  
};
</script>