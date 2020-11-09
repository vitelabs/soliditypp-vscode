<template>
    <Split class="split">
        <SplitArea :size="60" class="left-panel-wrapper">
            <debug-info></debug-info>
            <el-tabs class="deploy-list-tabs" v-model="selectedDeployIndex">
                <el-tab-pane
                    :label="deployInfo.compileInfo.contractName"
                    class="deploy-panel"
                    :value="index"
                    :key="index"
                    v-for="(deployInfo, index) in deployInfoList"
                >
                    <el-row class="deploy-wrapper">
                        <el-row :gutter="20" justify="space-between">
                            <el-col :span="16">
                                <deploy :deploy-info="deployInfo"></deploy>
                            </el-col>
                            <el-col :span="8">
                                <base-info :deploy-info="deployInfo"></base-info>
                            </el-col>
                        </el-row>
                    </el-row>

                    <el-row class="contract-list" v-if="deployInfo.sendCreateBlocks.length > 0">
                        <contract-list :deploy-info="deployInfo"></contract-list>
                    </el-row>
                </el-tab-pane>
            </el-tabs>
        </SplitArea>

        <SplitArea :size="40" class="right-panel-wrapper">
            <log-list
                class="right-panel"
                :key="selectedDeployIndex"
                v-if="selectedDeployInfo && selectedDeployInfo.logs && selectedDeployInfo.logs.length > 0"
                :deploy-info="selectedDeployInfo"
            ></log-list>
        </SplitArea>
    </Split>
</template>
    
<script>
import { mapState, mapGetters } from 'vuex';
import BigNumber from 'bignumber.js';

import deploy from './deploy';
import contractList from 'components/contractList';
import logList from 'components/logList';
import baseInfo from 'components/baseInfo';
import * as vite from 'global/vite';
import debugInfo from 'components/debugInfo';


function briefAddress(address) {
    return address.slice(0, 8) + '...' + address.slice(-3);
}
function briefHash(hash) {
    return hash.slice(0, 5) + '...' + hash.slice(-5);
}
function parseLogTitle(block) {
    let title = `${
        vite.isSendBlock(block.blockType) ? '<b>[SEND]</b>' : '<b>[RECEIVE]</b>'
    }`;

    let newProp = (k, v) => {
        return ` <b>${k}</b>: <span style="color: #F6F0F0">${v}</span>`;
    };
    title += newProp('from', briefAddress(block.fromAddress));
    title += newProp('to', briefAddress(block.toAddress));
    title += newProp('height', block.height);
    title += newProp('hash', briefHash(block.hash));

    if (vite.isReceiveBlock(block.blockType)) {
        title += newProp('fromHash', briefHash(block.fromBlockHash));
    }

    return title;
}

export default {
    components: {
        baseInfo,
        contractList,
        deploy,
        logList,
        debugInfo,
    },
    data() {
        return {
            selectedDeployIndex: 0,
            timerStatus: 'stop'
        };
    },
    computed: {
        ...mapState([
            'deployInfoList',
            'compileResult',
            'accounts',
        ]),
        ...mapGetters(['addressMap', 'selectedAccount']),
        selectedDeployInfo() {
            return this.deployInfoList[this.selectedDeployIndex];
        },
        selectedAddress: {
            get() {
                return this.$store.state.selectedAddress;
            },
            set(newValue) {
                this.$store.commit('setSelectedAddress', { address: newValue });
            },
        },
        balance() {
            const { accountState } = this.selectedAccount;
            return accountState && accountState.balance;
        }
    },

    async created() {
        await this.subscribeNewAccountBlocks();

        // init balances
        for (let i = 0; i < this.accounts.length; i++) {
            await vite.initBalance(
                this.accounts[i],
                vite.ACCOUNT_INIT_AMOUNT.toFixed()
            );
        }

        let runTask = () => {
            this.updateBalanceTimer = setTimeout(async () => {
                if (this.timerStatus !== 'start') {
                    return;
                }
                await this.updateAccountState();
                runTask();
            }, 600);
        };
        this.timerStatus = 'start';
        runTask();
    },

    beforeDestroy() {
        this.timerStatus = 'stop';
    },

    methods: {
        async subscribeNewAccountBlocks() {
            let client = vite.getVite();

            let listener;
            try {
                listener = await client.subscribe('newAccountBlocks');
            } catch (err) {
                console.log(err);
                return;
            }
            let rollbackSet = {};

            listener.on(async (resultList) => {
                if (!this.selectedDeployInfo) {
                    return;
                }

                for (let i = 0; i < resultList.length; i++) {
                    let result = resultList[i];
                    if (result.removed) {
                        rollbackSet[result.hash] = true;
                        this.$store.commit('addLog', {
                            deployInfo: this.selectedDeployInfo,
                            log: `rollback block ${result.hash}`,
                            title: 'rollback account block',
                        });
                        return;
                    }
                    if (rollbackSet[result.hash]) {
                        return;
                    }

                    let block;
                    try {
                        block = await client.request('ledger_getBlockByHash', result.hash);
                    } catch (err) {
                        this.$store.commit('addLog', {
                            deployInfo: this.selectedDeployInfo,
                            type: 'error',
                            log: `get block by hash: ${JSON.stringify(err)}`,
                        });
                        return;
                    }
                    if (!block) {
                        return;
                    }

                    let relatedDeployInfoList = [];
                    this.deployInfoList.forEach((deployInfo) => {
                        let toAccount = this.addressMap[block.toAddress];
                        let fromAccount = this.addressMap[block.fromAddress];

                        if (toAccount || fromAccount) {
                            relatedDeployInfoList.push(deployInfo);
                        }
                    });

                    for (let i = 0; i < relatedDeployInfoList.length; i++) {
                        let relatedDeployInfo = relatedDeployInfoList[i];

                        if (block.logHash && !block.logs) {
                            let vmLogs = await vite.queryVmLogList(
                                block,
                                relatedDeployInfo.compileInfo.abi
                            );
                            block.logs = vmLogs;
                            console.log(block.logs);
                        }
                        this.$store.commit('addLog', {
                            deployInfo: relatedDeployInfo,
                            log: block,
                            title: parseLogTitle(block),
                            dataType: 'accountBlock',
                        });
                    }
                }
            });
        },
        async updateAccountState() {
            let address = this.selectedAddress;
            let account = this.addressMap[address];
            if (!account) {
                return;
            }
            let accountState = await account.getBalance();

            console.log(JSON.stringify(accountState, null, 4));
            this.$store.commit('updateAccountState', {
                address: address,
                accountState: accountState,
            });
        },
    },
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
.deploy-list-tabs {
  .el-tabs__content {
    height: calc(100% - 41px);
  }
}
</style>

<style lang="scss" scoped>
.form {
    border-bottom: 1px solid rgba(0,0,0,0.04);
}

.deploy-wrapper {
    padding: 15px 0;
    width: 100%;
    border-bottom: 1px solid rgba(0,0,0,0.04);
}
</style>
