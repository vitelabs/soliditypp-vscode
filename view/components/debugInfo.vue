<template>
    <div>
        <el-form
            class="form"
            ref="form"
            label-position="left"
            size="mini"
        >
            <el-row :gutter="20" class="form-row" type="flex">
                <el-col :span="12">
                    <el-form-item label="Network: ">
                        <el-select v-model="netType" placeholder="Please select network">
                            <el-option
                                v-for="item in netTypeList"
                                :key="item"
                                :label="item"
                                :value="item">
                            </el-option>
                        </el-select>
                    </el-form-item>
                </el-col>

                <el-col :span="12">
                    <el-form-item label="Current Node: ">
                        <code>{{customNode}}</code>
                    </el-form-item>
                </el-col>
            </el-row>
            
            <el-row :gutter="20" class="form-row" type="flex">
                <el-col :span="12">
                    <el-form-item label="Snapshot Block Height: ">
                        {{ snapshotHeight }}
                    </el-form-item>
                </el-col>

                <el-col :span="12">
                    <el-form-item label="Account Block Number: ">
                        <div v-if="balance">{{ balance.blockCount }} </div>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row :gutter="20" class="form-row">
                <el-col :span="12">
 
                    <el-form-item label="Balance: ">
                        <div>
                            <template v-if="balance">
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
                            </template>
                            <el-button
                                v-if="isDebugEnv"
                                @click="isShowTransfer=true"
                                icon="el-icon-plus"
                                class="add-account-button"
                                size="mini"
                                circle
                            ></el-button>
                        </div>
                    </el-form-item>

                </el-col>

                <el-col :span="12">
                    <el-form-item label="Address: ">
                        <template v-if="!enableVc">
                            <el-select
                                v-model="selectedAddress"
                                placeholder="Please select Address"
                            >
                                <el-option
                                    v-for="item in accountsFilter"
                                    :key="item.address"
                                    :label="item.address"
                                    :value="item.address"
                                ></el-option>
                            </el-select>
                            <el-button
                                v-if="isDebugEnv"
                                @click="addAccount()"
                                icon="el-icon-plus"
                                class="add-account-button"
                                size="mini"
                                circle
                            ></el-button>
                        </template>
                        <div v-else>
                            <span v-if="selectedAddress && vcConnected">{{selectedAddress}}</span>
                            <vc-login v-else></vc-login>
                        </div>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row>
                <el-alert
                    :title="`Selected Address: ${selectedAccount.address}`"
                    :closable="false"
                    type="success">
                </el-alert>
            </el-row>

            <el-dialog
                width="40%"
                :visible.sync="isShowTransfer"
                title="transfer"
            >
                <div>
                    <transfer @afterTransfer="afterTransfer" :account="selectedAccount" />
                </div>
            </el-dialog>
        </el-form>

    </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import BigNumber from 'bignumber.js';

import * as vite from 'global/vite';
import transfer from 'components/transfer';
import vcLogin from 'components/vcLogin';

export default {
    components: {
        transfer,
        vcLogin
    },
    data() {
        return {
            selectedDeployIndex: 0,
            timerStatus: 'stop',
            isShowTransfer: false,
        };
    },
    computed: {
        ...mapState([
            'deployInfoList',
            'compileResult',
            'accounts',
            'snapshotHeight',
            'vcConnected',
            'mnemonics',
            'enableVc'
        ]),
        ...mapGetters([
            'addressMap', 
            'selectedAccount', 
            'netTypeList', 
            'isDebugEnv', 
            'currentNode', 
            'isDebugEnv', 
            'accountsFilter'
        ]),
        ...mapActions(['changeNetType']),
        selectedAddress: {
            get() {
                return this.$store.state.selectedAddress;
            },
            set(newValue) {
                this.$store.commit('setSelectedAddress', newValue);
            },
        },
        customNode: {
            get() {
                return this.$store.getters.currentNode;
            },
            set(newValue) {
                if (newValue) {
                    this.$store.commit('setCustomNode', newValue);
                }
            }
        },
        netType: {
            get() {
                return this.$store.state.netType;
            },
            set(newValue) {
                if (newValue) {
                    this.$store.dispatch('changeNetType', newValue);
                }
            }
        },
        balance() {
            const { accountState } = this.selectedAccount;
            return accountState && accountState.balance;
        }
    },
    methods: {
        async addAccount() {
            // add account
            let newAccount = vite.createAccount(this.mnemonics);

            this.$store.dispatch('addAccount', newAccount);

            // init balance
            await vite.initBalance(newAccount, vite.ACCOUNT_INIT_AMOUNT.toFixed());
        },
        transformBalance(amount, decimal) {
            return new BigNumber(amount).dividedBy(`1e${decimal}`).toFixed();
        },
        afterTransfer(res) {
            this.isShowTransfer = false;
            if (res.error) {
                this.$store.commit('addLog', {
                    deployInfo: this.deployInfo,
                    title: 'transfer vite failed',
                    type: 'error',
                    log: res.error
                });
                return;
            }
        },
    }
    
};
</script>

<style lang="scss" scoped>
.node-input {
    width: auto;
}
</style>