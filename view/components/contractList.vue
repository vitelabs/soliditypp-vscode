<template>
    <div class="module-wrapper">
        <h4 class="title">
            Contract List
        </h4>
        <div :key="contract.contractAddress" v-for="(contract, index) in contracts">
            <h5 class="title">
                <i class="el-icon-caret-bottom" @click="hideContract(index)" v-if="showContracts[index]"></i>
                <i class="el-icon-caret-right" @click="showContract(index)" v-else></i>
                {{contract.contractName}} - {{contract.contractAddress}}
            </h5>

            <div class="contract-content" v-show="showContracts[index]">
                <method-list 
                    class="method-list"
                    :account="account" 
                    :abi="contract.abi" 
                    :contractAddress="contract.contractAddress"
                    @sendContractTx="onSendContractTx($event, index)"></method-list>

                <result-list
                    class="result-list"
                    ref="resultList"
                    :abi="contract.abi" 
                    :sendCreatBlock="contract.contractBlock"
                    :contractAddress="contract.contractAddress">
                </result-list>
            </div>

            
        </div>
    </div>
</template>

<script>
import resultList from 'components/resultList';
import methodList from 'components/methodList';

export default {
    props: ['compileResult', 'contracts', 'account'],
    components: {
        resultList,
        methodList
    },
    data () {
        return {
            showContracts: []
        };
    },
    watch: {
        contracts () {
            if (!this.contracts) {
                return;
            }

            let gap = this.contracts.length - this.showContracts.length;
            for (let i =0; i < gap; i++) {
                this.showContracts.push(false);
            }
        }
    },
    methods: {
        showContract (index) {
            this.$set(this.showContracts, index, true);
        },

        hideContract (index) {
            this.$set(this.showContracts, index, false);
        },
        findIndexByContractAddress (contractAddress) {
            return this.contracts.findIndex(function (contract) {
                return contract.contractAddress === contractAddress;
            });
        },
        onSendContractTx (event, index) {
        
            this.$refs.resultList[index].onSendContractTx(event.abi, event.contractBlock);
        }
    }
};
</script>

<style lang="scss">
    .contract-content { 
        margin: 0 10px 10px 10px;
        border-left: 1px solid #999;
        border-right: 1px solid #999;
        border-bottom: 1px solid #999;

        .method-list {
            border-top: 1px solid #999;
        }
        .result-list {
            border-top: 1px solid #999;
        }
    }
</style>