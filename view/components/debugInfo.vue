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
                            <el-button
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
                </el-col>
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
import { mapState, mapGetters } from 'vuex';
import BigNumber from 'bignumber.js';

import * as vite from 'global/vite';
import transfer from 'components/transfer';

export default {
    components: {
        transfer
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
        ]),
        ...mapGetters(['addressMap', 'selectedAccount']),
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
    methods: {
        async addAccount() {
            // add account
            let newAccount = vite.createAccount();

            this.$store.commit('addAccount', {
                account: newAccount,
            });

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