<template>
    <div>
        <el-collapse class="deploy-list-collapse">
            <el-collapse-item
                v-for="(sendCreateBlock,index) in deployInfo.sendCreateBlocks"
                :key="index"
                :title="sendCreateBlock.toAddress"
            >
                <!-- <el-row class="select-row" type="flex" align="middle" justify="center">
                    <el-col :span="4" class="label">Constructor:</el-col>
                    <el-col :span="18">
                        <el-select size="small" class="selector">
                            <el-option
                                v-for="(abi, abiIndex) in constructors"
                                :key="abiIndex"
                                :value="abiIndex"
                            >{{functionSignature(abi)}}</el-option>
                        </el-select>
                    </el-col>
        </el-row>-->

                <el-row class="select-row" type="flex" align="middle" justify="center">
                    <el-col :span="4" class="label">Methods:</el-col>
                    <el-col :span="18">
                        <el-select size="small" class="selector">
                            <el-option
                                v-for="(abi, abiIndex) in functions"
                                :key="abiIndex"
                                :value="abi.name"
                            >{{functionSignature(abi)}}</el-option>
                        </el-select>
                    </el-col>
                </el-row>
            </el-collapse-item>
        </el-collapse>
    </div>

    <!-- <div class="module-wrapper">
        <h4 class="title">Contract List</h4>
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
                    :offchainCode="contract.offchainCode"
                    @sendContractTx="onSendContractTx($event, index)"
                ></method-list>

                <result-list
                    class="result-list"
                    ref="resultList"
                    :abi="contract.abi"
                    :sendCreatBlock="contract.contractBlock"
                    :contractAddress="contract.contractAddress"
                ></result-list>
            </div>
        </div>
  </div>-->
</template>

<script>
// import resultList from 'components/resultList';
// import methodList from 'components/methodList';

export default {
    props: ['deployInfo'],
    components: {
    // resultList,
    // methodList
    },
    created() {
        console.log(this.deployInfo);
    },
    computed: {
        constructors() {
            if (!this.deployInfo) {
                return [];
            }
            let constructors = [];

            this.deployInfo.compileInfo.abi.forEach(function(item) {
                if (item.type === 'constructor') {
                    constructors.push(item);
                }
            });

            return constructors;
        },
        functions() {
            if (!this.deployInfo) {
                return [];
            }
            let functions = [];

            this.deployInfo.compileInfo.abi.forEach(function(item) {
                if (item.type === 'function') {
                    functions.push(item);
                }
            });

            return functions;
        }
    },
    methods: {
        functionSignature(f) {
            let name = f.name;
            if (!name) {
                name = 'Constructor';
            }
            let signature = name + '(';
            f.inputs.forEach(function(input, index) {
                signature += input.type;
                if (index < f.inputs.length - 1) {
                    signature += ', ';
                }
            });

            return signature + ')';
        }
    }
    // data() {
    //     return {
    //         showContracts: []
    //     };
    // },
    // watch: {
    //     contracts() {
    //         if (!this.sendCreateBlocks) {
    //             return;
    //         }

    //         let gap = this.contracts.length - this.showContracts.length;
    //         for (let i = 0; i < gap; i++) {
    //             this.showContracts.push(false);
    //         }
    //     }
    // },
    // methods: {
    //     showContract(index) {
    //         this.$set(this.showContracts, index, true);
    //     },

    //     hideContract(index) {
    //         this.$set(this.showContracts, index, false);
    //     },
    //     findIndexByContractAddress(contractAddress) {
    //         return this.contracts.findIndex(function(contract) {
    //             return contract.contractAddress === contractAddress;
    //         });
    //     },
    //     onSendContractTx(event, index) {
    //         this.$refs.resultList[index].onSendContractTx(
    //             event.abi,
    //             event.contractBlock
    //         );
    //     }
    // }
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
.selector {
  width: 100%;
}
.select-row {
  margin-bottom: 10px;
}
</style>