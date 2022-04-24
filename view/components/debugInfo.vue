<template>
    <div class="env-info">
        <el-form class="node-form">
            <el-form-item class="form-item">
                <label>Network:</label>
                <el-select
                    class="network-select"
                    @input="onNetSelect"
                    :value="netType"
                    placeholder="Please select network"
                    size="small"
                >
                    <el-option
                        v-for="item in netTypeList"
                        :key="item"
                        :label="item"
                        :value="item"
                    >
                    </el-option>
                </el-select>
            </el-form-item>

            <el-form-item class="form-item">
                <label>Current Node:</label>
                <code>{{ currentNode }}</code
                ><el-button
                    v-if="!sysNetMap[netType]"
                    @click="onEditNet"
                    class="edit-net"
                    size="small"
                >Edit</el-button
                >
            </el-form-item>

            <el-form-item class="form-item">
                <label>Snapshot Block Height: </label>
                {{ snapshotHeight }}
            </el-form-item>

            <el-form-item class="form-item">
                <label>Account Block Number: </label>
                <span v-if="balance">{{ balance.blockCount }}</span>
            </el-form-item>

            <el-form-item class="form-tiem">
                <label>Balance: </label>
                <template v-if="balance">
                    <span
                        v-for="(tokenBalance,
                                tokenId,
                                index) in balance.balanceInfoMap"
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
                    @click="isShowTransfer = true"
                    class="button-circle"
                    size="mini"
                    circle
                >
                    <i class="el-icon-plus"></i>
                </el-button>
            </el-form-item>

            <el-form-item class="form-item">
                <label>Address:</label>
                <template v-if="!enableVc">
                    <el-select
                        v-model="selectedAddress"
                        placeholder="Please select Address"
                        size="small"
                    >
                        <el-option
                            v-for="item in accountsFilter"
                            :key="item.address"
                            :label="readable(item.address)"
                            :value="item.address"
                        ></el-option>
                    </el-select>
                    <el-button
                        v-if="isDebugEnv"
                        @click="addAccount()"
                        class="button-circle"
                        size="mini"
                        circle
                    >
                        <i class="el-icon-plus"></i>
                    </el-button>
                </template>
                <div v-else>
                    <span v-if="selectedAddress && vcConnected">{{
                        selectedAddress
                    }}</span>
                    <vc-login v-else></vc-login>
                </div>
            </el-form-item>
        </el-form>

        <div class="selected-address">
            <span>Selected Address:</span>
            <code>{{ selectedAddress }}</code> 
            <span>({{ selectedAddressQuota }} quota)</span>
        </div>

        <el-dialog
            width="30%"
            :visible.sync="isShowTransfer"
            title="Transfer"
        >
            <div>
                <transfer
                    @afterTransfer="afterTransfer"
                    :account="selectedAccount"
                />
            </div>
        </el-dialog>

        <el-dialog
            width="40%"
            :visible.sync="isShowDynamicNetEditor"
            title="Custom Network"
        >
            <el-form ref="netEditorForm" @submit.prevent label-position="right" label-width="70px;">
                <el-form-item>
                    <el-input v-model="dynamicNetUrlInput">
                        <template slot="prepend">URL:</template>
                    </el-input>
                </el-form-item>
                <el-form-item>
                    <el-button @click="onSaveDynamicUrl('custom', dynamicNetUrlInput)">Save</el-button>
                </el-form-item>
            </el-form>
        </el-dialog>
    </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import BigNumber from 'bignumber.js';

import * as vite from 'global/vite';
import transfer from 'components/transfer';
import vcLogin from 'components/vcLogin';
import { NET_MAPS } from 'store/store';

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
            dynamicNetUrlInput: '',
            isShowDynamicNetEditor: false,
            sysNetMap:NET_MAPS,
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
            'enableVc',
            'dynamicNetMap',
            'currentNode',
            'quotaMap'
        ]),
        ...mapGetters([
            'addressMap',
            'selectedAccount',
            'netTypeList',
            'isDebugEnv',
            'currentNode',
            'accountsFilter'
        ]),
        ...mapActions(['changeNetType']),
        selectedAddress: {
            get() {
                return this.$store.state.selectedAddress;
            },
            set(newValue) {
                this.$store.commit('setSelectedAddress', newValue);
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
        },
        selectedAddressQuota() {
            const quota = this.quotaMap[this.selectedAccount.address];
            return quota ? quota.currentQuota : '0';
        },
    },
    methods: {
        onNetSelect(value) {
            if (this.dynamicNetMap[value]) {
                this.netType = value;
            } else {
                this.onEditNet();
            }
        },
        onEditNet() {
            this.isShowDynamicNetEditor = true;
            this.dynamicNetUrlInput=this.currentNode;
        },
        onSaveDynamicUrl(name, url) {
            if (!name || !url) throw new Error('invalid name or url');
            this.$store.dispatch('updateDynamicNetItem', { name, url });
            this.netType = name;
            this.isShowDynamicNetEditor = false;
        },
        async addAccount() {
            // add account
            let newAccount = vite.createAccount(this.mnemonics);

            this.$store.dispatch('addAccount', newAccount);

            // init balance
            await vite.initBalance(
                newAccount,
                vite.ACCOUNT_INIT_AMOUNT.toFixed()
            );
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
        readable(address) {
            return address.replace(/(\w{11})\w{38}(\w{6})/, '$1...$2');
        },
    }
};
</script>

<style lang="scss" scoped>
.env-info {
    background: #fff;
    padding: 10px;
}
.node-form {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding-left: 10px;
    .form-item {
        margin-bottom: 0;
    }
    label {
        display: inline-block;
        width: 160px;
        color: #666;
    }
}
.selected-address{
    margin-top: -10px;
    margin-bottom: 10px;
    padding: 10px;
    background: #f0f9eb;
    border-radius: 3px;
    /* box-shadow: 1px 1px 2px rgba(0,0,0,.15); */
    span{
        font-size: 14px;
        color: #666;
    }
    code {
        margin: 0 10px;
        font-size: 16px;
        color: #007aff;
    }
}

.edit-net {
    margin-left: 8px;
}
.button-circle {
    position: relative;
    top: 6px;
    left: 6px;
    width: 24px;
    height: 24px;
    i {
        position: relative;
        top: -4px;
        left: -4px;
        font-size: 16px;
    }
}
</style>
