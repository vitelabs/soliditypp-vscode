<template>
    <div>
        <base-info  
            v-if="selectedAccount"
            v-bind:selected-account.sync="selectedAccount" 
            :contractAddress="contractAddress">
        </base-info>

        <deploy-list v-if="compileResult" :compile-result="compileResult" @deployed="deployed"></deploy-list>

        <contract-list v-if="contracts && contracts.length > 0" :compile-result="compileResult" :contracts="contracts" :selected-account="selectedAccount">
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

            this.selectedAccount = vite.getTestAccount();
        } catch (err) {
            throwError(err);
        }
    },
    methods: {
        deployed (contractAddress, abi, contractName) {
            this.contracts.push({
                contractAddress,
                abi,
                contractName
            });
        }
    }
    
};
</script>