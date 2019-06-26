<template>
    <!-- <div class="module-wrapper"> -->
    <el-tabs type="card" class="deploy-list-tabs" @tab-click="contractSelect">
        <el-tab-pane
            class="deploy-panel"
            :label="deployInfo.compileInfo.contractName"
            :key="index"
            v-for="(deployInfo, index) in deployInfoList"
        >
            <div class="left-panel">
                <div class="title">Deploy</div>
                <el-collapse class="deploy-list-collapse">
                    <el-collapse-item title="Select Account">
                        <el-row>
                            address:
                            <el-select
                                class="address-input"
                                size="small"
                                @change="selectAccount(index, $event)"
                                v-model="deployInfo.selectedAccountAddress"
                            >
                                <el-option
                                    v-for="account in deployInfo.accounts"
                                    :key="account.address"
                                    :label="account.address"
                                    :value="account.address"
                                ></el-option>
                            </el-select>

                            <el-button
                                @click="addAccount(index)"
                                icon="el-icon-plus"
                                class="add-account-button"
                                size="mini"
                                circle
                            ></el-button>
                        </el-row>

                        <!-- <i class="el-icon-circle-plus add-account"></i> -->
                    </el-collapse-item>

                    <el-collapse-item title="Deploy">
                        <deploy :deploy-info="deployInfo"></deploy>
                    </el-collapse-item>
                </el-collapse>

                <template v-if="deployInfo.sendCreateBlocks.length > 0">
                    <div class="title">Deployed Contracts</div>
                    <contract-list :deploy-info="deployInfo"></contract-list>
                </template>
            </div>
            <div class="right-panel" v-if="deployInfo && deployInfo.logs && deployInfo.logs.length > 0">
                <log-list :deploy-info="deployInfo"></log-list>
            </div>

            <!-- :account="selectedAccount"
                        v-if="compileResult"
                        :compile-result="compileResult"
      @deployed="deployed"-->
            <!-- <el-select v-model="selectedAccountAddress" size="small">
                <el-option
                    v-for="account in accountList"
                    :key="account.address"
                    :label="account.address"
                    :value="account.address"
                ></el-option>
      </el-select>-->
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
import deploy from './deploy';
import contractList from 'components/contractList';
import logList from 'components/logList';
// import baseInfo from 'components/baseInfo';
// import contractList from 'components/contractList';

import * as vite from 'global/vite';
import { mapState } from 'vuex';

async function createAccounts(count) {
    var newRandomAccount = async () => {
        try {
            return await vite.createAccount();
        } catch (err) {
            return await new Promise(resolve => {
                setTimeout(() => {
                    resolve();
                }, 200);
            }).then(() => newRandomAccount());
        }
    };
    let tasks = [];
    for (let i = 0; i < count; i++) {
        tasks.push(newRandomAccount());
    }

    return await Promise.all(tasks);
}

export default {
    components: {
    // baseInfo,
        contractList,
        deploy,
        logList
    },
    props: ['compileResult'],
    data() {
        return {
            // showContractDeployList: [],
            // activeTabName: ''
        };
    },
    computed: {
        ...mapState(['deployInfoList'])
    },

    async created() {
    // this.compileResult.abiList.forEach((abi, index) => {
    //     this.showContractDeployList[index] = false;
    // });
    // init a account

        // init the deployInfoList
        let initAccounts = await createAccounts(this.compileResult.abiList.length);
        this.$store.commit('init', {
            compileResult: this.compileResult,
            initAccounts
        });
    },
    methods: {
        async addAccount(index) {
            // add account
            let newAccounts = await createAccounts(1);

            let newAccount = newAccounts[0];

            this.$store.commit('addAccount', {
                index,
                account: newAccount
            });

            this.selectAccount(index, newAccount.address);
        },

        selectAccount(index, address) {
            this.$store.commit('selectAccount', {
                index,
                address
            });
        },

        contractSelect(tab, event) {
            console.log(tab, event);
        }

        // deployed(contractBlock, abi, contractName, offchainCode) {
        //     this.$emit('deployed', contractBlock, abi, contractName, offchainCode);
        // }

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
.deploy-list-tabs {
  .el-tabs__header {
    margin: 0;
  }
}
.deploy-list-collapse {
  .el-collapse-item__header {
    padding-left: 10px;
  }
  .el-collapse-item__wrap {
    padding-left: 10px;
  }
}

.add-account-button.el-button--mini.is-circle {
  padding: 1px;
  width: 16px;
  height: 16px;
  i {
    vertical-align: middle;
  }
}
</style>

<style lang="scss" scoped>
.deploy-panel {
  display: flex;
  align-content: stretch;
  .left-panel {
    flex: 1;
  }
}
.address-input {
  width: 80%;
}
</style>
