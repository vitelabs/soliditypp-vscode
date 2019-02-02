<template>
    <div>
        <base-info :account="testAccount" :contractAddress="contractAddress"> </base-info>
        <deploy v-if="abi && bytecodes && !isDeployed" :abi="abi" :bytecodes="bytecodes" @deployed="deployed"> </deploy>  
        <method-list v-if="isDeployed" :account="testAccount" :abi="abi" :contractAddress="contractAddress"></method-list>    
        <result-list 
            v-if="testAccount" 
            :account="testAccount">
        </result-list>
    </div>
</template>

<script>
import getCompileResult from 'services/compile';
import * as vite from 'global/vite';
import resultList from 'components/resultList';
import baseInfo from 'components/baseInfo';
import deploy from 'components/deploy';
import methodList from 'components/methodList';

export default {
    components: {
        resultList,
        deploy,
        baseInfo,
        methodList
    },
    data () {
        return {
            compileResult: undefined,
            testAccount: undefined,
            contractAddress: undefined,

            isDeployed: false
        };
    },

    computed: {
        abiList () {
            if (!this.compileResult) {
                return undefined;
            }
            return this.compileResult.abiList;

        },
        abi () {
            if (!this.abiList) {
                return undefined;
            }
            return this.abiList[0];
        },

        bytecodes () {
            if (!this.compileResult) {
                return undefined;
            }
            return this.compileResult.bytecodesList[0];
        }
    },

    async created () { 
        let compileResult = await getCompileResult();
        this.compileResult = compileResult;

        await vite.init(compileResult);
        this.testAccount = vite.getTestAccount();
    },
    methods: {
        deployed (contractAddress) {
            this.contractAddress = contractAddress;
            this.isDeployed = true;
        }
    }
    
};
</script>