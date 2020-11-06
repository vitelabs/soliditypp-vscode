<template>
    <Split class="split">
        <SplitArea :size="60" class="left-panel-wrapper">
            <el-form
                class="form"
                ref="form"
                label-width="180px"
                label-position="left"
                size="mini"
            >
                <el-form-item label="Snapshot Block Height: ">
                    {{ snapshotHeight }}
                </el-form-item>

                <el-form-item label="Balance: ">
                    <div v-if="balance">
                        <span
                            v-for="(tokenBalance, tokenId, index) in balance.balanceInfoMap"
                            :key="tokenId"
                        >
                            <span v-if="index > 0">,</span>
                            {{
                                transformBalance(
                                    tokenBalance.balance,
                                    tokenBalance.tokenInfo.decimals
                                )
                            }}
                            {{ tokenBalance.tokenInfo.tokenSymbol }}
                        </span>
                    </div>
                </el-form-item>

                <el-form-item label="Address: ">
                    <el-select
                        v-model="selectedAddress"
                        placeholder="Please select Address"
                    >
                        <el-option
                            v-for="item in accounts"
                            :key="item.address"
                            :label="item.address"
                            :value="item.address"
                        ></el-option>
                    </el-select>
                    <el-button
                        @click="addAccount()"
                        icon="el-icon-plus"
                        class="add-account-button"
                        size="mini"
                        circle
                    ></el-button>
                </el-form-item>
            </el-form>

            <el-tabs class="deploy-list-tabs" v-model="selectedDeployIndex">
                <el-tab-pane
                    :label="deployInfo.compileInfo.contractName"
                    class="deploy-panel"
                    :value="index"
                    :key="index"
                    v-for="(deployInfo, index) in deployInfoList"
                >
                    <div class="left-panel">
                        <div class="title">Deploy</div>
                        <el-collapse class="deploy-list-collapse">
                            <el-collapse-item :title="selectedAddress">
                                <div>
                                    <div class="minor-title">BaseInfo</div>
                                    <base-info :deploy-info="deployInfo"></base-info>
                                </div>

                                <div class="minor-section">
                                    <div class="minor-title">Deploy</div>
                                    <deploy :deploy-info="deployInfo"></deploy>
                                </div>
                            </el-collapse-item>
                        </el-collapse>

                        <template v-if="deployInfo.sendCreateBlocks.length > 0">
                            <div class="title">Contracts</div>
                            <contract-list :deploy-info="deployInfo"></contract-list>
                        </template>
                    </div>
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
    },
    data() {
        return {
            selectedDeployIndex: 0,
            timerStatus: 'stop',
        };
    },
    computed: {
        ...mapState([
            'deployInfoList',
            'compileResult',
            'accounts',
            'snapshotHeight',
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
        async addAccount() {
            // add account
            let newAccount = vite.createAccount();

            this.$store.commit('addAccount', {
                account: newAccount,
            });

            // init balance
            await vite.initBalance(newAccount, vite.ACCOUNT_INIT_AMOUNT.toFixed());
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
        transformBalance(amount, decimal) {
            return new BigNumber(amount).dividedBy(`1e${decimal}`).toFixed();
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
  max-width: 50%;
}

.deploy-panel {
  display: flex;
  align-content: stretch;
  height: 100%;
  .left-panel-wrapper {
    overflow: auto;
    .left-panel {
      // flex: 1;
      min-width: 465px;
      height: 100%;
    }
  }
  .right-panel-wrapper {
    overflow: auto;

    .right-panel {
      min-width: 300px;

      height: 100%;
    }
  }
}
.minor-section {
  margin-top: 10px;
}
</style>
