<template>
    <div>
        <!-- <el-row

                        type="flex"
                        align="middle"
                        justify="center"
                    >
                        <el-col :span="4">
                            <div>transfer</div>
                            <div>(uint256)</div>
                        </el-col>

                        <el-col :span="13" :offset="1">
                            <el-input size="small" v-model="callingParams.$$transfer"></el-input>
                        </el-col>

                        <el-col :span="4">
                            <units class="units" v-model="callingParams.$$transferUnits"></units>
                        </el-col>
    </el-row>-->
        <el-row type="flex" align="middle">
            <el-col :span="3" class="prop-label">address</el-col>
            <el-col :span="16">
                <el-select
                    class="address-input"
                    size="small"
                    @change="selectAccount($event)"
                    v-model="deployInfo.selectedAccountAddress"
                >
                    <el-option
                        v-for="account in deployInfo.accounts"
                        :key="account.address"
                        :label="account.address"
                        :value="account.address"
                    ></el-option>
                </el-select>
            </el-col>
            <el-col :span="3">
                <el-button
                    @click="addAccount()"
                    icon="el-icon-plus"
                    class="add-account-button"
                    size="mini"
                    circle
                ></el-button>
            </el-col>
        </el-row>

        <el-row class="prop-row" type="flex" align="middle">
            <el-col :span="3" class="prop-label">balance</el-col>
            <el-col :span="16">124 vite</el-col>
        </el-row>

        <el-row class="prop-row" type="flex" align="middle">
            <el-col :span="3" class="prop-label">abi</el-col>
            <el-col :span="16">
                <el-button size="small" @click="showAbi()">show abi</el-button>
            </el-col>
        </el-row>

        <el-row class="prop-row" type="flex" align="middle">
            <el-col :span="3" class="prop-label">code</el-col>
            <el-col :span="16">
                <el-button size="small" @click="showCode()">show code</el-button>
            </el-col>
        </el-row>

        <el-row class="prop-row" type="flex" align="middle">
            <el-col :span="3" class="prop-label">offchain code</el-col>
            <el-col :span="16">
                <el-button size="small" @click="showOffchaincode()">show offchain code</el-button>
            </el-col>
        </el-row>

        <el-dialog :visible.sync="isShowAbi" class="dialog" :fullscreen="true" title="abi">
            <vue-json-pretty :show-length="true" :data="deployInfo.compileInfo.abi"></vue-json-pretty>
        </el-dialog>
        <el-dialog class="dialog" :visible.sync="isShowCode" :fullscreen="true" title="code">
            <div>
                <i
                    class="el-icon-document-copy copy-icon"
                    :data-clipboard-text="deployInfo.compileInfo.bytecodes"
                ></i>
            </div>
            <div>{{deployInfo.compileInfo.bytecodes}}</div>
        </el-dialog>
        <el-dialog
            class="dialog"
            :visible.sync="isShowOffchainCode"
            :fullscreen="true"
            title="offchain code"
        >
            <div>
                <i
                    class="el-icon-document-copy copy-icon"
                    :data-clipboard-text="deployInfo.compileInfo.offchainCode"
                ></i>
            </div>
            <div id="offchainCodeContent">{{deployInfo.compileInfo.offchainCode}}</div>
        </el-dialog>
    </div>

    <!-- <div class="module-wrapper">
        <h4 class="title">Base information</h4>  
        <el-row type="flex" justify="center" align="middle" class="row" v-if="accountList">
            <el-col class="key-col" :span="4">
                account
                <i class="el-icon-circle-plus add-account" @click="addAccount"></i>
                :
            </el-col>

            <el-col class="col" :span="18">
                <el-select class="select-address" v-model="selectedAccountAddress" size="small">
                    <el-option
                        v-for="account in accountList"
                        :key="account.address"
                        :label="account.address"
                        :value="account.address">
                    </el-option>
                </el-select>
                
            </el-col>
        </el-row>

        <el-row type="flex" justify="center" class="row" v-if="contractAddress">
            <el-col class="key-col" :span="4">
                contract:
            </el-col>

            <el-col class="col" :span="18">{{contractAddress}}</el-col>
        </el-row>
  </div>-->
</template>
<script>
import * as vite from 'global/vite';
import ClipboardJS from 'clipboard';
import VueJsonPretty from 'vue-json-pretty';

export default {
    props: ['deployInfo'],
    components: {
        VueJsonPretty
    },
    data() {
        return {
            isShowAbi: false,
            isShowCode: false,
            isShowOffchainCode: false
        };
    },
    mounted() {
        new ClipboardJS('.copy-icon');
    },
    //     data () {
    //         return {
    //             accountList: []
    //         };
    //     },
    //     computed: {
    //         selectedAccountAddress: {
    //             get () {
    //                 if (!this.selectedAccount) {
    //                     return '';
    //                 }
    //                 return this.selectedAccount.address;
    //             },
    //             set (val) {
    //                 let selectedAccount = this.accountList.find(function (account) {
    //                     return account.address === val;
    //                 });
    //                 this.$emit('onSelectAccount', selectedAccount);
    //             }
    //         }
    //     },
    //     created () {
    //         if (this.selectedAccount) {
    //             this.accountList.push(this.selectedAccount);
    //         }
    //     },
    methods: {
        selectAccount(address) {
            this.$store.commit('selectAccount', {
                deployInfo: this.deployInfo,
                address
            });
        },
        async addAccount() {
            // add account
            let newAccount = vite.createAccount();

            this.$store.commit('addAccount', {
                deployInfo: this.deployInfo,
                account: newAccount
            });

            // init balance
            await vite.initBalance(newAccount, vite.ACCOUNT_INIT_AMOUNT.toString());

            this.selectAccount(newAccount.address);
        },
        showAbi() {
            this.isShowAbi = true;
        },
        showCode() {
            this.isShowCode = true;
        },
        showOffchaincode() {
            this.isShowOffchainCode = true;
        },
        copyCode() {
            window.clipboardData.setData(
                'data',
                this.deployInfo.compileInfo.bytecodes
            );
        },
        copyOffchainCode() {}
    //         async addAccount () {
    //             let account = await vite.createAccount();
    //             this.accountList.push(account);
    //         }
    }
};
</script>
<style lang="scss" scoped>
.address-input {
  width: 100%;
}
.add-account-button {
  margin-left: 10px;
}
.copy-icon {
  font-size: 20px;
  &:hover {
    cursor: pointer;
    color: #67c23a;
  }
}
// .row{
//     padding-bottom: 10px;
// }

// .key-col {
//     text-align: center;
// }

// .col {
//     word-break: break-all;
// }
// .add-account:hover {
//      cursor: pointer;
// }
// .select-address {
//     width: 100%;
// }
</style>
