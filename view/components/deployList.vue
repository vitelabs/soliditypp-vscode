<template>
    <!-- <div class="module-wrapper"> -->
    <el-tabs type="card" class="deploy-list-tabs" v-model="selectedDeployIndex">
        <el-tab-pane
            class="deploy-panel"
            :label="deployInfo.compileInfo.contractName"
            :value="index"
            :key="index"
            v-for="(deployInfo, index) in deployInfoList"
        >
            <Split style="height: 100%;">
                <SplitArea :size="75">
                    <div class="title">Deploy</div>
                    <el-collapse class="deploy-list-collapse">
                        <el-collapse-item :title="deployInfo.selectedAccountAddress">
                            <div>
                                <div class="minor-title">BaseInfo</div>
                                <base-info :deploy-info="deployInfo"></base-info>
                            </div>

                            <div>
                                <div class="minor-title">Deploy</div>
                                <deploy :deploy-info="deployInfo"></deploy>
                            </div>
                        </el-collapse-item>
                        <!-- <el-collapse-item title="Select Account">
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

          </el-collapse-item>

          <el-collapse-item title="Deploy">
            <deploy :deploy-info="deployInfo"></deploy>
            </el-collapse-item>-->
                    </el-collapse>

                    <template v-if="deployInfo.sendCreateBlocks.length > 0">
                        <div class="title">Deployed Contracts</div>
                        <contract-list :deploy-info="deployInfo"></contract-list>
                    </template>
                </SplitArea>

                <SplitArea :size="25" class="right-panel">
                    <log-list
                        v-if="deployInfo && deployInfo.logs && deployInfo.logs.length > 0"
                        :deploy-info="deployInfo"
                    ></log-list>
                </SplitArea>
            </Split>

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
import postError from 'utils/postError';

import baseInfo from 'components/baseInfo';
// import contractList from 'components/contractList';

import * as vite from 'global/vite';
import { mapState } from 'vuex';

// async function createAccounts(count) {
//     let accounts = [];
//     for (let i = 0; i < count; i++) {
//         accounts.push(vite.createAccount());
//     }
//     return accounts;
// var newRandomAccount = async () => {
//     try {
//         return await vite.createAccount();
//     } catch (err) {
//         return await new Promise(resolve => {
//             setTimeout(() => {
//                 resolve();
//             }, 200);
//         }).then(() => newRandomAccount());
//     }
// };
// let tasks = [];
// for (let i = 0; i < count; i++) {
//     tasks.push(newRandomAccount());
// }

// return await Promise.all(tasks);
// }

export default {
    components: {
        baseInfo,
        contractList,
        deploy,
        logList
    },
    props: ['compileResult'],
    data() {
        return {
            selectedDeployIndex: 0
        };
    },
    computed: {
        ...mapState(['deployInfoList']),
        selectedDeployInfo() {
            return this.deployInfoList[this.selectedDeployIndex];
        }
    },

    async created() {
    // init the deployInfoList
        await this.subscribeNewAccountBlocks();

        let initAccounts = [];

        for (let i = 0; i < this.compileResult.abiList.length; i++) {
            initAccounts.push(vite.createAccount());
        }
        // let initAccounts = await createAccounts(this.compileResult.abiList.length);

        this.$store.commit('init', {
            compileResult: this.compileResult,
            initAccounts
        });

        // init balances
        for (let i = 0; i < initAccounts.length; i++) {
            await vite.initBalance(
                initAccounts[i],
                vite.ACCOUNT_INIT_AMOUNT.toString()
            );
        }
    },

    methods: {
        async subscribeNewAccountBlocks() {
            let client = vite.getVite();

            let listener;
            try {
                listener = await client.subscribe('newAccountBlocks');
            } catch (err) {
                postError(err);
                return;
            }
            let rollbackSet = {};

            listener.on(async resultList => {
                if (!this.selectedDeployInfo) {
                    return;
                }

                for (let i = 0; i < resultList.length; i++) {
                    let result = resultList[i];
                    if (result.removed) {
                        rollbackSet[result.hash] = true;
                        this.$store.commit('addLog', {
                            deployInfo: this.selectedDeployInfo,
                            log: `rollback block ${result.hash}`
                        });
                        return;
                    }
                    if (rollbackSet[result.hash]) {
                        return;
                    }
                    let block;
                    try {
                        console.log(`request hash ${result.hash}`);
                        block = await client.request('ledger_getBlockByHash', result.hash);
                    } catch (err) {
                        this.$store.commit('addLog', {
                            deployInfo: this.selectedDeployInfo,
                            log: `get block by hash: ${JSON.stringify(err)}`
                        });
                        return;
                    }
                    if (!block) {
                        return;
                    }

                    let relatedDeployInfoList = [];
                    this.deployInfoList.forEach(deployInfo => {
                        if (
                            deployInfo.addressMap[block.toAddress] ||
              deployInfo.addressMap[block.fromAddress]
                        ) {
                            relatedDeployInfoList.push(deployInfo);
                        }
                    });

                    relatedDeployInfoList.forEach(relatedDeployInfo => {
                        this.$store.commit('addLog', {
                            deployInfo: relatedDeployInfo,
                            log: block
                        });
                    });
                }
            });
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
  height: 100%;
  .left-panel {
    flex: 1;
    height: 100%;
  }
  .right-panel {
    height: 100%;
  }
}
</style>
<style lang="scss">
.deploy-list-tabs {
  .el-tabs__content {
    height: calc(100% - 41px);
  }
}
</style>