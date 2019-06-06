<template>
    <div>
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

import baseInfo from 'components/baseInfo';
import contractList from 'components/contractList';
import deployList from 'components/deployList';
import throwError from 'utils/throwError';

export default {
    components: {
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
        try {
            let compileResult = await getCompileResult();
            this.compileResult = compileResult;
            await vite.init(compileResult);
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