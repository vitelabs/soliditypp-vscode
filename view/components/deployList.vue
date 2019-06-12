<template>
    <!-- <div class="module-wrapper"> -->
    <el-tabs type="card" @tab-click="contractSelect">
        <el-tab-pane
            :label="deployInfo.compileInfo.contractName"
            :key="index"
            v-for="(deployInfo, index) in deployInfoList"
        >
            <!-- <base-info
                v-if="selectedAccount"
                @onSelectAccount="onSelectAccount"
                :selected-account="selectedAccount"
                :contractAddress="contractAddress"
            ></base-info>
            <deploy
                :account="account"
                :abi="abi"
                :bytecodes="compileResult.bytecodesList[index]"
                :offchainCodes="compileResult.offchainCodesList[index]"
                @deployed="deployed($event, abi, compileResult.contractNameList[index], compileResult.offchainCodesList[index])"
      ></deploy>-->
        </el-tab-pane>
    </el-tabs>

    <!-- <h4 class="title">Deploy contract</h4>    
        <div :key="index" v-for = "(abi, index) in compileResult.abiList" >
            <h5 class="title">
                <i class="el-icon-caret-bottom" @click="hideDeploy(index)" v-if="showContractDeployList[index]"></i>
                <i class="el-icon-caret-right" @click="showDeploy(index)" v-else></i>
                {{compileResult.contractNameList[index]}}
            </h5>
            
            <deploy 
                v-if="showContractDeployList[index]"
                :account="account"
                :abi="abi" 
                :bytecodes="compileResult.bytecodesList[index]" 
                :offchainCodes="compileResult.offchainCodesList[index]" 
                @deployed="deployed($event, abi, compileResult.contractNameList[index], compileResult.offchainCodesList[index])"> 
            </deploy>            
  </div>-->
    <!-- </div> -->
</template>
    
<script>
// import deploy from './deploy';
// import baseInfo from 'components/baseInfo';
import { mapState } from 'vuex';

export default {
    components: {
    // baseInfo,
    // deploy
    },
    props: ['compileResult'],
    data() {
        return {
            // showContractDeployList: [],
            activeTabName: '',
            selectedAccount: undefined
        };
    },
    computed: {
        ...mapState(['deployInfoList'])
    },

    created() {
    // this.compileResult.abiList.forEach((abi, index) => {
    //     this.showContractDeployList[index] = false;
    // });

        // init the deployInfoList
        this.$store.commit('init', this.compileResult);
    },
    methods: {
        onSelectAccount(selectedAccount) {
            if (!selectedAccount) {
                return;
            }
            this.selectedAccount = selectedAccount;
        },

        contractSelect(tab, event) {
            console.log(tab, event);
        },
        deployed(contractBlock, abi, contractName, offchainCode) {
            this.$emit('deployed', contractBlock, abi, contractName, offchainCode);
        }

        // showDeploy(index) {
        //     this.$set(this.showContractDeployList, index, true);
        // },

    // hideDeploy(index) {
    //     this.$set(this.showContractDeployList, index, false);
    // }
    }
};
</script>

<style lang="scss">
</style>
