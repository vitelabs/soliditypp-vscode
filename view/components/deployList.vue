<template>
    <!-- <div class="module-wrapper"> -->
    <el-tabs type="card" class="deploy-list-tabs" v-model="selectedDeployIndex">
        <el-tab-pane
            :label="deployInfo.compileInfo.contractName"
            class="deploy-panel"
            :value="index"
            :key="index"
            v-for="(deployInfo, index) in deployInfoList"
        >
            <Split style="height: 100%;">
                <SplitArea :size="60" class="left-panel-wrapper">
                    <div class="left-panel">
                        <div class="title">Deploy</div>
                        <el-collapse class="deploy-list-collapse">
                            <el-collapse-item :title="deployInfo.selectedAccountAddress">
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
                </SplitArea>

                <SplitArea :size="40" class="right-panel-wrapper">
                    <log-list
                        class="right-panel"
                        v-if="deployInfo && deployInfo.logs && deployInfo.logs.length > 0"
                        :deploy-info="deployInfo"
                    ></log-list>
                </SplitArea>
            </Split>
        </el-tab-pane>
    </el-tabs>
</template>
    
<script>
import deploy from './deploy';
import contractList from 'components/contractList';
import logList from 'components/logList';
import postError from 'utils/postError';

import baseInfo from 'components/baseInfo';

import * as vite from 'global/vite';
import { mapState } from 'vuex';

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
                vite.ACCOUNT_INIT_AMOUNT.toFixed()
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
                            log: `rollback block ${result.hash}`,
                            title: 'rollback account block'
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
                            log: `get block by hash: ${JSON.stringify(err)}`
                        });
                        return;
                    }
                    if (!block) {
                        return;
                    }

                    let relatedDeployInfoList = [];
                    this.deployInfoList.forEach(deployInfo => {
                        let toAccount = deployInfo.addressMap[block.toAddress];
                        let fromAccount = deployInfo.addressMap[block.fromAddress];

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
                            dataType: 'accountBlock'
                        });
                    }
                }
            });
        }
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
.deploy-list-tabs {
  .el-tabs__content {
    height: calc(100% - 41px);
  }
}
</style>

<style lang="scss" scoped>
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
