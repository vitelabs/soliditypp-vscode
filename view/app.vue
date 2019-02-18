<template>
    <div>
        <base-info  
            v-if="selectedAccount"
            v-bind:selected-account.sync="selectedAccount" 
            :contractAddress="contractAddress">
        </base-info>

        <deploy-list v-if="compileResult" :compile-result="compileResult"></deploy-list>

        <method-list v-if="contractAddress" :account="selectedAccount" :abi="abi" :contractAddress="contractAddress"></method-list>

        <result-list 
            v-if="selectedAccount" 
            :account="selectedAccount">
        </result-list>
    </div>
</template>

<script>
import getCompileResult from 'services/compile';
import * as vite from 'global/vite';
import resultList from 'components/resultList';
import baseInfo from 'components/baseInfo';
import deployList from 'components/deployList';
import methodList from 'components/methodList';
import throwError from 'utils/throwError';

export default {
    components: {
        resultList,
        baseInfo,
        methodList,
        deployList
    },

    data () {
        return {
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
        deployed (contractAddress) {
            this.contractAddress = contractAddress;
        }
    }
    
};
</script>